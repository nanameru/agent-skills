// Offline contract tests: fake IPC/results are not browser, recording or E2E evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { checkEndpoint, pageIdentity } from '../scripts/e2e-native-cdp.mjs';
import { verifyResult } from './e2e-native-cdp-fixture/verify.mjs';

const worker = fileURLToPath(new URL('../scripts/e2e-worker.mjs', import.meta.url));
const runner = fileURLToPath(new URL('./e2e-native-cdp-fixture/contract-runner.mjs', import.meta.url));

test('endpoint accepts only an official-form loopback browser WebSocket', () => {
  assert.equal(checkEndpoint('ws://127.0.0.1:9222/devtools/browser/id'), 'ws://127.0.0.1:9222/devtools/browser/id');
  for (const value of ['http://127.0.0.1:9222/devtools/browser/id', 'ws://example.com:9222/devtools/browser/id',
    'ws://user@127.0.0.1:9222/devtools/browser/id', 'ws://127.0.0.1:9222/devtools/page/id',
    'ws://127.0.0.1:9222/devtools/browser/id?token=x', 'ws://127.0.0.1:9222/devtools/browser/id#x']) {
    assert.throws(() => checkEndpoint(value));
  }
});
test('identity requires the one active owned page, its URL and context', () => {
  const url = 'http://127.0.0.1:3000/';
  const tabs = { tabs: [{ active: true, targetId: 'owned' }] };
  const targets = { targetInfos: [{ type: 'page', targetId: 'owned', browserContextId: 'context', url }] };
  const contexts = { browserContextIds: ['context'] };
  assert.equal(pageIdentity(tabs, targets, contexts, url).targetId, 'owned');
  assert.throws(() => pageIdentity({ tabs: [{ active: true, targetId: 'other' }] }, targets, contexts, url));
  assert.throws(() => pageIdentity(tabs, { targetInfos: [...targets.targetInfos, { type: 'page', targetId: 'extra', url: 'chrome://new-tab-page/' }] }, contexts, url));
  assert.throws(() => pageIdentity(tabs, targets, { browserContextIds: ['other'] }, url));
  assert.throws(() => pageIdentity(tabs, targets, contexts, url + 'other'));
});

function exerciseWorker(scenario) {
  return new Promise((resolve, reject) => {
    const child = fork(worker, [runner, 'TC-054-RESULT-V1', 'native-cdp'], {
      env: { ...process.env, TB_CONTRACT_SCENARIO: scenario }, silent: true,
    });
    const messages = [];
    let stderr = '';
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    const timeout = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('offline worker timeout')); }, 5000);
    child.on('message', (msg) => {
      messages.push(msg);
      const reply = (value) => { if (child.connected) child.send({ type: 'reply', id: msg.id, value }); };
      if (msg.type === 'ready') reply({ sessionId: 'owned-session' });
      else if (msg.type === 'cdp-send') setTimeout(() => reply(msg.method === 'Runtime.evaluate' ? { result: { value: 1 } } : {}), 25);
      else {
        reply(true);
        if (scenario === 'signal' && msg.type === 'step-start') setImmediate(() => child.kill('SIGTERM'));
      }
    });
    child.once('error', (error) => { clearTimeout(timeout); reject(error); });
    child.once('close', (code, signal) => { clearTimeout(timeout); resolve({ code, signal, messages, stderr }); });
  });
}
test('worker forwards awaited native calls serially with the owned session', async () => {
  const out = await exerciseWorker('serial');
  assert.equal(out.code, 0); assert.equal(out.signal, null);
  const calls = out.messages.filter((item) => item.type === 'cdp-send');
  assert.deepEqual(calls.map((item) => item.method), ['Input.dispatchMouseEvent', 'Runtime.evaluate', 'Target.getTargets']);
  assert.deepEqual(calls.map((item) => item.sessionId), ['owned-session', 'owned-session', null]);
});
for (const scenario of ['evaluate-only', 'dispatch-event']) {
  test(`worker forwards ${scenario} as Runtime.evaluate, not native Input`, async () => {
    const out = await exerciseWorker(scenario);
    assert.equal(out.code, 0); assert.equal(out.signal, null);
    assert.deepEqual(out.messages.filter((item) => item.type === 'cdp-send').map((item) => item.method), ['Runtime.evaluate']);
    // The worker alone accepts this; the actual entrypoint must reject the
    // resulting zero nativeInputOperations. The synthetic guard below is not
    // an execution of that entrypoint.
  });
}
for (const scenario of ['unsupported', 'parallel', 'unawaited', 'outside', 'wrong-session', 'wrong-page-session']) {
  test(`worker rejects ${scenario} contract violation`, async () => {
    const out = await exerciseWorker(scenario);
    assert.equal(out.code, 1); assert.equal(out.signal, null);
    assert.equal(out.messages.find((item) => item.type === 'finished')?.status, 'failed');
  });
}
test('a terminated worker reports the real process signal in offline IPC', async () => {
  const out = await exerciseWorker('signal');
  assert.equal(out.code, null); assert.equal(out.signal, 'SIGTERM');
  assert.ok(out.messages.some((item) => item.type === 'step-start' && item.step === 'pending'));
});

