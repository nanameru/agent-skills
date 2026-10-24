import importlib.util
import json
import os
from pathlib import Path
import sqlite3
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('chat_browser', Path(__file__).parents[1] / 'scripts/chat_browser.py')
cb = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cb)


def pane(id='actual', name='現在の会話', cwd='/work', session=None):
    value = dict(pane_id=id, tab_id='actual-tab', workspace_id='w1', agent='codex',
                 terminal_title_stripped='⠸ ' + name + ' | repo', foreground_cwd=cwd)
    if session:
        value['agent_session'] = dict(agent='codex', value=session)
    return value


class RoutingTests(unittest.TestCase):
    def test_live_session_wins_over_stale_environment_and_title(self):
        panes = [pane('stale', session='another'), pane(session='current')]
        with patch.object(cb, 'herdr', return_value={'panes': panes}), patch.object(cb, 'thread_info', return_value=('現在の会話', '/work')):
            env, scope = cb.resolve({'HERDR_ENV': '1', 'HERDR_PANE_ID': 'stale', 'CODEX_THREAD_ID': 'current'})
        self.assertEqual(env['HERDR_PANE_ID'], 'actual')
        self.assertEqual(env['HERDR_TAB_ID'], 'actual-tab')

    def test_unique_name_and_cwd_bootstrap_without_session(self):
        chosen = cb.choose_pane([pane('other', cwd='/other'), pane()], 'current', ('現在の会話', '/work'))
        self.assertEqual(chosen['pane_id'], 'actual')

    def test_stale_session_id_with_wrong_title_rejected(self):
        with self.assertRaises(RuntimeError):
            cb.choose_pane([pane(name='以前の会話', session='current')], 'current', ('現在の会話', '/work'))

    def test_duplicate_live_sessions_fail_closed(self):
        with self.assertRaises(RuntimeError):
            cb.choose_pane([pane(session='current'), pane('other', session='current')], 'current', ('現在の会話', '/work'))

    def test_duplicate_titles_fail_closed(self):
        with self.assertRaises(RuntimeError):
            cb.choose_pane([pane(), pane('other')], 'current', ('現在の会話', '/work'))

    def test_title_substring_and_wrong_cwd_do_not_match(self):
        for p in [pane(name='現在の会話 続き'), pane(cwd='/other')]:
            with self.assertRaises(RuntimeError):
                cb.choose_pane([p], 'current', ('現在の会話', '/work'))

    def test_conflicting_session_not_rescued_by_title(self):
        with self.assertRaises(RuntimeError):
            cb.choose_pane([pane(session='other')], 'current', ('現在の会話', '/work'))

    def test_scope_is_per_thread_not_inherited_pane(self):
        panes = [pane('a', session='a'), pane('b', session='b')]
        with patch.object(cb, 'herdr', return_value={'panes': panes}), patch.object(cb, 'thread_info', return_value=('現在の会話', '/work')):
            scopes = [cb.resolve(dict(HERDR_ENV='1', HERDR_PANE_ID='stale', CODEX_THREAD_ID=t))[1] for t in ['a','b','a']]
        self.assertNotEqual(scopes[0], scopes[1])
        self.assertEqual(scopes[0], scopes[2])

    def test_duplicate_db_names_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / '.codex').mkdir()
            with sqlite3.connect(root / '.codex/state_5.sqlite') as db:
                db.execute('CREATE TABLE threads(id,name,cwd,archived)')
                db.executemany('INSERT INTO threads VALUES(?,?,?,0)', [('a','same','/work'),('b','same','/work')])
            with patch.object(cb, 'HOME', root), self.assertRaises(RuntimeError):
                cb.thread_info('a')


