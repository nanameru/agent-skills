// Direct entrypoint regressions with a fake CLI. No browser or real E2E video.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { lstat, mkdir, readFile, realpath, stat, writeFile } from 'node:fs/promises';
import { watch } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const entry = path.join(repo, 'test-case-board/bin/test-board');
const fake = path.join(repo, 'test-case-board/tests/fakes/agent-browser.mjs');
const runner = path.join(repo, 'test-case-board/tests/fakes/runner.mjs');
const unsupported = path.join(repo, 'test-case-board/tests/fakes/unsupported-runner.mjs');
const finalizationPreload = path.join(repo, 'test-case-board/tests/fakes/finalization-preload.cjs');
assert.ok(process.env.TB_FAKE_TEST_DIR, 'TB_FAKE_TEST_DIR must name an existing private directory outside the checkout');
const root = await realpath(process.env.TB_FAKE_TEST_DIR);
const rootStat = await stat(root);
assert.ok(rootStat.isDirectory() && !(rootStat.mode & 0o077) && (typeof process.getuid !== 'function' || rootStat.uid === process.getuid()), 'private owner-only test root required');
const checkout = await realpath(repo);
assert.ok(root !== checkout && !root.startsWith(checkout + path.sep), 'fake output root must be outside the checkout');
const batch = path.join(root, `fake-regression-${randomUUID()}`);
await mkdir(batch, { mode: 0o700 });

function waitForMarker(file, description = 'fake version preflight marker') {
  let watcher, timer;
  const promise = new Promise((resolve, reject) => {
    let checking = false;
    const check = async () => {
      if (checking) return;
      checking = true;
      try { await lstat(file); resolve(); }
      catch (error) { if (error.code !== 'ENOENT') reject(error); }
      finally { checking = false; }
    };
    watcher = watch(path.dirname(file), () => { void check(); });
    watcher.once('error', reject);
    timer = setTimeout(() => reject(new Error(`${description} was not observed`)), 20000);
    void check();
  });
  return { promise, close() { clearTimeout(timer); watcher.close(); } };
}

