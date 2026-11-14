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
try {
  const runner = await import(pathToFileURL(process.argv[2]).href);
  if (runner.contractVersion !== 'test-board-agent-browser-v1' || typeof runner.run !== 'function') {
    throw new Error('unsupported runner contract');
  }
  await request('ready', {});
  const api = {
    caseId: process.argv[3],
    async step(id, fn) {
      if (currentStep || typeof id !== 'string' || !id.trim() || typeof fn !== 'function') throw new Error('invalid or nested step');
      currentStep = id;
      await request('step-start', { step: id });
      try {
        const result = await fn();
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
  await runner.run(api);
  await request('finished', { status: 'passed' });
} catch (error) {
  try { await request('finished', { status: 'failed', step: currentStep, error: String(error?.message || error) }); } catch {}
  process.exitCode = 1;
}
process.disconnect();
