// Issue 56 fixture: the original #54 native input/assertion sequence is reused unchanged.
import assert from 'node:assert/strict';
import { run as originalRun } from './runner.mjs';
export const contractVersion = 'test-board-native-cdp-v1';

export async function run(api) {
  const { caseId, step, cdp, page } = api;
  assert.equal(caseId, 'TC-056-NAVIGATION');
  const scenario = process.env.TB_56_SCENARIO;
  assert.ok(['success', 'undeclared', 'sigterm', 'retry'].includes(scenario));
  const initial = process.env.TB_56_INITIAL_URL;
  const next = process.env.TB_56_QUERY_URL;
  const denied = process.env.TB_56_DENIED_URL;
  await originalRun({ ...api, caseId: 'TC-054-NATIVE-INPUT' });
  await step('profile-marker', async () => {
    assert.equal(await page.evalValue('location.href'), initial);
    assert.equal(await page.evalValue("localStorage.setItem('issue56-fixture', 'synthetic'); localStorage.getItem('issue56-fixture')"), 'synthetic');
  });
  async function readyAt(url) {
    await page.waitFor('Boolean(window.nativeFixture && document.querySelector("#surface"))');
    assert.equal(await page.evalValue('location.href'), url);
    assert.equal(await page.evalValue("localStorage.getItem('issue56-fixture')"), 'synthetic');
  }
  await step('same-url-reload', async () => { await page.navigate(initial); await readyAt(initial); });
  await step('declared-query-navigation', async () => {
    await page.navigate(next); await readyAt(next);
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
