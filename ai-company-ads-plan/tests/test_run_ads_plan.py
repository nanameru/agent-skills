from __future__ import annotations

import importlib.util
from pathlib import Path
import tempfile
import unittest


SCRIPT = Path(__file__).parents[1] / "scripts" / "run_ads_plan.py"
SPEC = importlib.util.spec_from_file_location("run_ads_plan", SCRIPT)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def make_repo(root: Path, name: str, marker: Path) -> Path:
    repo = root / name
    target = repo / marker
    target.parent.mkdir(parents=True)
    target.write_text("marker\n", encoding="utf-8")
    return repo


class ResolveRepoTest(unittest.TestCase):
    def test_explicit_repository_wins(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            repo = make_repo(root, "selected", MODULE.DOM_MARKER)
            resolved = MODULE.resolve_repo(
                label="dom-to-pptx",
                marker=MODULE.DOM_MARKER,
                prefix="dom-to-pptx",
                explicit=str(repo),
                env_name="UNSET_TEST_REPO",
                cwd=root,
                home=root,
            )
            self.assertEqual(resolved, repo.resolve())

    def test_current_repository_is_detected_from_child(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            repo = make_repo(root, "workspace", MODULE.DOM_MARKER)
            child = repo / "nested" / "task"
            child.mkdir(parents=True)
            resolved = MODULE.resolve_repo(
                label="dom-to-pptx",
                marker=MODULE.DOM_MARKER,
                prefix="dom-to-pptx",
                explicit=None,
                env_name="UNSET_TEST_REPO",
                cwd=child,
                home=root,
            )
            self.assertEqual(resolved, repo.resolve())

    def test_primary_checkout_is_preferred(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            home = Path(directory)
            primary = make_repo(home, "dom-to-pptx", MODULE.DOM_MARKER)
            make_repo(home, "dom-to-pptx-old", MODULE.DOM_MARKER)
            resolved = MODULE.resolve_repo(
                label="dom-to-pptx",
                marker=MODULE.DOM_MARKER,
                prefix="dom-to-pptx",
                explicit=None,
                env_name="UNSET_TEST_REPO",
                cwd=home / "unrelated",
                home=home,
            )
            self.assertEqual(resolved, primary.resolve())

    def test_multiple_non_primary_repositories_block(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            home = Path(directory)
            make_repo(home, "dom-to-pptx-a", MODULE.DOM_MARKER)
            make_repo(home, "dom-to-pptx-b", MODULE.DOM_MARKER)
            with self.assertRaises(MODULE.ResolutionBlocked):
                MODULE.resolve_repo(
                    label="dom-to-pptx",
                    marker=MODULE.DOM_MARKER,
                    prefix="dom-to-pptx",
                    explicit=None,
                    env_name="UNSET_TEST_REPO",
                    cwd=home / "unrelated",
                    home=home,
                )

    def test_missing_repository_blocks(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            home = Path(directory)
            with self.assertRaises(MODULE.ResolutionBlocked):
                MODULE.resolve_repo(
                    label="taiyo-gyomu",
                    marker=MODULE.TAIYO_MARKER,
                    prefix="taiyo-gyomu",
                    explicit=None,
                    env_name="UNSET_TEST_REPO",
                    cwd=home,
                    home=home,
                )


if __name__ == "__main__":
    unittest.main()
