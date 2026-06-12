#!/usr/bin/env python3
"""Standalone X (Twitter) search CLI backed by xAI's ``x_search`` Responses API tool.

Extracted from Hermes Agent's ``tools/x_search_tool.py`` so it can run as an
agent Skill without the Hermes runtime. Behavior contract is kept identical:

* ``from_date`` / ``to_date`` are validated client-side (YYYY-MM-DD, not
  inverted, ``from_date`` not in the future) before any billable API call.
* ``allowed_x_handles`` and ``excluded_x_handles`` are mutually exclusive,
  max 10 each.
* Successful responses carry ``degraded`` / ``degraded_reason``: ``degraded``
  is True when a narrowing filter was active AND xAI returned no citations,
  meaning the answer came from model knowledge, not the X index.

Credential resolution, in order:

1. If a Hermes Agent checkout exists (``HERMES_AGENT_DIR`` env var, default
   ``~/hermes-agent``), reuse ``tools.xai_http.resolve_xai_http_credentials``
   — this honors SuperGrok OAuth with automatic token refresh.
2. ``XAI_API_KEY`` from the process environment.
3. ``XAI_API_KEY`` from ``~/.hermes/.env``.

Only stdlib is required in paths 2-3 (urllib instead of requests).

Usage:
    x_search.py "query" [--handles a,b] [--exclude a,b]
                [--from YYYY-MM-DD] [--to YYYY-MM-DD]
                [--images] [--videos] [--model MODEL] [--timeout SECS]

Output: one JSON object on stdout. ``success`` tells you whether it worked.
Exit code 0 on success, 1 on failure.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

DEFAULT_XAI_BASE_URL = "https://api.x.ai/v1"
DEFAULT_X_SEARCH_MODEL = "grok-4.20-reasoning"
DEFAULT_TIMEOUT_SECONDS = 180
DEFAULT_RETRIES = 2
MAX_HANDLES = 10
USER_AGENT = "x-search-skill/1.0"


# ---------------------------------------------------------------------------
# Credential resolution
# ---------------------------------------------------------------------------

def _hermes_agent_dir() -> Optional[Path]:
    raw = os.environ.get("HERMES_AGENT_DIR", "").strip()
    candidate = Path(raw).expanduser() if raw else Path.home() / "hermes-agent"
    if (candidate / "tools" / "xai_http.py").exists():
        return candidate
    return None


def _read_dotenv_value(path: Path, name: str) -> str:
    try:
        for line in path.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            if key.strip() == name:
                return value.strip().strip("'\"")
    except Exception:
        pass
    return ""


def _resolve_via_hermes_inprocess(hermes_dir: Path) -> Optional[Tuple[str, str, str]]:
    sys.path.insert(0, str(hermes_dir))
    try:
        from tools.xai_http import resolve_xai_http_credentials  # type: ignore

        creds = resolve_xai_http_credentials()
        api_key = str(creds.get("api_key") or "").strip()
        if api_key:
            base_url = (
                str(creds.get("base_url") or DEFAULT_XAI_BASE_URL).strip().rstrip("/")
            )
            return api_key, base_url, str(creds.get("provider") or "xai")
    except Exception:
        pass
    finally:
        sys.path.remove(str(hermes_dir))
    return None


def _resolve_via_hermes_venv(hermes_dir: Path) -> Optional[Tuple[str, str, str]]:
    # hermes_cli.auth (the OAuth refresh path) needs httpx and friends, which
    # the interpreter running this script may not have. Hermes's own venv
    # does, so delegate just the credential resolution to it.
    import subprocess

    for venv_name in (".venv", "venv"):
        venv_python = hermes_dir / venv_name / "bin" / "python"
        if not venv_python.exists():
            continue
        try:
            proc = subprocess.run(
                [
                    str(venv_python),
                    "-c",
                    "import json, sys; sys.path.insert(0, sys.argv[1]); "
                    "from tools.xai_http import resolve_xai_http_credentials; "
                    "print(json.dumps(resolve_xai_http_credentials()))",
                    str(hermes_dir),
                ],
                capture_output=True,
                text=True,
                timeout=60,
                cwd=str(hermes_dir),
            )
            if proc.returncode != 0:
                continue
            creds = json.loads(proc.stdout.strip())
            api_key = str(creds.get("api_key") or "").strip()
            if api_key:
                base_url = (
                    str(creds.get("base_url") or DEFAULT_XAI_BASE_URL).strip().rstrip("/")
                )
                return api_key, base_url, str(creds.get("provider") or "xai")
        except Exception:
            continue
    return None


def resolve_credentials() -> Tuple[str, str, str]:
    """Return ``(api_key, base_url, source)`` or raise RuntimeError."""
    hermes_dir = _hermes_agent_dir()
    if hermes_dir is not None:
        resolved = _resolve_via_hermes_inprocess(hermes_dir) or _resolve_via_hermes_venv(
            hermes_dir
        )
        if resolved is not None:
            return resolved

    api_key = os.environ.get("XAI_API_KEY", "").strip()
    base_url = (
        os.environ.get("XAI_BASE_URL", "").strip() or DEFAULT_XAI_BASE_URL
    ).rstrip("/")
    if api_key:
        return api_key, base_url, "xai-env"

    dotenv = Path.home() / ".hermes" / ".env"
    if dotenv.exists():
        api_key = _read_dotenv_value(dotenv, "XAI_API_KEY")
        dotenv_base = _read_dotenv_value(dotenv, "XAI_BASE_URL")
        if api_key:
            return api_key, (dotenv_base or base_url).rstrip("/"), "xai-dotenv"

    raise RuntimeError(
        "No xAI credentials available. Sign in with `hermes auth add xai-oauth` "
        "(SuperGrok subscription), or set XAI_API_KEY in the environment or "
        "~/.hermes/.env."
    )


# ---------------------------------------------------------------------------
# Validation helpers (same contract as Hermes x_search_tool)
# ---------------------------------------------------------------------------

def _normalize_handles(handles: Optional[List[str]], field_name: str) -> List[str]:
    cleaned: List[str] = []
    for handle in handles or []:
        normalized = str(handle or "").strip().lstrip("@")
        if normalized:
            cleaned.append(normalized)
    if len(cleaned) > MAX_HANDLES:
        raise ValueError(f"{field_name} supports at most {MAX_HANDLES} handles")
    return cleaned


def _parse_iso_date(value: str, field_name: str) -> date:
    raw = value.strip()
    try:
        return datetime.strptime(raw, "%Y-%m-%d").date()
    except ValueError as exc:
        raise ValueError(f"{field_name} must be YYYY-MM-DD (got {raw!r})") from exc


def _validate_date_range(from_date: str, to_date: str) -> None:
    # xAI accepts malformed/impossible date windows, burns the billable call,
    # and returns a citation-free answer that looks real — so fail fast here.
    parsed_from: Optional[date] = None
    parsed_to: Optional[date] = None
    if from_date.strip():
        parsed_from = _parse_iso_date(from_date, "from_date")
    if to_date.strip():
        parsed_to = _parse_iso_date(to_date, "to_date")
    if parsed_from and parsed_to and parsed_from > parsed_to:
        raise ValueError(
            f"from_date ({parsed_from.isoformat()}) must be on or before "
            f"to_date ({parsed_to.isoformat()})"
        )
    if parsed_from is not None:
        today_utc = datetime.now(timezone.utc).date()
        if parsed_from > today_utc:
            raise ValueError(
                f"from_date ({parsed_from.isoformat()}) is in the future; "
                f"X Search only indexes past posts (today UTC is "
                f"{today_utc.isoformat()})"
            )


# ---------------------------------------------------------------------------
# Response parsing
# ---------------------------------------------------------------------------

def _extract_response_text(payload: Dict[str, Any]) -> str:
    output_text = str(payload.get("output_text") or "").strip()
    if output_text:
        return output_text

    parts: List[str] = []
    for item in payload.get("output", []) or []:
        if item.get("type") != "message":
            continue
        for content in item.get("content", []) or []:
            if content.get("type") in {"output_text", "text"}:
                text = str(content.get("text") or "").strip()
                if text:
                    parts.append(text)
    return "\n\n".join(parts).strip()


def _extract_inline_citations(payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    citations: List[Dict[str, Any]] = []
    for item in payload.get("output", []) or []:
        if item.get("type") != "message":
            continue
        for content in item.get("content", []) or []:
            for annotation in content.get("annotations", []) or []:
                if annotation.get("type") != "url_citation":
                    continue
                citations.append(
                    {
                        "url": annotation.get("url", ""),
                        "title": annotation.get("title", ""),
                        "start_index": annotation.get("start_index"),
                        "end_index": annotation.get("end_index"),
                    }
                )
    return citations


# ---------------------------------------------------------------------------
# HTTP
# ---------------------------------------------------------------------------

def _post_json(
    url: str,
    api_key: str,
    payload: Dict[str, Any],
    timeout_seconds: int,
    max_retries: int,
) -> Dict[str, Any]:
    body = json.dumps(payload).encode("utf-8")
    last_error: Optional[Exception] = None
    for attempt in range(max_retries + 1):
        request = urllib.request.Request(
            url,
            data=body,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "User-Agent": USER_AGENT,
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            detail = ""
            try:
                detail = exc.read().decode("utf-8", "replace")[:500]
            except Exception:
                pass
            error = RuntimeError(f"HTTP {exc.code}: {detail or exc.reason}")
            if exc.code < 500 or attempt >= max_retries:
                raise error from exc
            last_error = error
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            if attempt >= max_retries:
                raise RuntimeError(f"request failed: {exc}") from exc
            last_error = exc
        time.sleep(min(5.0, 1.5 * (attempt + 1)))
    raise RuntimeError(f"request failed after retries: {last_error}")


# ---------------------------------------------------------------------------
# Core
# ---------------------------------------------------------------------------

def x_search(
    query: str,
    allowed_x_handles: Optional[List[str]] = None,
    excluded_x_handles: Optional[List[str]] = None,
    from_date: str = "",
    to_date: str = "",
    enable_image_understanding: bool = False,
    enable_video_understanding: bool = False,
    model: str = "",
    timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS,
    retries: int = DEFAULT_RETRIES,
) -> Dict[str, Any]:
    if not query or not query.strip():
        return {"success": False, "tool": "x_search", "error": "query is required"}

    # Validate arguments before touching credentials so bad input fails the
    # same way everywhere, with or without xAI auth configured.
    try:
        allowed = _normalize_handles(allowed_x_handles, "allowed_x_handles")
        excluded = _normalize_handles(excluded_x_handles, "excluded_x_handles")
        if allowed and excluded:
            return {
                "success": False,
                "tool": "x_search",
                "error": "allowed_x_handles and excluded_x_handles cannot be used together",
            }
        _validate_date_range(from_date, to_date)
    except ValueError as exc:
        return {"success": False, "tool": "x_search", "error": str(exc)}

    try:
        api_key, base_url, source = resolve_credentials()
    except RuntimeError as exc:
        return {"success": False, "tool": "x_search", "error": str(exc)}

    tool_def: Dict[str, Any] = {"type": "x_search"}
    if allowed:
        tool_def["allowed_x_handles"] = allowed
    if excluded:
        tool_def["excluded_x_handles"] = excluded
    if from_date.strip():
        tool_def["from_date"] = from_date.strip()
    if to_date.strip():
        tool_def["to_date"] = to_date.strip()
    if enable_image_understanding:
        tool_def["enable_image_understanding"] = True
    if enable_video_understanding:
        tool_def["enable_video_understanding"] = True

    resolved_model = (
        model.strip()
        or os.environ.get("X_SEARCH_MODEL", "").strip()
        or DEFAULT_X_SEARCH_MODEL
    )
    payload = {
        "model": resolved_model,
        "input": [{"role": "user", "content": query.strip()}],
        "tools": [tool_def],
        "store": False,
    }

    try:
        data = _post_json(
            f"{base_url}/responses", api_key, payload, timeout_seconds, retries
        )
    except RuntimeError as exc:
        return {
            "success": False,
            "provider": "xai",
            "tool": "x_search",
            "error": str(exc),
        }

    answer = _extract_response_text(data)
    citations = list(data.get("citations") or [])
    inline_citations = _extract_inline_citations(data)

    # xAI returns 200 + a synthesized answer even when the narrowed X index
    # window has no posts; flag that so callers don't trust unsourced text.
    active_filters: List[str] = []
    if allowed:
        active_filters.append("allowed_x_handles")
    if excluded:
        active_filters.append("excluded_x_handles")
    if from_date.strip():
        active_filters.append("from_date")
    if to_date.strip():
        active_filters.append("to_date")
    degraded = bool(active_filters) and not citations and not inline_citations
    degraded_reason = (
        f"no citations returned despite filters: {', '.join(active_filters)}"
        if degraded
        else None
    )

    return {
        "success": True,
        "provider": "xai",
        "credential_source": source,
        "tool": "x_search",
        "model": resolved_model,
        "query": query.strip(),
        "answer": answer,
        "citations": citations,
        "inline_citations": inline_citations,
        "degraded": degraded,
        "degraded_reason": degraded_reason,
    }


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def _split_handles(raw: str) -> List[str]:
    return [part for part in (raw or "").split(",") if part.strip()]


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        description="Search X (Twitter) via xAI's x_search tool. Prints JSON."
    )
    parser.add_argument("query", help="What to look up on X")
    parser.add_argument(
        "--handles", default="", help="Comma-separated handles to include exclusively (max 10)"
    )
    parser.add_argument(
        "--exclude", default="", help="Comma-separated handles to exclude (max 10)"
    )
    parser.add_argument("--from", dest="from_date", default="", help="Start date YYYY-MM-DD")
    parser.add_argument("--to", dest="to_date", default="", help="End date YYYY-MM-DD")
    parser.add_argument(
        "--images", action="store_true", help="Analyze images attached to matching posts"
    )
    parser.add_argument(
        "--videos", action="store_true", help="Analyze videos attached to matching posts"
    )
    parser.add_argument("--model", default="", help=f"Override model (default {DEFAULT_X_SEARCH_MODEL})")
    parser.add_argument("--timeout", type=int, default=DEFAULT_TIMEOUT_SECONDS, help="HTTP timeout seconds")
    parser.add_argument("--retries", type=int, default=DEFAULT_RETRIES, help="Retries on 5xx/transport errors")
    args = parser.parse_args(argv)

    result = x_search(
        query=args.query,
        allowed_x_handles=_split_handles(args.handles),
        excluded_x_handles=_split_handles(args.exclude),
        from_date=args.from_date,
        to_date=args.to_date,
        enable_image_understanding=args.images,
        enable_video_understanding=args.videos,
        model=args.model,
        timeout_seconds=max(30, args.timeout),
        retries=max(0, args.retries),
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result.get("success") else 1


if __name__ == "__main__":
    sys.exit(main())
