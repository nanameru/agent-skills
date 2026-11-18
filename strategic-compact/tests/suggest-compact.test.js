'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const hook = path.resolve(__dirname, '../scripts/hooks/suggest-compact.js');

function isolatedHook(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'compact-hook-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const home = path.join(root, 'home');
  const tmp = path.join(root, 'tmp');
  const agentData = path.join(root, 'agent-data');
  for (const dir of [home, tmp, agentData]) fs.mkdirSync(dir, { mode: 0o700 });

  const env = {
    HOME: home,
    USERPROFILE: home,
    TMPDIR: tmp,
    TMP: tmp,
    TEMP: tmp,
    ECC_AGENT_DATA_HOME: agentData,
    // Retain only the OS essentials; inherited threshold/window settings must
    // not affect default-threshold checks or touch the real session state.
    ...(process.env.PATH ? { PATH: process.env.PATH } : {}),
    ...(process.env.SystemRoot ? { SystemRoot: process.env.SystemRoot } : {})
  };
  const file = path.join(root, 'synthetic.jsonl');

  function run(session, records, overrides = {}) {
    fs.writeFileSync(file, records.map(record => JSON.stringify(record)).join('\n'));
    const child = spawnSync(process.execPath, [hook], {
      input: JSON.stringify({ session_id: session, transcript_path: file }),
      encoding: 'utf8',
      env: { ...env, ...overrides },
      timeout: 10000
    });
    assert.ifError(child.error);
    assert.equal(child.signal, null);
    assert.equal(child.status, 0, child.stderr);
    return child;
  }

  return { tmp, state: path.join(home, '.strategic-compact'), run };
}

function event(input) {
  return {
    type: 'event_msg',
    payload: {
      type: 'token_count',
      info: {
        last_token_usage: { input_tokens: input, cached_input_tokens: 90000, output_tokens: 900000 },
        total_token_usage: { input_tokens: 999999, total_tokens: 999999 }
      }
    }
  };
}

function usageRecord(input) {
  return {
    type: 'token_usage_record',
    payload: { usage: { input_tokens: input, cached_input_tokens: 90000, output_tokens: 900000, total_tokens: 999999 } }
  };
}

function claude() {
  return {
    type: 'assistant',
    message: { model: 'claude-test', usage: { input_tokens: 30000, cache_read_input_tokens: 120000, cache_creation_input_tokens: 30000 } }
  };
}

function contextFrom(child) {
  const payload = JSON.parse(child.stdout);
  assert.equal(payload.hookSpecificOutput.hookEventName, 'PreToolUse');
  return payload.hookSpecificOutput.additionalContext;
}

for (const [name, makeRecord] of [['event_msg / token_count', event], ['token_usage_record', usageRecord]]) {
  test(`${name} produces one context notification per bucket at default thresholds`, t => {
    const { state, run } = isolatedHook(t);
    const first = run('high', [makeRecord(180000)]);
    const firstMessage = contextFrom(first);
    assert.match(firstMessage, /\[StrategicCompact\] Context ~180k tokens/);
    assert.equal(firstMessage.split('\n').length, 1);
    assert.equal(fs.readFileSync(path.join(state, 'claude-context-bucket-high'), 'utf8'), '0');

    const repeated = run('high', [makeRecord(180500)]);
    assert.equal(repeated.stdout.trim(), '');
    assert.doesNotMatch(repeated.stderr, /\[StrategicCompact\] Context/);

    // Even if cached and cumulative figures are high, a small current input is silent.
    const low = run('low', [makeRecord(100000)]);
    assert.equal(low.stdout.trim(), '');
    assert.doesNotMatch(low.stderr, /\[StrategicCompact\] Context/);
    assert.equal(fs.existsSync(path.join(state, 'claude-context-bucket-low')), false);
  });
}

test('Claude still produces the context notification from its input partitions', t => {
  const { run } = isolatedHook(t);
  const result = run('claude', [claude()]);
  assert.match(contextFrom(result), /\[StrategicCompact\] Context ~180k tokens/);
});

test('the default counter signal is secondary and shares the context payload', t => {
  const { state, run } = isolatedHook(t);
  fs.mkdirSync(state, { mode: 0o700 });
  fs.writeFileSync(path.join(state, 'claude-tool-count-both'), '49');
  const message = contextFrom(run('both', [event(180000)]));
  assert.match(message, /\[StrategicCompact\] Context ~180k tokens/);
  assert.match(message, /\[StrategicCompact\] 50 tool calls reached/);
  assert.equal(message.split('\n').length, 2);
});

test('COMPACT_CONTEXT_THRESHOLD=0 disables context while retaining the counter', t => {
  const { state, run } = isolatedHook(t);
  fs.mkdirSync(state, { mode: 0o700 });
  fs.writeFileSync(path.join(state, 'claude-tool-count-disabled'), '49');
  const message = contextFrom(run('disabled', [usageRecord(180000)], { COMPACT_CONTEXT_THRESHOLD: '0' }));
  assert.doesNotMatch(message, /\[StrategicCompact\] Context/);
  assert.match(message, /\[StrategicCompact\] 50 tool calls reached/);
  assert.equal(fs.existsSync(path.join(state, 'claude-context-bucket-disabled')), false);
});

test('notification state is stored in a user-private directory', t => {
  const { tmp, state, run } = isolatedHook(t);
  run('private', [event(180000)]);

  assert.deepEqual(fs.readdirSync(tmp), []);
  assert.equal(fs.readFileSync(path.join(state, 'claude-tool-count-private'), 'utf8'), '1');
  assert.equal(fs.readFileSync(path.join(state, 'claude-context-bucket-private'), 'utf8'), '0');
  if (process.platform !== 'win32') {
    assert.equal(fs.statSync(state).mode & 0o777, 0o700);
    for (const name of fs.readdirSync(state)) {
      assert.equal(fs.statSync(path.join(state, name)).mode & 0o777, 0o600);
    }
  }
});

test('both notification state files reject links without writing their targets', t => {
  const { tmp, state, run } = isolatedHook(t);
  fs.mkdirSync(state, { mode: 0o700 });
  const target = path.join(tmp, 'fixture');
  const original = '0\nfixture contents\n';
  fs.writeFileSync(target, original);
  const link = process.platform === 'win32' ? fs.linkSync : fs.symlinkSync;
  for (const name of ['claude-tool-count-linked', 'claude-context-bucket-linked']) {
    link(target, path.join(state, name));
  }

  const result = run('linked', [event(400000)], { COMPACT_THRESHOLD: '1' });
  assert.equal(result.stdout, '');
  assert.equal(fs.readFileSync(target, 'utf8'), original);
});
