#!/usr/bin/python3
"""Route Herdr browser operations by conversation, never by UI focus."""
import contextlib
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import socket
import sqlite3
import subprocess
import sys
import time
import urllib.parse
import urllib.request

HOME = Path.home()
UPSTREAM = HOME / '.local/share/terminal-browser/app/bin/terminal-browser'
STATE = Path(os.environ.get('XDG_STATE_HOME', HOME / '.local/state')) / 'terminal-browser-chat'


def run(args, env=None, capture=True):
    return subprocess.run([str(a) for a in args], env=env, check=True,
                          text=True, stdout=subprocess.PIPE if capture else None).stdout


def herdr(args, env):
    return json.loads(run([env.get('HERDR_BIN_PATH', 'herdr'), *args], env))['result']


def thread_info(thread):
    # Local metadata only; do not read conversation bodies or logs.
    db = HOME / '.codex/state_5.sqlite'
    with sqlite3.connect(db.as_uri() + '?mode=ro', uri=True) as conn:
        row = conn.execute('SELECT name,cwd FROM threads WHERE id=?', (thread,)).fetchone()
        if not row or not row[0]:
            raise RuntimeError('会話名が未登録です。表示先を特定できないため起動しません。')
        duplicates = conn.execute(
            'SELECT count(*) FROM threads WHERE name=? AND cwd=? AND archived=0', row).fetchone()[0]
    if duplicates != 1:
        raise RuntimeError('同じ会話名のスレッドが複数あります。一意な会話名が必要です。')
    return row


def title_name(pane):
    title = pane.get('terminal_title_stripped', '')
    title = re.sub(r'^[\u2800-\u28ff]\s+', '', title)
    return title.rsplit(' | ', 1)[0]


def choose_pane(panes, thread, info=None):
    candidates = [p for p in panes if p.get('agent') == 'codex'
                  and p.get('agent_session', {}).get('value') == thread
                  and p.get('agent_session', {}).get('agent') == 'codex']
    if len(candidates) == 1:
        candidate = candidates[0]
        if info is not None and (title_name(candidate) != info[0] or
                os.path.realpath(candidate.get('foreground_cwd', candidate.get('cwd', ''))) != os.path.realpath(info[1])):
            raise RuntimeError('会話IDと会話名・作業フォルダが不一致です。古い紐付けには開きません。')
        return candidate
    if candidates:
        raise RuntimeError('同じ会話IDが複数のペインにあります。起動しません。')
    if info is None:
        raise RuntimeError('会話IDと一致するペインがありません。')
    name, cwd = info
    candidates = [p for p in panes if p.get('agent') == 'codex'
                  and not p.get('agent_session')
                  and title_name(p) == name
                  and os.path.realpath(p.get('foreground_cwd', p.get('cwd', ''))) == os.path.realpath(cwd)]
    if len(candidates) != 1:
        raise RuntimeError('会話の表示先が一意ではありません。別チャットには開きません。')
    return candidates[0]


def resolve(env):
    env = dict(env)
    if env.get('HERDR_ENV') != '1':
        raise RuntimeError('Herdr内で実行してください。')
    thread = env.get('CODEX_THREAD_ID')
    if thread:
        panes = herdr(['pane', 'list'], env)['panes']
        pane = choose_pane(panes, thread, thread_info(thread))
    else:
        if not env.get('HERDR_PANE_ID'):
            raise RuntimeError('呼び出し元ペインが不明です。')
        pane = herdr(['pane', 'get', env['HERDR_PANE_ID']], env)['pane']
    env.update(HERDR_PANE_ID=pane['pane_id'], HERDR_TAB_ID=pane['tab_id'],
               HERDR_WORKSPACE_ID=pane['workspace_id'])
    identity = '\0'.join([env.get('HERDR_SOCKET_PATH', ''), thread or pane['pane_id']])
    scope = hashlib.sha256(identity.encode()).hexdigest()[:24]
    return env, scope


@contextlib.contextmanager
def locked(scope):
    directory = STATE / scope
    directory.mkdir(parents=True, exist_ok=True, mode=0o700)
    with (directory / 'lock').open('a') as handle:
        fcntl.flock(handle, fcntl.LOCK_EX)
        yield directory


def load(path):
    try:
        return json.loads(path.read_text())
    except (FileNotFoundError, ValueError):
        return {}


def save(path, value):
    temp = path.with_suffix('.tmp')
    temp.write_text(json.dumps(value))
    temp.replace(path)


def browsers(env):
    return json.loads(run([UPSTREAM, 'ls', '--all', '--json'], env))['browsers']


