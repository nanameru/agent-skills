// Synthetic Node/ffmpeg integration tests. Receipts, tab IDs and videos are
// fixtures: this does not call T3 tools, operate a browser or record an E2E run.
// TB_FAKE_TEST_DIR must be an existing owner-only directory outside the checkout.
// The UUID batch, including every failed attempt, is retained without cleanup.
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { chmod, mkdir, readFile, realpath, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { prepare, receipt, finalize, derive } from '../scripts/e2e-t3-lifecycle.mjs';

const exec = promisify(execFile);
const here = path.dirname(fileURLToPath(import.meta.url));
const checkout = path.resolve(here, '../..');
const cli = path.join(checkout, 'test-case-board/scripts/e2e-t3-cli.mjs');
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const bytes = (dir, name) => readFile(path.join(dir, name));
const json = async (dir, name) => JSON.parse(await bytes(dir, name));
const time = (n) => new Date(Date.UTC(2026, 10, 14, 0, 0, n)).toISOString();
let batch, video, videoSize;

before(async () => {
  const requested = process.env.TB_FAKE_TEST_DIR;
  assert.ok(requested && path.isAbsolute(requested), 'TB_FAKE_TEST_DIR must name an existing absolute private directory');
  assert.equal(typeof process.getuid, 'function', 'owner verification is required');
  const root = await realpath(requested);
  const rootStat = await stat(root);
  assert.ok(rootStat.isDirectory() && !(rootStat.mode & 0o077) && rootStat.uid === process.getuid(), 'test root must be owner-only');
  const repo = await realpath(checkout);
  assert.ok(root !== repo && !root.startsWith(repo + path.sep), 'test root must be outside the checkout');
  assert.equal(await realpath(process.cwd()), repo, 'run the test from the checkout root');
  process.umask(0o077);
  batch = path.join(root, `t3-lifecycle-${randomUUID()}`);
  await mkdir(batch, { mode: 0o700 });
  video = path.join(batch, 'synthetic-input.mp4');
  // Generated locally for media parsing only; it is not a captured browser video.
  await exec('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'testsrc=size=96x64:rate=10:duration=2',
    '-c:v', 'mpeg4', '-pix_fmt', 'yuv420p', '-n', video], { timeout: 30000 });
  videoSize = (await stat(video)).size;
  assert.ok(videoSize > 0);
});

const owned = () => ({ available: true, tabId: 'fixture-tab', control: { owner: 'agent', ownedByCaller: true },
  tabs: [{ tabId: 'fixture-tab', owner: 'agent', ownedByCaller: true }] });

function receipts({ testStatus = 'passed', stepOutcome = 'passed', interruption = null,
  signal = null, failedStep = null, missingPost = false, badOwner = false,
  stopFailed = false, stopPath = video } = {}) {
  const status = (n, position, operationId, content = owned()) => ({ kind: 'status', at: time(n), ok: true,
    position, operationId, structuredContent: content });
  const bad = owned();
  if (badOwner) bad.control.ownedByCaller = false;
  const entries = [
    { kind: 'status', at: time(0), ok: true, structuredContent: { available: true, tabs: [] } },
    { kind: 'open', at: time(1), ok: true, arguments: { reuseExistingTab: false }, structuredContent: owned() },
    status(2, 'before', 'start-1'),
    { kind: 'start', at: time(3), ok: true, operationId: 'start-1',
      structuredContent: { tabId: 'fixture-tab', recording: true, startedAt: time(3) } },
    status(4, 'after', 'start-1'),
    status(5, 'before', 'step-1', bad),
    { kind: 'step', at: time(7), ok: true, operationId: 'step-1', stepId: 'click-fixture',
      tool: 'fake-preview-click', startedAt: time(6), outcome: stepOutcome, structuredContent: {} },
  ];
  if (!missingPost) entries.push(status(8, 'after', 'step-1'));
  entries.push({ kind: 'test', at: time(9), status: testStatus, exitCode: signal ? null : testStatus === 'passed' ? 0 : 1,
    signal, interruption, failedStep });
  entries.push(status(10, 'before', 'stop-1'));
  if (stopFailed) entries.push({ kind: 'stop', at: time(11), ok: false, error: 'synthetic stop failure' });
  else {
    entries.push({ kind: 'stop', at: time(11), ok: true, operationId: 'stop-1',
      structuredContent: { tabId: 'fixture-tab', mimeType: 'video/mp4', path: stopPath, sizeBytes: videoSize } });
    entries.push(status(12, 'after', 'stop-1'));
  }
  return entries;
}

