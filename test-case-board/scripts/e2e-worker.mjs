// Versioned runner bridge. Only browser commands sent over IPC are recorded.
import { pathToFileURL } from 'node:url';

let serial = 0;
const pending = new Map();
process.on('message', (message) => {
  if (message?.type !== 'reply') return;
  const request = pending.get(message.id);
  if (!request) return;
  pending.delete(message.id);
  if (message.error) request.reject(new Error(message.error));
  else request.resolve(message.value);
});
function request(type, data) {
  const id = ++serial;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    process.send({ type, id, ...data });
  });
}
let currentStep = null;
const native = process.argv[4] === 'native-cdp';
let inFlight = false, violation = false, sessionId;
const issued = [];
const handlers = new Map();
process.on('message', (message) => {
  if (message?.type !== 'cdp-event') return;
  for (const fn of handlers.get(message.method) || []) fn(message.params, message.sessionId);
  for (const fn of handlers.get('*') || []) fn(message.method, message.params, message.sessionId);
});
function tracked(promise) {
  const call = { consumed: false }; issued.push(call);
  promise.catch(() => {});
  return { then(resolve, reject) { call.consumed = true; return promise.then(resolve, reject); }, catch(reject) { call.consumed = true; return promise.catch(reject); }, finally(fn) { call.consumed = true; return promise.finally(fn); } };
}
function nativeSend(method, params = {}, sid = undefined, timeoutMs = 30000) {
  const browserRead = method === 'Target.getTargets' && sid === undefined;
  if (!currentStep || inFlight || (!browserRead && sid !== sessionId)) { violation = true; throw new Error('native operation requires a sequential active step and owned session'); }
  inFlight = true;
  const promise = request('cdp-send', { step: currentStep, method, params, sessionId: browserRead ? null : sid, timeoutMs }).finally(() => { inFlight = false; });
  return tracked(promise);
}

try {
  const runner = await import(pathToFileURL(process.argv[2]).href);
  if (runner.contractVersion !== (native ? 'test-board-native-cdp-v1' : 'test-board-agent-browser-v1') || typeof runner.run !== 'function') {
    throw new Error('unsupported runner contract');
  }
  const release = await request('ready', {});
  if (native) sessionId = release.sessionId;
  const api = {
    caseId: process.argv[3],
    async step(id, fn) {
      if (currentStep || typeof id !== 'string' || !id.trim() || typeof fn !== 'function') { if (native) violation = true; throw new Error('invalid or nested step'); }
      currentStep = id;
      await request('step-start', { step: id });
      try {
        const result = await fn();
        if (native && (inFlight || violation || issued.some((call) => !call.consumed))) throw new Error('native operation not awaited or contract violated');
        await request('step-end', { step: id, status: 'passed' });
        return result;
      } catch (error) {
        await request('step-end', { step: id, status: 'failed', error: String(error?.message || error) });
        throw error;
      } finally { currentStep = null; }
    },
    async command(...args) {
      if (!currentStep || !args.length || args.some((x) => typeof x !== 'string')) throw new Error('command requires an active step and string arguments');
      return request('command', { step: currentStep, args });
    },
  };
  if (native) {
    const cdp = { send: nativeSend, on(method, fn) {
      if (typeof method !== 'string' || typeof fn !== 'function') throw new Error('invalid event handler');
      if (!handlers.has(method)) handlers.set(method, new Set());
      handlers.get(method).add(fn); return () => handlers.get(method)?.delete(fn);
    } };
    const page = { cdp, sessionId,
      evaluate(expression, opts = {}) { if (opts.sessionId && opts.sessionId !== sessionId) { violation = true; throw new Error('session switch prohibited'); } return cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, ...opts, sessionId: undefined }, sessionId); },
      evalValue(expression, opts = {}) { return tracked((async () => { const r = await this.evaluate(expression, opts); if (r.exceptionDetails) throw new Error(`eval failed: ${r.exceptionDetails.text} ${r.exceptionDetails.exception?.description || ''}`); return r.result?.value; })()); },
      sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); },
      async waitFor(expression, { timeoutMs = 10000, pollMs = 100 } = {}) { const start = Date.now(); for (;;) { const value = await this.evalValue(expression).catch(() => undefined); if (value) return value; if (Date.now() - start > timeoutMs) throw new Error(`waitFor timeout: ${expression}`); await this.sleep(pollMs); } },
    };
    Object.assign(api, { cdp, page }); delete api.command;
  }
  await runner.run(api);
  if (native && (currentStep || inFlight || violation || issued.some((call) => !call.consumed))) throw new Error('native contract violation');
  await request('finished', { status: 'passed' });
} catch (error) {
  try { await request('finished', { status: 'failed', step: currentStep, error: String(error?.message || error) }); } catch {}
  process.exitCode = 1;
}
process.disconnect();
