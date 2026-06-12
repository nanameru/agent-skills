#!/usr/bin/env python3
"""Standalone Grok Imagine video generation CLI backed by xAI's videos API.

Extracted from Hermes Agent's ``plugins/video_gen/xai`` provider so it can
run as an agent Skill without the Hermes runtime. Behavior contract is kept
identical:

* Text-to-video (prompt only) and image-to-video (``--image``) through
  ``POST /videos/generations`` + polling ``GET /videos/{request_id}``.
* Model auto-selection per modality: image-to-video defaults to
  ``grok-imagine-video-1.5-preview`` (which rejects text-only calls),
  text-to-video defaults to ``grok-imagine-video``. An explicit ``--model``
  always wins.
* Duration clamped to 1-15s (10s max when reference images are used).
* ``--image`` and reference images are mutually exclusive; max 7 refs.
* Local image paths are inlined as base64 data URIs.

Credential resolution, in order (same as the x-search skill):

1. If a Hermes Agent checkout exists (``HERMES_AGENT_DIR`` env var, default
   ``~/hermes-agent``), reuse ``tools.xai_http.resolve_xai_http_credentials``
   — this honors SuperGrok OAuth with automatic token refresh.
2. ``XAI_API_KEY`` from the process environment.
3. ``XAI_API_KEY`` from ``~/.hermes/.env``.

Only stdlib is required in paths 2-3 (urllib instead of httpx).

Usage:
    grok_video.py "prompt" [--image PATH_OR_URL] [--ref URL ...]
                  [--duration N] [--aspect 16:9] [--resolution 720p]
                  [--model MODEL] [--timeout SECS] [--out FILE.mp4]

Output: one JSON object on stdout. ``success`` tells you whether it worked.
Exit code 0 on success, 1 on failure.
"""

from __future__ import annotations

import argparse
import base64
import json
import mimetypes
import os
import sys
import time
import urllib.error
import urllib.request
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

DEFAULT_XAI_BASE_URL = "https://api.x.ai/v1"
DEFAULT_TEXT_TO_VIDEO_MODEL = "grok-imagine-video"
DEFAULT_IMAGE_TO_VIDEO_MODEL = "grok-imagine-video-1.5-preview"
DEFAULT_DURATION = 8
DEFAULT_ASPECT_RATIO = "16:9"
DEFAULT_RESOLUTION = "720p"
DEFAULT_TIMEOUT_SECONDS = 240
POLL_INTERVAL_SECONDS = 5

VALID_ASPECT_RATIOS = {"1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"}
VALID_RESOLUTIONS = {"480p", "720p"}
MAX_REFERENCE_IMAGES = 7
USER_AGENT = "grok-video-skill/1.0"


# ---------------------------------------------------------------------------
# Credential resolution (same contract as the x-search skill)
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
# Input normalization (same contract as Hermes xai video plugin)
# ---------------------------------------------------------------------------

def _image_ref_to_xai_url(value: str) -> str:
    """Return a URL/data URI accepted by xAI for image inputs."""
    ref = (value or "").strip()
    if not ref:
        return ""
    lower = ref.lower()
    if lower.startswith(("http://", "https://", "data:image/")):
        return ref

    path = Path(ref).expanduser()
    if not path.is_file():
        return ref

    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    if not mime.startswith("image/"):
        return ref

    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:{mime};base64,{encoded}"


def _normalize_reference_images(refs: Optional[List[str]]) -> Optional[List[Dict[str, str]]]:
    out = []
    for url in refs or []:
        normalized = _image_ref_to_xai_url(url)
        if normalized:
            out.append({"url": normalized})
    return out or None


def _clamp_duration(duration: Optional[int], has_reference_images: bool) -> int:
    value = duration if duration is not None else DEFAULT_DURATION
    if value < 1:
        value = 1
    if value > 15:
        value = 15
    if has_reference_images and value > 10:
        value = 10
    return value


def _resolve_model_for_modality(
    model: Optional[str], *, modality: str, explicit_model: bool
) -> str:
    """Select xAI's text/video model.

    ``grok-imagine-video-1.5-preview`` rejects text-only generation but is
    the desired image-to-video backend; an explicit --model always wins.
    """
    requested = (model or "").strip()
    if explicit_model and requested:
        return requested
    if modality == "image":
        return DEFAULT_IMAGE_TO_VIDEO_MODEL
    if requested == DEFAULT_IMAGE_TO_VIDEO_MODEL:
        return DEFAULT_TEXT_TO_VIDEO_MODEL
    return requested or DEFAULT_TEXT_TO_VIDEO_MODEL


