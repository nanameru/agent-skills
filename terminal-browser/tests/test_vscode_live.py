"""Opt-in macOS integration: two real servers; no existing job is stopped."""
import importlib.util
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch
import urllib.parse
import uuid

spec = importlib.util.spec_from_file_location('live_chat_browser', Path(__file__).parents[1] / 'scripts/chat_browser.py')
cb = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cb)


@unittest.skipUnless(os.environ.get('RUN_LIVE_VSCODE') == '1', 'RUN_LIVE_VSCODE=1 on macOS')
class LiveVSCodeTests(unittest.TestCase):
    def test_two_conversations_coexist_and_reuse_their_own_server(self):
        scopes = ['test-' + uuid.uuid4().hex[:20] for _ in range(2)]
        labels = ['com.codex.terminal-browser-vscode.' + s for s in scopes]
        with tempfile.TemporaryDirectory() as temp, patch.object(cb, 'open_browser') as opened:
            root = Path(temp)
            directories = [root / s for s in scopes]
            targets = [root / 'project A', root / 'project B']
            for p in directories + targets:
                p.mkdir()
            try:
                for target, scope, directory in zip(targets, scopes, directories):
                    cb.vscode(target, dict(os.environ), scope, directory)
                servers = [cb.load(d / 'vscode-server.json') for d in directories]
                self.assertNotEqual(servers[0]['port'], servers[1]['port'])
                self.assertNotEqual(servers[0]['label'], servers[1]['label'])
                self.assertTrue(all(cb.healthy(s['port']) for s in servers))
                cb.vscode(targets[1], dict(os.environ), scopes[0], directories[0])
                self.assertEqual(cb.load(directories[0] / 'vscode-server.json'), servers[0])
                self.assertTrue(all(cb.healthy(s['port']) for s in servers))
                url = opened.call_args[0][0]
                self.assertEqual(urllib.parse.parse_qs(urllib.parse.urlparse(url).query)['folder'], [str(targets[1].resolve())])
                self.assertEqual(opened.call_args[0][3], 'vscode')
            finally:
                for label in labels:
                    subprocess.run(['launchctl', 'remove', label], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