async function run({ retryOf = null, ...scenario } = {}) {
  const prepared = await prepare({ caseId: 'TC-050-MOCK', evidenceDir: batch, dataKind: 'mock', issue: '50',
    environment: 'synthetic Node test; no T3 or browser', retryOf });
  for (const entry of receipts(scenario)) await receipt(prepared.runDir, entry);
  return { ...prepared, ...(await finalize(prepared.runDir)) };
}

async function retained(dir) {
  return Object.fromEntries(await Promise.all(['result.json', 'run.log', 'recording.mp4', 'source-frames.json']
    .map(async (name) => [name, sha(await bytes(dir, name))])));
}

test('mock lifecycle keeps source, decoded PTS and an unverified derived mapping separate', async () => {
  const attempt = await run();
  const result = attempt.result;
  assert.equal(attempt.ok, true);
  assert.equal(result.schema, 'test-board-e2e-result-v1');
  assert.equal(result.runId, attempt.runId);
  assert.equal(result.dataKind, 'mock');
  assert.equal(result.test.status, 'passed');
  assert.equal(result.recording.targetContinuity, 'passed');
  assert.equal(result.recording.save, 'verified');
  assert.equal(result.recording.readback.status, 'passed');
  assert.equal(result.recording.readback.visualInspection, 'unverified');
  assert.equal(result.steps[0].frameMapping.seekable, false);
  const source = await bytes(attempt.runDir, 'recording.mp4');
  assert.equal(sha(source), sha(await readFile(video)));
  assert.equal(sha(source), result.recording.readback.sha256);
  const frames = await json(attempt.runDir, 'source-frames.json');
  assert.equal(frames.sha256, sha(source));
  assert.equal(frames.frames.length, result.recording.readback.decodedFrames);
  assert.ok(frames.frames.length >= 5);
  frames.frames.forEach((frame, index) => {
    assert.equal(frame.index, index);
    assert.ok(Number.isFinite(frame.pts));
    if (index) assert.ok(frame.pts >= frames.frames[index - 1].pts);
  });
  const preserved = await retained(attempt.runDir);
  const start = (frames.frames[0].pts + frames.frames[1].pts) / 2;
  const end = frames.frames.at(-1).pts;
  const selected = frames.frames.filter((frame) => frame.pts >= start && frame.pts < end);
  assert.ok(selected.length >= 2);
  const edit = { segments: [{ start, end, speed: 2 }], freezeSeconds: 0.3, outputFps: 12 };
  const derived = await derive(attempt.runDir, edit);
  assert.equal(derived.status, 'generated', derived.error);
  const mapping = JSON.parse(await readFile(derived.sidecar, 'utf8'));
  assert.equal(mapping.schema, 'test-board-t3-derived-v1');
  assert.deepEqual(mapping.edit, edit);
  assert.equal(mapping.source.sha256, sha(source));
  assert.equal(mapping.plannedMapping[0].firstRetainedSourcePts, selected[0].pts);
  assert.equal(mapping.plannedMapping[0].lastRetainedSourcePts, selected.at(-1).pts);
  assert.equal(mapping.mappingStatus, 'unverified');
  assert.deepEqual(mapping.verifiedMapping, []);
  assert.equal(mapping.visualInspection, 'unverified');
  assert.equal(mapping.derived.readback.status, 'passed');
  assert.equal(mapping.derived.sha256, sha(await bytes(attempt.runDir, mapping.derived.file)));
  assert.notEqual(mapping.derived.file, 'recording.mp4');
  assert.deepEqual(await retained(attempt.runDir), preserved);

  const invalidEdits = [
    { segments: [], freezeSeconds: 0, outputFps: 10 },
    { segments: [{ start: -1, end, speed: 1 }], freezeSeconds: 0, outputFps: 10 },
    { segments: [{ start, end: frames.frames.at(-1).pts + 1, speed: 1 }], freezeSeconds: 0, outputFps: 10 },
    { segments: [{ start: frames.frames[0].pts, end: start, speed: 1 }], freezeSeconds: 0, outputFps: 10 },
    { segments: [{ start, end, speed: 0 }], freezeSeconds: 0, outputFps: 10 },
    { segments: [{ start, end, speed: 1 }], freezeSeconds: 61, outputFps: 10 },
    { segments: [{ start, end, speed: 1 }], freezeSeconds: 0, outputFps: 0 },
  ];
  for (const invalid of invalidEdits) await assert.rejects(derive(attempt.runDir, invalid), /invalid|fewer than two/);
  assert.deepEqual(await retained(attempt.runDir), preserved);
});

