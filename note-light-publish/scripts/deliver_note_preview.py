#!/usr/bin/env python3
"""Safely deliver an unpublished note preview to Discord after approval."""

from __future__ import annotations

import argparse
import fcntl
import hashlib
import json
import os
import re
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse


PREVIEW_RE = re.compile(r"^/preview/(?P<key>n[a-zA-Z0-9]+)$")
PUBLIC_RE = re.compile(r"^/(?P<user>[^/]+)/n/(?P<key>n[a-zA-Z0-9]+)$")
DEFAULT_ACCESS_LABEL = "ライトプラン限定 / 単発500円 / 公開済み"


class DeliveryError(RuntimeError):
    """A safe, user-facing delivery error."""


def parse_note_urls(preview_url: str, public_url: str) -> tuple[str, str]:
    preview = urlparse(preview_url)
    public = urlparse(public_url)

    preview_match = PREVIEW_RE.fullmatch(preview.path)
    query_names = {part.split("=", 1)[0] for part in preview.query.split("&") if part}
    if (
        preview.scheme != "https"
        or preview.netloc != "note.com"
        or not preview_match
        or "prev_access_key" not in query_names
    ):
        raise DeliveryError("複製下書きの正しいnoteプレビューURLを指定してください。")

    public_match = PUBLIC_RE.fullmatch(public.path)
    if public.scheme != "https" or public.netloc != "note.com" or not public_match:
        raise DeliveryError("公開済み記事の正しいnote URLを指定してください。")

    preview_key = preview_match.group("key")
    public_key = public_match.group("key")
    if preview_key == public_key:
        raise DeliveryError("公開記事ではなく、別の非公開複製下書きのプレビューURLが必要です。")
    return preview_key, public_key


def load_dotenv_value(path: Path, name: str) -> str | None:
    if not path.is_file():
        return None
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        if key.strip() != name:
            continue
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
            value = value[1:-1]
        return value or None
    return None


def resolve_webhook(env_file: Path) -> str:
    webhook = os.environ.get("NOTE_PREVIEW_DISCORD_WEBHOOK_URL")
    if not webhook:
        webhook = load_dotenv_value(env_file, "NOTE_PREVIEW_DISCORD_WEBHOOK_URL")
    parsed = urlparse(webhook or "")
    if parsed.scheme != "https" or parsed.netloc not in {
        "discord.com",
        "www.discord.com",
        "discordapp.com",
        "www.discordapp.com",
    } or "/api/webhooks/" not in parsed.path:
        raise DeliveryError("NOTE_PREVIEW_DISCORD_WEBHOOK_URL が設定されていません。")
    return webhook or ""


def delivery_key(title: str, preview_key: str, public_key: str) -> str:
    material = f"{title.strip()}\n{preview_key}\n{public_key}".encode()
    return hashlib.sha256(material).hexdigest()


def read_state(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {"version": 1, "deliveries": []}
    try:
        state = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise DeliveryError("配信状態ファイルを読み込めません。") from exc
    if not isinstance(state, dict) or not isinstance(state.get("deliveries"), list):
        raise DeliveryError("配信状態ファイルの形式が不正です。")
    return state


def write_state(path: Path, state: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.chmod(temporary, 0o600)
    temporary.replace(path)


def build_payload(
    title: str,
    preview_url: str,
    public_url: str,
    access_label: str,
    eyecatch_url: str | None,
    include_thread_name: bool,
) -> dict[str, Any]:
    content = (
        f"{title}\n\n"
        f"メンバー向けプレビュー: {preview_url}\n"
        f"公開記事: {public_url}\n"
        f"状態: {access_label}"
    )
    if len(content) > 2000:
        raise DeliveryError("Discordメッセージが2000文字を超えています。")
    payload: dict[str, Any] = {
        "content": content,
        "allowed_mentions": {"parse": []},
    }
    if include_thread_name:
        payload["thread_name"] = title[:100]
    if eyecatch_url:
        parsed = urlparse(eyecatch_url)
        if parsed.scheme != "https" or not parsed.netloc:
            raise DeliveryError("アイキャッチURLはHTTPSで指定してください。")
        payload["embeds"] = [{"image": {"url": eyecatch_url}}]
    return payload


def post_webhook(webhook: str, payload: dict[str, Any]) -> int:
    request = urllib.request.Request(
        webhook,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json", "User-Agent": "note-light-publish/1.0"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            status = response.status
    except urllib.error.HTTPError as exc:
        raise DeliveryError(f"Discord送信に失敗しました（HTTP {exc.code}）。") from None
    except urllib.error.URLError as exc:
        raise DeliveryError("Discord送信に失敗しました（ネットワークエラー）。") from exc
    if status not in {200, 204}:
        raise DeliveryError(f"Discord送信に失敗しました（HTTP {status}）。")
    return status


def make_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--title", required=True)
    parser.add_argument("--preview-url", required=True)
    parser.add_argument("--public-url", required=True)
    parser.add_argument("--access-label", default=DEFAULT_ACCESS_LABEL)
    parser.add_argument("--eyecatch-url")
    parser.add_argument("--env-file", type=Path, default=Path.cwd() / ".env.local")
    parser.add_argument(
        "--state-file",
        type=Path,
        default=Path.cwd() / ".codex" / "note-preview-delivery-state.json",
    )
    parser.add_argument("--approved", action="store_true", help="人間の明示承認を確認した")
    parser.add_argument("--send", action="store_true", help="Discordへ実際に送信する")
    parser.add_argument("--no-thread-name", action="store_true", help="通常テキストチャンネル用")
    return parser


def run(args: argparse.Namespace) -> int:
    preview_key, public_key = parse_note_urls(args.preview_url, args.public_url)
    key = delivery_key(args.title, preview_key, public_key)
    payload = build_payload(
        args.title,
        args.preview_url,
        args.public_url,
        args.access_label,
        args.eyecatch_url,
        not args.no_thread_name,
    )

    if not args.send:
        state = read_state(args.state_file)
        if any(item.get("delivery_key") == key for item in state["deliveries"]):
            raise DeliveryError("この複製プレビューは既にDiscordへ配信済みです。")
        print(
            "DRY RUN: 送信は行いません。"
            f" title={args.title!r} preview_article={preview_key} public_article={public_key}"
        )
        return 0
    if not args.approved:
        raise DeliveryError("実送信には --approved と --send の両方が必要です。")

    lock_path = args.state_file.with_suffix(args.state_file.suffix + ".lock")
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    with lock_path.open("a+", encoding="utf-8") as lock_file:
        os.chmod(lock_path, 0o600)
        fcntl.flock(lock_file.fileno(), fcntl.LOCK_EX)
        state = read_state(args.state_file)
        if any(item.get("delivery_key") == key for item in state["deliveries"]):
            raise DeliveryError("この複製プレビューは既にDiscordへ配信済みです。")

        webhook = resolve_webhook(args.env_file)
        status = post_webhook(webhook, payload)
        state["deliveries"].append(
            {
                "delivery_key": key,
                "preview_article_key": preview_key,
                "public_article_key": public_key,
                "sent_at": datetime.now(timezone.utc).isoformat(),
                "http_status": status,
            }
        )
        write_state(args.state_file, state)
    print(
        "Discord配信が完了しました。"
        f" preview_article={preview_key} public_article={public_key} http_status={status}"
    )
    return 0


def main() -> int:
    parser = make_parser()
    args = parser.parse_args()
    try:
        return run(args)
    except DeliveryError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
