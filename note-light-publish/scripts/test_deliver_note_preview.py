import argparse
import importlib.util
import json
import io
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from contextlib import redirect_stdout


SCRIPT = Path(__file__).with_name("deliver_note_preview.py")
SPEC = importlib.util.spec_from_file_location("deliver_note_preview", SCRIPT)
module = importlib.util.module_from_spec(SPEC)
assert SPEC.loader
SPEC.loader.exec_module(module)


PREVIEW_URL = "https://note.com/preview/npreview123?prev_access_key=secret-token"
PUBLIC_URL = "https://note.com/meru2002/n/npublic456"


def args_for(root: Path, **overrides):
    values = {
        "title": "テスト記事",
        "preview_url": PREVIEW_URL,
        "public_url": PUBLIC_URL,
        "access_model": "light",
        "eyecatch_url": None,
        "env_file": root / ".env.local",
        "state_file": root / "state.json",
        "approved": False,
        "send": False,
        "no_thread_name": False,
    }
    values.update(overrides)
    return argparse.Namespace(**values)


class DeliveryTest(unittest.TestCase):
    def test_dry_run_never_resolves_or_posts_webhook(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(
            module, "resolve_webhook"
        ) as resolve, patch.object(module, "post_webhook") as post, redirect_stdout(io.StringIO()) as output:
            result = module.run(args_for(Path(directory)))
        self.assertEqual(result, 0)
        self.assertNotIn("secret-token", output.getvalue())
        self.assertNotIn("prev_access_key", output.getvalue())
        resolve.assert_not_called()
        post.assert_not_called()

    def test_send_requires_approval(self):
        with tempfile.TemporaryDirectory() as directory, self.assertRaisesRegex(
            module.DeliveryError, "--approved"
        ), patch.object(module, "resolve_webhook") as resolve:
            module.run(args_for(Path(directory), send=True))
        resolve.assert_not_called()

    def test_payload_uses_preview_as_primary_link_and_blocks_mentions(self):
        payload = module.build_payload(
            "テスト記事",
            PREVIEW_URL,
            PUBLIC_URL,
            module.ACCESS_LABELS["light"],
            "https://assets.example.com/eyecatch.png",
            True,
        )
        self.assertLess(payload["content"].index(PREVIEW_URL), payload["content"].index(PUBLIC_URL))
        self.assertEqual(payload["allowed_mentions"], {"parse": []})
        self.assertEqual(payload["thread_name"], "テスト記事")
        self.assertEqual(payload["embeds"][0]["image"]["url"], "https://assets.example.com/eyecatch.png")

    def test_public_article_cannot_be_used_as_duplicate(self):
        with self.assertRaisesRegex(module.DeliveryError, "別の非公開複製"):
            module.parse_note_urls(
                "https://note.com/preview/nsame?prev_access_key=secret",
                "https://note.com/meru2002/n/nsame",
            )

    def test_all_access_models_have_fixed_labels(self):
        self.assertEqual(
            module.ACCESS_LABELS,
            {
                "free": "無料公開 / 公開済み",
                "light": "ライトプラン限定 / 単発500円 / 公開済み",
                "pro": "Proプラン限定 / 単発2000円 / 公開済み",
            },
        )

    def test_success_writes_only_redacted_identifiers_and_blocks_duplicate(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            args = args_for(root, approved=True, send=True)
            with patch.object(module, "resolve_webhook", return_value="https://discord.com/api/webhooks/id/token"), patch.object(
                module, "post_webhook", return_value=204
            ) as post:
                self.assertEqual(module.run(args), 0)
                state_text = args.state_file.read_text(encoding="utf-8")
                state = json.loads(state_text)
                self.assertNotIn("prev_access_key", state_text)
                self.assertNotIn("secret-token", state_text)
                self.assertEqual(state["deliveries"][0]["preview_article_key"], "npreview123")
                sent_payload = post.call_args.args[1]
                self.assertIn(PREVIEW_URL, sent_payload["content"])
            with self.assertRaisesRegex(module.DeliveryError, "配信済み"):
                module.run(args)

    def test_webhook_is_loaded_without_being_returned_in_errors(self):
        with tempfile.TemporaryDirectory() as directory:
            env_file = Path(directory) / ".env.local"
            env_file.write_text(
                'NOTE_PREVIEW_DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/123/token"\n',
                encoding="utf-8",
            )
            self.assertEqual(
                module.resolve_webhook(env_file), "https://discord.com/api/webhooks/123/token"
            )


if __name__ == "__main__":
    unittest.main()
