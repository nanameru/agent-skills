// Invoked once by run.mjs only after standard recording has started.
import assert from 'node:assert/strict';
import { CDP, publicIdentity } from './protocol.mjs';

const payload = await new Promise((resolve) => process.once('message', resolve));
let cdp;
try {
  cdp = await CDP.connect(payload.endpoint);
  const attached = await cdp.send('Target.attachToTarget', { targetId: payload.identity.targetId, flatten: true });
  const sid = attached.sessionId;
  const confirm = async (phase) => {
    const info = (await cdp.send('Target.getTargetInfo', {}, sid)).targetInfo;
    assert.equal(info.targetId, payload.identity.targetId);
    assert.equal(info.browserContextId ?? 'default', payload.identity.contextId);
    assert.equal(info.url, payload.url);
    process.send({ type: 'identity', phase, ...publicIdentity(payload.identity) });
  };
  const evaluate = async (expression) => {
    const response = await cdp.send('Runtime.evaluate', { expression, returnByValue: true }, sid);
    if (response.exceptionDetails) throw new Error('fixture evaluation failed');
    return response.result.value;
  };
  await confirm('before-native-input');
  const box = await evaluate(`(() => { const r = document.querySelector('#probe').getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}; })()`);
  assert.ok(Number.isFinite(box.x) && Number.isFinite(box.y));
  process.send({ type: 'step', phase: 'native-click-start', x: box.x, y: box.y });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...box, button: 'left', buttons: 1, clickCount: 1 }, sid);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...box, button: 'left', buttons: 0, clickCount: 1 }, sid);
  assert.equal(await evaluate("document.querySelector('#outcome').textContent"), 'Trusted click received.');
  process.send({ type: 'step', phase: 'trusted-click-asserted' });
  await confirm('after-native-input');
  // This pause is after the assertion; it allows the changed state to be visible.
  await new Promise((resolve) => setTimeout(resolve, 1000));
  process.send({ type: 'finished', status: 'passed' });
} catch (error) {
  process.send?.({ type: 'finished', status: 'failed', error: error.message });
  process.exitCode = 1;
} finally {
  cdp?.close();
  process.disconnect?.();
}
