'use strict';

// API-only integration/contract tests: real hook process + isolated files + fake CLI.
// No native hook, installed settings, T3 connection, or actual compact is exercised.
// Codex: https://github.com/openai/codex/tree/710bee73a89385aaf2afb41d885edf82473d941f/codex-rs/hooks/schema/generated
// and codex-rs/hooks/src/types.rs at that revision (input + registration schemas).
// Claude: https://code.claude.com/docs/en/hooks (read 2026-11-16; unpinned).
// T3 Code (Beta) 0.1.8, local app.asar server bundle SHA-256
// b20492735ecfe9f63eda52ab0d88ccc773780238dfed120c3b288c8077cd4238:
// threadSendCommand/threadShowCommand and OrchestratorMcpThreadDetail/ThreadSendResult.
// These references describe schemas, not actual runtime delivery or trust.

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const test = require('node:test');

const hook = path.resolve(__dirname, '../scripts/hooks/queue-compact.js');
const fakeScript = path.resolve(__dirname, 'fixtures/queue-fake-cli.js');
const clock = path.resolve(__dirname, 'fixtures/queue-clock.js');
const guard = path.resolve(__dirname, 'fixtures/queue-guard.js');
const threadId = '00000000-0000-4000-8000-000000000062';
const requestRun = 'synthetic-compact-run';
const laterRun = 'synthetic-later-run';
const startTime = 1700000000000;
const sha = text => crypto.createHash('sha256').update(text).digest('hex');

