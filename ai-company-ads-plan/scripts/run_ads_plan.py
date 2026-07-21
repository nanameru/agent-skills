#!/usr/bin/env python3
"""Resolve app repositories and run the AI Company ads.plan dry run safely."""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
from typing import Iterable


DOM_MARKER = Path("scripts/ai-company-request.mjs")
TAIYO_MARKER = Path("scripts/product-growth-control.py")
FIXTURE = Path("test/fixtures/ai-company-dry-run.json")
LIVE_ENV_NAMES = (
    "DOM_TO_PPTX_POSTHOG_PROJECT_ID",
    "DOM_TO_PPTX_POSTHOG_PERSONAL_API_KEY",
    "DOM_TO_PPTX_POSTHOG_KEY_ROTATED_AT",
)


class ResolutionBlocked(RuntimeError):
    """Raised when a repository cannot be selected without guessing."""


def is_repo(path: Path, marker: Path) -> bool:
    return path.is_dir() and (path / marker).is_file()


def unique_paths(paths: Iterable[Path]) -> list[Path]:
    seen: set[Path] = set()
    result: list[Path] = []
    for path in paths:
        try:
            resolved = path.expanduser().resolve()
        except OSError:
            continue
        if resolved not in seen:
            seen.add(resolved)
            result.append(resolved)
    return result


def current_candidates(cwd: Path, marker: Path) -> list[Path]:
    return [parent for parent in (cwd, *cwd.parents) if is_repo(parent, marker)]


def discovered_candidates(home: Path, marker: Path, prefix: str) -> list[Path]:
    candidates: list[Path] = []

    for direct in sorted(home.glob(f"{prefix}*")):
        if is_repo(direct, marker):
            candidates.append(direct)

    search_roots = (
        home / ".codex" / "worktrees",
        home / f"{prefix}-worktrees",
    )
    marker_pattern = str(marker)
    for root in search_roots:
        if not root.is_dir():
            continue
        try:
            for match in root.rglob(marker_pattern):
                candidates.append(match.parents[len(marker.parts) - 1])
        except OSError:
            continue

    return unique_paths(candidates)


def resolve_repo(
    *,
    label: str,
    marker: Path,
    prefix: str,
    explicit: str | None,
    env_name: str,
    cwd: Path,
    home: Path,
) -> Path:
    selected = explicit or os.environ.get(env_name)
    if selected:
        candidate = Path(selected).expanduser().resolve()
        if not is_repo(candidate, marker):
            raise ResolutionBlocked(
                f"{label} path is invalid; set {env_name} to a repository containing {marker}"
            )
        return candidate

    local = unique_paths(current_candidates(cwd.resolve(), marker))
    if len(local) == 1:
        return local[0]

    primary = home / prefix
    if is_repo(primary, marker):
        return primary.resolve()

    discovered = discovered_candidates(home, marker, prefix)
    if len(discovered) == 1:
        return discovered[0]
    if len(discovered) > 1:
        raise ResolutionBlocked(
            f"multiple {label} repositories found; set {env_name} to the intended absolute path"
        )
    raise ResolutionBlocked(
        f"{label} repository not found; set {env_name} to an absolute path containing {marker}"
    )


def receipt(status: str, **fields: object) -> None:
    print(json.dumps({"status": status, **fields}, ensure_ascii=False, indent=2))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--mode", choices=("fixture", "live"), default="fixture")
    parser.add_argument("--dom-repo")
    parser.add_argument("--taiyo-repo")
    parser.add_argument("--resolve-only", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    home = Path.home()
    cwd = Path.cwd()

    try:
        dom_repo = resolve_repo(
            label="dom-to-pptx",
            marker=DOM_MARKER,
            prefix="dom-to-pptx",
            explicit=args.dom_repo,
            env_name="DOM_TO_PPTX_REPO",
            cwd=cwd,
            home=home,
        )
        taiyo_repo = resolve_repo(
            label="taiyo-gyomu",
            marker=TAIYO_MARKER,
            prefix="taiyo-gyomu",
            explicit=args.taiyo_repo,
            env_name="TAIYO_GYOMU_REPO",
            cwd=cwd,
            home=home,
        )
    except ResolutionBlocked as error:
        receipt("blocked", reason=str(error))
        return 2

    if args.resolve_only:
        receipt(
            "ready",
            mode=args.mode,
            dom_repo=str(dom_repo),
            taiyo_repo=str(taiyo_repo),
        )
        return 0

    if args.mode == "live":
        missing = [name for name in LIVE_ENV_NAMES if not os.environ.get(name)]
        if missing:
            receipt(
                "blocked",
                reason="rotated read-only PostHog configuration is incomplete",
                missing_environment_variables=missing,
            )
            return 2

    if shutil.which("npm") is None:
        receipt("blocked", reason="npm is required but was not found on PATH")
        return 2

    command = [
        "npm",
        "run",
        "ai-company:ads-plan",
        "--",
        "--dry-run",
    ]
    if args.mode == "fixture":
        fixture_path = dom_repo / FIXTURE
        if not fixture_path.is_file():
            receipt("blocked", reason=f"fixture is missing: {FIXTURE}")
            return 2
        print(
            "notice: PostHog and finance inputs are synthetic fixture values; "
            "Git and repository metadata come from the resolved local repository.",
            file=sys.stderr,
        )
        command.extend(("--fixture", str(fixture_path)))
    command.extend(("--taiyo-repo", str(taiyo_repo)))

    completed = subprocess.run(command, cwd=dom_repo, check=False)
    return completed.returncode


if __name__ == "__main__":
    sys.exit(main())
