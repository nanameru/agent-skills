// Real runner and worker IPC; browser commands are a local in-process double.
import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import http from 'node:http';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import vm from 'node:vm';

const workerFile = fileURLToPath(new URL('../scripts/e2e-worker.mjs', import.meta.url));
const runnerFile = fileURLToPath(new URL('./e2e-fixture/runner.mjs', import.meta.url));

// The probe removes its own listener on the tagged reply, then reports on the
// next event-loop turn. The worker's own IPC listener remains unmodified and
// keeps the IPC channel referenced while the runner's promise is pending.
const probe = `
function observe(message) {
  if (!message?.fixtureProbe) return;
  process.removeListener('message', observe);
  setImmediate(() => process.send({ type: 'fixture-probe', id: message.id }));
}
process.on('message', observe);
`;

test('fixture timeout: finite pending request leaves the worker step active until SIGTERM', async () => {
  const requests = [];
  const server = http.createServer((req, res) => {
    requests.push(req.url);
    res.writeHead(req.url === '/pending?attempt=ipc-regression' ? 204 : 404).end();
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const target = `http://127.0.0.1:${server.address().port}/?attempt=ipc-regression`;
  const status = { textContent: 'READY' };
  const page = vm.createContext({
    URL,
    location: new URL(target),
    document: { querySelector: (selector) => selector === '#status' ? status : null },
    window: { fixtureReported: false },
    fetch: (url) => {
      assert.equal(new URL(url).origin, new URL(target).origin);
      return fetch(url);
    },
  });
  const child = fork(workerFile, [runnerFile, 'TC-048-TIMEOUT-FIXTURE'], {
    env: { ...process.env, TB_FIXTURE_URL: target, TB_FIXTURE_SCENARIO: 'timeout' },
    execArgv: ['--import', `data:text/javascript,${encodeURIComponent(probe)}`],
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
  });
  child.stdout.resume();
  let stderr = '';
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  const closed = new Promise((resolve) => child.once('close', (code, signal) => resolve({ code, signal })));
  let resolveObserved, rejectObserved;
  const observed = new Promise((resolve, reject) => { resolveObserved = resolve; rejectObserved = reject; });
  const watchdog = setTimeout(() => rejectObserved(new Error('fixture did not reach the finite command and pending worker state')), 15000);
  let currentStep = null;
  let finiteCommandCompleted = false;
  let pendingCommandId = null;
  let stopping = false;
  const completedSteps = [];
  const messages = [];
  const reply = (message, value, fixtureProbe = false) => {
    assert.equal(child.connected, true, 'worker IPC disconnected before reply');
    child.send({ type: 'reply', id: message.id, value, fixtureProbe });
  };
  child.once('error', rejectObserved);
  child.once('exit', (code, signal) => {
    if (!stopping) rejectObserved(new Error(`worker exited before the pending state: ${code}/${signal}; ${stderr}`));
  });
  child.on('message', (message) => {
    messages.push(message);
    void (async () => {
      if (message.type === 'ready') return reply(message, true); // Simulated recording release.
      if (message.type === 'step-start') {
        assert.equal(currentStep, null);
        currentStep = message.step;
        return reply(message, true);
      }
      if (message.type === 'step-end') {
        assert.equal(message.step, currentStep);
        assert.equal(message.status, 'passed');
        completedSteps.push(message.step);
        currentStep = null;
        return reply(message, true);
      }
      if (message.type === 'command') {
        assert.equal(message.step, currentStep);
        const [name, ...args] = message.args;
        let value = {};
        if (name === 'open') assert.equal(args[0], target);
        else if (name === 'wait') {
          assert.equal(args[0], '--fn');
          assert.equal(vm.runInContext(args[1], page), true);
        } else if (name === 'click') {
          assert.equal(args[0], '#action');
          status.textContent = 'CLICKED';
          page.window.fixtureReported = true;
        } else if (name === 'console') value = { messages: [] };
        else if (name === 'eval') value = { result: await vm.runInContext(args[0], page) };
        else assert.fail(`unexpected browser command: ${name}`);

        if (currentStep === 'pending-interruption') {
          assert.equal(name, 'eval');
          assert.deepEqual(requests, ['/pending?attempt=ipc-regression']);
          assert.equal(value.result, true, 'the finite command must acknowledge the request');
          finiteCommandCompleted = true;
          pendingCommandId = message.id;
          return reply(message, value, true);
        }
        return reply(message, value);
      }
      if (message.type === 'fixture-probe') {
        assert.equal(finiteCommandCompleted, true);
        assert.equal(message.id, pendingCommandId);
        assert.equal(currentStep, 'pending-interruption');
        assert.deepEqual(completedSteps, ['open-fixture', 'assert-ready', 'click-action', 'assert-clicked', 'collect-console']);
        assert.equal(child.connected, true);
        assert.equal(child.exitCode, null);
        assert.equal(child.signalCode, null);
        stopping = true;
        assert.equal(child.kill('SIGTERM'), true);
        const exit = await closed;
        assert.deepEqual(exit, { code: null, signal: 'SIGTERM' });
        assert.equal(messages.some((item) => item.type === 'finished' || (item.type === 'step-end' && item.step === 'pending-interruption')), false);
        return resolveObserved();
      }
      assert.fail(`unexpected worker message: ${message.type}`);
    })().catch(rejectObserved);
  });

  try {
    await observed;
  } finally {
    clearTimeout(watchdog);
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM');
    await closed;
    const serverClosed = new Promise((resolve) => server.close(resolve));
    server.closeAllConnections();
    await serverClosed;
  }
});
