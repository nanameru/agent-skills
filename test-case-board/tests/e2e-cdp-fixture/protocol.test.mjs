// Offline contract tests; they do not launch a browser, make a recording, or run E2E.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkEndpoint, pageIdentity, publicIdentity, experimentConclusion } from './protocol.mjs';

test('accepts only a loopback browser WebSocket without credentials or query', () => {
  assert.equal(checkEndpoint('ws://127.0.0.1:9222/devtools/browser/example'), 'ws://127.0.0.1:9222/devtools/browser/example');
  for (const endpoint of ['wss://127.0.0.1:9222/devtools/browser/a', 'ws://example.com:9222/devtools/browser/a',
    'ws://127.0.0.1:9222/devtools/page/a', 'ws://user:pass@127.0.0.1:9222/devtools/browser/a',
    'ws://127.0.0.1:9222/devtools/browser/a?token=x']) assert.throws(() => checkEndpoint(endpoint));
});

test('requires one shared active fixture target and no unrelated context', () => {
  const url = 'http://127.0.0.1:3000/';
  const tabs = { tabs: [{ targetId: 'target-1', active: true }] };
  const targets = { targetInfos: [{ targetId: 'target-1', browserContextId: 'context-1', type: 'page', url }] };
  const contexts = { browserContextIds: ['context-1'] };
  const identity = pageIdentity(tabs, targets, contexts, url);
  assert.equal(publicIdentity(identity).targetHash.length, 64);
  assert.throws(() => pageIdentity({ tabs: [...tabs.tabs, { active: false }] }, targets, contexts, url));
  assert.throws(() => pageIdentity({ tabs: [{ targetId: 'different', active: true }] }, targets, contexts, url));
  assert.throws(() => pageIdentity(tabs, targets, { browserContextIds: ['context-1', 'other'] }, url));
  assert.throws(() => pageIdentity(tabs, { targetInfos: [...targets.targetInfos, targets.targetInfos[0]] }, contexts, url));
  assert.throws(() => pageIdentity(tabs, targets, contexts, 'http://127.0.0.1:3001/'));
});

test('keeps identity changes and interruption separate from the completed worker result', () => {
  const result = { interruption: null, error: null, test: { status: 'passed' },
    recording: { start: 'passed', stop: 'passed', save: 'verified', readback: { status: 'passed' },
      sameTargetAtStart: true, sameContextAtStart: true, sameContextSetAtStart: true },
    artifacts: { logStatus: 'verified' } };
  assert.deepEqual(experimentConclusion(result), { conclusion: 'automatic-checks-passed-manual-review-required', exitCode: 0 });
  result.recording.sameTargetAtStart = false;
  assert.deepEqual(experimentConclusion(result), { conclusion: 'inconclusive-start-identity-changed', exitCode: 2 });
  assert.equal(result.test.status, 'passed');
  result.recording.sameTargetAtStart = true;
  result.recording.sameContextAtStart = false;
  assert.deepEqual(experimentConclusion(result), { conclusion: 'inconclusive-start-identity-changed', exitCode: 2 });
  result.recording.sameContextAtStart = true;
  result.recording.sameContextSetAtStart = false;
  assert.deepEqual(experimentConclusion(result), { conclusion: 'inconclusive-start-identity-changed', exitCode: 2 });
  result.recording.sameContextSetAtStart = true;
  result.interruption = { reason: 'SIGTERM' };
  assert.deepEqual(experimentConclusion(result), { conclusion: 'incomplete', exitCode: 1 });
  assert.equal(result.test.status, 'passed');
  result.interruption = null;
  result.recording.sameTargetAtStart = null;
  assert.deepEqual(experimentConclusion(result), { conclusion: 'incomplete', exitCode: 1 });
});
