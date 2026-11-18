// Offline IPC contract tests. These do not launch a browser or provide E2E evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// The execution role may point this at a private git-show copy for a negative control.
const worker = process.env.TB_STEP_TEST_WORKER || fileURLToPath(new URL('../scripts/e2e-worker.mjs', import.meta.url));
const runner = fileURLToPath(new URL('./fakes/worker-step-start-runner.mjs', import.meta.url));
const startError = 'fixture guard rejected step-before';
const endError = 'fixture guard rejected step-after';

function exercise(scenario, { mode = 'native', rejectAt = null, probe = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = fork(worker, [runner, 'TC-056-IPC', ...(mode === 'native' ? ['native-cdp'] : [])], {
      env: { ...process.env, TB_STEP_FIXTURE_SCENARIO: scenario, TB_STEP_FIXTURE_MODE: mode },
      silent: true,
    });
    const messages = [];
    let stderr = '', heldStart, heldOperation, operationCount = 0, rejections = 0;
    child.stdout.resume();
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    const timeout = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`offline worker timed out in ${scenario}: ${stderr}`));
    }, 10000);
    const reply = (msg, value = true, error = null) => {
      if (child.connected) child.send({ type: 'reply', id: msg.id, value, error });
    };
    child.on('message', (msg) => {
      messages.push(msg);
      if (msg.type === 'fixture') {
        if (msg.name === 'before-start-reply' && heldStart) { reply(heldStart); heldStart = null; }
        if (msg.name === 'before-operation-reply' && heldOperation) { reply(heldOperation, { result: { value: 1 } }); heldOperation = null; }
        return;
      }
      if (msg.type === 'ready') reply(msg, mode === 'native' ? { sessionId: 'owned-session' } : {});
      else if (msg.type === 'step-start' && rejectAt === 'start' && rejections === 0) {
        rejections++; reply(msg, null, startError);
      } else if (msg.type === 'step-end' && rejectAt === 'end' && rejections === 0) {
        rejections++; reply(msg, null, endError);
      } else if (probe && msg.type === 'step-start') {
        heldStart = msg;
        child.send({ type: 'cdp-event', method: 'fixture.probe', params: { name: 'before-start-reply' } });
      } else if (msg.type === 'cdp-send') {
        operationCount++;
        if (probe && operationCount === 1) {
          heldOperation = msg;
          child.send({ type: 'cdp-event', method: 'fixture.probe', params: { name: 'before-operation-reply' } });
        } else reply(msg, { result: { value: 1 } });
      } else reply(msg);
    });
    child.once('error', (error) => { clearTimeout(timeout); reject(error); });
    child.once('close', (code, signal) => {
      clearTimeout(timeout);
      resolve({ code, signal, messages, rejections, stderr });
    });
  });
}

const trace = (out) => out.messages.map((msg) => msg.type === 'fixture' ? `fixture:${msg.name}` : msg.type);
const byType = (out, type) => out.messages.filter((msg) => msg.type === type);
const marker = (out, name) => out.messages.find((msg) => msg.type === 'fixture' && msg.name === name);
function assertExit(out, code) {
  assert.equal(out.code, code, out.stderr);
  assert.equal(out.signal, null);
  assert.equal(byType(out, 'finished').length, 1);
}
function assertFirstFailure(out, error) {
  assertExit(out, 1);
  const [finished] = byType(out, 'finished');
  assert.equal(finished.status, 'failed');
  assert.equal(finished.step, 'first');
  assert.equal(finished.error, error);
  assert.equal(marker(out, 'first-caught')?.error, error);
  const subsequent = marker(out, 'second-caught')?.error;
  assert.equal(typeof subsequent, 'string', 'the attempted later step must reject');
  // Permit the original cause or a stable previous-failure rejection, never a stale nested-step error.
  assert.match(subsequent, /fail|reject|abort|blocked/i);
  assert.doesNotMatch(subsequent, /invalid or nested step/i);
  assert.ok(marker(out, 'outside-caught'), 'the attempted outside operation must reject');
  assert.equal(out.rejections, 1);
}

test('agent-browser start rejection clears shared step state before the next step', async () => {
  const out = await exercise('agent-start-caught', { mode: 'agent', rejectAt: 'start' });
  assertExit(out, 0);
  assert.equal(out.rejections, 1);
  assert.deepEqual(trace(out), ['ready', 'step-start', 'fixture:first-caught', 'step-start',
    'fixture:second-callback', 'command', 'step-end', 'finished']);
  assert.equal(marker(out, 'first-caught').error, startError);
  assert.deepEqual(byType(out, 'step-start').map((msg) => msg.step), ['first', 'second']);
  assert.deepEqual(byType(out, 'command').map((msg) => [msg.step, msg.args]), [['second', ['snapshot']]]);
  assert.deepEqual(byType(out, 'step-end').map((msg) => [msg.step, msg.status]), [['second', 'passed']]);
  assert.equal(byType(out, 'finished')[0].status, 'passed');
});

