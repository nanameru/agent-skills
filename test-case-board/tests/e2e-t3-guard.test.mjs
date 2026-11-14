// Synthetic harness/CLI contract only: no T3, browser, recording, or E2E.
// One synthetic video exercises the existing finalizer; it is not a capture.
// TB_FAKE_TEST_DIR must be an existing owner-only directory outside the checkout.
import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { prepare, receipt, finalize } from '../scripts/e2e-t3-lifecycle.mjs';
import { createGuard } from '../scripts/e2e-t3-guard.mjs';

const checkout = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const cli = path.join(checkout, 'test-case-board/scripts/e2e-t3-cli.mjs');
let root, syntheticVideo;
before(async () => {
  assert.ok(path.isAbsolute(process.env.TB_FAKE_TEST_DIR || ''), 'private TB_FAKE_TEST_DIR required');
  const parent = await realpath(process.env.TB_FAKE_TEST_DIR), s = await stat(parent), repo = await realpath(checkout);
  assert.ok(s.isDirectory() && !(s.mode & 0o077) && (!process.getuid || s.uid === process.getuid()));
  assert.ok(parent !== repo && !parent.startsWith(repo + path.sep));
  assert.equal(await realpath(process.cwd()), repo);
  root = path.join(parent, `guard-fixtures-${randomUUID()}`);
  await mkdir(root, { mode: 0o700 });
  const videoPath = path.join(root, 'synthetic.mp4');
  await promisify(execFile)('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'color=c=black:s=32x32:r=2:d=1',
    '-c:v', 'mpeg4', '-pix_fmt', 'yuv420p', '-n', videoPath], { timeout: 30000 });
  syntheticVideo = { path: videoPath, sizeBytes: (await stat(videoPath)).size };
  assert.ok(syntheticVideo.sizeBytes > 0);
});
const owned = () => ({ available: true, tabId: 'mock-tab', control: { ownedByCaller: true, owner: 'agent' },
  tabs: [{ tabId: 'mock-tab', ownedByCaller: true, owner: 'agent' }] });
const readJson = async (dir, file) => JSON.parse(await readFile(path.join(dir, file), 'utf8'));

async function makeRun(retryOf = null, media = null) {
  const run = await prepare({ caseId: 'TC-050-GUARD', evidenceDir: root, dataKind: 'mock', issue: '50',
    environment: 'synthetic harness; no T3 or browser', retryOf });
  const guard = await createGuard(run.runDir);
  let tick = Date.now() + 60000, serial = 0;
  const dispatched = [];
  const now = () => new Date(tick++).toISOString();
  async function call(ticket, change = () => {}) {
    dispatched.push({ tool: ticket.tool, boundary: ticket.boundary, operationId: ticket.operationId });
    let content;
    if (ticket.boundary === 'initial') content = { available: true, tabs: [] };
    else if (ticket.tool === 'preview_recording_start') content = { tabId: 'mock-tab', recording: true, startedAt: now() };
    else if (ticket.tool === 'preview_recording_stop') content = { tabId: 'mock-tab', mimeType: 'video/mp4', path: media?.path ?? path.join(root, 'absent-synthetic.mp4'), sizeBytes: media?.sizeBytes ?? 1 };
    else if (ticket.tool === 'preview_status' || ticket.tool === 'preview_open') content = owned();
    else content = { value: 'synthetic' };
    const envelope = { ticket: structuredClone(ticket), tool: ticket.tool, callId: `call-${++serial}`, responseId: `response-${serial}`,
      startedAt: now(), finishedAt: now(), response: { structuredContent: content },
      ...(ticket.boundary === 'operation' && ticket.tool === 'preview_act' ? { outcome: 'passed' } : {}) };
    change(envelope);
    return guard.handle({ action: 'accept', envelope });
  }
  async function single(kind, args = {}) {
    const { ticket } = await guard.handle({ action: 'begin', kind, ...args });
    return call(ticket);
  }
  async function triplet(kind, args = {}, outcome = 'passed') {
    let { ticket } = await guard.handle({ action: 'begin', kind, ...args });
    ({ ticket } = await call(ticket));
    ({ ticket } = await call(ticket, e => { if (kind === 'step') e.outcome = outcome; }));
    return call(ticket);
  }
  async function ready() {
    await single('initial');
    await single('open', { arguments: { reuseExistingTab: false, url: 'http://localhost/fixture' } });
    await triplet('start');
  }
  async function step(outcome = 'passed') {
    return triplet('step', { stepId: 'click', tool: 'preview_act', arguments: { action: 'click', locator: 'aria-ref=fixture' } }, outcome);
  }
  async function testResult(status = 'passed') {
    return guard.handle({ action: 'test', result: { at: now(), status, exitCode: status === 'passed' ? 0 : 1,
      signal: null, interruption: null, failedStep: status === 'failed' ? 'click' : null } });
  }
  async function stopAndFinalize() {
    await triplet('stop');
    return guard.handle({ action: 'finalize' });
  }
  return { ...run, guard, call, single, triplet, ready, step, testResult, stopAndFinalize, dispatched, now };
}

