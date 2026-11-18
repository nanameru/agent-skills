#!/usr/bin/env node
// Opt-in REAL browser E2E driver. Every attempt goes through test-board e2e.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { appendFile, lstat, mkdir, readFile, realpath, stat, writeFile } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const entry = path.join(repo, 'test-case-board/bin/test-board');
const runner = path.join(here, 'runner.mjs');
const usage = `Usage: node test-case-board/tests/e2e-fixture/driver.mjs --scenario success|assertion|sigint|sigterm|timeout|retry|all
Requires TB_EVIDENCE_DIR, TB_BROWSER, AGENT_BROWSER_EXECUTABLE_PATH and PATH containing ffmpeg/ffprobe.
Each attempt uses the real test-board e2e entrypoint and retains private evidence; visual inspection remains separate.\n`;
if (process.argv.includes('--help')) { process.stdout.write(usage); process.exit(0); }
const args = process.argv.slice(2);
assert.equal(args.length, 2, usage);
assert.equal(args[0], '--scenario', usage);
const selection = args[1];
assert.ok(['success', 'assertion', 'sigint', 'sigterm', 'timeout', 'retry', 'all'].includes(selection), usage);
assert.ok(process.env.TB_EVIDENCE_DIR && process.env.TB_BROWSER && process.env.AGENT_BROWSER_EXECUTABLE_PATH, usage);
const evidence = await realpath(process.env.TB_EVIDENCE_DIR);
const rootInfo = await stat(evidence);
assert.ok(rootInfo.isDirectory() && !(rootInfo.mode & 0o077) && (typeof process.getuid !== 'function' || rootInfo.uid === process.getuid()), 'evidence root must already be owner-only');
const realRepo = await realpath(repo);
assert.ok(evidence !== realRepo && !evidence.startsWith(realRepo + path.sep), 'evidence must be outside checkout');
const suite = path.join(evidence, `fixture-46-${randomUUID()}`);
await mkdir(suite, { mode: 0o700 });
const runs = path.join(suite, 'runs');
await mkdir(runs, { mode: 0o700 });
const eventsFile = path.join(suite, 'server-events.jsonl');
await writeFile(eventsFile, '', { flag: 'wx', mode: 0o600 });
const html = await readFile(path.join(here, 'index.html'));
let eventWrites = Promise.resolve();
let active = null;
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  const attempt = url.searchParams.get('attempt');
  const recognized = url.pathname === '/' || url.pathname === '/clicked' || url.pathname === '/pending';
  if (!recognized || !active || attempt !== active.id) { res.writeHead(404).end(); return; }
  eventWrites = eventWrites.then(() => appendFile(eventsFile, JSON.stringify({ at: new Date().toISOString(), attempt, event: url.pathname }) + '\n'));
  if (url.pathname === '/') res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }).end(html);
  else res.writeHead(204, { 'cache-control': 'no-store' }).end();
  if (url.pathname === '/pending') {
    active.pendingSeen = true;
    if (active.signal && !active.signalSent) {
      // /pending is requested inside the named step, which the worker cannot enter
      // until the entrypoint has successfully started recording and released it.
      active.signalSent = active.child.kill(active.signal);
    }
  }
});
await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
const hash = async (file) => createHash('sha256').update(await readFile(file)).digest('hex');
const preserved = [];
const kinds = selection === 'all' ? ['success', 'assertion', 'sigint', 'sigterm', 'timeout', 'assertion', 'success'] :
  selection === 'retry' ? ['assertion', 'success'] : [selection];
