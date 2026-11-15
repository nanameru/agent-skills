import assert from 'node:assert/strict';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const sha = /^[a-f0-9]{64}$/;
const originalSteps = ['fixture-ready', 'native-touch-end', 'native-touch-cancel', 'native-space-click', 'native-roundtrip-pan', 'native-ctrl-wheel'];

// Result-v1 source validation only; neither synthetic results nor decode prove visual content.
export function verifyNavigationResult(result, { scenario, commit, exit, initial, next, denied }) {
  assert.equal(result.schema, 'test-board-e2e-result-v1'); assert.match(result.runId, uuid);
  assert.equal(result.caseId, 'TC-056-NAVIGATION'); assert.equal(result.issue, '56'); assert.equal(result.dataKind, 'fixture');
  assert.equal(result.git?.head, commit); assert.equal(result.git?.dirty, false);
  assert.ok(Number.isFinite(Date.parse(result.startedAt)) && Number.isFinite(Date.parse(result.finishedAt)) && result.timezone);
  assert.ok(result.environment?.platform && result.environment?.arch && result.environment?.node);
  assert.match(result.environment.agentBrowser, /(?:^|\s)0\.43\.0$/);
  assert.equal(exit.signal, null); assert.equal(exit.code, ['success', 'retry'].includes(scenario) ? 0 : 1);
  assert.equal(result.test.nativeInputOperations, 29);
  assert.ok(Number.isSafeInteger(result.test.nativeCdpOperations) && result.test.nativeCdpOperations >= 31);
  for (const id of [...originalSteps, 'profile-marker', 'same-url-reload', 'declared-query-navigation']) {
    assert.equal(result.steps.find((s) => s.id === id)?.status, 'passed', `step did not pass: ${id}`);
  }
  for (const [id, url] of [['same-url-reload', initial], ['declared-query-navigation', next]]) {
    const entries = result.steps.find((s) => s.id === id).navigations;
    assert.equal(entries.length, 1); assert.equal(entries[0].step, id);
    assert.equal(entries[0].requestedURL, url); assert.equal(entries[0].observedURL, url); assert.equal(entries[0].status, 'passed');
  }
  if (scenario === 'undeclared') {
    assert.equal(result.test.status, 'failed'); assert.equal(result.test.exitCode, 1); assert.equal(result.test.signal, null);
    assert.equal(result.test.failedStep, 'undeclared-navigation'); assert.equal(result.interruption, null);
    const failed = result.steps.find((s) => s.id === 'undeclared-navigation');
    assert.equal(failed?.status, 'failed'); assert.equal(failed.navigations?.length, 1);
    assert.equal(failed.navigations[0].requestedURL, denied); assert.equal(failed.navigations[0].observedURL, null);
    assert.equal(failed.navigations[0].status, 'failed'); assert.match(failed.navigations[0].error, /not declared/);
  } else if (scenario === 'sigterm') {
    assert.equal(result.test.status, 'failed'); assert.equal(result.test.exitCode, null); assert.equal(result.test.signal, 'SIGTERM');
    assert.equal(result.test.failedStep, 'pending-interruption'); assert.equal(result.interruption?.reason, 'SIGTERM');
    assert.ok(Number.isFinite(Date.parse(result.interruption.observedAt)));
    assert.ok(result.steps.find((s) => s.id === 'pending-interruption')?.startedAt);
  } else {
    assert.ok(['success', 'retry'].includes(scenario)); assert.equal(result.test.status, 'passed');
    assert.equal(result.test.exitCode, 0); assert.equal(result.test.signal, null); assert.equal(result.test.failedStep, null); assert.equal(result.interruption, null);
  }
  assert.equal(result.recording.start, 'passed'); assert.equal(result.recording.stop, 'passed'); assert.equal(result.recording.save, 'verified');
  assert.equal(result.recording.targetContinuity, ['sigterm', 'undeclared'].includes(scenario) ? 'not-verified' : 'passed');
  const v = result.recording.readback;
  assert.equal(v.status, 'passed'); assert.equal(v.visualInspection, 'unverified');
  assert.ok(v.bytes > 0 && v.duration > 0 && v.decodedFrames > 0);
  assert.equal(v.first?.index, 0); assert.equal(v.last?.index, v.decodedFrames - 1);
  assert.ok(Number.isFinite(v.first.pts) && Number.isFinite(v.last.pts) && v.last.pts >= v.first.pts);
  assert.match(v.sha256, sha); assert.equal(result.artifacts.logStatus, 'verified'); assert.match(result.artifacts.logSha256, sha);
  assert.equal(result.artifacts.video, 'recording.webm'); assert.equal(result.artifacts.log, 'run.log');
  return true;
}
