'use strict';

// Terminal Code is rendered into terminal pixels, not a desktop Retina window.
// Keep one CSS pixel per terminal image pixel despite host/DPI zoom changes.
function correction(zoom, dpr, target = 1) {
  if (![zoom, dpr, target].every(v => Number.isFinite(v) && v > 0)) return null;
  if (Math.abs(dpr / target - 1) < 0.015) return null;
  const next = Math.max(0.25, Math.min(5, zoom * target / dpr));
  return Math.abs(next - zoom) > 0.001 ? next : null;
}

function install(options, electron = require('electron')) {
  const { app, webContents, BrowserWindow } = electron;
  const origin = new URL(options.origin).origin;
  if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) throw new Error('Expected a local Terminal Code origin');
  const key = Symbol.for('terminal-code.pixel-density-policies');
  const policies = globalThis[key] ||= new Map();
  const existing = policies.get(origin);
  if (existing?.version === options.version) return existing;
  existing?.dispose();
  const monitors = new Map();
  let stopped = false;
  function attach(contents) {
    if (stopped || contents.isDestroyed() || monitors.has(contents.id)) return;
    let busy = false;
    let pending = null;
    const matches = () => {
      try { return new URL(contents.getURL()).origin === origin; }
      catch { return false; }
    };
    async function tick() {
      if (busy || stopped || contents.isDestroyed() || !matches()) return;
      busy = true;
      try {
        const dpr = await contents.executeJavaScript('window.devicePixelRatio', false);
        if (stopped || contents.isDestroyed() || !matches()) return;
        const next = correction(contents.getZoomFactor(), dpr, options.targetDpr || 1);
        if (next !== null) contents.setZoomFactor(next);
      } catch { /* Navigation/destroyed renderers are retried on the next event. */ }
      finally { busy = false; }
    }
    function schedule() {
      if (pending) clearTimeout(pending);
      pending = setTimeout(() => { pending = null; void tick(); }, 60);
      pending.unref?.();
    }
    const events = ['did-finish-load', 'did-stop-loading', 'did-navigate', 'zoom-changed'];
    for (const event of events) contents.on(event, schedule);
    const window = BrowserWindow.fromWebContents(contents);
    window?.on('resize', schedule);
    // followCellZoom changes ZoomFactor programmatically without a zoom-changed event.
    const timer = setInterval(() => void tick(), 500);
    timer.unref?.();
    function dispose() {
      clearInterval(timer);
      if (pending) clearTimeout(pending);
      for (const event of events) contents.removeListener(event, schedule);
      window?.removeListener('resize', schedule);
      contents.removeListener('destroyed', dispose);
      monitors.delete(contents.id);
    }
    contents.once('destroyed', dispose);
    monitors.set(contents.id, { tick, dispose });
    schedule();
  }
  const created = (_event, contents) => attach(contents);
  app.on('web-contents-created', created);
  for (const contents of webContents.getAllWebContents()) attach(contents);
  const policy = {
    version: options.version,
    async refresh() { await Promise.all([...monitors.values()].map(m => m.tick())); },
    dispose() {
      stopped = true;
      app.removeListener('web-contents-created', created);
      for (const monitor of [...monitors.values()]) monitor.dispose();
      if (policies.get(origin) === policy) policies.delete(origin);
    }
  };
  policies.set(origin, policy);
  return policy;
}
module.exports = { correction, install };