class BrowserTests(unittest.TestCase):
    def test_reopen_reuses_owned_browser_and_explicit_tab(self):
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            cb.save(directory / 'web-browser.json', {'key': 'owned'})
            browser = {'key': 'owned', 'pane': {'tab': 'actual-tab', 'pane': 'right'},
                       'tabs': [{'id': 7, 'active': True}]}
            with patch.object(cb, 'browsers', return_value=[browser]), patch.object(cb, 'on_right', return_value=True), patch.object(cb, 'run') as run:
                cb.open_browser('https://example.com', {}, directory)
            args = run.call_args[0][0]
            self.assertIn('action', args)
            self.assertEqual(args[args.index('--browser') + 1], 'owned')
            self.assertEqual(args[args.index('--tab') + 1], 7)
            self.assertNotIn('open', args)

    def test_browser_moved_elsewhere_does_not_navigate_or_open(self):
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            cb.save(directory / 'web-browser.json', {'key': 'owned'})
            with patch.object(cb, 'browsers', return_value=[{'key': 'owned'}]), patch.object(cb, 'on_right', return_value=False), patch.object(cb, 'run') as run:
                with self.assertRaises(RuntimeError):
                    cb.open_browser('https://example.com', {}, directory)
            run.assert_not_called()

    def test_new_browser_receives_resolved_environment(self):
        with tempfile.TemporaryDirectory() as temp:
            env = {'HERDR_PANE_ID': 'actual'}
            browser = {'key': 'fresh', 'pane': {'pane': 'right'}}
            with patch.object(cb, 'browsers', side_effect=[[], [browser]]), patch.object(cb, 'on_right', return_value=True), patch.object(cb, 'resolve', return_value=(env, 'scope')), patch.object(cb, 'run') as run:
                cb.open_browser('https://example.com', env, Path(temp))
            self.assertEqual(run.call_args[0][1]['HERDR_PANE_ID'], 'actual')
            self.assertEqual(cb.load(Path(temp) / 'web-browser.json')['key'], 'fresh')

    def test_unsafe_direction_and_global_shutdown_rejected(self):
        with patch.dict(os.environ, {'HERDR_ENV':'1'}), patch.object(cb, 'resolve', return_value=({}, 'scope')):
            for args in [['open', '--split', 'left'], ['shutdown']]:
                with self.assertRaises(RuntimeError):
                    cb.cli(args)

    def test_local_files_preserve_url_encoding(self):
        with tempfile.TemporaryDirectory() as temp:
            p = Path(temp) / 'a #日本語.html'
            p.touch()
            self.assertEqual(cb.normalized_url(str(p)), p.resolve().as_uri())


class DefaultRepositoryTests(unittest.TestCase):
    def test_omitted_path_uses_conversation_cwd_not_tool_worktree(self):
        import contextlib
        for command in ['code','terminal-code','vscode']:
            with self.subTest(command=command), patch.dict(os.environ,{'HERDR_ENV':'1'}), patch.object(cb,'resolve',return_value=({'CODEX_THREAD_ID':'current'},'scope')), patch.object(cb,'thread_info',return_value=('会話','/conversation/repo')), patch.object(cb,'locked',return_value=contextlib.nullcontext(Path('/state'))), patch.object(cb,'terminal_code') as tode, patch.object(cb,'vscode') as vscode:
                cb.cli([command])
                chosen = vscode if command == 'vscode' else tode
                self.assertEqual(chosen.call_args[0][0],'/conversation/repo')

    def test_explicit_path_wins_over_conversation_default(self):
        import contextlib
        with patch.dict(os.environ,{'HERDR_ENV':'1'}), patch.object(cb,'resolve',return_value=({'CODEX_THREAD_ID':'current'},'scope')), patch.object(cb,'thread_info') as info, patch.object(cb,'locked',return_value=contextlib.nullcontext(Path('/state'))), patch.object(cb,'terminal_code') as tode:
            cb.cli(['code','/explicit/repo'])
            self.assertEqual(tode.call_args[0][0],'/explicit/repo')
            info.assert_not_called()


class TerminalCodeTests(unittest.TestCase):
    def test_reuse_uses_only_recorded_window_ipc(self):
        import socket
        with tempfile.TemporaryDirectory(dir='/tmp') as temp:
            root = Path(temp)
            ipc = root / '.local/state/tode/ipc'
            ipc.mkdir(parents=True)
            sock = socket.socket(socket.AF_UNIX)
            path = ipc / 'owned.sock'
            sock.bind(str(path))
            try:
                cb.save(root / 'terminal-code.json', {'key':'owned', 'ipc':str(path)})
                browser = {'key':'owned', 'pane':{'pane':'right'}}
                calls = []
                def run(args, env):
                    calls.append((args, env))
                    return json.dumps({'browsers':[browser]}) if '--all' in args else ''
                with patch.object(cb,'HOME',root), patch.object(cb,'run',side_effect=run), patch.object(cb,'on_right',return_value=True), patch.object(cb,'ensure_tode_zoom'):
                    cb.terminal_code(root, {'TODE_IPC':'foreign.sock'}, root)
                self.assertEqual(calls[-1][1]['TODE_IPC'],str(path))
                self.assertIn('--reuse-window',calls[-1][0])
                self.assertNotIn('--new-window',calls[-1][0])
            finally:
                sock.close()

    def test_moved_registered_window_is_not_reused(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)
            cb.save(root / 'terminal-code.json', {'key':'owned','ipc':'unknown'})
            with patch.object(cb,'run',return_value=json.dumps({'browsers':[{'key':'owned'}]})) as run, patch.object(cb,'on_right',return_value=False):
                with self.assertRaises(RuntimeError):
                    cb.terminal_code(root, {}, root)
            self.assertEqual(run.call_count,1)


if __name__ == '__main__':
    unittest.main()
