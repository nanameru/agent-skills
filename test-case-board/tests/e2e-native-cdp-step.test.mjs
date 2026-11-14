// Offline contract checks: fake observation and IPC are not browser or E2E evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { finishNativeStep } from '../scripts/e2e-native-cdp.mjs';

const worker = fileURLToPath(new URL('../scripts/e2e-worker.mjs', import.meta.url));
const runner = fileURLToPath(new URL('./e2e-native-cdp-fixture/contract-runner.mjs', import.meta.url));
const stepId = 'serial';

function runningResult() {
  return {
    test: { failedStep: null },
    steps: [
      { id: 'earlier', status: 'passed' },
      { id: stepId, status: 'running', startedAt: '2026-01-01T00:00:00.000Z' },
    ],
  };
}

function assertFinished(step) {
  assert.equal(step.id, stepId);
  assert.equal(typeof step.finishedAt, 'string');
  const time = Date.parse(step.finishedAt);
  assert.ok(Number.isFinite(time), 'finishedAt must be a valid timestamp');
  assert.equal(new Date(time).toISOString(), step.finishedAt);
}

test('finishNativeStep waits for a successful observation before storing a passed step', async () => {
  const result = runningResult();
  let resolveObservation;
  let observations = 0;
  const observation = new Promise((resolve) => { resolveObservation = resolve; });
  const finishing = finishNativeStep({ result, step: stepId, status: 'passed', error: null,
    observe: () => { observations++; return observation; } });

  assert.equal(observations, 1);
  assert.equal(result.steps[1].status, 'running');
  assert.equal(result.steps[1].finishedAt, undefined);
  resolveObservation();
  await finishing;

  assert.deepEqual(result.steps[0], { id: 'earlier', status: 'passed' });
  assert.equal(result.steps[1].status, 'passed');
  assert.equal(result.steps[1].error, null);
  assertFinished(result.steps[1]);
  assert.equal(result.test.failedStep, null);
});

test('finishNativeStep preserves an assertion failure when observation succeeds', async () => {
  const result = runningResult();
  const assertionError = 'fixture assertion failed';
  let observations = 0;
  await finishNativeStep({ result, step: stepId, status: 'failed', error: assertionError,
    observe: async () => { observations++; } });

  assert.equal(observations, 1);
  assert.equal(result.steps[1].status, 'failed');
  assert.equal(result.steps[1].error, assertionError);
  assertFinished(result.steps[1]);
  assert.equal(result.test.failedStep, stepId);
});

test('finishNativeStep records and rethrows a failed ownership observation', async () => {
  const result = runningResult();
  const ownershipError = new Error('ownership gate failed');
  let observations = 0;
  await assert.rejects(
    finishNativeStep({ result, step: stepId, status: 'passed', error: null,
      observe: async () => { observations++; throw ownershipError; } }),
    (error) => error === ownershipError,
  );

  assert.equal(observations, 1);
  assert.equal(result.steps[1].status, 'failed');
  assert.equal(result.steps[1].error, ownershipError.message);
  assertFinished(result.steps[1]);
  assert.equal(result.test.failedStep, stepId);
});

test('finishNativeStep retains both assertion and ownership errors', async () => {
  const result = runningResult();
  const assertionError = 'fixture assertion failed';
  const ownershipError = new Error('ownership gate failed');
  await assert.rejects(
    finishNativeStep({ result, step: stepId, status: 'failed', error: assertionError,
      observe: async () => { throw ownershipError; } }),
    (error) => error === ownershipError,
  );

  assert.equal(result.steps[1].status, 'failed');
  assert.ok(result.steps[1].error.includes(assertionError));
  assert.ok(result.steps[1].error.includes(ownershipError.message));
  assertFinished(result.steps[1]);
  assert.equal(result.test.failedStep, stepId);
});

function exerciseWorkerWithRejectedStepEnd() {
  return new Promise((resolve, reject) => {
    const child = fork(worker, [runner, 'TC-054-RESULT-V1', 'native-cdp'], {
      env: { ...process.env, TB_CONTRACT_SCENARIO: 'serial' }, silent: true,
    });
    const messages = [];
    let injected = 0;
    let stderr = '';
    child.stdout.resume();
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    const timeout = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('offline worker timeout'));
    }, 10000);
    child.on('message', (msg) => {
      messages.push(msg);
      const reply = (value, error) => {
        if (child.connected) child.send({ type: 'reply', id: msg.id, value, error });
      };
      if (msg.type === 'ready') reply({ sessionId: 'owned-session' });
      else if (msg.type === 'cdp-send') reply(msg.method === 'Runtime.evaluate' ? { result: { value: 1 } } : {});
      else if (msg.type === 'step-end' && msg.status === 'passed' && injected === 0) {
        injected++;
        reply(null, 'ownership gate failed');
      } else reply(true);
    });
    child.once('error', (error) => { clearTimeout(timeout); reject(error); });
    child.once('close', (code, signal) => {
      clearTimeout(timeout);
      resolve({ code, signal, messages, injected, stderr });
    });
  });
}

test('worker reports the failed step without sending step-end twice after an ownership rejection', async () => {
  const out = await exerciseWorkerWithRejectedStepEnd();
  assert.equal(out.code, 1, out.stderr);
  assert.equal(out.signal, null);
  assert.equal(out.injected, 1);
  const starts = out.messages.filter((msg) => msg.type === 'step-start');
  assert.equal(starts.length, 1);
  assert.equal(starts[0].step, stepId);
  const ends = out.messages.filter((msg) => msg.type === 'step-end');
  assert.equal(ends.length, 1);
  assert.equal(ends[0].step, stepId);
  assert.equal(ends[0].status, 'passed');
  const finished = out.messages.filter((msg) => msg.type === 'finished');
  assert.equal(finished.length, 1);
  assert.equal(finished[0].status, 'failed');
  assert.equal(finished[0].step, stepId);
  assert.equal(finished[0].error, 'ownership gate failed');
});
