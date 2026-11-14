import assert from 'node:assert/strict';

const nativeSteps = ['fixture-ready', 'native-touch-end', 'native-touch-cancel', 'native-space-click', 'native-roundtrip-pan', 'native-ctrl-wheel'];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const sha256 = /^[0-9a-f]{64}$/;

// Validates the existing result-v1 fields; synthetic objects are offline tests only.
export function verifyResult(result, { scenario, caseId, commit, exit }) {
  assert.equal(result.schema, 'test-board-e2e-result-v1');
  assert.match(result.runId, uuid);
  assert.equal(result.caseId, caseId); assert.equal(result.issue, '54'); assert.equal(result.dataKind, 'fixture');
  assert.equal(result.git?.head, commit); assert.equal(result.git?.dirty, false);
  assert.ok(Number.isFinite(Date.parse(result.startedAt)) && Number.isFinite(Date.parse(result.finishedAt)) && result.timezone);
  assert.ok(result.environment?.platform && result.environment?.arch && result.environment?.node);
  assert.match(result.environment.agentBrowser, /(?:^|\s)0\.43\.0$/);
  assert.equal(exit.signal, null, 'entrypoint did not handle its signal');
  assert.equal(exit.code, ['success', 'retry'].includes(scenario) ? 0 : 1);
  // This fixture sends exactly 4 touch, 2 key and 20 mouse Input calls.
  assert.equal(result.test.nativeInputOperations, 26, 'successful native Input response count differs');
  assert.ok(Number.isSafeInteger(result.test.nativeCdpOperations) && result.test.nativeCdpOperations >= 26, 'invalid native CDP attempt count');
  for (const id of nativeSteps) assert.equal(result.steps.find((item) => item.id === id)?.status, 'passed', `native step did not pass: ${id}`);
  if (['success', 'retry'].includes(scenario)) {
    assert.equal(result.test.status, 'passed'); assert.equal(result.test.exitCode, 0); assert.equal(result.test.signal, null);
    assert.equal(result.test.failedStep, null); assert.equal(result.interruption, null);
  } else if (scenario === 'assertion') {
    assert.equal(result.test.status, 'failed'); assert.equal(result.test.exitCode, 1); assert.equal(result.test.signal, null);
    assert.equal(result.test.failedStep, 'intentional-assertion-failure');
    assert.equal(result.steps.find((item) => item.id === 'intentional-assertion-failure')?.status, 'failed');
    assert.match(result.error, /intentional fixture assertion/); assert.equal(result.interruption, null);
  } else if (scenario === 'sigterm') {
    assert.equal(result.test.status, 'failed'); assert.equal(result.test.exitCode, null); assert.equal(result.test.signal, 'SIGTERM');
    assert.equal(result.test.failedStep, 'pending-interruption'); assert.equal(result.interruption?.reason, 'SIGTERM');
    assert.ok(Number.isFinite(Date.parse(result.interruption.observedAt)));
    assert.ok(result.steps.some((item) => item.id === 'pending-interruption' && item.startedAt));
  } else throw new Error('unsupported scenario');
  assert.equal(result.recording.start, 'passed'); assert.equal(result.recording.stop, 'passed');
  assert.equal(result.recording.save, 'verified');
  // The common entrypoint aborts its after-worker observation on SIGTERM.
  // Do not turn that missing final observation into a continuity pass.
  assert.equal(result.recording.targetContinuity, scenario === 'sigterm' ? 'not-verified' : 'passed');
  const readback = result.recording.readback;
  assert.equal(readback.status, 'passed'); assert.equal(readback.visualInspection, 'unverified');
  assert.ok(readback.bytes > 0 && readback.decodedFrames > 0 && readback.duration > 0);
  assert.equal(readback.first?.index, 0); assert.equal(readback.last?.index, readback.decodedFrames - 1);
  assert.ok(Number.isFinite(readback.first.pts) && Number.isFinite(readback.last.pts) && readback.last.pts >= readback.first.pts);
  assert.match(readback.sha256, sha256); assert.equal(result.artifacts.logStatus, 'verified');
  assert.match(result.artifacts.logSha256, sha256);
  assert.equal(result.artifacts.video, 'recording.webm'); assert.equal(result.artifacts.log, 'run.log');
  return true;
}
