'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { parseCliOutput, resolveCodexThread, resolveThreadId } = require('../scripts/lib/t3-compact-context');

const warning = '[00:59:35.148] WARN (#29): Database migration history diverges from this build; recorded migration ids are skipped, not reconciled by name. {\n  divergent: [\n    \'82:TurnItemConversationIndex (unknown to this build)\',\n  ],\n}\n';
const now = Date.now();
const input = { session_id: 'native-session', turn_id: 'native-turn' };
const tid = 'mcp:launch:synthetic';
const otherTid = 'mcp:launch:other';
const config = threadId => ({ 'shell_environment_policy.set.T3CODE_THREAD_ID': threadId });
const request = (id, threadId, method = 'thread/start') =>
  frame({ id, method, params: { config: config(threadId) } }, 'outgoing');
const response = (id, nativeId = input.session_id) => frame({ id, result: { thread: { id: nativeId } } });
const turn = (threadId = input.session_id, turnId = input.turn_id, at = now) =>
  frame({ method: 'turn/started', params: { threadId, turn: { id: turnId } } }, 'incoming', at);

function frame(payload, direction = 'incoming', at = now) {
  return `[${new Date(at).toISOString()}] NTIVE: ${JSON.stringify({
    provider: 'codex', protocol: 'codex.app-server', kind: 'protocol',
    providerSessionId: 't3-provider-epoch', event: { direction, stage: 'decoded', payload }
  })}`;
}

function logs(t) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'compact-t3-'));
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  const directory = path.join(home, 'userdata', 'logs', 'provider');
  fs.mkdirSync(directory, { recursive: true });
  return { home, write: (name, ...lines) => fs.writeFileSync(path.join(directory, `events.${name}.log`),
    lines.join('\n') + '\n') };
}

test('parses T3 stdout with or without multiline migration diagnostics', () => {
  const value = { threadId: tid, note: 'brackets { and escaped newline\n' };
  const json = JSON.stringify(value, null, 2) + '\n';
  for (const output of [json, warning + json, json + warning, (warning + json).replaceAll('\n', '\r\n')]) {
    assert.deepEqual(parseCliOutput(output), value);
  }
});

test('rejects ambiguous, incomplete and unrecognized CLI output', () => {
  for (const output of [warning, warning + '{}\n{}', warning + '{"threadId":', 'other text\n{}',
    warning.slice(0, -2) + '{}\n']) {
    assert.throws(() => parseCliOutput(output), SyntaxError);
  }
});

test('maps the exact native session and turn through the paired RPC in a shared app-server log', t => {
  const l = logs(t);
  l.write('shared', request(1, otherTid), request(2, tid), response(2),
    response(1, 'another-session'), turn());
  assert.equal(resolveCodexThread(input, l.home, now), tid);
  assert.equal(resolveCodexThread({ ...input, turn_id: 'another-turn' }, l.home, now), null);
  assert.equal(resolveCodexThread({ ...input, session_id: 'another-session' }, l.home, now), null);
});

test('accepts a resume response, ignores old turns and never guesses from a filename', t => {
  const l = logs(t);
  l.write(tid.replaceAll(':', '-'), request(1, tid, 'thread/resume'), response(1),
    turn(input.session_id, input.turn_id, now - 180000));
  assert.equal(resolveCodexThread(input, l.home, now), null);
  l.write('different-name', request(1, tid, 'thread/resume'), response(1), turn());
  assert.equal(resolveCodexThread(input, l.home, now), tid);
  l.write('different-name', request(1, tid, 'thread/resume'), response(2), turn());
  assert.equal(resolveCodexThread(input, l.home, now), null);
});

test('refuses competing native-turn sources and conflicting bindings', t => {
  const l = logs(t);
  l.write('first', request(1, tid), response(1), turn());
  l.write('second', request(1, otherTid), response(1), turn());
  assert.equal(resolveCodexThread(input, l.home, now), null);
  l.write('second');
  l.write('first', request(1, tid), response(1), request(2, otherTid), response(2), turn());
  assert.equal(resolveCodexThread(input, l.home, now), null);
});

test('uses an explicit T3 ID and limits fallback to Codex', t => {
  const l = logs(t);
  l.write('current', request(1, tid), response(1), turn());
  assert.equal(resolveThreadId(input, 'codex', { T3CODE_HOME: l.home }), tid);
  assert.equal(resolveThreadId(input, 'claude', { T3CODE_HOME: l.home }), null);
  assert.equal(resolveThreadId(input, 'codex', { T3CODE_HOME: l.home, T3CODE_THREAD_ID: otherTid }), otherTid);
  assert.equal(resolveThreadId(input, 'codex', { T3CODE_HOME: l.home, T3CODE_THREAD_ID: '--invalid' }), null);
});