# ---------------------------------------------------------------------------
# HTTP (stdlib urllib)
# ---------------------------------------------------------------------------

def _headers(api_key: str, idempotency: bool = False) -> Dict[str, str]:
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
    }
    if idempotency:
        headers["x-idempotency-key"] = str(uuid.uuid4())
    return headers


def _http_json(
    url: str,
    *,
    api_key: str,
    payload: Optional[Dict[str, Any]] = None,
    timeout: int = 60,
    idempotency: bool = False,
) -> Dict[str, Any]:
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(
        url, data=data, headers=_headers(api_key, idempotency=idempotency),
        method="POST" if data is not None else "GET",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _submit(payload: Dict[str, Any], *, api_key: str, base_url: str) -> str:
    body = _http_json(
        f"{base_url}/videos/generations",
        api_key=api_key, payload=payload, timeout=60, idempotency=True,
    )
    request_id = body.get("request_id")
    if not request_id:
        raise RuntimeError("xAI video response did not include request_id")
    return str(request_id)


def _poll(
    request_id: str, *, api_key: str, base_url: str,
    timeout_seconds: int, poll_interval: int = POLL_INTERVAL_SECONDS,
) -> Dict[str, Any]:
    elapsed = 0.0
    last_status = "queued"
    while elapsed < timeout_seconds:
        body = _http_json(
            f"{base_url}/videos/{request_id}", api_key=api_key, timeout=30,
        )
        last_status = (body.get("status") or "").lower()
        if last_status == "done":
            return {"status": "done", "body": body}
        if last_status in {"failed", "error", "expired", "cancelled"}:
            return {"status": last_status, "body": body}
        time.sleep(poll_interval)
        elapsed += poll_interval
    return {"status": "timeout", "body": {"status": last_status}}


def _download(url: str, out_path: Path) -> Path:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(req, timeout=120) as resp, open(out_path, "wb") as fh:
        while True:
            chunk = resp.read(1 << 16)
            if not chunk:
                break
            fh.write(chunk)
    return out_path


# ---------------------------------------------------------------------------
# Generation
# ---------------------------------------------------------------------------

def error_response(**fields: Any) -> Dict[str, Any]:
    return {"success": False, **fields}


def generate(
    prompt: str,
    *,
    model: Optional[str] = None,
    explicit_model: bool = False,
    image_url: Optional[str] = None,
    reference_image_urls: Optional[List[str]] = None,
    duration: Optional[int] = None,
    aspect_ratio: str = DEFAULT_ASPECT_RATIO,
    resolution: str = DEFAULT_RESOLUTION,
    timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS,
) -> Dict[str, Any]:
    prompt = (prompt or "").strip()
    if not prompt:
        return error_response(
            error="prompt is required (text-to-video or image-to-video)",
            error_type="missing_prompt", provider="xai",
        )

    try:
        api_key, base_url, source = resolve_credentials()
    except RuntimeError as exc:
        return error_response(
            error=str(exc), error_type="auth_required", provider="xai", prompt=prompt,
        )

    image_url_norm = _image_ref_to_xai_url(image_url or "") or None
    refs = _normalize_reference_images(reference_image_urls)
    if refs and len(refs) > MAX_REFERENCE_IMAGES:
        return error_response(
            error=f"reference images: at most {MAX_REFERENCE_IMAGES} supported on xAI",
            error_type="too_many_references", provider="xai", prompt=prompt,
        )
    if image_url_norm and refs:
        return error_response(
            error="--image and reference images cannot be combined on xAI",
            error_type="conflicting_inputs", provider="xai", prompt=prompt,
        )

    modality = "image" if image_url_norm else "text"
    resolved_model = _resolve_model_for_modality(
        model, modality=modality, explicit_model=explicit_model,
    )
    clamped_duration = _clamp_duration(duration, has_reference_images=bool(refs))

    normalized_aspect_ratio = (aspect_ratio or DEFAULT_ASPECT_RATIO).strip()
    if normalized_aspect_ratio not in VALID_ASPECT_RATIOS:
        normalized_aspect_ratio = DEFAULT_ASPECT_RATIO
    normalized_resolution = (resolution or DEFAULT_RESOLUTION).strip().lower()
    if normalized_resolution not in VALID_RESOLUTIONS:
        normalized_resolution = DEFAULT_RESOLUTION

    payload: Dict[str, Any] = {
        "model": resolved_model,
        "prompt": prompt,
        "duration": clamped_duration,
        "aspect_ratio": normalized_aspect_ratio,
        "resolution": normalized_resolution,
    }
    if image_url_norm:
        payload["image"] = {"url": image_url_norm}
    if refs:
        payload["reference_images"] = refs

    try:
        request_id = _submit(payload, api_key=api_key, base_url=base_url)
    except urllib.error.HTTPError as exc:
        detail = ""
        try:
            detail = exc.read().decode("utf-8", "replace")[:500]
        except Exception:
            pass
        return error_response(
            error=f"xAI submit failed ({exc.code}): {detail or exc}",
            error_type="api_error", provider="xai",
            model=resolved_model, prompt=prompt,
        )
    except Exception as exc:
        return error_response(
            error=f"xAI submit failed: {exc}", error_type="api_error",
            provider="xai", model=resolved_model, prompt=prompt,
        )

    try:
        poll_result = _poll(
            request_id, api_key=api_key, base_url=base_url,
            timeout_seconds=timeout_seconds,
        )
    except Exception as exc:
        return error_response(
            error=f"xAI polling failed: {exc}", error_type="api_error",
            provider="xai", model=resolved_model, prompt=prompt,
            request_id=request_id,
        )

    status = poll_result["status"]
    body = poll_result["body"]

    if status == "done":
        video = body.get("video") or {}
        url = video.get("url")
        if not url:
            return error_response(
                error="xAI video generation completed without a video URL",
                error_type="empty_response", provider="xai",
                model=body.get("model") or resolved_model, prompt=prompt,
                request_id=request_id,
            )
        result: Dict[str, Any] = {
            "success": True,
            "video": url,
            "model": body.get("model") or resolved_model,
            "prompt": prompt,
            "modality": modality,
            "aspect_ratio": normalized_aspect_ratio,
            "resolution": normalized_resolution,
            "duration": video.get("duration") or clamped_duration,
            "provider": "xai",
            "credential_source": source,
            "request_id": request_id,
        }
        if body.get("usage"):
            result["usage"] = body["usage"]
        return result

    if status == "timeout":
        return error_response(
            error=f"Timed out waiting for video generation after {timeout_seconds}s",
            error_type="timeout", provider="xai",
            model=resolved_model, prompt=prompt, request_id=request_id,
        )

    message = (
        (body.get("error", {}) or {}).get("message")
        or body.get("message")
        or f"xAI video generation ended with status '{status}'"
    )
    return error_response(
        error=message, error_type=f"xai_{status}", provider="xai",
        model=resolved_model, prompt=prompt, request_id=request_id,
    )


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        description="Generate a video with xAI Grok Imagine (text-to-video / image-to-video).",
    )
    parser.add_argument("prompt", help="Text instruction: subject, motion, style, camera movement")
    parser.add_argument(
        "--image",
        help="Still image to animate (image-to-video): URL, data URI, or local file path",
    )
    parser.add_argument(
        "--ref", action="append", default=[], metavar="IMAGE",
        help="Reference image (style/character); repeatable, max 7. Mutually exclusive with --image",
    )
    parser.add_argument("--duration", type=int, help="Seconds, clamped to 1-15 (10 with refs); default 8")
    parser.add_argument(
        "--aspect", default=DEFAULT_ASPECT_RATIO,
        help=f"Aspect ratio: {', '.join(sorted(VALID_ASPECT_RATIOS))} (default {DEFAULT_ASPECT_RATIO})",
    )
    parser.add_argument(
        "--resolution", default=DEFAULT_RESOLUTION,
        help=f"Resolution: {', '.join(sorted(VALID_RESOLUTIONS))} (default {DEFAULT_RESOLUTION})",
    )
    parser.add_argument(
        "--model",
        help=(
            "Model override. Default: grok-imagine-video (text), "
            "grok-imagine-video-1.5-preview (image-to-video)"
        ),
    )
    parser.add_argument(
        "--timeout", type=int, default=DEFAULT_TIMEOUT_SECONDS,
        help=f"Max seconds to wait for completion (default {DEFAULT_TIMEOUT_SECONDS})",
    )
    parser.add_argument(
        "--out", metavar="FILE",
        help="Also download the finished video to this local path (.mp4)",
    )
    args = parser.parse_args(argv)

    result = generate(
        args.prompt,
        model=args.model,
        explicit_model=bool(args.model),
        image_url=args.image,
        reference_image_urls=args.ref or None,
        duration=args.duration,
        aspect_ratio=args.aspect,
        resolution=args.resolution,
        timeout_seconds=args.timeout,
    )

    if result.get("success") and args.out:
        try:
            saved = _download(str(result["video"]), Path(args.out).expanduser())
            result["local_path"] = str(saved)
        except Exception as exc:
            result["download_error"] = f"video URL is valid but download failed: {exc}"

    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result.get("success") else 1


if __name__ == "__main__":
    sys.exit(main())
