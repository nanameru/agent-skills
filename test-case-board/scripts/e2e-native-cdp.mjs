import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

export const hash = (s) => createHash('sha256').update(s).digest('hex');

// Declarations are absolute URLs, never patterns or origin-wide grants.
export function navigationURL(value, origin) {
  assert.equal(typeof value, 'string');
  assert.ok(/^https?:\/\//i.test(value) && !/[\s*]/.test(value), 'invalid navigation URL');
  assert.ok(!/^https?:\/\/[^/]*@/i.test(value), 'credentials are prohibited');
  const u = new URL(value);
  assert.ok(['http:', 'https:'].includes(u.protocol) && ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname));
  assert.ok(!u.username && !u.password && u.origin === origin, 'navigation origin differs');
  return u.href;
}

// Only the endpoint returned by this run's agent-browser get cdp-url is used.
export function checkEndpoint(value) {
  const u = new URL(value);
  assert.equal(u.protocol, 'ws:');
  assert.ok(['127.0.0.1', '[::1]'].includes(u.hostname));
  assert.ok(u.port && /^\/devtools\/browser\/[^/]+$/.test(u.pathname));
  assert.ok(!u.username && !u.password && !u.search && !u.hash);
  return u.href;
}

export function pageIdentity(tabs, targets, contexts, fixtureURL) {
  assert.equal(tabs?.tabs?.length, 1, 'agent-browser must report one tab');
  const active = tabs.tabs.filter((tab) => tab.active === true);
  assert.equal(active.length, 1, 'one active tab required');
  const pages = targets.targetInfos.filter((target) => target.type === 'page');
  assert.equal(pages.length, 1, 'CDP must report one page target');
  const page = pages[0];
  assert.ok(page.targetId && page.targetId === active[0].targetId, 'CLI and CDP target differ');
  assert.equal(page.url, fixtureURL, 'active target must be the fixture');
  assert.ok(Array.isArray(contexts.browserContextIds));
  // The default context is not included by Target.getBrowserContexts.
  assert.ok(contexts.browserContextIds.length <= 1, 'extra browser contexts');
  if (!page.browserContextId) assert.equal(contexts.browserContextIds.length, 0, 'extra browser context');
  if (page.browserContextId && contexts.browserContextIds.length) {
    assert.ok(contexts.browserContextIds.includes(page.browserContextId));
  }
  return { targetId: page.targetId, contextId: page.browserContextId ?? 'default',
    contexts: [...contexts.browserContextIds].sort() };
}

export function publicIdentity(identity) {
  return { targetHash: hash(identity.targetId), contextHash: hash(identity.contextId),
    contextSetHashes: identity.contexts.map(hash) };
}

// Shared by the live runner and offline contract checks.
export async function sendNativeOperation({ cdp, test, method, params, sessionId, timeoutMs }) {
  test.nativeCdpOperations++;
  const result = await cdp.send(method, params, sessionId, timeoutMs);
  if (['Input.dispatchTouchEvent', 'Input.dispatchKeyEvent', 'Input.dispatchMouseEvent'].includes(method)) test.nativeInputOperations++;
  return result;
}

export function nativeInputSatisfied(native, test) {
  return !native || test.nativeInputOperations > 0;
}

// Finalize the matching native step even when the ownership observation fails.
export async function finishNativeStep({ result, step, status, error, observe }) {
  let observationFailed = false, observationError;
  try { await observe(); } catch (caught) { observationFailed = true; observationError = caught; }
  const detail = observationFailed ? String(observationError?.message || observationError || 'ownership observation failed') : null;
  Object.assign(result.steps.at(-1), {
    status: observationFailed ? 'failed' : status,
    finishedAt: new Date().toISOString(),
    error: [error, detail].filter(Boolean).join('; ') || null,
  });
  if (observationFailed || status === 'failed') result.test.failedStep = step;
  if (observationFailed) throw observationError;
}

// A minimal protocol transport, not a capture engine. No retries or discovery.
export class CDP {
  constructor(ws) {
    this.ws = ws; this.next = 0; this.pending = new Map(); this.handlers = new Map();
    ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      const wait = this.pending.get(message.id);
      if (!wait) { if (message.method) { for (const fn of this.handlers.get(message.method) || []) fn(message.params, message.sessionId); for (const fn of this.handlers.get('*') || []) fn(message.method, message.params, message.sessionId); } return; }
      this.pending.delete(message.id); clearTimeout(wait.timer);
      if (message.error) wait.reject(new Error(`CDP ${message.error.message}`));
      else wait.resolve(message.result ?? {});
    });
    ws.addEventListener('close', () => {
      for (const wait of this.pending.values()) { clearTimeout(wait.timer); wait.reject(new Error('CDP closed')); }
      this.pending.clear();
    });
  }
  static async connect(endpoint) {
    const ws = new WebSocket(checkEndpoint(endpoint));
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => { ws.close(); reject(new Error('CDP connect timeout')); }, 10000);
      ws.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
      ws.addEventListener('error', () => { clearTimeout(timer); reject(new Error('CDP connect failed')); }, { once: true });
    });
    return new CDP(ws);
  }
  on(method, fn) { if (!this.handlers.has(method)) this.handlers.set(method, new Set()); this.handlers.get(method).add(fn); return () => this.handlers.get(method)?.delete(fn); }
  send(method, params = {}, sessionId, timeoutMs = 30000) {
    const id = ++this.next;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      try { this.ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) })); }
      catch (error) { clearTimeout(timer); this.pending.delete(id); reject(error); }
    });
  }
  close() { this.ws.close(); }
}
