from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def require(path: str, phrases: list[str]) -> None:
    target = ROOT / path
    text = target.read_text(encoding="utf-8")
    assert len(text.splitlines()) <= 500, f"{path} exceeds 500 lines"
    for phrase in phrases:
        assert phrase in text, f"{phrase!r} missing from {path}"


require(
    "loop-engineering-core/SKILL.md",
    [
        "## Issue Goal Loop",
        "one bounded outer goal loop",
        "Re-evaluate the whole Issue",
        "**Complete**",
        "**Blocked**",
    ],
)
require(
    "loop-engineering-dev/SKILL.md",
    [
        "## Per-Issue Goal Loop",
        "do not create a new Issue for every iteration",
        "single Draft PR",
        "exact resume point",
    ],
)
require(
    "loop-engineering-core/references/development-flow.md",
    [
        "continues the same Issue goal loop until completion or a hard stop",
        "opens at most one Draft PR when complete, or produces a blocked report",
    ],
)

print("issue goal loop contract: OK")
