import assert from 'node:assert/strict';

export const contractVersion = 'test-board-native-cdp-v1';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const steps = (a, b, n) => Array.from({ length: n }, (_, i) => ({ x: a.x + (b.x - a.x) * (i + 1) / n, y: a.y + (b.y - a.y) * (i + 1) / n }));
const near = (a, b, rel) => Math.abs(a - b) <= Math.abs(b) * rel;

export async function run({ caseId, step, cdp, page }) {
  assert.ok(['TC-054-NATIVE-INPUT', 'TC-054-RUN-EVIDENCE'].includes(caseId));
  const scenario = process.env.TB_NATIVE_SCENARIO;
  assert.ok(['success', 'assertion', 'sigterm', 'retry'].includes(scenario));
  const sid = page.sessionId;
  const input = (method, params) => cdp.send(method, params, sid);
  const mouse = (type, x, y, extra = {}) => input('Input.dispatchMouseEvent', { type, x, y, ...extra });
  const state = () => page.evalValue('structuredClone(window.nativeFixture)');
  const view = async () => (await state()).view;
  const unchanged = (a, b) => {
    assert.ok(Math.abs(a.x - b.x) < 1 && Math.abs(a.y - b.y) < 1, 'view position changed');
    assert.ok(near(a.zoom, b.zoom, 1e-6), 'view zoom changed');
  };
  async function live() {
    const liveState = await page.evalValue(`new Promise(resolve => {
      let done = false; const finish = raf => { if (!done) { done = true; resolve({ visible: document.visibilityState, raf }); } };
      requestAnimationFrame(() => finish('ok')); setTimeout(() => finish('stalled'), 1500);
    })`);
    const pages = (await cdp.send('Target.getTargets')).targetInfos.filter((target) => target.type === 'page');
    assert.equal(liveState.visible, 'visible'); assert.equal(liveState.raf, 'ok'); assert.equal(pages.length, 1);
  }
  // Matches the source's initial wait, four identical 60 ms samples, and 5 s limit.
  async function settle(first) {
    await sleep(first);
    let previous = null, same = 0; const started = Date.now();
    for (;;) {
      const v = await view();
      const current = JSON.stringify([+v.x.toFixed(1), +v.y.toFixed(1), +v.zoom.toFixed(4)]);
      if (current === previous) { if (++same >= 4) break; } else { same = 0; previous = current; }
      if (Date.now() - started > 5000) { await live(); throw new Error('fixture view did not settle'); }
      await sleep(60);
    }
    await live();
  }
  async function realClick(p) {
    await mouse('mouseMoved', p.x, p.y);
    await mouse('mousePressed', p.x, p.y, { button: 'left', buttons: 1, clickCount: 1 });
    await sleep(60);
    await mouse('mouseReleased', p.x, p.y, { button: 'left', buttons: 0, clickCount: 1 });
  }
  async function realDrag(p, path) {
    await mouse('mouseMoved', p.x, p.y);
    await mouse('mousePressed', p.x, p.y, { button: 'left', buttons: 1, clickCount: 1 });
    let last = p;
    for (const q of path) { await mouse('mouseMoved', q.x, q.y, { button: 'left', buttons: 1 }); await sleep(16); last = q; }
    await mouse('mouseReleased', last.x, last.y, { button: 'left', buttons: 0, clickCount: 1 });
  }
  async function withTouch(fn) {
    await input('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    try { await fn(); } finally {
      await sleep(150);
      await input('Emulation.setTouchEmulationEnabled', { enabled: false }).catch(() => {});
    }
  }
  async function touch(p, end) {
    await withTouch(async () => {
      await input('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y, id: 1 }] });
      await sleep(60);
      await input('Input.dispatchTouchEvent', { type: end, touchPoints: [] });
    });
  }
  const key = (type) => input('Input.dispatchKeyEvent', { type, key: ' ', code: 'Space', windowsVirtualKeyCode: 32, modifiers: 0 });
  const eventAfter = (events, type, predicate = () => true) => {
    const event = events.find((item) => item.type === type && predicate(item));
    assert.ok(event, `missing ${type}`); assert.equal(event.trusted, true, `${type} is not trusted`); return event;
  };

  let point;
  await step('fixture-ready', async () => {
    await page.waitFor('Boolean(window.nativeFixture && document.querySelector("#surface"))');
    point = await page.evalValue(`(() => { const e = document.querySelector('#surface'); const r = e.getBoundingClientRect();
      const x = r.left + 120, y = r.top + 90; const hit = document.elementFromPoint(x, y);
      return { x, y, usable: r.right > x + 80 && r.bottom > y + 30 && x > 0 && y > 0 && r.bottom <= innerHeight && (hit === e || e.contains(hit)) }; })()`);
    assert.equal(point.usable, true, 'fixture surface is not visible and unobstructed');
  });
  await step('native-touch-end', async () => {
    const before = await state();
    await touch(point, 'touchEnd');
    const events = (await state()).events.slice(before.events.length);
    eventAfter(events, 'touchstart', (e) => e.touches === 1);
    eventAfter(events, 'touchend', (e) => e.touches === 0 && e.changed > 0);
    eventAfter(events, 'pointerdown', (e) => e.pointerType === 'touch');
    eventAfter(events, 'pointerup', (e) => e.pointerType === 'touch');
  });
  await step('native-touch-cancel', async () => {
    const before = await state();
    await touch(point, 'touchCancel');
    await settle(600);
    const after = await state(), events = after.events.slice(before.events.length);
    eventAfter(events, 'touchstart', (e) => e.touches === 1);
    eventAfter(events, 'touchcancel', (e) => e.touches === 0 && e.changed > 0);
    eventAfter(events, 'pointercancel', (e) => e.pointerType === 'touch');
    unchanged(before.view, after.view);
  });
  await step('native-space-click', async () => {
    const before = await state();
    await key('keyDown'); await realClick(point); await key('keyUp'); await settle(600);
    const after = await state(), events = after.events.slice(before.events.length);
    const down = eventAfter(events, 'keydown', (e) => e.key === ' ' && e.code === 'Space' && e.keyCode === 32);
    const pressed = eventAfter(events, 'mousedown', (e) => e.button === 0 && e.buttons === 1 && e.space);
    const released = eventAfter(events, 'mouseup', (e) => e.button === 0 && e.buttons === 0 && e.space);
    const clicked = eventAfter(events, 'click', (e) => e.button === 0 && e.space);
    const up = eventAfter(events, 'keyup', (e) => e.key === ' ' && e.code === 'Space' && e.keyCode === 32);
    assert.ok(events.indexOf(down) < events.indexOf(pressed) && events.indexOf(pressed) < events.indexOf(released) && events.indexOf(released) < events.indexOf(clicked) && events.indexOf(clicked) < events.indexOf(up));
    assert.equal(after.space, false); unchanged(before.view, after.view);
  });
  await step('native-roundtrip-pan', async () => {
    const before = await state(), far = { x: point.x + 80, y: point.y + 30 };
    const path = steps(point, far, 6).concat(steps(far, point, 6));
    await realDrag(point, path); await settle(600);
    const after = await state(), events = after.events.slice(before.events.length);
    eventAfter(events, 'mousedown', (e) => e.button === 0 && e.buttons === 1);
    eventAfter(events, 'mouseup', (e) => e.button === 0 && e.buttons === 0);
    const moves = events.filter((e) => e.type === 'mousemove' && e.buttons === 1);
    let cursor = 0;
    for (const expected of path) {
      while (cursor < moves.length && (Math.abs(moves[cursor].x - expected.x) > 2 || Math.abs(moves[cursor].y - expected.y) > 2)) cursor++;
      assert.ok(cursor < moves.length, 'missing intermediate pan point');
      assert.equal(moves[cursor++].trusted, true, 'pan move is not trusted');
    }
    const farMove = moves.find((e) => e.x - point.x >= 78 && e.y - point.y >= 28);
    assert.ok(farMove && farMove.trusted, 'pan never reached the far point with trusted input');
    assert.ok(Math.abs(farMove.viewX - before.view.x - 80) <= 1.5 && Math.abs(farMove.viewY - before.view.y - 30) <= 1.5, 'view did not move through the far point');
    unchanged(before.view, after.view);
  });
  await step('native-ctrl-wheel', async () => {
    const before = await state();
    await mouse('mouseMoved', point.x, point.y);
    await mouse('mouseWheel', point.x, point.y, { deltaX: 0, deltaY: -100, modifiers: 2 });
    await settle(500);
    const after = await state(), events = after.events.slice(before.events.length);
    eventAfter(events, 'wheel', (e) => e.ctrlKey && e.deltaX === 0 && e.deltaY === -100);
    assert.ok(near(after.view.zoom, Math.min(4, before.view.zoom * Math.exp(0.25)), 0.01), 'Ctrl+wheel zoom differs by more than 1%');
    // This is after every native-input assertion, not a change to gesture speed.
    await sleep(1000);
  });
  if (scenario === 'assertion') {
    await step('intentional-assertion-failure', async () => {
      assert.equal(await page.evalValue('document.querySelector("#zoom").textContent'), 'INTENTIONALLY ABSENT', 'intentional fixture assertion');
    });
  }
  if (scenario === 'sigterm') {
    await step('pending-interruption', async () => {
      // A worker-side localhost request proves this named step began after the
      // recorder released the worker, without leaving a CDP send in flight.
      const pending = new URL(process.env.TB_NATIVE_FIXTURE_URL);
      assert.equal(pending.protocol, 'http:'); assert.equal(pending.hostname, '127.0.0.1');
      pending.pathname = '/pending';
      assert.equal((await fetch(pending)).ok, true);
      await new Promise(() => {});
    });
  }
}