// Successful machine processing of synthetic media is not a live T3 run.
test('mock full success, intentional failure, AbortError, and retry preserve v1 results', async () => {
  const passed = await makeRun(null, syntheticVideo);
  await passed.ready(); await passed.step(); await passed.testResult();
  const a = await passed.stopAndFinalize();
  assert.equal(a.result.schema, 'test-board-e2e-result-v1');
  assert.equal(a.result.test.status, 'passed');
  assert.equal(a.result.recording.targetContinuity, 'passed');
  assert.equal(a.result.recording.stop, 'passed');
  assert.equal(a.result.recording.save, 'verified');
  assert.equal(a.result.recording.readback.status, 'passed');
  assert.equal(a.ok, true, 'the complete synthetic sequence should pass');
  const log = (await readFile(path.join(passed.runDir, 'run.log'), 'utf8')).trim().split('\n').map(JSON.parse);
  const step = log.find(e => e.kind === 'step');
  assert.equal(step.stepId, 'click'); assert.equal(step.outcome, 'passed');
  assert.equal(step.call.ticket.boundary, 'operation');
  assert.equal(step.call.ticket.operationId, step.operationId);
  const statuses = log.filter(e => e.kind === 'status' && e.position);
  assert.ok(statuses.length >= 6);
  assert.deepEqual(statuses[0].structuredContent, statuses[1].structuredContent, 'identical static responses are allowed');
  assert.notEqual(statuses[0].call.callId, statuses[1].call.callId);

  const failed = await makeRun();
  await failed.ready(); await failed.step('failed'); await failed.testResult('failed');
  const b = await failed.stopAndFinalize();
  assert.equal(b.result.test.status, 'failed');
  assert.equal(b.result.steps[0].status, 'failed');
  assert.equal(b.result.recording.targetContinuity, 'passed');
  const prior = await Promise.all(['run.json', 'run.log', 'result.json'].map(f => readFile(path.join(failed.runDir, f))));

  // A pre-existing failure produced by the original raw-receipt path.
  const legacy = await prepare({ caseId: 'TC-050-LEGACY', evidenceDir: root, dataKind: 'mock', issue: '50', environment: 'old raw failure fixture' });
  await receipt(legacy.runDir, { kind: 'test', at: new Date().toISOString(), status: 'failed', exitCode: 1, signal: null, interruption: null });
  await finalize(legacy.runDir);
  const legacyBefore = await Promise.all(['run.json', 'run.log', 'result.json'].map(f => readFile(path.join(legacy.runDir, f))));
  const retry = await makeRun(legacy.runId);
  await retry.ready(); await retry.step(); await retry.testResult();
  const c = await retry.stopAndFinalize();
  assert.notEqual(retry.runId, legacy.runId);
  assert.equal(c.result.retryOf, legacy.runId);
  assert.equal(c.result.test.status, 'passed');
  assert.deepEqual(await Promise.all(['run.json', 'run.log', 'result.json'].map(f => readFile(path.join(failed.runDir, f)))), prior);
  assert.deepEqual(await Promise.all(['run.json', 'run.log', 'result.json'].map(f => readFile(path.join(legacy.runDir, f)))), legacyBefore);

  const interrupted = await makeRun();
  await interrupted.ready(); await interrupted.step();
  const at = interrupted.now();
  await interrupted.guard.handle({ action: 'abort', at, error: { name: 'AbortError', message: 'synthetic interruption' } });
  const d = await interrupted.stopAndFinalize();
  assert.equal(d.result.test.status, 'failed');
  assert.deepEqual(d.result.interruption, { reason: 'AbortError', observedAt: at });
  assert.equal(d.result.recording.stop, 'passed');
  assert.equal(d.result.recording.targetContinuity, 'passed');

  const toolFailed = await makeRun(); await toolFailed.ready();
  let next = await toolFailed.guard.handle({ action: 'begin', ...stepPlan });
  next = await toolFailed.call(next.ticket);
  next = await toolFailed.call(next.ticket, e => { e.response = { isError: true, content: [{ type: 'text', text: 'synthetic error' }] }; e.outcome = 'failed'; });
  await toolFailed.call(next.ticket);
  await toolFailed.testResult('failed');
  const e = await toolFailed.stopAndFinalize();
  assert.equal(e.result.recording.targetContinuity, 'passed');
  assert.deepEqual(e.result.toolFailures, ['step tool failed']);
  assert.equal(e.result.recording.stop, 'passed');
});