try {
  for (const [index, kind] of kinds.entries()) {
    const attempt = randomUUID();
    const attemptDir = path.join(suite, `driver-${attempt}`);
    await mkdir(attemptDir, { mode: 0o700 });
    const caseId = selection === 'retry' || (selection === 'all' && index >= 5) ? 'TC-046-RETRY' :
      ['sigint', 'sigterm', 'timeout'].includes(kind) ? 'TC-046-INTERRUPT' : 'TC-046-E2E';
    const signal = kind === 'sigint' ? 'SIGINT' : kind === 'sigterm' ? 'SIGTERM' : null;
    const fixtureURL = `http://127.0.0.1:${server.address().port}/?attempt=${attempt}`;
    const cliArgs = ['e2e', '--case', caseId, '--runner', runner, '--browser', path.resolve(process.env.TB_BROWSER),
      '--evidence-dir', runs, '--data-kind', 'fixture', '--issue', '46', '--environment', process.env.TB_E2E_ENVIRONMENT || 'local fixture / unspecified harness',
      '--timeout-ms', kind === 'timeout' ? (process.env.TB_TIMEOUT_MS || '45000') : (process.env.TB_TIMEOUT_MS || '120000')];
    const names = ['PATH', 'HOME', 'USER', 'TMPDIR', 'TMP', 'TEMP', 'LANG', 'LC_ALL', 'TZ', 'SYSTEMROOT', 'WINDIR', 'AGENT_BROWSER_EXECUTABLE_PATH'];
    const env = Object.fromEntries(names.filter((name) => process.env[name] !== undefined).map((name) => [name, process.env[name]]));
    Object.assign(env, { TB_FIXTURE_URL: fixtureURL, TB_FIXTURE_SCENARIO: kind });
    const child = spawn(entry, cliArgs, { cwd: repo, env, stdio: ['ignore', 'pipe', 'pipe'] });
    active = { id: attempt, child, signal, signalSent: false, pendingSeen: false };
    let stdout = '', stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    const exit = await new Promise((resolve) => { child.once('error', (error) => resolve({ code: null, signal: null, error: error.message })); child.once('close', (code, sig) => resolve({ code, signal: sig })); });
    await eventWrites;
    const facts = { index, kind, attempt, exit, pendingSeen: active.pendingSeen, signalSent: active.signalSent, requestedSignal: signal, stdout, stderr };
    await writeFile(path.join(attemptDir, 'driver.json'), JSON.stringify(facts, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    active = null;
    // Compare prior bytes even when the current attempt itself fails verification.
    for (const old of preserved) for (const [file, expected] of old.files) assert.equal(await hash(file), expected, `previous evidence changed: ${file}`);
    assert.equal(exit.signal, null, 'entrypoint must handle signals, not exit directly from one');
    assert.equal(exit.code, kind === 'success' ? 0 : 1, `unexpected entrypoint exit: ${kind}`);
    const lines = stdout.trim().split('\n').filter(Boolean);
    const output = JSON.parse(lines.at(-1));
    const resultPath = await realpath(output.result);
    assert.ok(resultPath.startsWith(runs + path.sep), 'result must be in this private suite');
    const runDir = path.dirname(resultPath);
    const result = JSON.parse(await readFile(resultPath, 'utf8'));
    assert.equal(result.schema, 'test-board-e2e-result-v1');
    assert.equal(result.caseId, caseId);
    assert.equal(result.issue, '46');
    assert.equal(result.dataKind, 'fixture');
    assert.match(result.git.head, /^[a-f0-9]{40}$/);
    assert.ok(result.startedAt && result.finishedAt && result.timezone);
    assert.ok(!preserved.some((old) => old.runId === result.runId || old.runDir === runDir), 'attempt must have a new UUID and directory');
    assert.equal(result.test.status, kind === 'success' ? 'passed' : 'failed');
    if (kind === 'success') { assert.equal(result.test.exitCode, 0); assert.equal(result.test.signal, null); }
    if (kind === 'assertion') {
      assert.equal(result.test.exitCode, 1); assert.equal(result.test.signal, null);
      assert.equal(result.test.failedStep, 'intentional-assertion-failure');
      assert.match(result.error, /intentional fixture assertion/);
    }
    if (['sigint', 'sigterm', 'timeout'].includes(kind)) {
      assert.equal(facts.pendingSeen, true, 'pending step was never reached');
      if (signal) assert.equal(facts.signalSent, true, 'signal was not delivered');
      assert.equal(result.error, signal || 'timeout');
      assert.equal(result.test.failedStep, 'pending-interruption');
      assert.equal(result.test.exitCode, null);
      assert.equal(result.test.signal, 'SIGTERM'); // entrypoint stops its worker with SIGTERM
    }
    assert.equal(result.recording.start, 'passed');
    assert.equal(result.recording.stop, 'passed');
    assert.equal(result.recording.save, 'verified');
    assert.equal(result.recording.readback.status, 'passed');
    assert.equal(result.recording.readback.visualInspection, 'unverified');
    assert.ok(result.recording.readback.decodedFrames > 0);
    const video = path.join(runDir, result.artifacts.video), log = path.join(runDir, result.artifacts.log);
    assert.ok((await lstat(video)).isFile() && (await stat(video)).size > 0);
    assert.equal(await hash(video), result.recording.readback.sha256);
    assert.equal(await hash(log), result.artifacts.logSha256);
    assert.equal(result.artifacts.logStatus, 'verified');
    const text = await readFile(log, 'utf8');
    assert.match(text, /"step":"assert-ready"/);
    assert.match(text, /"step":"click-action"/);
    assert.match(text, /"step":"assert-clicked"/);
    assert.match(text, /fixture-console=/);
    const events = (await readFile(eventsFile, 'utf8')).trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
    assert.ok(events.some((event) => event.attempt === attempt && event.event === '/clicked'), 'server did not observe the click');
    preserved.push({ runId: result.runId, runDir, files: await Promise.all([resultPath, video, log, path.join(attemptDir, 'driver.json')].map(async (file) => [file, await hash(file)])) });
    console.log(JSON.stringify({ kind, runId: result.runId, result: resultPath, exit: exit.code, test: result.test, recording: result.recording.readback.status, visualInspection: 'unverified' }));
  }
  console.log(`Verified expected outcomes for ${preserved.length} attempts; inspect the actual videos separately. Private suite: ${suite}`);
} finally {
  await new Promise((resolve) => server.close(resolve));
  await eventWrites;
}