def on_right(browser, env):
    pane = browser.get('pane', {})
    if pane.get('tab') != env['HERDR_TAB_ID']:
        return False
    layout = herdr(['pane', 'layout', '--pane', env['HERDR_PANE_ID']], env)['layout']
    rects = {p['pane_id']: p['rect'] for p in layout['panes']}
    parent, child = rects.get(env['HERDR_PANE_ID']), rects.get(pane.get('pane'))
    return bool(parent and child and child['x'] >= parent['x'] + parent['width'])


def normalized_url(url):
    try:
        if Path(url).exists():
            return Path(url).resolve().as_uri()
    except OSError:
        pass
    if not urllib.parse.urlparse(url).scheme:
        return 'http://' + url
    if re.match(r'^[^/:]+:\d+(?:/|$)', url):
        return 'http://' + url
    return url


def open_browser(url, env, directory, role='web', options=None):
    options = options or []
    record_path = directory / (role + '-browser.json')
    record = load(record_path)
    current = browsers(env)
    browser = next((b for b in current if b['key'] == record.get('key')), None)
    if browser:
        if not on_right(browser, env):
            raise RuntimeError('この会話のブラウザが右側から移動されています。誤った場所には開きません。')
        if url:
            active = next((t for t in browser['tabs'] if t.get('active')), None)
            if not active:
                raise RuntimeError('再利用するブラウザのタブがありません。')
            run([UPSTREAM, 'action', '--browser', browser['key'], '--tab', active['id'],
                 '--', 'eval', 'location.href = ' + json.dumps(normalized_url(url))], env)
        print(json.dumps({'browser': browser['key'], 'pane': browser['pane'], 'reused': True}))
        return browser
    # Re-resolve just before opening; a moved/renamed conversation must not use stale context.
    checked, _ = resolve(env)
    if checked['HERDR_PANE_ID'] != env['HERDR_PANE_ID']:
        raise RuntimeError('会話のペインが移動しました。もう一度実行してください。')
    before = {b['key'] for b in current}
    run([UPSTREAM, 'open', *([url] if url else []), '--split', 'right', *options], env)
    fresh = [b for b in browsers(env) if b['key'] not in before and on_right(b, env)]
    if len(fresh) != 1:
        raise RuntimeError('右側ブラウザの登録を確認できませんでした。追加起動せず停止します。')
    browser = fresh[0]
    save(record_path, {'key': browser['key']})
    print(json.dumps({'browser': browser['key'], 'pane': browser['pane'], 'reused': False}))
    return browser


def healthy(port):
    try:
        with urllib.request.urlopen('http://127.0.0.1:%s/' % int(port), timeout=1) as response:
            return response.status == 200
    except (OSError, ValueError, TypeError):
        return False


def vscode(target, env, scope, directory):
    target = Path(target).resolve(strict=True)
    if target.is_file():
        target = target.parent
    code = Path('/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code')
    server_path = directory / 'vscode-server.json'
    server = load(server_path)
    label = 'com.codex.terminal-browser-vscode.' + scope
    job = subprocess.run(['launchctl', 'list', label], stdout=subprocess.DEVNULL,
                         stderr=subprocess.DEVNULL)
    if job.returncode != 0 or not healthy(server.get('port')):
        # Never remove another conversation's launch job (including the legacy shared job).
        if job.returncode == 0:
            raise RuntimeError('この会話のVS Codeは起動中ですが応答しません。停止せず確認を求めます。')
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0))
            port = sock.getsockname()[1]
        if not code.is_file():
            raise RuntimeError('公式Visual Studio Codeがありません。')
        run(['launchctl', 'submit', '-l', label, '-o', directory / 'vscode.log',
             '-e', directory / 'vscode.log', '--', code, 'serve-web', '--host', '127.0.0.1',
             '--port', port, '--without-connection-token', '--accept-server-license-terms',
             '--disable-telemetry', '--default-folder', target,
             '--server-data-dir', directory / 'server-data'], env)
        server = {'port': port, 'label': label}
        save(server_path, server)
        for _ in range(80):
            if healthy(port):
                break
            time.sleep(.25)
        else:
            raise RuntimeError('VS Code起動待ちがタイムアウトしました。ログ: ' + str(directory / 'vscode.log'))
    url = 'http://127.0.0.1:%s/?%s' % (server['port'], urllib.parse.urlencode({'folder': str(target)}))
    return open_browser(url, env, directory, 'vscode', ['--size', '0.55'])