test('native caught start rejection blocks later steps and operations but keeps the first failure', async () => {
  const out = await exercise('native-start-caught', { rejectAt: 'start' });
  assertFirstFailure(out, startError);
  assert.deepEqual(trace(out), ['ready', 'step-start', 'fixture:first-caught', 'fixture:second-caught',
    'fixture:outside-caught', 'finished']);
  assert.equal(byType(out, 'step-start')[0].step, 'first');
});

test('native uncaught start rejection reports the rejected step and original cause', async () => {
  const out = await exercise('native-start-uncaught', { rejectAt: 'start' });
  assertExit(out, 1);
  assert.equal(out.rejections, 1);
  assert.deepEqual(trace(out), ['ready', 'step-start', 'finished']);
  assert.equal(byType(out, 'step-start')[0].step, 'first');
  const [finished] = byType(out, 'finished');
  assert.equal(finished.status, 'failed');
  assert.equal(finished.step, 'first');
  assert.equal(finished.error, startError);
});

test('native start rejection remains the cause when a later error escapes the runner', async () => {
  const out = await exercise('native-start-derived', { rejectAt: 'start' });
  assertExit(out, 1);
  assert.equal(out.rejections, 1);
  assert.deepEqual(trace(out), ['ready', 'step-start', 'fixture:first-caught', 'fixture:second-caught', 'finished']);
  assert.equal(marker(out, 'first-caught').error, startError);
  assert.doesNotMatch(marker(out, 'second-caught').error, /invalid or nested step/i);
  const [finished] = byType(out, 'finished');
  assert.equal(finished.status, 'failed');
  assert.equal(finished.step, 'first');
  assert.equal(finished.error, startError);
  assert.notEqual(finished.error, 'fixture later derived error');
});

test('native caught step-end rejection keeps the first failure without a second end', async () => {
  const out = await exercise('native-end-caught', { rejectAt: 'end' });
  assertFirstFailure(out, endError);
  assert.deepEqual(trace(out), ['ready', 'step-start', 'fixture:first-callback', 'cdp-send', 'step-end',
    'fixture:first-caught', 'fixture:second-caught', 'fixture:outside-caught', 'finished']);
  assert.deepEqual(byType(out, 'step-end').map((msg) => [msg.step, msg.status]), [['first', 'passed']]);
  assert.equal(byType(out, 'cdp-send')[0].step, 'first');
});

test('native waits for start and operation replies before executing subsequent work', async () => {
  const out = await exercise('ordered', { probe: true });
  assertExit(out, 0);
  assert.deepEqual(trace(out), ['ready', 'step-start', 'fixture:before-start-reply', 'fixture:callback',
    'cdp-send', 'fixture:before-operation-reply', 'fixture:first-operation-resolved', 'cdp-send',
    'fixture:second-operation-resolved', 'step-end', 'finished']);
  assert.deepEqual(byType(out, 'cdp-send').map((msg) => [msg.step, msg.method, msg.sessionId]), [
    ['ordered', 'Runtime.evaluate', 'owned-session'], ['ordered', 'Runtime.evaluate', 'owned-session'],
  ]);
  assert.deepEqual(byType(out, 'step-end').map((msg) => [msg.step, msg.status]), [['ordered', 'passed']]);
  assert.equal(byType(out, 'finished')[0].status, 'passed');
});

for (const scenario of ['unawaited', 'parallel', 'nested', 'outside']) {
  test(`native retains the ${scenario} operation rejection`, async () => {
    const out = await exercise(scenario);
    assertExit(out, 1);
    assert.equal(byType(out, 'finished')[0].status, 'failed');
    assert.equal(byType(out, 'step-end').some((msg) => msg.status === 'passed'), false);
    assert.equal(marker(out, 'forbidden-inner-callback'), undefined);
    if (scenario === 'outside') {
      assert.deepEqual(trace(out), ['ready', 'fixture:outside-caught', 'finished']);
    } else {
      assert.equal(byType(out, 'step-start').length, 1);
      assert.equal(byType(out, 'step-end').length, 1);
      assert.equal(byType(out, 'step-end')[0].status, 'failed');
      assert.equal(byType(out, 'cdp-send').length, scenario === 'nested' ? 0 : 1);
      if (scenario === 'parallel') assert.ok(marker(out, 'parallel-caught'));
      if (scenario === 'nested') assert.ok(marker(out, 'nested-caught'));
    }
  });
}
