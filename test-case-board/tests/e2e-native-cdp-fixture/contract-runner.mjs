// Offline IPC fixture only: never connects to a browser or counts as E2E evidence.
import assert from 'node:assert/strict';
export const contractVersion = process.env.TB_CONTRACT_SCENARIO === 'unsupported' ? 'unsupported' : 'test-board-native-cdp-v1';

export async function run({ step, cdp, page }) {
  const scenario = process.env.TB_CONTRACT_SCENARIO;
  if (scenario === 'serial') {
    await step('serial', async () => {
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1, y: 1 }, page.sessionId);
      assert.equal(await page.evalValue('1'), 1);
      await cdp.send('Target.getTargets');
    });
  } else if (scenario === 'evaluate-only' || scenario === 'dispatch-event') {
    await step('no-native-input', async () => {
      await page.evalValue(scenario === 'evaluate-only' ? '1' : 'document.body.dispatchEvent(new Event("touchstart"))');
    });
  } else if (scenario === 'parallel') {
    await step('parallel', async () => {
      const first = cdp.send('Runtime.evaluate', {}, page.sessionId);
      try { cdp.send('Runtime.evaluate', {}, page.sessionId); } catch {}
      await first;
    });
  } else if (scenario === 'unawaited') {
    await step('unawaited', async () => { cdp.send('Runtime.evaluate', {}, page.sessionId); });
  } else if (scenario === 'outside') {
    try { cdp.send('Runtime.evaluate', {}, page.sessionId); } catch {}
  } else if (scenario === 'wrong-session') {
    await step('wrong-session', async () => { try { cdp.send('Runtime.evaluate', {}, 'other-session'); } catch {} });
  } else if (scenario === 'wrong-page-session') {
    await step('wrong-page-session', async () => { try { page.evaluate('1', { sessionId: 'other-session' }); } catch {} });
  } else if (scenario === 'signal') {
    await step('pending', async () => { await new Promise(() => {}); });
  } else throw new Error('unsupported offline scenario');
}