const stepPlan = { kind: 'step', stepId: 'click', tool: 'preview_act', arguments: { action: 'click' } };
async function expectBlocked(run, action, pattern) {
  await assert.rejects(action, pattern);
  const before = run.dispatched.filter(x => x.tool === 'preview_act').length;
  await assert.rejects(run.guard.handle({ action: 'begin', ...stepPlan }), /failed|pending|sequence/);
  assert.equal(run.dispatched.filter(x => x.tool === 'preview_act').length, before, 'no next operation was dispatched');
  const result = await run.stopAndFinalize();
  assert.equal(result.ok, false);
  assert.equal(result.result.test.status, 'failed');
  assert.equal(result.result.recording.stop, 'passed', 'cleanup remains available');
  const log = (await readFile(path.join(run.runDir, 'run.log'), 'utf8')).trim().split('\n').map(JSON.parse);
  assert.ok(log.some(e => e.guardFailure), 'failure is retained');
}

test('preflight rejects missing/empty stepId before any step dispatch', async () => {
  for (const stepId of [undefined, '', '   ']) {
    const run = await makeRun(); await run.ready();
    await expectBlocked(run, () => run.guard.handle({ action: 'begin', ...stepPlan, stepId }), /stepId/);
    assert.equal(run.dispatched.filter(x => x.tool === 'preview_act').length, 0);
  }
});

test('missing/invalid outcomes, reused envelope IDs, open substitution and broken boundary stop before next operation', async () => {
  const cases = [
    ['missing outcome', 'operation', e => { delete e.outcome; }, /outcome/],
    ['invalid outcome', 'operation', e => { e.outcome = 'unknown'; }, /outcome/],
    ['duplicate call', 'before', e => { e.callId = 'call-5'; }, /duplicate/],
    ['duplicate response', 'before', e => { e.responseId = 'response-5'; }, /duplicate/],
    ['open as status', 'before', e => { e.tool = 'preview_open'; }, /actual tool/],
    ['wrong run', 'before', e => { e.ticket.runId = 'another-run'; }, /ticket/],
    ['missing boundary', 'before', e => { delete e.ticket.boundary; }, /ticket/],
    ['missing operationId', 'before', e => { e.ticket.operationId = ''; }, /ticket/],
    ['missing startedAt', 'before', e => { delete e.startedAt; }, /timestamps/],
    ['missing finishedAt', 'before', e => { delete e.finishedAt; }, /timestamps/],
    ['missing callId', 'before', e => { delete e.callId; }, /callId/],
    ['missing responseId', 'before', e => { delete e.responseId; }, /responseId/],
    ['reversed timestamps', 'before', e => { e.startedAt = '2099-01-01T00:00:00.000Z'; }, /timestamps/],
    ['wrong owner', 'before', e => { e.response.structuredContent.control.ownedByCaller = false; }, /ownership/],
    ['wrong tab', 'before', e => { e.response.structuredContent.tabId = 'another-tab'; }, /target/],
  ];
  for (const [label, at, mutate, message] of cases) {
    const run = await makeRun(); await run.ready();
    let { ticket } = await run.guard.handle({ action: 'begin', ...stepPlan });
    if (at === 'operation') ({ ticket } = await run.call(ticket));
    await expectBlocked(run, () => run.call(ticket, mutate), message);
    assert.equal(run.dispatched.filter(x => x.tool === 'preview_act').length, at === 'operation' ? 1 : 0, label);
  }
});

