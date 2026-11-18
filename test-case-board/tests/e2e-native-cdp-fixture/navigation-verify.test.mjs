// Synthetic log-contract checks only; these do not prove real CDP ownership.
import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyNativeTargets } from '../../scripts/e2e-native-cdp.mjs';
import { verifyIframeObservations, verifyWorkerObservations } from './navigation-verify.mjs';

test('iframe proof requires official parent/context observations and distinct boundary target IDs', () => {
  const makeObservation = (phase, step, frameId) => {
    const page = { targetId: 'page', type: 'page', browserContextId: 'context', url: 'http://127.0.0.1:3010/?run=synthetic' };
    const targets = { targetInfos: [page, { targetId: frameId, type: 'iframe', parentId: 'page', browserContextId: 'context' }] };
    return [{ type: 'native-observation', phase, step, targets, tabs: { tabs: [{ active: true, targetId: 'page' }] }, contexts: { browserContextIds: ['context'] }, sessionTarget: { ...page } },
      { type: 'native-target-classification', phase, step, ...classifyNativeTargets(targets, page) }];
  };
  const log = [
    ...makeObservation('navigation-before', 'same-url-reload', 'one'),
    ...makeObservation('step-after', 'same-url-reload', 'two'),
    ...makeObservation('navigation-before', 'declared-query-navigation', 'two'),
    ...makeObservation('step-after', 'declared-query-navigation', 'three'),
  ];
  assert.equal(verifyIframeObservations(log), true);
  for (const [label, mutate] of [
    ['missing parent', (copy) => { copy[0].targets.targetInfos[1].parentId = undefined; }],
    ['missing context', (copy) => { copy[0].targets.targetInfos[1].browserContextId = undefined; }],
    ['different context', (copy) => { copy[0].targets.targetInfos[1].browserContextId = 'other'; }],
    ['unknown parent', (copy) => { copy[0].targets.targetInfos[1].parentId = 'unknown'; }],
    ['cycle', (copy) => { copy[0].targets.targetInfos[1].parentId = 'one'; }],
    ['same target after reload', (copy) => { copy[2].targets.targetInfos[1].targetId = 'one'; copy[3].ownedIframes[0].targetId = 'one'; }],
    ['no iframe target', (copy) => { copy[0].targets.targetInfos.pop(); copy[1].ownedIframes = []; }],
    ['new page', (copy) => { copy[2].targets.targetInfos.push({ targetId: 'other', type: 'page', browserContextId: 'context' }); }],
    ['changed session', (copy) => { copy[2].sessionTarget.targetId = 'other'; }],
    ['changed context set', (copy) => { copy[2].contexts.browserContextIds = []; }],
    ['missing classification', (copy) => { copy.splice(1, 1); }],
  ]) {
    const copy = structuredClone(log); mutate(copy);
    assert.throws(() => verifyIframeObservations(copy), label);
  }
});

test('worker proof uses initial raw enumeration and formal confirmations, then observes disappearance with an unchanged owner', () => {
  const page = { targetId: 'page', type: 'page', browserContextId: 'context', url: 'http://127.0.0.1:3010/' };
  const worker = { targetId: 'worker', type: 'service_worker', browserContextId: 'context', url: `chrome-extension://${'a'.repeat(32)}/background.js` };
  const observation = (phase, step, present = true) => ({ type: 'native-observation', phase, step,
    tabs: { tabs: [{ active: true, targetId: 'page' }] }, contexts: { browserContextIds: ['context'] },
    sessionTarget: phase === 'initial-target' ? null : { ...page },
    targets: { targetInfos: present ? [{ ...page }, { ...worker }] : [{ ...page }] } });
  const classification = { type: 'native-target-classification', phase: 'initial-target', step: null,
    extensionWorkers: { baseline: ['worker'], confirmations: [{ targetId: 'worker', status: 'matched', targetInfo: { ...worker } }] } };
  const log = [observation('initial-target', null), classification, observation('step-before', null),
    observation('step-after', 'initial-worker-disappearance', false), observation('after-worker', null, false)];
  assert.deepEqual(verifyWorkerObservations(log), { candidateIds: ['worker'] });
  for (const [label, mutate] of [
    ['no initial worker', (copy) => { copy[0].targets.targetInfos.pop(); }],
    ['no confirmation', (copy) => { copy[1].extensionWorkers.confirmations = []; }],
    ['confirmation pending', (copy) => { copy[1].extensionWorkers.confirmations[0].status = 'pending'; }],
    ['confirmation mismatch', (copy) => { copy[1].extensionWorkers.confirmations[0].targetInfo.parentId = 'different'; }],
    ['worker already gone before step', (copy) => { copy[2].targets.targetInfos.pop(); }],
    ['no disappearance', (copy) => { copy[3].targets.targetInfos.push({ ...worker }); copy[4].targets.targetInfos.push({ ...worker }); }],
    ['same id reappears', (copy) => { copy[4].targets.targetInfos.push({ ...worker }); }],
    ['new worker', (copy) => { copy[4].targets.targetInfos.push({ ...worker, targetId: 'new-worker' }); }],
    ['worker URL changed', (copy) => { copy[2].targets.targetInfos[1].url += '?changed'; }],
    ['owner changed', (copy) => { copy[3].targets.targetInfos[0].targetId = 'other'; }],
    ['session target changed', (copy) => { copy[3].sessionTarget.targetId = 'other'; }],
    ['context set changed', (copy) => { copy[3].contexts.browserContextIds = ['other']; }],
  ]) {
    const copy = structuredClone(log); mutate(copy);
    assert.throws(() => verifyWorkerObservations(copy), label);
  }
});
