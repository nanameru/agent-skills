#!/usr/bin/env python3
"""Validate AI PLAY GUILD eyecatch dimensions and a visible design-aware frame."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from PIL import Image, ImageStat


def mean_rgb(image: Image.Image) -> tuple[float, float, float]:
    return tuple(ImageStat.Stat(image.convert("RGB")).mean[:3])


def color_distance(left: Image.Image, right: Image.Image) -> float:
    a = mean_rgb(left)
    b = mean_rgb(right)
    return sum((x - y) ** 2 for x, y in zip(a, b)) ** 0.5


def frame_samples(image: Image.Image, frame_px: int) -> list[tuple[Image.Image, Image.Image, Image.Image]]:
    width, height = image.size
    samples: list[tuple[Image.Image, Image.Image, Image.Image]] = []
    segments = 8
    for index in range(segments):
        x1 = frame_px + (width - frame_px * 2) * index // segments
        x2 = frame_px + (width - frame_px * 2) * (index + 1) // segments
        samples.append(
            (
                image.crop((x1, 0, x2, frame_px)),
                image.crop((x1, 0, x2, max(1, frame_px // 2))),
                image.crop((x1, frame_px * 2, x2, frame_px * 3)),
            )
        )
        samples.append(
            (
                image.crop((x1, height - frame_px, x2, height)),
                image.crop((x1, height - max(1, frame_px // 2), x2, height)),
                image.crop((x1, height - frame_px * 3, x2, height - frame_px * 2)),
            )
        )
    for index in range(segments):
        y1 = frame_px + (height - frame_px * 2) * index // segments
        y2 = frame_px + (height - frame_px * 2) * (index + 1) // segments
        samples.append(
            (
                image.crop((0, y1, frame_px, y2)),
                image.crop((0, y1, max(1, frame_px // 2), y2)),
                image.crop((frame_px * 2, y1, frame_px * 3, y2)),
            )
        )
        samples.append(
            (
                image.crop((width - frame_px, y1, width, y2)),
                image.crop((width - max(1, frame_px // 2), y1, width, y2)),
                image.crop((width - frame_px * 3, y1, width - frame_px * 2, y2)),
            )
        )
    return samples


def validate(path: Path, frame_px: int = 14) -> dict[str, object]:
    image = Image.open(path).convert("RGB")
    width, height = image.size
    errors: list[dict[str, object]] = []
    if (width, height) != (1280, 670):
        errors.append({"code": "wrong-size", "actual": [width, height], "expected": [1280, 670]})

    if width > frame_px * 5 and height > frame_px * 5:
        samples = frame_samples(image, frame_px)
        contrast_distances = [color_distance(frame, adjacent) for frame, _, adjacent in samples]
        coherence_distances = [color_distance(frame, outer_half) for frame, outer_half, _ in samples]
        contrast_ratio = sum(distance >= 18 for distance in contrast_distances) / len(samples)
        coherence_ratio = sum(distance <= 28 for distance in coherence_distances) / len(samples)
        if contrast_ratio < 0.7:
            errors.append(
                {
                    "code": "outer-frame-not-visually-separated",
                    "contrasting_segments_ratio": round(contrast_ratio, 3),
                    "minimum": 0.7,
                }
            )
        if coherence_ratio < 0.7:
            errors.append(
                {
                    "code": "outer-frame-not-continuous",
                    "coherent_segments_ratio": round(coherence_ratio, 3),
                    "minimum": 0.7,
                }
            )

    return {
        "ok": not errors,
        "errors": errors,
        "size": [width, height],
        "frame_px": frame_px,
        "rule": "frame color may vary; it must be continuous and visibly separated from the inner design",
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("image", type=Path)
    parser.add_argument("--frame-px", type=int, default=14)
    parser.add_argument("--json-output", type=Path)
    args = parser.parse_args()
    result = validate(args.image, args.frame_px)
    payload = json.dumps(result, ensure_ascii=False, indent=2)
    if args.json_output:
        args.json_output.write_text(payload + "\n", encoding="utf-8")
    print(payload)
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