async function invoke({ dir = batch, scenario = 'success', video = 'valid', version = '0.43.0', selectedRunner = runner, caseId = 'TC-046-FAKE', gate = null, actionGate = null, finalization = null, signal = null, timeoutMs = 120000 } = {}) {
  const names = ['PATH', 'HOME', 'USER', 'TMPDIR', 'TMP', 'TEMP', 'LANG', 'LC_ALL', 'TZ', 'SYSTEMROOT', 'WINDIR'];
  const env = Object.fromEntries(names.filter((key) => process.env[key] !== undefined).map((key) => [key, process.env[key]]));
  Object.assign(env, { TB_FAKE_SCENARIO: scenario, TB_FAKE_VIDEO_MODE: video, TB_FAKE_VERSION: version });
  if (gate) env.TB_FAKE_VERSION_GATE = gate;
  if (actionGate) env.TB_FAKE_ACTION_GATE = actionGate;
  if (finalization) {
    env.TB_FAKE_FINALIZATION_GATE = finalization.gate;
    env.TB_FAKE_FINALIZATION_PHASE = finalization.phase;
    env.TB_FAKE_FINALIZATION_SIGNAL = finalization.signal;
    env.TB_FAKE_FINALIZATION_ROOT = dir;
    env.NODE_OPTIONS = `--require ${JSON.stringify(finalizationPreload)}`;
  }
  const args = ['e2e', '--case', caseId, '--runner', selectedRunner, '--browser', fake, '--evidence-dir', dir,
    '--data-kind', 'mock', '--issue', '46', '--environment', 'fake CLI; synthetic media; no browser', '--timeout-ms', String(timeoutMs)];
  // Register the watcher before spawning so a fast marker is not missed.
  const marker = gate ? waitForMarker(gate) : actionGate ? waitForMarker(path.join(actionGate, 'action-started'), 'fake operation start marker') : null;
  const phaseMarker = finalization ? waitForMarker(path.join(finalization.gate, 'phase-armed'), 'finalization phase marker') : null;
  const child = spawn(entry, args, { cwd: repo, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '', stderr = '';
  child.stdout.on('data', (chunk) => { stdout += chunk; }); child.stderr.on('data', (chunk) => { stderr += chunk; });
  const closed = new Promise((resolve, reject) => { child.once('error', reject); child.once('close', (code, childSignal) => resolve({ code, signal: childSignal })); });
  if (marker) {
    await Promise.race([marker.promise, closed.then(() => { throw new Error(`entrypoint exited before ${actionGate ? 'fake operation' : 'fake version preflight'} was entered`); })]).finally(() => marker.close());
    if (signal) assert.equal(child.kill(signal), true, `could not send ${signal} during ${actionGate ? 'fake operation' : 'preflight'}`);
    if (actionGate) {
      const terminated = waitForMarker(path.join(actionGate, 'worker-sigterm'), 'fake worker SIGTERM marker');
      await Promise.race([terminated.promise, closed.then(() => { throw new Error('entrypoint exited before worker SIGTERM was observed'); })]).finally(() => terminated.close());
      await writeFile(path.join(actionGate, 'release'), 'release\n', { flag: 'wx', mode: 0o600 });
    }
  }
  let signalObserved = false;
  if (phaseMarker) {
    await Promise.race([phaseMarker.promise, closed.then(() => { throw new Error('entrypoint exited before the requested finalization phase'); })]).finally(() => phaseMarker.close());
    const observed = finalization.phase === 'result-write' ? null : waitForMarker(path.join(finalization.gate, 'signal-observed'), 'finalization signal marker');
    assert.equal(child.kill(finalization.signal), true, `could not send ${finalization.signal} during ${finalization.phase}`);
    if (observed) {
      signalObserved = await Promise.race([observed.promise.then(() => true), closed.then(() => false)]).finally(() => observed.close());
    }
    // For result-write the entrypoint is synchronously blocked: deliver the
    // signal while it is blocked, then release it so its handler can run.
    await writeFile(path.join(finalization.gate, 'release'), 'release\n', { flag: 'wx', mode: 0o600 });
  }
  const exit = await closed;
  const line = stdout.trim().split('\n').filter(Boolean).at(-1);
  const output = line ? JSON.parse(line) : null;
  const result = output ? JSON.parse(await readFile(output.result, 'utf8')) : null;
  return { exit, stdout, stderr, output, result, signalObserved };
}
const hash = async (file) => createHash('sha256').update(await readFile(file)).digest('hex');
const videoPath = (run) => path.join(path.dirname(run.output.result), run.result.artifacts.video);
const logPath = (run) => path.join(path.dirname(run.output.result), run.result.artifacts.log);

for (const phase of ['record-stop', 'log-hash', 'result-write']) {
  for (const interruption of ['SIGINT', 'SIGTERM']) {
    test(`fake: finalization ${phase} preserves ${interruption}`, { timeout: 75000 }, async () => {
      const gate = path.join(batch, `finalization-${randomUUID()}`);
      await mkdir(gate, { mode: 0o700 });
      const run = await invoke({ finalization: { gate, phase, signal: interruption } });
      assert.deepEqual(run.exit, { code: 1, signal: null }, 'entrypoint must handle the signal and exit nonzero');
      assert.ok(run.result, 'the original result.json must be saved and returned');
      assert.equal(run.result.test.status, 'passed');
      assert.equal(run.result.test.exitCode, 0);
      assert.equal(run.result.test.signal, null);
      assert.equal(run.result.test.failedStep, null);
      assert.equal(run.result.recording.start, 'passed');
      assert.equal(run.result.recording.stop, 'passed');
      assert.equal(run.result.recording.save, 'verified');
      assert.equal(run.result.recording.readback.status, 'passed');
      assert.equal(run.result.recording.readback.visualInspection, 'unverified');
      assert.ok((await stat(videoPath(run))).size > 0);
      assert.equal(await hash(videoPath(run)), run.result.recording.readback.sha256);
      assert.equal(run.result.artifacts.logStatus, 'verified');
      assert.ok((await stat(logPath(run))).size > 0);
      assert.equal(await hash(logPath(run)), run.result.artifacts.logSha256);
      assert.equal(run.result.artifacts.allure.status, 'prepared');
      const allurePath = path.join(path.dirname(run.output.result), run.result.artifacts.allure.result);
      assert.ok((await lstat(allurePath)).isFile(), 'prepared Allure result must actually be saved');
      const allure = JSON.parse(await readFile(allurePath, 'utf8'));
      assert.equal(allure.testCaseId, run.result.caseId);
      assert.match(allure.statusDetails?.message, /\btest=passed\b/);
      if (phase === 'result-write') {
        assert.equal(run.result.interruption, null, 'a signal received after the snapshot must not rewrite the result');
        assert.equal(allure.status, 'passed', 'Allure must describe the already finalized snapshot');
        const lateLine = run.stderr.split('\n').find((line) => line.startsWith('test-board e2e: {') && line.includes('"phase":"after-result-finalization"'));
        assert.ok(lateLine, 'late interruption must be reported as structured stderr');
        const late = JSON.parse(lateLine.slice('test-board e2e: '.length));
        assert.deepEqual(late, { interruption, phase: 'after-result-finalization' });
      } else {
        assert.equal(run.signalObserved, true, 'the entrypoint signal handler must run before releasing the phase');
        assert.equal(run.result.interruption?.reason, interruption);
        assert.ok(Number.isFinite(Date.parse(run.result.interruption?.observedAt)), 'interruption timestamp must be recorded');
        assert.equal(allure.status, 'broken');
        assert.ok(allure.statusDetails.message.includes(`interruption=${interruption}`));
      }
    });
  }
}

test('fake: SIGINT waits for dispatched operation before record stop', { timeout: 75000 }, async () => {
  const actionGate = path.join(batch, `inflight-${randomUUID()}`);
  await mkdir(actionGate, { mode: 0o700 });
  const run = await invoke({ scenario: 'inflight-sigint', actionGate, signal: 'SIGINT' });
  assert.deepEqual(run.exit, { code: 1, signal: null });
  assert.equal(run.result.error, 'SIGINT');
  assert.equal(run.result.test.status, 'failed');
  assert.equal(run.result.test.exitCode, null);
  assert.equal(run.result.test.signal, 'SIGTERM');
  assert.equal(run.result.test.failedStep, 'inflight-action');
  assert.equal(run.result.recording.start, 'passed');
  assert.equal(run.result.recording.stop, 'passed');
  assert.equal(run.result.recording.save, 'verified');
  assert.equal(run.result.recording.readback.status, 'passed');
  assert.equal(run.result.recording.readback.visualInspection, 'unverified');
  assert.equal(await hash(videoPath(run)), run.result.recording.readback.sha256);
  assert.equal((await lstat(path.join(actionGate, 'action-complete'))).isFile(), true);
  const trace = await readFile(path.join(path.dirname(run.output.result), 'sockets', 'fake-commands.jsonl'), 'utf8');
  const commands = trace.trim().split('\n').map((line) => JSON.parse(line));
  const dispatched = commands.findIndex((args) => args[0] === 'eval' && args[1] === "'INFLIGHT'");
  const completed = commands.findIndex((args) => args[0] === 'fixture-action-complete');
  const stopped = commands.findIndex((args) => args[0] === 'record' && args[1] === 'stop');
  assert.ok(dispatched >= 0 && dispatched < completed && completed < stopped, 'dispatched fake operation must complete before record stop');
  const entries = (await readFile(logPath(run), 'utf8')).split('\n').filter(Boolean).map((line) => JSON.parse(line));
  const response = entries.findIndex((entry) => entry.type === 'browser-command' && entry.args?.[0] === 'eval' && entry.args?.[1] === "'INFLIGHT'" && entry.status === 'passed');
  const stopResponse = entries.findIndex((entry) => entry.type === 'browser-command' && entry.args?.[0] === 'record' && entry.args?.[1] === 'stop');
  assert.ok(response >= 0 && response < stopResponse, 'dispatched CLI response must be received before record stop completes');
});

for (const video of ['empty', 'corrupt']) {
  test(`fake: ${video} media cannot be accepted even when the test passes`, async () => {
    const run = await invoke({ video });
    assert.deepEqual(run.exit, { code: 1, signal: null });
    assert.equal(run.result.test.status, 'passed'); assert.equal(run.result.test.exitCode, 0);
    assert.equal(run.result.recording.start, 'passed'); assert.equal(run.result.recording.stop, 'passed');
    assert.equal(run.result.recording.save, 'not-verified'); assert.equal(run.result.recording.readback.status, 'failed');
    assert.equal(run.result.recording.readback.visualInspection, 'unverified');
    assert.equal((await lstat(videoPath(run))).isFile(), true);
    if (video === 'empty') assert.equal((await stat(videoPath(run))).size, 0);
    else assert.ok((await stat(videoPath(run))).size > 0);
  });
}

test('fake: failing assertion remains failed while recording and readback pass', async () => {
  const run = await invoke({ scenario: 'assertion' });
  assert.deepEqual(run.exit, { code: 1, signal: null });
  assert.equal(run.result.test.status, 'failed'); assert.equal(run.result.test.exitCode, 1);
  assert.equal(run.result.test.failedStep, 'intentional-assertion-failure');
  assert.match(run.result.error, /intentional fake assertion/);
  assert.equal(run.result.recording.start, 'passed'); assert.equal(run.result.recording.stop, 'passed');
  assert.equal(run.result.recording.readback.status, 'passed'); assert.equal(run.result.recording.save, 'verified');
  assert.equal(await hash(videoPath(run)), run.result.recording.readback.sha256);
  assert.equal(run.result.recording.readback.visualInspection, 'unverified');
});

test('fake: recording stop failure remains failed when the test and decode pass', async () => {
  const run = await invoke({ video: 'stop-fails' });
  assert.deepEqual(run.exit, { code: 1, signal: null });
  assert.equal(run.result.test.status, 'passed'); assert.equal(run.result.test.exitCode, 0);
  assert.equal(run.result.recording.start, 'passed'); assert.equal(run.result.recording.stop, 'failed');
  assert.equal(run.result.recording.readback.status, 'passed'); assert.equal(run.result.recording.save, 'verified');
});

test('fake: unsupported versioned runner is rejected before recording', async () => {
  const run = await invoke({ selectedRunner: unsupported });
  assert.deepEqual(run.exit, { code: 1, signal: null });
  assert.equal(run.result.test.status, 'not-run');
  assert.equal(run.result.recording.start, 'not-attempted');
  assert.equal(run.result.recording.stop, 'not-attempted');
});

test('fake: alternate session arguments are rejected within the v1 contract', async () => {
  const run = await invoke({ scenario: 'session' });
  assert.deepEqual(run.exit, { code: 1, signal: null });
  assert.equal(run.result.test.status, 'failed'); assert.equal(run.result.test.exitCode, 1);
  assert.equal(run.result.test.failedStep, 'unsupported-session');
  assert.match(run.result.error, /unsupported.*(?:command|arguments)/i);
  const trace = await readFile(path.join(path.dirname(run.output.result), 'sockets', 'fake-commands.jsonl'), 'utf8');
  const commands = trace.trim().split('\n').map((line) => JSON.parse(line));
  assert.ok(commands.every((args) => args[0] !== 'open' && !args.includes('--session=other')), 'unsupported session command reached the CLI');
  assert.equal(run.result.recording.readback.status, 'passed');
});

test('fake: incompatible browser version fails before recording', async () => {
  const run = await invoke({ version: '0.42.0' });
  assert.deepEqual(run.exit, { code: 1, signal: null });
  assert.equal(run.result.test.status, 'not-run');
  assert.equal(run.result.recording.start, 'not-attempted');
  assert.match(run.result.error, /requires agent-browser 0\.43\.0/);
});

test('fake: nonprivate evidence directory is rejected before creating a run', async () => {
  const bad = path.join(batch, `nonprivate-${randomUUID()}`);
  await mkdir(bad, { mode: 0o755 });
  // Defeat a restrictive umask so the mode under test is deliberately nonprivate.
  const { chmod } = await import('node:fs/promises'); await chmod(bad, 0o755);
  const run = await invoke({ dir: bad });
  assert.deepEqual(run.exit, { code: 1, signal: null });
  assert.equal(run.result, null); assert.match(run.stderr, /private \(owner only\)/);
  const { readdir } = await import('node:fs/promises'); assert.deepEqual(await readdir(bad), []);
});

test('fake: retry retains the failing attempt and uses distinct UUID, video and log', async () => {
  const first = await invoke({ scenario: 'assertion', caseId: 'TC-046-FAKE-RETRY' });
  assert.equal(first.exit.code, 1); assert.equal(first.result.test.exitCode, 1);
  const files = [first.output.result, videoPath(first), logPath(first)];
  const before = await Promise.all(files.map(hash));
  const second = await invoke({ caseId: 'TC-046-FAKE-RETRY' });
  assert.equal(second.exit.code, 0); assert.equal(second.result.test.status, 'passed');
  assert.notEqual(first.result.runId, second.result.runId);
  assert.notEqual(first.output.result, second.output.result);
  assert.notEqual(videoPath(first), videoPath(second)); assert.notEqual(logPath(first), logPath(second));
  assert.deepEqual(await Promise.all(files.map(hash)), before);
  assert.equal(JSON.parse(await readFile(first.output.result, 'utf8')).test.status, 'failed');
});

for (const [scenario, flag] of [['global-auto-connect', '--auto-connect'], ['global-config', '--config=untrusted.json']]) {
  test(`fake: runner cannot pass ${flag} into the browser invocation`, async () => {
    const run = await invoke({ scenario });
    assert.equal(run.exit.code, 1);
    assert.equal(run.result.test.status, 'failed');
    assert.equal(run.result.test.exitCode, 1);
    assert.equal(run.result.test.failedStep, `unsupported-${scenario}`);
    const trace = await readFile(path.join(path.dirname(run.output.result), 'sockets', 'fake-commands.jsonl'), 'utf8');
    const commands = trace.trim().split('\n').map((line) => JSON.parse(line));
    assert.ok(commands.every((args) => !args.includes(flag)), 'unsupported flag reached the CLI');
  });
}

for (const interruption of ['SIGINT', 'SIGTERM', 'timeout']) {
  test(`fake: ${interruption} during version preflight preserves a result`, { timeout: 75000 }, async () => {
    const gate = path.join(batch, `version-gate-${randomUUID()}`);
    const run = await invoke({ gate, signal: interruption === 'timeout' ? null : interruption,
      timeoutMs: interruption === 'timeout' ? 10000 : 120000 });
    assert.equal(run.exit.signal, null, 'entrypoint must handle the interruption');
    assert.equal(run.exit.code, 1);
    assert.ok(run.result, 'interrupted preflight must write and return result.json');
    assert.equal(run.result.error, interruption);
    assert.equal(run.result.test.status, 'not-run');
    assert.equal(run.result.recording.start, 'not-attempted');
    assert.equal(run.result.recording.stop, 'not-attempted');
  });
}

for (const video of ['empty', 'corrupt', 'stop-fails']) {
  test(`fake: Allure does not report passed for ${video} evidence with a passing test`, async () => {
    const run = await invoke({ video });
    assert.equal(run.exit.code, 1);
    assert.equal(run.result.test.status, 'passed', 'original test outcome remains separate');
    assert.equal(run.result.test.exitCode, 0);
    assert.equal(run.result.artifacts.allure.status, 'prepared');
    const allurePath = path.join(path.dirname(run.output.result), run.result.artifacts.allure.result);
    assert.ok((await lstat(allurePath)).isFile(), 'prepared Allure result must actually be saved');
    const allure = JSON.parse(await readFile(allurePath, 'utf8'));
    assert.equal(allure.status, 'broken');
    assert.match(allure.statusDetails?.message, /\btest=passed\b/);
    if (video === 'stop-fails') assert.match(allure.statusDetails.message, /\bstop=failed\b/);
    else {
      assert.match(allure.statusDetails.message, /\bsave=not-verified\b/);
      assert.match(allure.statusDetails.message, /\breadback=failed\b/);
    }
    assert.equal(allure.testCaseId, run.result.caseId);
  });
}
