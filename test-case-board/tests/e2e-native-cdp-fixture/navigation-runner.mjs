// Issue 56 fixture: the original #54 native input/assertion sequence is reused unchanged.
import assert from 'node:assert/strict';
import { run as originalRun } from './runner.mjs';
import { extensionWorkerCandidate, workerProvenance } from '../../scripts/e2e-native-cdp.mjs';
export const contractVersion = 'test-board-native-cdp-v1';

export async function run(api) {
  const { caseId, step, cdp, page } = api;
  assert.equal(caseId, 'TC-056-NAVIGATION');
  const scenario = process.env.TB_56_SCENARIO;
  assert.ok(['success', 'undeclared', 'sigterm', 'retry'].includes(scenario));
  const initial = process.env.TB_56_INITIAL_URL;
  const next = process.env.TB_56_QUERY_URL;
  const denied = process.env.TB_56_DENIED_URL;
  const iframeMode = process.env.TB_56_IFRAME === '1';
  const workerMode = process.env.TB_56_WORKER_V3 === '1';
  let previousFrames = null, ownedPage = null, ownedContext = null;
  async function waitForRecreatedIframe() {
    const started = Date.now();
    for (;;) {
      // This is the same official browser-level read used by the original runner;
      // the entrypoint's independent boundary observations are checked afterward.
      const infos = (await cdp.send('Target.getTargets')).targetInfos;
      const pages = infos.filter((item) => item.type === 'page');
      assert.equal(pages.length, 1);
      const pageTarget = pages[0];
      assert.ok(typeof pageTarget.browserContextId === 'string' && pageTarget.browserContextId, 'owned page context unproven');
      ownedPage ??= pageTarget.targetId; ownedContext ??= pageTarget.browserContextId;
      assert.equal(pageTarget.targetId, ownedPage); assert.equal(pageTarget.browserContextId, ownedContext);
      const byId = new Map(infos.map((item) => [item.targetId, item]));
      assert.equal(byId.size, infos.length, 'duplicate target ID');
      const frames = infos.filter((item) => item.type === 'iframe');
      for (const frame of frames) {
        const seen = new Set(); let current = frame;
        for (;;) {
          assert.ok(!seen.has(current.targetId), 'iframe parent cycle'); seen.add(current.targetId);
          assert.equal(current.browserContextId, ownedContext, 'iframe context unproven');
          if (current.targetId === ownedPage) { assert.equal(current.type, 'page'); break; }
          assert.equal(current.type, 'iframe', 'non-iframe parent');
          assert.ok(typeof current.parentId === 'string' && current.parentId, 'iframe parent unproven');
          current = byId.get(current.parentId); assert.ok(current, 'iframe parent unavailable');
        }
      }
      const ids = frames.map((item) => item.targetId);
      if (ids.length && (!previousFrames || previousFrames.every((id) => !ids.includes(id)))) { previousFrames = ids; return; }
      if (Date.now() - started >= 10000) throw new Error('owned iframe target regeneration was not observed');
      await page.sleep(100);
    }
  }
  if (workerMode) await step('initial-worker-disappearance', async () => {
    const initialInfos = (await cdp.send('Target.getTargets')).targetInfos;
    const pages = initialInfos.filter((item) => item.type === 'page');
    assert.equal(pages.length, 1);
    const owner = pages[0];
    assert.ok(owner.targetId && owner.browserContextId && owner.url === initial, 'owned page context unproven');
    const known = new Map(initialInfos.map((item) => [item.targetId, item]));
    assert.equal(known.size, initialInfos.length, 'duplicate target ID');
    const candidates = initialInfos.filter((item) => extensionWorkerCandidate(item, owner));
    assert.ok(candidates.length, 'initial extension worker not observed');
    const candidateIds = new Set(candidates.map((item) => item.targetId));
    const started = Date.now();
    for (;;) {
      const infos = (await cdp.send('Target.getTargets')).targetInfos;
      const current = new Map(infos.map((item) => [item.targetId, item]));
      assert.equal(current.size, infos.length, 'duplicate target ID');
      for (const item of infos) {
        const old = known.get(item.targetId);
        assert.ok(old, 'unknown target appeared');
        assert.equal(item.type, old.type); assert.equal(item.browserContextId, old.browserContextId);
        if (old.type === 'service_worker') assert.deepEqual(workerProvenance(item), workerProvenance(old));
      }
      for (const [id, item] of known) if (!candidateIds.has(id)) assert.ok(current.has(id), 'fixed target disappeared');
      const pageNow = current.get(owner.targetId);
      assert.equal(pageNow?.type, 'page'); assert.equal(pageNow?.browserContextId, owner.browserContextId); assert.equal(pageNow?.url, initial);
      if (candidates.some((item) => !current.has(item.targetId))) return;
      if (Date.now() - started >= 45000) throw new Error('initial extension worker disappearance was not observed');
      await page.sleep(250);
    }
  });
  await originalRun({ ...api, caseId: 'TC-054-NATIVE-INPUT' });
  await step('profile-marker', async () => {
    assert.equal(await page.evalValue('location.href'), initial);
    assert.equal(await page.evalValue("localStorage.setItem('issue56-fixture', 'synthetic'); localStorage.getItem('issue56-fixture')"), 'synthetic');
    if (iframeMode) await waitForRecreatedIframe();
  });
  async function readyAt(url) {
    await page.waitFor('Boolean(window.nativeFixture && document.querySelector("#surface"))');
    assert.equal(await page.evalValue('location.href'), url);
    assert.equal(await page.evalValue("localStorage.getItem('issue56-fixture')"), 'synthetic');
  }
  await step('same-url-reload', async () => { await page.navigate(initial); await readyAt(initial); if (iframeMode) await waitForRecreatedIframe(); });
  await step('declared-query-navigation', async () => {
    await page.navigate(next); await readyAt(next);
    if (iframeMode) await waitForRecreatedIframe();
    const point = await page.evalValue(`(() => { const r = document.querySelector('#surface').getBoundingClientRect(); return {x:r.left+120,y:r.top+90}; })()`);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point }, page.sessionId);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', buttons: 1, clickCount: 1 }, page.sessionId);
    await page.sleep(60);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', buttons: 0, clickCount: 1 }, page.sessionId);
    await page.waitFor("window.nativeFixture.events.some(e => e.type === 'click' && e.trusted)");
    assert.equal(await page.evalValue("window.nativeFixture.events.some(e => e.type === 'click' && e.trusted)"), true);
  });
  if (scenario === 'undeclared') {
    await step('undeclared-navigation', async () => { await page.navigate(denied); });
  }
  if (scenario === 'sigterm') {
    await step('pending-interruption', async () => {
      const pending = new URL(initial); pending.pathname = '/pending';
      assert.equal((await fetch(pending)).ok, true);
      await new Promise(() => {});
    });
  }
}
