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
import { prepare, receipt, finalize, derive, inspect } from '../scripts/e2e-t3-lifecycle.mjs';

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
    '-c:v', 'mpeg4', '-pix_fmt', 'yuv420p', '-color_range', 'tv', '-color_primaries', 'bt709',
    '-color_trc', 'bt709', '-colorspace', 'bt709', '-movflags', '+write_colr', '-n', video], { timeout: 30000 });
  videoSize = (await stat(video)).size;
  assert.ok(videoSize > 0);
  assert.equal((await syntheticProbe(video, 'stream=color_range', '-show_streams')).streams[0].color_range, 'tv');
});

const owned = () => ({ available: true, tabId: 'fixture-tab', control: { owner: 'agent', ownedByCaller: true },
  tabs: [{ tabId: 'fixture-tab', owner: 'agent', ownedByCaller: true }] });

function receipts({ testStatus = 'passed', stepOutcome = 'passed', interruption = null,
  signal = null, failedStep = null, missingPost = false, badOwner = false,
  stopFailed = false, stopPath = video, initiallyUnavailable = false } = {}) {
  const status = (n, position, operationId, content = owned()) => ({ kind: 'status', at: time(n), ok: true,
    position, operationId, structuredContent: content });
  const bad = owned();
  if (badOwner) bad.control.ownedByCaller = false;
  const entries = [
    { kind: 'status', at: time(0), ok: true, structuredContent: initiallyUnavailable
      ? { available: false, tabId: null } : { available: true, tabs: [] } },
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

// Each synthetic journal is finalized in a new owner-only run; even rejected
// sequences retain the raw receipt log and any copyable synthetic video.
async function runEntries(entries) {
  const prepared = await prepare({ caseId: 'TC-050-MOCK-REVIEW', evidenceDir: batch, dataKind: 'mock', issue: '50',
    environment: 'synthetic receipt regression; no T3 or browser' });
  for (const entry of entries) await receipt(prepared.runDir, entry);
  const finalized = await finalize(prepared.runDir);
  const journal = (await bytes(prepared.runDir, 'run.log')).toString().trim().split('\n').map(JSON.parse);
  assert.deepEqual(journal, JSON.parse(JSON.stringify(entries)));
  assert.deepEqual(await json(prepared.runDir, 'result.json'), finalized.result);
  return { ...prepared, ...finalized };
}

function assertResultV1(result) {
  assert.ok(result.error === null || typeof result.error === 'string', 'result.error must be string or null');
  assert.equal(result.environment.agentBrowser, null);
  if (result.interruption !== null) {
    assert.equal(typeof result.interruption.reason, 'string');
    assert.ok(Number.isFinite(Date.parse(result.interruption.observedAt)));
  }
}

test('mock lifecycle keeps source, decoded PTS and individual derived frame matches separate', async () => {
  const attempt = await run();
  const result = attempt.result;
  assertResultV1(result);
  assert.equal(result.error, null);
  assert.equal(result.interruption, null);
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
  assert.equal(mapping.mappingStatus, 'partially-verified');
  assert.equal(mapping.verificationError, null);
  assert.ok(mapping.verifiedMapping.length > 0);
  assert.equal(new Set(mapping.verifiedMapping.map((match) => match.pixelMd5)).size, mapping.verifiedMapping.length);
  assert.equal(new Set(mapping.verifiedMapping.map((match) => match.sourceFrame)).size, mapping.verifiedMapping.length);
  assert.equal(new Set(mapping.verifiedMapping.map((match) => match.derivedFrame)).size, mapping.verifiedMapping.length);
  const derivedFrames = await json(attempt.runDir, mapping.derived.readback.frames);
  for (const match of mapping.verifiedMapping) {
    assert.equal(match.sourcePts, frames.frames[match.sourceFrame].pts);
    assert.equal(match.derivedPts, derivedFrames.frames[match.derivedFrame].pts);
    assert.ok(match.sourcePts >= start && match.sourcePts < end);
    assert.ok(Math.abs(match.filterPts - match.derivedPts) <= 0.000001);
    assert.match(match.pixelMd5, /^[a-f0-9]{32}$/);
  }
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

  // This is a synthetic attestation for API testing, not a visual inspection.
  const observation = { stepId: 'click-fixture', verdict: 'confirmed', observer: 'mock-observer',
    inspectedAt: time(13), sourceStartPts: frames.frames[1].pts, sourceEndPts: frames.frames[2].pts,
    note: 'Synthetic observation; no human inspected the video.' };
  await assert.rejects(inspect(attempt.runDir, { ...observation, stepId: 'missing-step' }), /step ID/);
  await assert.rejects(inspect(attempt.runDir, { ...observation, sourceEndPts: end + 1 }), /outside actual source PTS/);
  const inspection = await inspect(attempt.runDir, observation);
  const sidecar = JSON.parse(await readFile(inspection.sidecar, 'utf8'));
  assert.equal(sidecar.stepId, observation.stepId);
  assert.equal(sidecar.source.sha256, sha(source));
  assert.equal(sidecar.rangeCheck, 'passed');
  assert.equal(sidecar.seekable, true);
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
  const retried = await run({ retryOf: failed.runId, initiallyUnavailable: true });
  assert.equal(retried.ok, true);
  assert.notEqual(retried.runId, failed.runId);
  assert.notEqual(retried.runDir, failed.runDir);
  assert.equal(retried.result.retryOf, failed.runId);
  assert.deepEqual(await retained(failed.runDir), original);
  const interrupted = await run({ testStatus: 'failed', interruption: 'SIGTERM', signal: 'SIGTERM' });
  assert.equal(interrupted.ok, false);
  assert.equal(interrupted.result.test.status, 'failed');
  assert.equal(interrupted.result.test.signal, 'SIGTERM');
  assertResultV1(interrupted.result);
  assert.deepEqual(interrupted.result.interruption, { reason: 'SIGTERM', observedAt: time(9) });
  const rawInterruption = (await bytes(interrupted.runDir, 'run.log')).toString().trim().split('\n').map(JSON.parse).find((entry) => entry.kind === 'test');
  assert.equal(rawInterruption.interruption, 'SIGTERM');
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
    assertResultV1(attempt.result);
    assert.equal(typeof attempt.result.error, 'string');
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

test('mock failed tool step retains its identity, recording and synthetic inspection without changing test outcome', async () => {
  for (const status of ['failed', 'passed']) {
    const entries = receipts({ testStatus: status, failedStep: status === 'failed' ? 'click-fixture' : null });
    const step = entries.find((entry) => entry.kind === 'step');
    step.ok = false;
    step.error = 'synthetic preview operation failure';
    delete step.outcome;
    delete step.structuredContent;
    const attempt = await runEntries(entries);
    assert.equal(attempt.ok, false);
    assertResultV1(attempt.result);
    assert.equal(attempt.result.test.status, status);
    assert.equal(attempt.result.recording.targetContinuity, 'passed');
    assert.equal(attempt.result.recording.stop, 'passed');
    assert.equal(attempt.result.recording.save, 'verified');
    assert.equal(attempt.result.recording.readback.status, 'passed');
    assert.deepEqual(attempt.result.steps.map(({ id, status: stepStatus, tool, startedAt, finishedAt }) =>
      ({ id, status: stepStatus, tool, startedAt, finishedAt })), [{ id: 'click-fixture', status: 'failed',
      tool: 'fake-preview-click', startedAt: time(6), finishedAt: time(7) }]);
    assert.equal(sha(await bytes(attempt.runDir, 'recording.mp4')), sha(await readFile(video)));
    if (status === 'failed') {
      assert.equal(attempt.result.test.failedStep, 'click-fixture');
      const original = await retained(attempt.runDir);
      const frames = (await json(attempt.runDir, 'source-frames.json')).frames;
      const observation = { stepId: 'click-fixture', verdict: 'confirmed', observer: 'mock-observer',
        inspectedAt: time(13), sourceStartPts: frames[0].pts, sourceEndPts: frames[1].pts,
        note: 'Synthetic attestation for a failed step; no human inspected the video.' };
      const inspection = await inspect(attempt.runDir, observation);
      const saved = JSON.parse(await readFile(inspection.sidecar, 'utf8'));
      assert.equal(saved.stepId, 'click-fixture');
      assert.equal(saved.testStepStatus, 'failed');
      assert.equal(saved.visualObservation.note, observation.note);
      assert.deepEqual(await retained(attempt.runDir), original);
    }
  }
});

test('mock step and stop require matching unique string operation IDs and both status receipts', async () => {
  for (const kind of ['step', 'stop']) {
    const cases = [
      ['missing pre-status', (entries, index) => entries.splice(index - 1, 1)],
      ['missing pre-status plus null IDs', (entries, index) => {
        entries[index].operationId = null;
        entries[index + 1].operationId = null;
        entries.splice(index - 1, 1);
      }],
      ...[null, undefined, '', 'start-1', 42].map((value) => [
        `invalid or duplicate ID ${String(value)}`,
        (entries, index) => {
          for (const item of entries.slice(index - 1, index + 2)) {
            if (value === undefined) delete item.operationId;
            else item.operationId = value;
          }
        },
      ]),
      ['before ID differs', (entries, index) => { entries[index - 1].operationId = 'different-before'; }],
      ['after ID differs', (entries, index) => { entries[index + 1].operationId = 'different-after'; }],
      ['wrong pre-status position', (entries, index) => { entries[index - 1].position = 'after'; }],
      ['wrong post-status position', (entries, index) => { entries[index + 1].position = 'before'; }],
    ];
    for (const [label, change] of cases) {
      const entries = receipts();
      const index = entries.findIndex((entry) => entry.kind === kind);
      assert.equal(entries[index - 1].position, 'before');
      assert.equal(entries[index + 1].position, 'after');
      change(entries, index);
      const attempt = await runEntries(entries);
      assert.equal(attempt.ok, false, `${kind}: ${label}`);
      assertResultV1(attempt.result);
      assert.equal(attempt.result.test.status, 'passed', `${kind}: ${label}`);
      assert.equal(attempt.result.recording.save, 'verified', `${kind}: ${label}`);
      assert.equal(attempt.result.recording.readback.status, 'passed', `${kind}: ${label}`);
      assert.equal(sha(await bytes(attempt.runDir, 'recording.mp4')), sha(await readFile(video)));
    }
  }
});

// Give each rearranged receipt monotonically increasing times, so an ordering
// failure cannot be explained solely by the separate timestamp-order rule.
function retime(entries) {
  entries.forEach((entry, index) => {
    entry.at = time(index * 2);
    if (entry.kind === 'start') entry.structuredContent.startedAt = entry.at;
    if (entry.kind === 'step') entry.startedAt = time(index * 2 - 1);
  });
  return entries;
}

test('mock passed test receipt is valid only after all steps and before stop begins', async () => {
  const scenarios = [
    ['initial', (entries, testEntry) => entries.unshift(testEntry)],
    ['before start', (entries, testEntry) => entries.splice(entries.findIndex((e) => e.kind === 'status' && e.operationId === 'start-1' && e.position === 'before'), 0, testEntry)],
    ['before step post-status', (entries, testEntry) => entries.splice(entries.findIndex((e) => e.kind === 'status' && e.operationId === 'step-1' && e.position === 'after'), 0, testEntry)],
    ['after stop pre-status', (entries, testEntry) => entries.splice(entries.findIndex((e) => e.kind === 'stop'), 0, testEntry)],
    ['before stop post-status', (entries, testEntry) => entries.splice(entries.findIndex((e) => e.kind === 'stop') + 1, 0, testEntry)],
    ['after stop post-status', (entries, testEntry) => entries.push(testEntry)],
  ];
  for (const [label, place] of scenarios) {
    const entries = receipts();
    const [testEntry] = entries.splice(entries.findIndex((entry) => entry.kind === 'test'), 1);
    place(entries, testEntry);
    const attempt = await runEntries(retime(entries));
    assert.equal(attempt.ok, false, label);
    assertResultV1(attempt.result);
    assert.equal(attempt.result.test.status, 'passed', label);
    assert.equal(attempt.result.recording.save, 'verified', label);
    assert.equal(attempt.result.recording.readback.status, 'passed', label);
  }
  const duplicate = receipts();
  const testIndex = duplicate.findIndex((entry) => entry.kind === 'test');
  duplicate.splice(testIndex + 1, 0, structuredClone(duplicate[testIndex]));
  const duplicateResult = await runEntries(retime(duplicate));
  assert.equal(duplicateResult.ok, false, 'duplicate passed test');
  assertResultV1(duplicateResult.result);
  assert.equal(duplicateResult.result.test.status, 'passed');
  assert.equal(duplicateResult.result.recording.save, 'verified');

  const afterTest = receipts();
  const postTest = afterTest.findIndex((entry) => entry.kind === 'test') + 1;
  const laterStep = structuredClone(afterTest.slice(5, 8));
  for (const entry of laterStep) entry.operationId = 'step-2';
  laterStep[1].stepId = 'second-step';
  afterTest.splice(postTest, 0, ...laterStep);
  const lateStep = await runEntries(retime(afterTest));
  assert.equal(lateStep.ok, false, 'step after passed test');
  assertResultV1(lateStep.result);
  assert.equal(lateStep.result.test.status, 'passed');
  assert.equal(lateStep.result.recording.save, 'verified');

  const normal = await runEntries(receipts());
  assert.equal(normal.ok, true, 'post-step, test, pre-stop order');
  assertResultV1(normal.result);
  assert.equal(normal.result.test.status, 'passed');
  assert.equal(normal.result.interruption, null);
  assert.equal(normal.result.error, null);

  const notRun = await runEntries([
    { kind: 'status', at: time(0), ok: false, error: 'synthetic preflight failure' },
    { kind: 'test', at: time(1), status: 'not-run', exitCode: null, signal: null, interruption: null },
  ]);
  assert.equal(notRun.ok, false);
  assertResultV1(notRun.result);
  assert.equal(notRun.result.test.status, 'not-run');
  assert.equal(notRun.result.interruption, null);
  assert.equal(notRun.result.recording.save, 'not-verified');
});

// Inspect pixel hashes independently of the result sidecar; this is synthetic
// ffmpeg media, not a T3 recording or a visual confirmation.
async function syntheticFrameMd5(args) {
  const output = await exec('ffmpeg', ['-v', 'error', '-xerror', ...args, '-an', '-fps_mode', 'passthrough',
    '-pix_fmt', 'yuv420p', '-f', 'framemd5', '-'], { timeout: 30000 });
  const timebase = /^#tb 0: (\d+)\/(\d+)$/m.exec(output.stdout);
  assert.ok(timebase && Number(timebase[2]) > 0);
  return output.stdout.split('\n').filter((line) => line && !line.startsWith('#')).map((line) => {
    const columns = line.split(',').map((value) => value.trim());
    assert.equal(columns.length, 6);
    assert.match(columns[5], /^[a-f0-9]{32}$/i);
    return { pts: Number(columns[2]) * Number(timebase[1]) / Number(timebase[2]), hash: columns[5].toLowerCase() };
  });
}

test('mock positive source PTS maps a real cut and speed change without normalizing the source', async () => {
  const shifted = path.join(batch, `synthetic-positive-pts-${randomUUID()}.mp4`);
  await exec('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'testsrc=size=96x64:rate=10:duration=2',
    '-c:v', 'mpeg4', '-pix_fmt', 'yuv420p', '-color_range', 'tv', '-color_primaries', 'bt709',
    '-color_trc', 'bt709', '-colorspace', 'bt709', '-movflags', '+write_colr',
    '-output_ts_offset', '5', '-n', shifted], { timeout: 30000 });
  const probed = await exec('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_frames',
    '-show_entries', 'frame=pts_time', '-of', 'json', shifted], { timeout: 30000 });
  assert.equal((await syntheticProbe(shifted, 'stream=color_range', '-show_streams')).streams[0].color_range, 'tv');
  const actualPts = JSON.parse(probed.stdout).frames.map((frame) => Number(frame.pts_time));
  assert.ok(actualPts.length >= 10 && actualPts.every(Number.isFinite));
  assert.ok(actualPts[0] > 0 && actualPts[0] >= 4.9, 'synthetic source must really start near 5 seconds');
  assert.ok(actualPts.at(-1) > actualPts[0] + 1.5);
  const original = await readFile(shifted);
  const entries = receipts({ stopPath: shifted });
  entries.find((entry) => entry.kind === 'stop').structuredContent.sizeBytes = original.length;
  const attempt = await runEntries(entries);
  assert.equal(attempt.ok, true);
  assertResultV1(attempt.result);
  const source = path.join(attempt.runDir, 'recording.mp4');
  const sourceFrames = await json(attempt.runDir, 'source-frames.json');
  assert.deepEqual(sourceFrames.frames.map((frame) => frame.pts), actualPts);
  assert.equal(sourceFrames.sha256, sha(original));
  assert.equal(sha(await readFile(source)), sha(original));
  const preserved = await retained(attempt.runDir);
  const start = actualPts[0] + 0.2;
  const end = actualPts[0] + 1.2;
  const edit = { segments: [{ start, end, speed: 2 }], freezeSeconds: 0.3, outputFps: 10 };
  const result = await derive(attempt.runDir, edit);
  assert.equal(result.status, 'generated', result.error);
  const mapping = JSON.parse(await readFile(result.sidecar, 'utf8'));
  assert.equal(mapping.source.sha256, sha(original));
  assert.equal(mapping.mappingStatus, 'partially-verified');
  assert.equal(mapping.verificationError, null);
  assert.ok(mapping.verifiedMapping.length > 0);
  const derivedFile = path.join(attempt.runDir, mapping.derived.file);
  const derivedFrames = await json(attempt.runDir, mapping.derived.readback.frames);
  assert.equal(mapping.derived.sha256, sha(await readFile(derivedFile)));
  assert.equal(mapping.derived.readback.status, 'passed');
  assert.equal(mapping.visualInspection, 'unverified');

  const normalize = 'scale=in_range=tv:out_range=tv,format=yuv420p';
  const segmentDuration = (end - start) / 2;
  const graph = `[0:v]${normalize},trim=start=${start}:end=${end},setpts=(PTS-STARTPTS)/2,` +
    `fps=fps=10:eof_action=pass,trim=duration=${segmentDuration},setpts=PTS-STARTPTS[s0];` +
    '[s0]concat=n=1:v=1:a=0,tpad=stop_mode=clone:stop_duration=0.3,' +
    `fps=fps=10:eof_action=pass,trim=duration=${segmentDuration + 0.3},setpts=PTS-STARTPTS,format=yuv420p[out]`;
  // These are explicitly normalized pixels, not a claim about raw source bytes.
  const sourcePixels = await syntheticFrameMd5(['-copyts', '-i', source, '-map', '0:v:0', '-vf', normalize]);
  const filteredPixels = await syntheticFrameMd5(['-copyts', '-i', source, '-filter_complex', graph, '-map', '[out]']);
  const derivedPixels = await syntheticFrameMd5(['-copyts', '-i', derivedFile, '-map', '0:v:0']);
  assert.ok(filteredPixels.length > 0, 'the positive-PTS cut must not be empty');
  assert.equal(filteredPixels.length, derivedPixels.length);
  assert.equal(derivedPixels.length, derivedFrames.frames.length);
  for (let index = 0; index < filteredPixels.length; index++) {
    assert.equal(filteredPixels[index].hash, derivedPixels[index].hash);
    assert.ok(Math.abs(filteredPixels[index].pts - derivedFrames.frames[index].pts) <= 0.000001);
  }
  const filterCounts = new Map();
  const sourceCounts = new Map();
  for (const frame of sourcePixels) sourceCounts.set(frame.hash, (sourceCounts.get(frame.hash) || 0) + 1);
  for (const frame of filteredPixels) filterCounts.set(frame.hash, (filterCounts.get(frame.hash) || 0) + 1);
  assert.ok([...filterCounts.values()].some((count) => count > 1), 'freeze must produce repeated frames');
  for (const match of mapping.verifiedMapping) {
    assert.ok(match.sourcePts >= start && match.sourcePts < end);
    assert.equal(match.sourcePts, actualPts[match.sourceFrame]);
    assert.equal(match.derivedPts, derivedFrames.frames[match.derivedFrame].pts);
    assert.equal(match.pixelMd5, sourcePixels[match.sourceFrame].hash);
    assert.equal(match.pixelMd5, filteredPixels[match.filterFrame].hash);
    assert.equal(match.pixelMd5, derivedPixels[match.derivedFrame].hash);
    assert.equal(sourceCounts.get(match.pixelMd5), 1, 'repeated source frames cannot be individually verified');
    assert.equal(filterCounts.get(match.pixelMd5), 1, 'repeated freeze frames cannot be individually verified');
    assert.ok(Math.abs(match.filterPts - filteredPixels[match.filterFrame].pts) <= 0.000001);
    assert.ok(Math.abs(match.filterPts - match.derivedPts) <= 0.000001);
  }
  assert.deepEqual(await readFile(shifted), original);
  assert.deepEqual(await retained(attempt.runDir), preserved);
});

// ffprobe results below come only from synthetic videos created in the private
// batch. This helper does not inspect a browser recording.
async function syntheticProbe(file, entries, show) {
  const output = await exec('ffprobe', ['-v', 'error', '-select_streams', 'v:0', show,
    '-show_entries', entries, '-of', 'json', file], { timeout: 30000 });
  return JSON.parse(output.stdout);
}

async function syntheticDecodeAll(file) {
  await exec('ffmpeg', ['-v', 'error', '-xerror', '-i', file, '-map', '0:v:0', '-f', 'null', '-'], { timeout: 30000 });
}

test('mock full-range sparse VFR cut bounds the derived duration and preserves source PTS', async () => {
  const input = path.join(batch, `synthetic-full-range-vfr-${randomUUID()}.mp4`);
  // N=0..18 occupy about 0.6 s; N=19..20 follow after a 30 s gap.
  // The cut's last retained packet therefore spans the gap. Nothing is captured
  // from T3 and no real recording is copied into the repository.
  const pts = "setpts='if(lt(N,19),N/(30*TB),(30+(N-19)/30)/TB)'";
  await exec('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'testsrc=size=96x64:rate=30:duration=0.7',
    '-vf', pts, '-frames:v', '21', '-c:v', 'libx264', '-preset', 'ultrafast', '-qp', '0', '-bf', '0',
    '-pix_fmt', 'yuvj420p', '-color_range', 'pc', '-enc_time_base', '1:30000', '-fps_mode', 'passthrough',
    '-video_track_timescale', '30000', '-output_ts_offset', '5', '-n', input], { timeout: 30000 });
  const sourceInfo = await syntheticProbe(input, 'stream=codec_name,pix_fmt,color_range', '-show_streams');
  const inputStream = sourceInfo.streams[0];
  assert.equal(inputStream.codec_name, 'h264');
  assert.equal(inputStream.pix_fmt, 'yuvj420p');
  assert.equal(inputStream.color_range, 'pc', 'fixture must actually be full range');
  const sourceProbe = await syntheticProbe(input, 'frame=pts_time', '-show_frames');
  const sourcePts = sourceProbe.frames.map((frame) => Number(frame.pts_time));
  assert.equal(sourcePts.length, 21);
  assert.ok(sourcePts.every(Number.isFinite));
  assert.ok(sourcePts[0] > 0, 'source must retain a positive PTS');
  const gaps = sourcePts.slice(1).map((value, index) => value - sourcePts[index]);
  assert.ok(gaps.every((gap) => gap > 0));
  assert.ok(Math.max(...gaps) > 20, 'fixture must have a long VFR gap');
  const start = sourcePts[0] + 0.001;
  const end = start + 0.6;
  const selected = sourcePts.filter((value) => value >= start && value < end);
  assert.ok(selected.length >= 10 && selected.length < sourcePts.length);
  const sourcePacketData = await syntheticProbe(input, 'packet=pts_time,duration_time', '-show_packets');
  const selectedPackets = sourcePacketData.packets.map((packet) => ({ pts: Number(packet.pts_time), duration: Number(packet.duration_time) }))
    .filter((packet) => packet.pts >= start && packet.pts < end);
  assert.ok(selectedPackets.length > 0);
  const lastSelectedPacket = selectedPackets.at(-1);
  assert.ok(Math.abs(lastSelectedPacket.pts - selected.at(-1)) < 0.00001);
  assert.ok(lastSelectedPacket.duration > 10, 'cut must contain a terminal packet spanning the long gap');
  await syntheticDecodeAll(input);

  const original = await readFile(input);
  const entries = receipts({ stopPath: input });
  entries.find((entry) => entry.kind === 'stop').structuredContent.sizeBytes = original.length;
  const attempt = await runEntries(entries);
  assert.equal(attempt.ok, true);
  assertResultV1(attempt.result);
  const source = path.join(attempt.runDir, 'recording.mp4');
  const frames = await json(attempt.runDir, 'source-frames.json');
  assert.deepEqual(frames.frames.map((frame) => frame.pts), sourcePts);
  assert.equal(frames.sha256, sha(original));
  assert.equal(attempt.result.recording.readback.sha256, sha(original));
  assert.equal(sha(await readFile(source)), sha(original));
  assert.equal(attempt.result.recording.readback.status, 'passed');
  const preserved = await retained(attempt.runDir);
  const edit = { segments: [{ start, end, speed: 2 }], freezeSeconds: 0.5, outputFps: 30 };
  const output = await derive(attempt.runDir, edit);
  assert.equal(output.status, 'generated', output.error);
  const mapping = JSON.parse(await readFile(output.sidecar, 'utf8'));
  assert.equal(mapping.status, 'generated');
  assert.equal(mapping.source.sha256, sha(original));
  assert.equal(mapping.colorNormalization.sourcePixelFormat, 'yuvj420p');
  assert.equal(mapping.colorNormalization.sourceColorRange, 'pc');
  assert.equal(mapping.colorNormalization.inputRange, 'pc');
  assert.match(mapping.colorNormalization.rangeBasis, /yuvj/);
  assert.equal(mapping.colorNormalization.outputPixelFormat, 'yuv420p');
  assert.equal(mapping.colorNormalization.outputColorRange, 'tv');
  assert.equal(mapping.timeline.durationCheck, 'passed');
  assert.deepEqual(mapping.timeline.verifiedBoundaries, []);
  assert.equal(mapping.visualInspection, 'unverified');
  assert.equal(attempt.result.steps[0].frameMapping.seekable, false);

  const derivedFile = path.join(attempt.runDir, mapping.derived.file);
  const derivedStream = (await syntheticProbe(derivedFile, 'stream=pix_fmt,color_range', '-show_streams')).streams[0];
  assert.equal(derivedStream.pix_fmt, 'yuv420p');
  assert.equal(derivedStream.color_range, 'tv');
  const derivedBytes = await readFile(derivedFile);
  assert.notEqual(mapping.derived.file, 'recording.mp4');
  assert.equal(mapping.derived.sha256, sha(derivedBytes));
  assert.equal(mapping.derived.readback.sha256, sha(derivedBytes));
  assert.equal(mapping.derived.readback.status, 'passed');
  await syntheticDecodeAll(source);
  await syntheticDecodeAll(derivedFile);
  const derivedProbe = await syntheticProbe(derivedFile, 'frame=pts_time', '-show_frames');
  const derivedPts = derivedProbe.frames.map((frame) => Number(frame.pts_time));
  const derivedFrames = await json(attempt.runDir, mapping.derived.readback.frames);
  assert.ok(derivedPts.length > 0 && derivedPts.every(Number.isFinite));
  assert.deepEqual(derivedFrames.frames.map((frame) => frame.pts), derivedPts);
  assert.equal(derivedFrames.sha256, sha(derivedBytes));
  assert.ok(derivedPts.every((value, index) => !index || value >= derivedPts[index - 1]));
  const durationProbe = await syntheticProbe(derivedFile, 'format=duration', '-show_format');
  const actualDuration = Number(durationProbe.format.duration);
  const plannedDuration = (end - start) / 2 + edit.freezeSeconds;
  // One fps rounding allowance per segment plus two output boundaries.
  const fpsTolerance = (edit.segments.length + 2) / edit.outputFps;
  assert.ok(Number.isFinite(actualDuration));
  assert.ok(Math.abs(actualDuration - plannedDuration) <= fpsTolerance,
    `derived duration ${actualDuration} is outside ${plannedDuration} ± ${fpsTolerance}`);
  assert.equal(mapping.timeline.plannedDuration, plannedDuration);
  assert.equal(mapping.timeline.tolerance, fpsTolerance);
  assert.equal(mapping.timeline.observed.duration, actualDuration);
  const derivedPackets = (await syntheticProbe(derivedFile, 'packet=pts_time,duration_time', '-show_packets')).packets;
  assert.ok(derivedPackets.length > 0);
  assert.ok(derivedPackets.every((packet) => Number.isFinite(Number(packet.duration_time)) &&
    Number(packet.duration_time) > 0 && Number(packet.duration_time) <= 2 / edit.outputFps),
  'the long source packet must not become a long output packet');

  // Match membership is checked against actual frame indices and PTS. Range
  // conversion means a normalized MD5 must never be described as raw-pixel equality.
  assert.ok(Array.isArray(mapping.verifiedMapping));
  assert.equal(mapping.mappingStatus, 'partially-verified');
  assert.equal(mapping.verificationError, null);
  assert.ok(mapping.verifiedMapping.length > 0);
  assert.equal(new Set(mapping.verifiedMapping.map((match) => match.sourceFrame)).size, mapping.verifiedMapping.length);
  assert.equal(new Set(mapping.verifiedMapping.map((match) => match.derivedFrame)).size, mapping.verifiedMapping.length);
  const normalizedSource = await syntheticFrameMd5(['-copyts', '-i', source, '-map', '0:v:0',
    '-vf', 'scale=in_range=pc:out_range=tv,format=yuv420p']);
  const outputPixels = await syntheticFrameMd5(['-i', derivedFile, '-map', '0:v:0']);
  const sourceCounts = new Map();
  for (const frame of normalizedSource) sourceCounts.set(frame.hash, (sourceCounts.get(frame.hash) || 0) + 1);
  const outputCounts = new Map();
  for (const frame of outputPixels) outputCounts.set(frame.hash, (outputCounts.get(frame.hash) || 0) + 1);
  assert.equal(outputPixels.length, derivedPts.length);
  assert.ok([...outputCounts.values()].some((count) => count > 1), 'freeze must yield repeated output pixels');
  for (const match of mapping.verifiedMapping) {
    assert.ok(match.sourcePts >= start && match.sourcePts < end);
    assert.equal(match.sourcePts, sourcePts[match.sourceFrame]);
    assert.equal(match.derivedPts, derivedPts[match.derivedFrame]);
    assert.ok(Math.abs(match.filterPts - match.derivedPts) <= 0.000001);
    assert.match(match.pixelMd5, /^[a-f0-9]{32}$/);
    assert.equal(match.pixelMd5, normalizedSource[match.sourceFrame].hash);
    assert.equal(match.pixelMd5, outputPixels[match.derivedFrame].hash);
    assert.equal(sourceCounts.get(match.pixelMd5), 1, 'ambiguous source pixels remain unverified');
    assert.equal(outputCounts.get(outputPixels[match.derivedFrame].hash), 1, 'freeze duplicates remain unverified');
  }
  assert.deepEqual(await readFile(input), original);
  assert.deepEqual(await retained(attempt.runDir), preserved);
});

test('mock source with unknown range can render but cannot verify source frame correspondence', async () => {
  const input = path.join(batch, `synthetic-unknown-range-${randomUUID()}.mp4`);
  await exec('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'testsrc=size=96x64:rate=10:duration=2',
    '-c:v', 'mpeg4', '-pix_fmt', 'yuv420p', '-color_range', 'unknown', '-n', input], { timeout: 30000 });
  const stream = (await syntheticProbe(input, 'stream=pix_fmt,color_range', '-show_streams')).streams[0];
  assert.equal(stream.pix_fmt, 'yuv420p');
  assert.ok(!stream.color_range || stream.color_range === 'unknown', 'fixture must have an unknown range');
  const original = await readFile(input);
  const entries = receipts({ stopPath: input });
  entries.find((entry) => entry.kind === 'stop').structuredContent.sizeBytes = original.length;
  const attempt = await runEntries(entries);
  assert.equal(attempt.ok, true);
  const preserved = await retained(attempt.runDir);
  const frames = (await json(attempt.runDir, 'source-frames.json')).frames;
  const start = frames[1].pts;
  const end = frames.at(-2).pts;
  const output = await derive(attempt.runDir, { segments: [{ start, end, speed: 2 }], freezeSeconds: 0, outputFps: 10 });
  assert.equal(output.status, 'generated', output.error);
  const mapping = JSON.parse(await readFile(output.sidecar, 'utf8'));
  assert.equal(mapping.colorNormalization.sourcePixelFormat, 'yuv420p');
  assert.ok(mapping.colorNormalization.sourceColorRange === null || mapping.colorNormalization.sourceColorRange === 'unknown');
  assert.equal(mapping.colorNormalization.inputRange, 'tv');
  assert.match(mapping.colorNormalization.rangeBasis, /assumed.*unverified/);
  assert.equal(mapping.timeline.durationCheck, 'passed');
  assert.equal(mapping.mappingStatus, 'unverified');
  assert.deepEqual(mapping.verifiedMapping, []);
  assert.match(mapping.verificationError, /range unknown/i);
  const derivedFile = path.join(attempt.runDir, mapping.derived.file);
  const derivedStream = (await syntheticProbe(derivedFile, 'stream=pix_fmt,color_range', '-show_streams')).streams[0];
  assert.equal(derivedStream.pix_fmt, 'yuv420p');
  assert.equal(derivedStream.color_range, 'tv');
  assert.deepEqual(mapping.timeline.verifiedBoundaries, []);
  assert.equal(mapping.visualInspection, 'unverified');
  assert.deepEqual(await readFile(input), original);
  assert.deepEqual(await retained(attempt.runDir), preserved);
});