test('missing status response cannot release the operation ticket', async () => {
  const run = await makeRun(); await run.ready();
  const { ticket } = await run.guard.handle({ action: 'begin', ...stepPlan });
  assert.equal(ticket.tool, 'preview_status'); assert.equal(ticket.boundary, 'before');
  await expectBlocked(run, () => run.guard.handle({ action: 'begin', ...stepPlan }), /pending/);
  assert.equal(run.dispatched.filter(x => x.tool === 'preview_act').length, 0);
});

test('failed pre-stop status still permits one emergency stop and records a protocol failure', async () => {
  const run = await makeRun(); await run.ready(); await run.step(); await run.testResult();
  const { ticket } = await run.guard.handle({ action: 'begin', kind: 'stop' });
  await assert.rejects(run.call(ticket, e => { e.response.structuredContent.control.owner = 'human'; }), /ownership/);
  let emergency = await run.guard.handle({ action: 'cleanup' });
  assert.equal(emergency.ticket.tool, 'preview_recording_stop');
  emergency = await run.call(emergency.ticket);
  await run.call(emergency.ticket);
  const result = await run.guard.handle({ action: 'finalize' });
  assert.equal(result.ok, false);
  assert.equal(result.result.recording.stop, 'passed');
  assert.equal(result.result.recording.targetContinuity, 'failed');
  assert.ok(result.result.protocolErrors.length > 0);
});

test('NDJSON CLI returns a ticket and rejects an unbound open response', async () => {
  const run = await prepare({ caseId: 'TC-050-CLI', evidenceDir: root, dataKind: 'mock', issue: '50', environment: 'mock CLI' });
  const child = spawn(process.execPath, [cli, 'guard', '--run', run.runDir], { cwd: checkout, stdio: ['pipe', 'pipe', 'pipe'] });
  const lines = createInterface({ input: child.stdout })[Symbol.asyncIterator]();
  const send = async value => { child.stdin.write(JSON.stringify(value) + '\n'); return JSON.parse((await lines.next()).value); };
  const first = await send({ action: 'begin', kind: 'initial' });
  assert.equal(first.ok, true); assert.equal(first.result.ticket.tool, 'preview_status');
  const t = first.result.ticket, now = new Date().toISOString();
  const invalid = await send({ action: 'accept', envelope: { ticket: t, tool: 'preview_open', callId: 'one', responseId: 'one',
    startedAt: now, finishedAt: now, response: { structuredContent: owned() } } });
  assert.equal(invalid.ok, false); assert.match(invalid.error, /actual tool/);
  const final = await send({ action: 'finalize' });
  assert.equal(final.ok, true); assert.equal(final.result.ok, false);
  assert.equal(final.result.result.test.status, 'failed');
  const exited = new Promise(resolve => child.once('exit', (code, signal) => resolve({ code, signal })));
  child.stdin.end();
  const exit = await exited;
  assert.deepEqual(exit, { code: 0, signal: null });
  assert.equal((await readJson(run.runDir, 'result.json')).test.status, 'failed');
});