function exampleResult() {
  return { schema: 'test-board-e2e-result-v1', runId: '11111111-1111-4111-8111-111111111111', caseId: 'TC-054-NATIVE-INPUT', issue: '54', dataKind: 'fixture',
    git: { head: 'a'.repeat(40), dirty: false }, startedAt: '2026-11-14T00:00:00Z', finishedAt: '2026-11-14T00:00:01Z', timezone: 'UTC',
    environment: { platform: 'fake', arch: 'fake', node: 'fake', agentBrowser: 'agent-browser 0.43.0' },
    test: { status: 'passed', exitCode: 0, signal: null, failedStep: null, nativeCdpOperations: 30, nativeInputOperations: 26 }, interruption: null,
    steps: ['fixture-ready', 'native-touch-end', 'native-touch-cancel', 'native-space-click', 'native-roundtrip-pan', 'native-ctrl-wheel'].map((id) => ({ id, status: 'passed' })),
    recording: { start: 'passed', stop: 'passed', save: 'verified', targetContinuity: 'passed', readback: { status: 'passed', visualInspection: 'unverified', bytes: 1, duration: 1, decodedFrames: 1, first: { index: 0, pts: 0 }, last: { index: 0, pts: 0 }, sha256: 'b'.repeat(64) } },
    artifacts: { video: 'recording.webm', log: 'run.log', logStatus: 'verified', logSha256: 'c'.repeat(64) } };
}
test('result-v1 validator rejects zero native input, missing evidence and fabricated visual pass', () => {
  const options = { scenario: 'success', caseId: 'TC-054-NATIVE-INPUT', commit: 'a'.repeat(40), exit: { code: 0, signal: null } };
  const result = exampleResult(); assert.equal(verifyResult(result, options), true);
  for (const mutate of [
    (r) => { r.test.nativeInputOperations = 0; },
    (r) => { delete r.test.nativeInputOperations; },
    (r) => { r.test.nativeCdpOperations = 25; },
    (r) => { r.recording.readback.visualInspection = 'passed'; },
    (r) => { r.recording.stop = 'failed'; },
    (r) => { r.recording.readback.last.pts = -1; },
    (r) => { r.test.signal = 'SIGTERM'; },
  ]) { const altered = structuredClone(result); mutate(altered); assert.throws(() => verifyResult(altered, options)); }
});
test('interrupted synthetic result preserves the worker signal and unverified final continuity', () => {
  const options = { scenario: 'sigterm', caseId: 'TC-054-RUN-EVIDENCE', commit: 'a'.repeat(40), exit: { code: 1, signal: null } };
  const result = exampleResult();
  result.caseId = options.caseId;
  Object.assign(result.test, { status: 'failed', exitCode: null, signal: 'SIGTERM', failedStep: 'pending-interruption' });
  result.interruption = { reason: 'SIGTERM', observedAt: '2026-11-14T00:00:01Z' };
  result.steps.push({ id: 'pending-interruption', status: 'running', startedAt: '2026-11-14T00:00:00Z' });
  result.recording.targetContinuity = 'not-verified';
  assert.equal(verifyResult(result, options), true);
  for (const mutate of [
    (r) => { r.test.signal = null; },
    (r) => { r.interruption = null; },
    (r) => { r.test.failedStep = null; },
    (r) => { r.recording.targetContinuity = 'passed'; },
  ]) { const altered = structuredClone(result); mutate(altered); assert.throws(() => verifyResult(altered, options)); }
});
