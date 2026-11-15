import assert from 'node:assert/strict';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const sha = /^[a-f0-9]{64}$/;
const originalSteps = ['fixture-ready', 'native-touch-end', 'native-touch-cancel', 'native-space-click', 'native-roundtrip-pan', 'native-ctrl-wheel'];

// Independently check the official raw Target.getTargets snapshots in the
// existing private log. DOM presence and the product's classification alone
// are not evidence that an iframe target was recreated or owned.
export function verifyIframeObservations(entries) {
  const observations = entries.filter((e) => e.type === 'native-observation');
  const classifications = entries.filter((e) => e.type === 'native-target-classification');
  assert.ok(observations.length > 0 && observations.length === classifications.length, 'missing target observations/classifications');
  let ownedId, contextId, contextSet, fixed;
  for (let index = 0; index < observations.length; index++) {
    const observation = observations[index], classification = classifications[index];
    assert.equal(classification.phase, observation.phase); assert.equal(classification.step, observation.step);
    const infos = observation.targets?.targetInfos;
    assert.ok(Array.isArray(infos));
    const byId = new Map();
    for (const info of infos) {
      assert.ok(typeof info.targetId === 'string' && info.targetId && !byId.has(info.targetId), 'invalid target ID');
      byId.set(info.targetId, info);
    }
    const pages = infos.filter((info) => info.type === 'page');
    assert.equal(pages.length, 1, 'expected exactly one page');
    const page = pages[0];
    assert.ok(typeof page.browserContextId === 'string' && page.browserContextId, 'page context was not explicitly observed');
    ownedId ??= page.targetId; contextId ??= page.browserContextId;
    assert.equal(page.targetId, ownedId); assert.equal(page.browserContextId, contextId);
    assert.equal(observation.tabs?.tabs?.length, 1);
    assert.equal(observation.tabs.tabs[0].active, true); assert.equal(observation.tabs.tabs[0].targetId, ownedId);
    assert.ok(Array.isArray(observation.contexts?.browserContextIds));
    assert.ok(observation.contexts.browserContextIds.length <= 1 && (!observation.contexts.browserContextIds.length || observation.contexts.browserContextIds[0] === contextId));
    contextSet ??= [...observation.contexts.browserContextIds].sort();
    assert.deepEqual([...observation.contexts.browserContextIds].sort(), contextSet, 'browser context set changed');
    if (observation.phase !== 'initial-target') {
      assert.equal(observation.sessionTarget?.targetId, ownedId);
      assert.equal(observation.sessionTarget?.browserContextId, contextId);
      assert.equal(observation.sessionTarget?.url, page.url);
    }
    const stable = infos.filter((info) => info.type !== 'iframe')
      .map((info) => [info.targetId, info.type, info.browserContextId ?? 'default'])
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    fixed ??= stable;
    assert.deepEqual(stable, fixed, 'non-iframe target set changed');
    assert.deepEqual(classification.fixedTargets, stable);
    assert.deepEqual(classification.unprovenIframes, []);
    const frames = infos.filter((info) => info.type === 'iframe');
    for (const frame of frames) {
      let current = frame;
      const seen = new Set();
      for (;;) {
        assert.ok(!seen.has(current.targetId), 'iframe parent cycle'); seen.add(current.targetId);
        assert.equal(current.browserContextId, contextId, 'iframe chain context missing or different');
        if (current.targetId === ownedId) { assert.equal(current.type, 'page'); break; }
        assert.equal(current.type, 'iframe', 'non-iframe ancestor');
        assert.ok(typeof current.parentId === 'string' && current.parentId, 'iframe parent missing');
        current = byId.get(current.parentId);
        assert.ok(current, 'iframe parent unavailable');
      }
    }
    assert.deepEqual(classification.ownedIframes.map((frame) => frame.targetId).sort(), frames.map((frame) => frame.targetId).sort());
  }
  for (const step of ['same-url-reload', 'declared-query-navigation']) {
    const before = observations.filter((e) => e.step === step && e.phase === 'navigation-before');
    const after = observations.filter((e) => e.step === step && e.phase === 'step-after');
    assert.equal(before.length, 1); assert.equal(after.length, 1);
    assert.ok(entries.indexOf(before[0]) < entries.indexOf(after[0]));
    const previous = before[0].targets.targetInfos.filter((i) => i.type === 'iframe').map((i) => i.targetId);
    const current = after[0].targets.targetInfos.filter((i) => i.type === 'iframe').map((i) => i.targetId);
    assert.ok(previous.length && current.length, 'real iframe target absent at navigation boundary');
    assert.ok(previous.every((id) => !current.includes(id)), 'previous iframe target still present or not recreated');
  }
  return true;
}

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
