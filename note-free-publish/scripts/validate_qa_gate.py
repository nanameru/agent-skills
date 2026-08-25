#!/usr/bin/env python3
"""Verify that both QA passes apply to the exact current article artifacts."""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path


PASS_FIELDS = (
    "preview_lint_passed",
    "visual_preview_passed",
    "eyecatch_lint_passed",
    "eyecatch_visual_passed",
    "editorial_review_passed",
    "fact_check_passed",
    "checked_after_last_update",
)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def validate(
    gate: dict[str, object],
    source: Path,
    source_notes: Path,
    preview_html: Path,
    eyecatch: Path,
) -> dict[str, object]:
    errors: list[dict[str, object]] = []
    for field in PASS_FIELDS:
        if gate.get(field) is not True:
            errors.append({"code": "gate-not-passed", "field": field})

    chips = gate.get("topic_chips")
    if not isinstance(chips, list) or not 2 <= len(chips) <= 4 or any(not str(chip).strip() for chip in chips):
        errors.append({"code": "invalid-topic-chips", "expected": "2-4 non-empty strings"})
    elif len({str(chip).strip() for chip in chips}) != len(chips):
        errors.append({"code": "duplicate-topic-chips"})
    if not isinstance(gate.get("frame_color_rationale"), str) or not str(gate["frame_color_rationale"]).strip():
        errors.append({"code": "missing-frame-color-rationale"})
    for field in ("editorial_review_summary", "fact_check_summary"):
        if not isinstance(gate.get(field), str) or not str(gate[field]).strip():
            errors.append({"code": "missing-review-summary", "field": field})
    for field in ("unresolved_editorial_findings", "unresolved_fact_check_findings"):
        if not isinstance(gate.get(field), list):
            errors.append({"code": "invalid-findings-list", "field": field})
        elif gate[field]:
            errors.append({"code": "unresolved-findings", "field": field, "count": len(gate[field])})

    artifacts = {
        "source_sha256": sha256(source),
        "source_notes_sha256": sha256(source_notes),
        "preview_html_sha256": sha256(preview_html),
        "eyecatch_sha256": sha256(eyecatch),
    }
    for field, actual in artifacts.items():
        if gate.get(field) != actual:
            errors.append({"code": "artifact-changed-after-check", "field": field})

    return {"ok": not errors, "errors": errors, "artifacts": artifacts}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--gate", required=True, type=Path)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--source-notes", required=True, type=Path)
    parser.add_argument("--preview-html", required=True, type=Path)
    parser.add_argument("--eyecatch", required=True, type=Path)
    args = parser.parse_args()
    result = validate(
        json.loads(args.gate.read_text(encoding="utf-8")),
        args.source,
        args.source_notes,
        args.preview_html,
        args.eyecatch,
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