test('mock failure and interruption remain failed while retry uses a distinct preserved run', async () => {
  const failed = await run({ testStatus: 'failed', stepOutcome: 'failed', failedStep: 'click-fixture' });
  assert.equal(failed.ok, false);
  assert.equal(failed.result.test.status, 'failed');
  assert.equal(failed.result.test.failedStep, 'click-fixture');
  assert.equal(failed.result.recording.save, 'verified');
  assert.equal(failed.result.recording.readback.status, 'passed');
  const original = await retained(failed.runDir);
  const retried = await run({ retryOf: failed.runId });
  assert.equal(retried.ok, true);
  assert.notEqual(retried.runId, failed.runId);
  assert.notEqual(retried.runDir, failed.runDir);
  assert.equal(retried.result.retryOf, failed.runId);
  assert.deepEqual(await retained(failed.runDir), original);
  const interrupted = await run({ testStatus: 'failed', interruption: 'SIGTERM', signal: 'SIGTERM' });
  assert.equal(interrupted.ok, false);
  assert.equal(interrupted.result.test.status, 'failed');
  assert.equal(interrupted.result.test.signal, 'SIGTERM');
  assert.equal(interrupted.result.interruption, 'SIGTERM');
  assert.equal(interrupted.result.recording.stop, 'passed');
  assert.equal(interrupted.result.recording.readback.status, 'passed');
  assert.deepEqual(await retained(failed.runDir), original);
});

test('mock missing receipt, lost ownership and failed recording never become a passing run', async () => {
  for (const scenario of [{ missingPost: true }, { badOwner: true }]) {
    const attempt = await run(scenario);
    assert.equal(attempt.ok, false);
    assert.equal(attempt.result.test.status, 'passed');
    assert.equal(attempt.result.recording.targetContinuity, 'failed');
    assert.ok(attempt.result.error.length > 0);
  }
  const noStop = await run({ stopFailed: true });
  assert.equal(noStop.ok, false);
  assert.equal(noStop.result.test.status, 'passed');
  assert.equal(noStop.result.recording.stop, 'failed');
  assert.equal(noStop.result.recording.save, 'not-verified');
  assert.equal(noStop.result.recording.readback.status, 'not-attempted');
  const missingMedia = await run({ stopPath: path.join(batch, 'missing-synthetic.mp4') });
  assert.equal(missingMedia.ok, false);
  assert.equal(missingMedia.result.test.status, 'passed');
  assert.equal(missingMedia.result.recording.stop, 'passed');
  assert.equal(missingMedia.result.recording.save, 'not-verified');
  assert.equal(missingMedia.result.recording.readback.status, 'failed');
});

test('private roots, unknown CLI options and exclusive outputs are enforced for mock runs', async () => {
  const publicMode = path.join(batch, `nonprivate-${randomUUID()}`);
  await mkdir(publicMode, { mode: 0o700 });
  // The parent batch remains owner-only; this child tests rejection of its mode.
  await chmod(publicMode, 0o755);
  await assert.rejects(prepare({ caseId: 'TC-050-MOCK', evidenceDir: publicMode, dataKind: 'mock' }), /private|owner-only/);
  await assert.rejects(prepare({ caseId: 'TC-050-MOCK', evidenceDir: checkout, dataKind: 'mock' }), /private|outside|owner-only/);
  await assert.rejects(prepare({ caseId: 'TC-050-MOCK', evidenceDir: path.join(batch, 'missing-root'), dataKind: 'mock' }), /ENOENT/);
  await assert.rejects(exec(process.execPath, [cli, 'prepare', '--case', 'TC-050-MOCK', '--evidence-dir', batch,
    '--data-kind', 'mock', '--unknown', 'value']), (error) => error.code === 1 && /unknown phase or option/.test(error.stderr));

  const attempt = await prepare({ caseId: 'TC-050-EXCLUSIVE', evidenceDir: batch, dataKind: 'mock' });
  for (const entry of receipts()) await receipt(attempt.runDir, entry);
  const sentinel = Buffer.from('preexisting synthetic file must remain unchanged\n');
  await writeFile(path.join(attempt.runDir, 'recording.mp4'), sentinel, { flag: 'wx', mode: 0o600 });
  const finalized = await finalize(attempt.runDir);
  assert.equal(finalized.ok, false);
  assert.equal(finalized.result.test.status, 'passed');
  assert.equal(finalized.result.recording.save, 'not-verified');
  assert.equal(finalized.result.recording.readback.status, 'failed');
  assert.deepEqual(await bytes(attempt.runDir, 'recording.mp4'), sentinel);
  const resultBefore = await bytes(attempt.runDir, 'result.json');
  const logBefore = await bytes(attempt.runDir, 'run.log');
  await assert.rejects(finalize(attempt.runDir), /already finalized/);
  await assert.rejects(receipt(attempt.runDir, receipts()[0]), /already finalized/);
  assert.deepEqual(await bytes(attempt.runDir, 'result.json'), resultBefore);
  assert.deepEqual(await bytes(attempt.runDir, 'run.log'), logBefore);
});
