---
name: grok-video
description: "Generate AI videos with xAI's Grok Imagine (text-to-video and image-to-video) using a bundled Python CLI. Use when the user asks to generate a video with Grok, animate a still image into video via xAI, or requests Grok Imagine video generation. Trigger on Grok動画, Grok Imagine, grok-video, xAI video, 画像を動かして, image to video with Grok."
metadata:
  short-description: xAI Grok Imagine動画生成CLI（text-to-video / image-to-video）
---

# Grok Video

Generate videos through xAI's Grok Imagine async videos API, using the
bundled standalone CLI. Extracted from Hermes Agent's
`plugins/video_gen/xai` provider — same model auto-selection, clamping,
and error contract, but stdlib-only and runnable without the Hermes
runtime.

## How to run

```bash
python3 scripts/grok_video.py "a cat surfing a wave at sunset, cinematic"
```

(Resolve `scripts/` relative to this skill folder.)

Image-to-video (animate a still image — URL, data URI, or local file):

```bash
python3 scripts/grok_video.py "slow zoom in, gentle wind in the hair" \
  --image ./portrait.png --out ./portrait-animated.mp4
```

Options:

```bash
python3 scripts/grok_video.py "prompt" \
  --image PATH_OR_URL          # image-to-video (mutually exclusive with --ref)
  --ref img1.png --ref img2.png  # style/character reference images, max 7
  --duration 8                 # seconds, clamped 1-15 (10 with refs)
  --aspect 16:9                # 1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3
  --resolution 720p            # 480p or 720p
  --model grok-imagine-video   # override auto-selection
  --timeout 240                # max wait for completion
  --out video.mp4              # also download the result locally
```

Output is a single JSON object on stdout; exit code 0 on success.

## Models (auto-selected by modality)

- Text-to-video → `grok-imagine-video`
- Image-to-video (`--image`) → `grok-imagine-video-1.5-preview`
  (this model **rejects text-only calls**; the CLI routes automatically)
- Explicit `--model` always wins.

## Credentials

Resolved in this order (no flags needed):

1. Hermes Agent checkout (`HERMES_AGENT_DIR` env, default `~/hermes-agent`) —
   reuses Hermes's SuperGrok OAuth with automatic token refresh.
2. `XAI_API_KEY` in the process environment (`XAI_BASE_URL` optional).
3. `XAI_API_KEY` in `~/.hermes/.env`.

If none are available the tool fails fast with instructions; report that to
the user instead of retrying.

## Reading the result

- `video`: HTTPS URL on xAI's CDN (time-limited — download promptly).
- `local_path`: present when `--out` was given and the download succeeded.
- `request_id`: xAI job id, useful when reporting failures.
- On failure `success: false` with `error` / `error_type`
  (`auth_required`, `api_error`, `timeout`, `xai_failed`, ...).

## Rules for agents

- Generation typically takes 1-4 minutes; the call blocks until done. Use
  a generous Bash timeout (≥ 300000 ms) and do not retry while a call is
  still running.
- Each call is a billable xAI request. Refine the prompt once and submit
  one good call instead of many probes.
- Always pass `--out` when the user wants the file; the CDN URL expires.
- Validation errors (`conflicting_inputs`, `too_many_references`,
  `missing_prompt`) fail before any billable API call — fix the arguments
  rather than retrying as-is.