function codexEvent(n) {
  return { type: 'event_msg', payload: { type: 'token_count', info: {
    last_token_usage: { input_tokens: n, cached_input_tokens: 90000, output_tokens: 800000 },
    total_token_usage: { input_tokens: 999999 }
  } } };
}
function codexRecord(n) {
  return { type: 'token_usage_record', payload: { usage: {
    input_tokens: n, cached_input_tokens: 90000, output_tokens: 800000
  }, thread_total_tokens: 999999 } };
}
function claudeRecord(n) {
  return { type: 'assistant', message: { model: 'claude-test', usage: {
    input_tokens: n - 120000, cache_read_input_tokens: 100000,
    cache_creation_input_tokens: 20000, output_tokens: 900000
  } } };
}

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'issue62-queue-'));
  fs.chmodSync(root, 0o700);
  t.after(() => {
    try {
      assert.equal(fs.existsSync(path.join(root, 'guard-violation')), false,
        'hook attempted to start a command outside the absolute fake CLI');
      const file = path.join(root, 'calls.jsonl');
      if (fs.existsSync(file)) {
        for (const line of fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean)) {
          const args = JSON.parse(line).argv;
          const validShow = ['thread', 'show', threadId, '--messages', '1', '--json'];
          const validSend = ['thread', 'send', threadId, '/compact', '--json'];
          assert.ok(JSON.stringify(args) === JSON.stringify(validShow) ||
            JSON.stringify(args) === JSON.stringify(validSend), 'fake CLI saw unexpected argv: ' + JSON.stringify(args));
        }
      }
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
  const home = path.join(root, 'home');
  const tmp = path.join(root, 'tmp');
  const emptyPath = path.join(root, 'empty-path');
  fs.mkdirSync(home, { mode: 0o700 });
  fs.mkdirSync(tmp, { mode: 0o700 });
  fs.mkdirSync(emptyPath, { mode: 0o700 });
  const fake = path.join(root, 'fake-t3');
  // The wrapper only execs the absolute Node executable and the fixture script
  // supplied in the clean environment below. It cannot fall back to a real CLI.
  fs.writeFileSync(fake, '#!/bin/sh\nexec "$FAKE_NODE" "$FAKE_SCRIPT" "$@"\n', { mode: 0o700 });
  const transcript = path.join(root, 'synthetic-transcript.jsonl');
  const stateDir = path.join(home, '.local', 'state', 'strategic-compact');
  const stateFile = path.join(stateDir, sha(threadId) + '.json');
  const lock = path.join(stateDir, sha(threadId) + '.lock');
  const hazard = path.join(stateDir, sha(threadId) + '.unsafe');
  const configFile = path.join(root, 'cli-config.json');
  let now = startTime;
  let config = {
    // Required OrchestratorMcpThreadDetail fields, not a guessed partial response.
    thread: { threadId, projectId: 'synthetic-project', title: 'Synthetic thread',
      createdBy: 'user', creationSource: 'web', status: 'running',
      activeRunId: 'synthetic-current-run', latestRunId: 'synthetic-current-run',
      providerInstanceId: 'codex', model: 'synthetic-model', runtimeMode: 'full-access',
      interactionMode: 'default', linkedPullRequest: null, titleRegeneration: null,
      branch: null, worktreePath: null, parentThreadId: null, relationshipToParent: null,
      runCount: 1, itemCount: 1, pendingRequestCount: 0, archived: false, settled: false,
      settledAt: null, snoozed: false, snoozedUntil: null,
      createdAt: '2023-11-14T22:13:20.000Z', updatedAt: '2023-11-14T22:13:20.000Z' },
    receipt: { threadId, messageId: 'synthetic-message', runId: requestRun,
      status: 'queued', delivery: 'queued' }
  };
  const configure = patch => {
    config = { ...config, ...patch };
    fs.writeFileSync(configFile, JSON.stringify(config), { mode: 0o600 });
  };
  configure({});
  const setUsage = (...records) => fs.writeFileSync(transcript,
    records.map(value => typeof value === 'string' ? value : JSON.stringify(value)).join('\n') + '\n');
  setUsage(codexEvent(160000));

  // Explicit allow-list: no real HOME, PATH, T3 ID or CLI is inherited.
  const envFor = (opts = {}) => {
    const env = {
      HOME: home, PATH: emptyPath, TMPDIR: tmp, TMP: tmp, TEMP: tmp,
      T3CODE_CLI_PATH: fake, T3CODE_THREAD_ID: threadId,
      FAKE_ROOT: root, FAKE_NODE: process.execPath, FAKE_SCRIPT: fakeScript,
      FAKE_STATE_FILE: stateFile, FAKE_SAFE: 'issue62-synthetic-only',
      FAKE_NOW: String(now)
    };
    if (opts.cli === null) delete env.T3CODE_CLI_PATH;
    else if (opts.cli === 'relative') env.T3CODE_CLI_PATH = 'fake-t3';
    if (opts.noThread) delete env.T3CODE_THREAD_ID;
    if (opts.threshold !== undefined) env.COMPACT_CONTEXT_THRESHOLD = String(opts.threshold);
    if (opts.interval !== undefined) env.COMPACT_CONTEXT_INTERVAL = String(opts.interval);
    if (opts.window !== undefined) env.ECC_CONTEXT_WINDOW_TOKENS = String(opts.window);
    if (opts.nativeBudget !== undefined) env.CLAUDE_CODE_AUTO_COMPACT_WINDOW = String(opts.nativeBudget);
    return env;
  };
  const payload = (harness = 'codex', event = 'Stop', patch = {}) => {
    const common = { session_id: 'synthetic-session', transcript_path: transcript,
      cwd: root, hook_event_name: event };
    if (harness === 'codex') {
      common.turn_id = 'synthetic-turn';
      common.model = 'gpt-synthetic';
      if (event === 'Stop') {
        common.permission_mode = 'default';
        common.last_assistant_message = null;
      }
    }
    if (event === 'Stop') {
      common.stop_hook_active = false;
      if (harness === 'claude') {
        common.permission_mode = 'default';
        common.last_assistant_message = 'synthetic final message';
      }
    } else {
      common.trigger = 'manual';
      if (harness === 'claude' && event === 'PreCompact') common.custom_instructions = null;
      if (harness === 'claude' && event === 'PostCompact') common.compact_summary = 'synthetic summary';
    }
    return { ...common, ...patch };
  };
  function check(child, harness) {
    assert.ifError(child.error);
    assert.equal(child.signal, null);
    assert.equal(child.status, 0, child.stderr);
    assert.equal(child.stdout, harness === 'codex' ? '{}\n' : '');
  }
  function run(harness = 'codex', event = 'Stop', patch = {}, opts = {}) {
    const child = spawnSync(process.execPath, ['--require', guard, '--require', clock, hook, harness], {
      cwd: root, env: envFor(opts), input: JSON.stringify(payload(harness, event, patch)),
      encoding: 'utf8', timeout: 12000
    });
    check(child, harness);
    return child;
  }
  function start(harness = 'codex', event = 'Stop', patch = {}, opts = {}) {
    const child = spawn(process.execPath, ['--require', guard, '--require', clock, hook, harness],
      { cwd: root, env: envFor(opts), stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    child.stdout.setEncoding('utf8').on('data', chunk => { stdout += chunk; });
    child.stderr.setEncoding('utf8').on('data', chunk => { stderr += chunk; });
    const done = new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('close', (status, signal) => {
        try { check({ status, signal, stdout, stderr }, harness); resolve(); } catch (err) { reject(err); }
      });
    });
    child.stdin.end(JSON.stringify(payload(harness, event, patch)));
    return { child, done };
  }
  function calls() {
    try {
      return fs.readFileSync(path.join(root, 'calls.jsonl'), 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
    } catch (err) {
      if (err.code === 'ENOENT') return [];
      throw err;
    }
  }
  const sends = () => calls().filter(call => call.argv[1] === 'send');
  const state = () => JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  const setThread = patch => configure({ thread: { ...config.thread, ...patch } });
  const setTime = ms => { now = ms; };
  const makeStateDir = () => fs.mkdirSync(stateDir, { recursive: true, mode: 0o700 });
  return { root, home, transcript, fake, stateDir, stateFile, lock, hazard, configure,
    setThread, setTime, setUsage, payload, run, start, calls, sends, state, makeStateDir };
}

// Wait for the fake's explicit signal, not a presumed timing window.
function waitForFile(file) {
  return new Promise((resolve, reject) => {
    let watcher;
    const timer = setTimeout(() => { if (watcher) watcher.close(); reject(new Error('fixture barrier timed out')); }, 4000);
    const check = () => {
      if (fs.existsSync(file)) { clearTimeout(timer); if (watcher) watcher.close(); resolve(); }
    };
    watcher = fs.watch(path.dirname(file), check);
    check();
  });
}
function codexProviderLog(f) {
  const directory = path.join(f.home, '.t3', 'userdata', 'logs', 'provider');
  fs.mkdirSync(directory, { recursive: true });
  const file = path.join(directory, 'events.fixture.log');
  const row = (direction, payload) => `[${new Date(startTime).toISOString()}] NTIVE: ${JSON.stringify({
    provider: 'codex', protocol: 'codex.app-server', kind: 'protocol', providerSessionId: 'fixture-epoch',
    event: { stage: 'decoded', direction, payload }
  })}\n`;
  const incoming = (payload) => fs.appendFileSync(file, row('incoming', payload));
  fs.writeFileSync(file, row('outgoing', { id: 1, method: 'thread/start', params: {
    config: { 'shell_environment_policy.set.T3CODE_THREAD_ID': threadId }
  } }));
  incoming({ id: 1, result: { thread: { id: 'synthetic-session' } } });
  return turnId => incoming({ method: 'thread/tokenUsage/updated', params: { threadId: 'synthetic-session', turnId } });
}

function assertSend(f) {
  assert.equal(f.sends().length, 1);
  assert.deepEqual(f.sends()[0].argv, ['thread', 'send', threadId, '/compact', '--json']);
  assert.equal(f.sends()[0].stateAtSend.request.state, 'unknown', 'claim must exist before send');
  assert.ok(f.calls().every(c => c.argv[2] === threadId));
}
function compactPair(f, harness = 'codex') {
  f.setThread({ activeRunId: requestRun, latestRunId: requestRun, status: 'running' });
  f.run(harness, 'PreCompact');
  f.run(harness, 'PostCompact');
}

for (const [label, record, harness] of [
  ['Codex event_msg', codexEvent, 'codex'],
  ['Codex token_usage_record', codexRecord, 'codex'],
  ['Claude input/cache partitions', claudeRecord, 'claude']
]) {
  test(label + ' queues once on the existing threshold and keeps acceptance separate', t => {
    const f = fixture(t);
    if (harness === 'claude') f.setThread({ providerInstanceId: 'claude' });
    f.setUsage(record(160000));
    f.run(harness);
    assertSend(f);
    assert.equal(f.state().request.state, 'queued');
    assert.notEqual(f.state().request.state, 'compact_completed');
    f.run(harness);
    assert.equal(f.sends().length, 1);
  });
}

for (const [label, record] of [['event_msg', codexEvent], ['token_usage_record', codexRecord]]) {
  test(label + ' does not double count cached, output, or cumulative tokens', t => {
    const f = fixture(t);
    f.setUsage(record(159999));
    f.run();
    assert.equal(f.sends().length, 0);
    assert.equal(f.state().request, null);
  });
}

test('newest valid usage wins over malformed records, and missing/bad-only usage is silent', t => {
  const f = fixture(t);
  f.setUsage(codexEvent(100000), codexRecord(160000), '{bad', codexEvent(-1));
  f.run();
  assertSend(f);
  const silent = fixture(t);
  silent.setUsage('{bad', codexEvent(-1), codexRecord(0));
  silent.run();
  assert.equal(silent.sends().length, 0);
  assert.equal(silent.state().request, null);
  silent.run('codex', 'Stop', { transcript_path: path.join(silent.root, 'missing.jsonl') });
  assert.equal(silent.sends().length, 0);
  assert.equal(silent.state().request, null);
});

test('window-scaled threshold, native budget, explicit zero and override are respected', t => {
  for (const [tokens, opts, expected] of [
    [249999, { window: 1000000 }, 0],
    [250000, { window: 1000000 }, 1],
    [79999, { window: 1000000, nativeBudget: 100000 }, 0],
    [80000, { window: 1000000, nativeBudget: 100000 }, 1],
    [180000, { threshold: 0 }, 0],
    [99999, { threshold: 100000 }, 0],
    [100000, { threshold: 100000 }, 1]
  ]) {
    const f = fixture(t);
    f.setUsage(codexEvent(tokens));
    f.run('codex', 'Stop', {}, opts);
    assert.equal(f.sends().length, expected, JSON.stringify({ tokens, opts }));
    if (expected === 0) assert.equal(f.state().request, null);
  }
});

test('unsupported harness, unsafe payloads and missing identity/CLI never send', t => {
  for (const [harness, patch, opts] of [
    ['other', {}, {}],
    ['codex', { turn_id: '' }, {}],
    ['codex', { stop_hook_active: true }, {}],
    ['codex', { agent_id: 'synthetic-subagent' }, {}],
    ['codex', {}, { cli: null }],
    ['codex', {}, { cli: 'relative' }],
    ['codex', {}, { noThread: true }]
  ]) {
    const f = fixture(t);
    f.run(harness, 'Stop', patch, opts);
    assert.equal(f.calls().length, 0, JSON.stringify({ harness, patch, opts }));
    assert.equal(fs.existsSync(f.stateFile), false);
  }
});

test('Codex Stop resolves its thread without the env ID and accepts warning-prefixed show and send JSON', t => {
  const f = fixture(t);
  codexProviderLog(f)('synthetic-turn');
  f.configure({ warn: true });

  f.setThread({ status: 'completed', activeRunId: null });
  f.run('codex', 'Stop', {}, { noThread: true });
  assert.equal(f.sends().length, 0);
  assert.equal(fs.existsSync(f.stateFile), false);

  f.setThread({ status: 'running', activeRunId: 'synthetic-current-run' });
  f.run('codex', 'Stop', {}, { noThread: true });
  assertSend(f);
  assert.equal(f.state().request.state, 'queued');
});

test('Codex PreCompact waits for the native turn log to reach disk', async t => {
  const f = fixture(t);
  const logTurn = codexProviderLog(f);
  logTurn('synthetic-turn');
  f.run('codex', 'Stop', {}, { noThread: true });
  f.setThread({ activeRunId: requestRun, latestRunId: requestRun, status: 'running' });
  const compact = { turn_id: 'native-compact-turn' };
  const pre = f.start('codex', 'PreCompact', compact, { noThread: true });
  await new Promise(resolve => setTimeout(resolve, 300));
  logTurn(compact.turn_id);
  await pre.done;
  assert.equal(f.state().request.preObserved, true);
  f.run('codex', 'PostCompact', compact, { noThread: true });
  assert.equal(f.state().request.state, 'compact_completed');
});

test('show must identify the same thread before any reservation', t => {
  const f = fixture(t);
  f.setThread({ threadId: '00000000-0000-4000-8000-000000000063' });
  f.run();
  assert.equal(f.sends().length, 0);
  assert.equal(f.state().request, null);
});

test('concurrent Stop hooks claim before a single non-wait send', async t => {
  const f = fixture(t);
  f.configure({ sendMode: 'barrier' });
  const first = f.start();
  try {
    await waitForFile(path.join(f.root, 'send-entered'));
    assert.equal(f.state().request.state, 'unknown');
    const second = f.start();
    await second.done;
  } finally {
    fs.writeFileSync(path.join(f.root, 'release-send'), 'release');
    await first.done;
  }
  assertSend(f);
  f.run();
  assert.equal(f.sends().length, 1);
});

test('a native event lost to lock contention leaves a persistent fail-closed hazard', async t => {
  const f = fixture(t);
  f.configure({ sendMode: 'barrier' });
  const first = f.start();
  try {
    await waitForFile(path.join(f.root, 'send-entered'));
    f.run('codex', 'PreCompact');
    assert.equal(fs.existsSync(f.hazard), true);
  } finally {
    fs.writeFileSync(path.join(f.root, 'release-send'), 'release');
    await first.done;
  }
  assertSend(f);
  f.run();
  assert.equal(f.sends().length, 1);
});

test('corrupt state and a stale lock do not send', t => {
  const broken = fixture(t);
  broken.makeStateDir();
  fs.writeFileSync(broken.stateFile, '{');
  broken.run();
  assert.equal(broken.sends().length, 0);
  const locked = fixture(t);
  locked.makeStateDir();
  fs.mkdirSync(locked.lock, { mode: 0o700 });
  locked.run();
  assert.equal(locked.calls().length, 0);
});

for (const mode of ['nonzero', 'invalid', 'timeout', 'wrong-thread', 'missing-run', 'missing-message', 'missing-status', 'bad-status', 'bad-delivery']) {
  test('ambiguous send outcome ' + mode + ' stays latched without retry', t => {
    const f = fixture(t);
    if (['nonzero', 'invalid', 'timeout'].includes(mode)) f.configure({ sendMode: mode });
    // Vary one field at a time against the formal T3 send result.
    const receipt = { threadId, messageId: 'synthetic-message', runId: requestRun,
      status: 'queued', delivery: 'queued' };
    if (mode === 'wrong-thread') receipt.threadId = 'synthetic-other-thread';
    if (mode === 'missing-run') delete receipt.runId;
    if (mode === 'missing-message') delete receipt.messageId;
    if (mode === 'missing-status') delete receipt.status;
    if (mode === 'bad-status') receipt.status = 'not-a-run-status';
    if (mode === 'bad-delivery') receipt.delivery = 'steered';
    if (!['nonzero', 'invalid', 'timeout'].includes(mode)) f.configure({ receipt });
    f.run();
    assertSend(f);
    assert.equal(f.state().request.state, 'unknown');
    f.run();
    assert.equal(f.sends().length, 1);
    assert.equal(f.state().request.state, 'unknown');
  });
}

test('status of a later queued run is not attributed to the active compact run', t => {
  const f = fixture(t);
  f.configure({ receipt: { threadId, messageId: 'synthetic-message', runId: requestRun,
    status: 'running', delivery: 'started' } });
  f.run();
  assert.equal(f.state().request.runState, 'unknown');
  f.setThread({ activeRunId: requestRun, latestRunId: laterRun, status: 'queued' });
  f.run();
  assert.equal(f.state().request.runState, 'unknown');
  assert.equal(f.sends().length, 1);
});

test('a later run failure is not assigned to the reserved run', t => {
  const f = fixture(t);
  f.run();
  f.setThread({ activeRunId: null, latestRunId: laterRun, status: 'failed' });
  f.run();
  assert.notEqual(f.state().request.state, 'failed');
  assert.equal(f.sends().length, 1);
});

test('receipt or completed run alone does not prove native compact completion', t => {
  const f = fixture(t);
  f.run();
  f.setThread({ activeRunId: null, latestRunId: requestRun, status: 'completed' });
  f.run();
  assert.equal(f.state().request.runState, 'completed');
  assert.notEqual(f.state().request.state, 'compact_completed');
  assert.equal(f.sends().length, 1);
});

for (const outcome of ['failed', 'cancelled', 'interrupted', 'rolled_back']) {
  test('matching run ' + outcome + ' remains failed and is not retried', t => {
    const f = fixture(t);
    f.run();
    f.setThread({ activeRunId: null, latestRunId: requestRun, status: outcome });
    f.run();
    assert.equal(f.state().request.state, 'failed');
    assert.equal(f.state().request.runState, outcome);
    assert.equal(f.sends().length, 1);
  });
}

test('native events pair only for the reserved active run, session and manual trigger', t => {
  for (const mismatch of ['run', 'session', 'trigger', 'thread']) {
    const f = fixture(t);
    f.run();
    f.setThread({ activeRunId: requestRun, latestRunId: requestRun, status: 'running' });
    f.run('codex', 'PreCompact');
    if (mismatch === 'run') f.setThread({ activeRunId: laterRun, latestRunId: laterRun });
    if (mismatch === 'thread') f.setThread({ threadId: '00000000-0000-4000-8000-000000000063' });
    f.run('codex', 'PostCompact', mismatch === 'session' ? { session_id: 'other-session' } :
      mismatch === 'trigger' ? { trigger: 'auto' } : {});
    assert.notEqual(f.state().request.state, 'compact_completed', mismatch);
    f.run();
    assert.equal(f.sends().length, 1);
  }
});

test('a different harness cannot complete a reserved run through matching-looking native events', t => {
  const f = fixture(t);
  f.run('codex');
  f.setThread({ activeRunId: requestRun, latestRunId: requestRun, status: 'running' });
  f.run('claude', 'PreCompact');
  f.run('claude', 'PostCompact');
  assert.notEqual(f.state().request.state, 'compact_completed');
  assert.equal(f.sends().length, 1);
});

test('native events after the reserved run is no longer active do not prove its compact', t => {
  const f = fixture(t);
  f.run();
  f.setThread({ activeRunId: null, latestRunId: requestRun, status: 'completed' });
  f.run('codex', 'PreCompact');
  f.run('codex', 'PostCompact');
  assert.notEqual(f.state().request.state, 'compact_completed');
  assert.equal(f.sends().length, 1);
});

test('a native event on an already failed run cannot convert failure to completion', t => {
  const f = fixture(t);
  f.run();
  f.setThread({ activeRunId: null, latestRunId: requestRun, status: 'failed' });
  f.run('codex', 'PreCompact');
  f.run('codex', 'PostCompact');
  assert.equal(f.state().request.state, 'failed');
  assert.equal(f.sends().length, 1);
});

test('own compact run, cooldown, interval and a later distinct run gate the next request', t => {
  const f = fixture(t);
  const opts = { threshold: 160000, interval: 60000 };
  f.run('codex', 'Stop', {}, opts);
  compactPair(f);
  assert.equal(f.state().request.state, 'compact_completed');
  f.setTime(startTime + 300000);
  f.setUsage(codexEvent(220000));
  f.run('codex', 'Stop', {}, opts); // still the compact run
  assert.equal(f.sends().length, 1);
  f.setThread({ activeRunId: laterRun, latestRunId: laterRun, status: 'running' });
  f.setTime(startTime + 299999);
  f.run('codex', 'Stop', {}, opts);
  assert.equal(f.sends().length, 1);
  f.setTime(startTime + 300000);
  f.setUsage(codexEvent(219999));
  f.run('codex', 'Stop', {}, opts);
  assert.equal(f.sends().length, 1);
  f.setUsage(codexEvent(220000));
  f.run('codex', 'Stop', {}, opts);
  assert.equal(f.sends().length, 2);
});

test('same bucket stays notified in one session but a new session can notify again', t => {
  const f = fixture(t);
  const opts = { threshold: 160000, interval: 60000 };
  f.run('codex', 'Stop', {}, opts);
  compactPair(f);
  f.setThread({ activeRunId: laterRun, latestRunId: laterRun, status: 'running' });
  f.setTime(startTime + 300000);
  f.setUsage(codexEvent(100000));
  f.run('codex', 'Stop', {}, opts);
  f.setUsage(codexEvent(160000));
  f.run('codex', 'Stop', {}, opts);
  assert.equal(f.sends().length, 1, 'the same session/bucket was already notified');
  f.run('codex', 'Stop', { session_id: 'synthetic-new-session' }, opts);
  assert.equal(f.sends().length, 2, 'a new session has its own notification buckets');
});

// This is a merge-contract test, not a mutation of installed settings.
// Synthetic existing Wiki hooks are deliberately retained by exact object content.
for (const harness of ['claude', 'codex']) {
  test(harness + ' registration adds supported command groups without replacing existing hooks', () => {
    const file = path.resolve(__dirname, '../registration/' + harness + '.json');
    const fragment = JSON.parse(fs.readFileSync(file, 'utf8'));
    const existing = { hooks: {
      Stop: [{ hooks: [{ type: 'command', command: 'wiki-stop' }] }],
      PreCompact: [{ matcher: 'manual', hooks: [{ type: 'command', command: 'wiki-pre' }] }],
      PostCompact: [{ hooks: [{ type: 'command', command: 'wiki-post' }] }],
      PreToolUse: [{ matcher: 'Edit', hooks: [{ type: 'command', command: 'existing-suggest' }] }]
    } };
    const before = structuredClone(existing);
    const merged = structuredClone(existing);
    assert.deepEqual(Object.keys(fragment.hooks).sort(), ['PostCompact', 'PreCompact', 'Stop']);
    for (const event of ['Stop', 'PreCompact', 'PostCompact']) {
      const groups = fragment.hooks[event];
      assert.equal(groups.length, 1);
      assert.equal(groups[0].matcher, undefined); // all triggers
      assert.equal(groups[0].hooks.length, 1);
      const handler = groups[0].hooks[0];
      assert.deepEqual(Object.keys(handler).sort(), ['command', 'timeout', 'type']);
      assert.equal(handler.type, 'command');
      assert.equal(handler.timeout, 15);
      assert.equal(handler.command,
        'node "$HOME/.agents/hooks/strategic-compact/scripts/hooks/queue-compact.js" ' + harness);
      merged.hooks[event].push(...groups);
      assert.deepEqual(merged.hooks[event].slice(0, before.hooks[event].length), before.hooks[event]);
    }
    assert.deepEqual(merged.hooks.PreToolUse, before.hooks.PreToolUse);
  });
}

test('failed or malformed thread reads cannot trigger a send', t => {
  for (const showMode of ['nonzero', 'invalid']) {
    const f = fixture(t);
    f.configure({ showMode });
    f.run();
    assert.equal(f.sends().length, 0);
    assert.equal(f.state().request, null);
  }
});

test('observed native compaction and its cooldown suppress a fresh request', t => {
  const f = fixture(t);
  f.run('codex', 'PreCompact', { trigger: 'auto' });
  f.run();
  assert.equal(f.sends().length, 0);
  f.run('codex', 'PostCompact', { trigger: 'auto' });
  f.setTime(startTime + 299999);
  f.run();
  assert.equal(f.sends().length, 0);
  f.setTime(startTime + 300000);
  f.run();
  assertSend(f);
});

test('a different session cannot complete the reserved run even when its own native pair matches', t => {
  const f = fixture(t);
  f.run();
  f.setThread({ activeRunId: requestRun, latestRunId: requestRun, status: 'running' });
  f.run('codex', 'PreCompact', { session_id: 'other-synthetic-session' });
  f.run('codex', 'PostCompact', { session_id: 'other-synthetic-session' });
  assert.notEqual(f.state().request.state, 'compact_completed');
  assert.equal(f.sends().length, 1);
});

// Codex's schema is not Claude's schema. This checks the generated fixtures
// against the published required fields, not just JSON parsing or our hook.
test('synthetic Stop and compact payloads follow each harness-specific contract', t => {
  const f = fixture(t);
  const codexRequired = {
    Stop: ['cwd', 'hook_event_name', 'last_assistant_message', 'model', 'permission_mode',
      'session_id', 'stop_hook_active', 'transcript_path', 'turn_id'],
    PreCompact: ['cwd', 'hook_event_name', 'model', 'session_id', 'transcript_path', 'trigger', 'turn_id'],
    PostCompact: ['cwd', 'hook_event_name', 'model', 'session_id', 'transcript_path', 'trigger', 'turn_id']
  };
  for (const event of Object.keys(codexRequired)) {
    const input = f.payload('codex', event);
    assert.deepEqual(Object.keys(input).sort(), codexRequired[event].slice().sort());
    assert.equal(input.hook_event_name, event);
    assert.equal(typeof input.turn_id, 'string');
    if (event !== 'Stop') assert.equal(input.trigger, 'manual');
  }
  const pre = f.payload('claude', 'PreCompact');
  const post = f.payload('claude', 'PostCompact');
  const stop = f.payload('claude', 'Stop');
  assert.equal(pre.custom_instructions, null);
  assert.equal(post.compact_summary, 'synthetic summary');
  assert.equal(stop.stop_hook_active, false);
  assert.equal(stop.permission_mode, 'default');
  assert.equal(typeof stop.last_assistant_message, 'string');
  assert.equal('turn_id' in stop, false);
  assert.equal('turn_id' in pre, false);
  assert.equal('compact_summary' in f.payload('codex', 'PostCompact'), false);
});
