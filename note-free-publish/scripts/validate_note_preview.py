#!/usr/bin/env python3
"""Fail closed when a rendered note preview contains known conversion defects."""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path


class PreviewParser(HTMLParser):
    VOID_TAGS = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}

    def __init__(self, scope_to_article: bool = False) -> None:
        super().__init__(convert_charrefs=True)
        self.all_text: list[str] = []
        self.stack: list[tuple[str, list[str]]] = []
        self.elements: dict[str, list[str]] = {"li": [], "p": [], "h2": []}
        self.image_count = 0
        self.has_toc = False
        self.ignored_depth = 0
        self.scope_to_article = scope_to_article
        self.scope_depth = 0
        self.pre_depth = 0
        self.inline_code_count = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_map = dict(attrs)
        is_article_root = tag == "div" and (
            attrs_map.get("data-name") == "body"
            or "note-common-styles__textnote-body" in (attrs_map.get("class") or "")
        )
        if self.scope_to_article:
            if self.scope_depth == 0:
                if not is_article_root:
                    return
                self.scope_depth = 1
                return
            if tag not in self.VOID_TAGS:
                self.scope_depth += 1
        if tag in {"script", "style", "template", "noscript"}:
            self.ignored_depth += 1
            return
        if self.ignored_depth:
            return
        if tag in self.elements:
            self.stack.append((tag, []))
        if tag == "img":
            self.image_count += 1
        if tag == "table-of-contents":
            self.has_toc = True
        if tag == "pre":
            self.pre_depth += 1
        if tag == "code" and self.pre_depth == 0:
            self.inline_code_count += 1

    def handle_endtag(self, tag: str) -> None:
        if self.scope_to_article and self.scope_depth == 0:
            return
        if tag in {"script", "style", "template", "noscript"} and self.ignored_depth:
            self.ignored_depth -= 1
        elif not self.ignored_depth:
            if self.stack:
                current_tag, chunks = self.stack[-1]
                if current_tag == tag:
                    self.elements[tag].append("".join(chunks))
                    self.stack.pop()
            if tag == "pre" and self.pre_depth:
                self.pre_depth -= 1
        if self.scope_to_article and tag not in self.VOID_TAGS:
            self.scope_depth -= 1

    def handle_data(self, data: str) -> None:
        if self.scope_to_article and self.scope_depth == 0:
            return
        if self.ignored_depth:
            return
        self.all_text.append(data)
        for _, chunks in self.stack:
            chunks.append(data)


def normalize(value: str) -> str:
    value = html.unescape(value)
    value = value.replace("\u00a0", " ")
    return re.sub(r"\s+", " ", value).strip()


def inline_code_tokens(markdown: str) -> list[str]:
    without_fences = re.sub(r"```.*?```", "", markdown, flags=re.DOTALL)
    return [normalize(token) for token in re.findall(r"(?<!`)`([^`\n]+)`(?!`)", without_fences)]


def validate(source: str, preview_html: str, min_images: int, min_h2: int, require_toc: bool) -> dict[str, object]:
    parser = PreviewParser(scope_to_article="note-common-styles__textnote-body" in preview_html)
    parser.feed(preview_html)
    visible = normalize(" ".join(parser.all_text))
    errors: list[dict[str, object]] = []

    empty_items = [index + 1 for index, text in enumerate(parser.elements["li"]) if not normalize(text)]
    if empty_items:
        errors.append({"code": "empty-list-item", "items": empty_items})

    orphaned = [
        normalize(text)
        for text in parser.elements["p"]
        if re.match(r"^[：:、。・；;）)]", normalize(text))
        or normalize(text) in {"•", "●", "・"}
    ]
    if orphaned:
        errors.append({"code": "orphaned-punctuation", "samples": orphaned[:5]})

    missing_code = [token for token in inline_code_tokens(source) if token and token not in visible]
    if missing_code:
        errors.append({"code": "missing-inline-code", "tokens": missing_code[:10]})
    if parser.inline_code_count:
        errors.append({"code": "inline-code-rendering-risk", "count": parser.inline_code_count})

    raw_markers = [marker for marker in ("{{", "}}", "[TOC]", "```", "![") if marker in visible]
    if raw_markers:
        errors.append({"code": "raw-markdown-or-placeholder", "markers": raw_markers})

    if parser.image_count < min_images:
        errors.append({"code": "too-few-images", "actual": parser.image_count, "minimum": min_images})
    if len(parser.elements["h2"]) < min_h2:
        errors.append({"code": "too-few-h2", "actual": len(parser.elements["h2"]), "minimum": min_h2})
    if require_toc and not parser.has_toc and "目次" not in visible:
        errors.append({"code": "missing-toc"})

    return {
        "ok": not errors,
        "errors": errors,
        "counts": {
            "list_items": len(parser.elements["li"]),
            "paragraphs": len(parser.elements["p"]),
            "h2": len(parser.elements["h2"]),
            "images": parser.image_count,
            "inline_code": parser.inline_code_count,
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--preview-html", required=True, type=Path)
    parser.add_argument("--min-images", type=int, default=6)
    parser.add_argument("--min-h2", type=int, default=2)
    parser.add_argument("--require-toc", action="store_true")
    parser.add_argument("--json-output", type=Path)
    args = parser.parse_args()

    result = validate(
        args.source.read_text(encoding="utf-8"),
        args.preview_html.read_text(encoding="utf-8"),
        args.min_images,
        args.min_h2,
        args.require_toc,
    )
    payload = json.dumps(result, ensure_ascii=False, indent=2)
    if args.json_output:
        args.json_output.write_text(payload + "\n", encoding="utf-8")
    print(payload)
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