def terminal_code(target, env, directory):
    """Use tode while preserving the conversation's window ownership."""
    target = Path(target).resolve(strict=True)
    binary = HOME / '.local/lib/tode/vendor/terminal-browser/bin/terminal-browser'
    ipc_dir = HOME / '.local/state/tode/ipc'
    def windows():
        return json.loads(run([binary, 'ls', '--all', '--json'], env))['browsers']
    def sockets():
        return {str(p) for p in ipc_dir.glob('*.sock') if p.is_socket()}
    record_path = directory / 'terminal-code.json'
    record = load(record_path)
    current = windows()
    owned = next((b for b in current if b['key'] == record.get('key')), None)
    # Adopt an already tested window only when both browser and IPC are unambiguous.
    if not record:
        here = [b for b in current if on_right(b, env)]
        if len(current) == 1 and len(here) == 1 and len(sockets()) == 1:
            owned = here[0]
            record = {'key': owned['key'], 'ipc': next(iter(sockets()))}
    call_env = dict(env)
    call_env.pop('TODE_IPC', None)
    if owned:
        if not on_right(owned, env) or record.get('ipc') not in sockets():
            raise RuntimeError('この会話のTerminal Codeを安全に再利用できません。別会話には開きません。')
        call_env['TODE_IPC'] = record['ipc']
        run([HOME / '.local/bin/tode', '--reuse-window', target], call_env)
        save(record_path, record)
        print(json.dumps({'browser': owned['key'], 'pane': owned['pane'], 'reused': True}))
        return owned
    checked, _ = resolve(env)
    if checked['HERDR_PANE_ID'] != env['HERDR_PANE_ID']:
        raise RuntimeError('会話が移動しました。もう一度実行してください。')
    before_keys, before_ipc = {b['key'] for b in current}, sockets()
    run([HOME / '.local/bin/tode', target, '--new-window', '--split', 'right', '--size', '0.55'], call_env)
    fresh = [b for b in windows() if b['key'] not in before_keys and on_right(b, env)]
    for _ in range(40):
        new_ipc = sockets() - before_ipc
        if new_ipc:
            break
        time.sleep(.25)
    if len(fresh) != 1 or len(new_ipc) != 1:
        raise RuntimeError('Terminal Codeの会話別ウィンドウを一意に登録できませんでした。')
    owned = fresh[0]
    save(record_path, {'key': owned['key'], 'ipc': next(iter(new_ipc))})
    print(json.dumps({'browser': owned['key'], 'pane': owned['pane'], 'reused': False}))
    return owned


def cli(argv):
    # Help/version/setup are non-routing commands, and work even outside Herdr.
    if not argv or argv[0] in ('help', '--help', '-h', '--version', 'setup', 'upgrade') or '--help' in argv:
        return subprocess.call([str(UPSTREAM), *argv])
    if os.environ.get('HERDR_ENV') != '1':
        if argv[0] in ('code', 'terminal-code', 'vscode'):
            raise RuntimeError('VS CodeはHerdr内で開いてください。')
        return subprocess.call([str(UPSTREAM), *argv])
    env, scope = resolve(os.environ)
    if argv[0] == 'context':
        print(json.dumps({k: env[k] for k in ('HERDR_PANE_ID', 'HERDR_TAB_ID', 'HERDR_WORKSPACE_ID')}))
        return 0
    if argv[0] in ('code', 'terminal-code', 'vscode'):
        if len(argv) != 2:
            raise RuntimeError('usage: terminal-browser vscode /absolute/path')
        with locked(scope) as directory:
            if argv[0] == 'vscode':
                vscode(argv[1], env, scope, directory)
            else:
                terminal_code(argv[1], env, directory)
        return 0
    known = ('ls', 'action', 'new-tab', 'shutdown')
    if argv[0] not in known:
        args = argv[1:] if argv[0] == 'open' else argv
        # Keep the supported safe path small; do not silently ignore security/SSH options.
        url, options = None, []
        i = 0
        while i < len(args):
            if args[i] in ('--split', '--size') and i + 1 < len(args):
                flag, value = args[i:i+2]
                if flag == '--split' and value != 'right':
                    raise RuntimeError('Herdrでは会話の右側へ表示します。--split rightを指定してください。')
                if flag == '--size':
                    options += [flag, value]
                i += 2
            elif not args[i].startswith('-') and url is None:
                url = args[i]
                i += 1
            else:
                raise RuntimeError('この会話用ラッパーでは未対応のオプションです: ' + args[i])
        with locked(scope) as directory:
            open_browser(url, env, directory, options=options)
        return 0
    if argv[0] == 'shutdown':
        raise RuntimeError('shutdownは全チャットを閉じるため実行しません。')
    return subprocess.call([str(UPSTREAM), *argv], env=env)


if __name__ == '__main__':
    try:
        sys.exit(cli(sys.argv[1:]))
    except (RuntimeError, OSError, sqlite3.Error, subprocess.CalledProcessError) as error:
        print('terminal-browser: ' + str(error), file=sys.stderr)
        sys.exit(1)
