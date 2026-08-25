"""Contract tests for Discord preview delivery across all note Skills."""

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
SHARED_SCRIPT = (
    "/Users/kimurataiyou/.agents/skills/note-light-publish/"
    "scripts/deliver_note_preview.py"
)


class NoteSkillDeliveryContractTest(unittest.TestCase):
    def test_all_note_publish_skills_use_shared_delivery_script(self):
        expected_models = {
            "note-free-publish": "free",
            "note-light-publish": "light",
            "note-pro-publish": "pro",
        }
        for skill, access_model in expected_models.items():
            with self.subTest(skill=skill):
                content = (REPO_ROOT / skill / "SKILL.md").read_text(encoding="utf-8")
                self.assertIn(SHARED_SCRIPT, content)
                self.assertIn(f"--access-model {access_model}", content)
                self.assertIn("--approved --send", content)


if __name__ == "__main__":
    unittest.main()
