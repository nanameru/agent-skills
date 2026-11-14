#!/usr/bin/env node
// Issue 54 AC-5 experiment only. Preparation never starts a browser or server.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { execFile, fork } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { CDP, checkEndpoint, pageIdentity, publicIdentity, experimentConclusion } from './protocol.mjs';

const exec = promisify(execFile);
const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const evidenceRoot = path.join(os.homedir(), '.local/share/agent-skills/e2e-evidence');
const args = process.argv.slice(2);
const usage = 'node test-case-board/tests/e2e-cdp-fixture/run.mjs --prepare|--run --chrome /absolute/path/to/chrome --commit FULL_SHA';
if (args.includes('--help')) { console.log(usage); process.exit(0); }
assert.equal(args.length, 5, usage);
assert.ok(['--prepare', '--run'].includes(args[0]) && args[1] === '--chrome' && args[3] === '--commit', usage);
const chrome = args[2], expected = args[4];
assert.ok(path.isAbsolute(chrome) && /^[a-f0-9]{40}$/.test(expected), usage);
const env = Object.fromEntries(['PATH', 'HOME', 'USER', 'TMPDIR', 'TMP', 'TEMP', 'LANG', 'LC_ALL', 'TZ', 'SYSTEMROOT', 'WINDIR']
  .filter((key) => process.env[key] !== undefined).map((key) => [key, process.env[key]]));
async function command(program, argv, options = {}) {
  return exec(program, argv, { cwd: repo, env, timeout: 30000, maxBuffer: 16 * 1024 * 1024, ...options });
}
async function preflight() {
  assert.ok(Number(process.versions.node.split('.')[0]) >= 22, 'Node 22+ required');
  await fsp.access(chrome, fs.constants.X_OK);
  const root = await fsp.realpath(evidenceRoot), stat = await fsp.stat(root);
  assert.equal(root, evidenceRoot, 'evidence root must be its existing real path');
  assert.ok(stat.isDirectory() && !(stat.mode & 0o077) && stat.uid === process.getuid(), 'evidence root must be owner-only');
  const space = await fsp.statfs(root);
  assert.ok(Number(space.bavail) * Number(space.bsize) >= 64 * 1024 * 1024, 'less than 64 MiB free');
  const head = (await command('git', ['rev-parse', 'HEAD'])).stdout.trim();
  assert.equal(head, expected, 'fixed commit does not match HEAD');
  assert.equal((await command('git', ['status', '--porcelain=v1'])).stdout, '', 'worktree must be clean');
  const version = (await command('npx', ['--yes', 'agent-browser@0.43.0', '--version'])).stdout.trim();
  assert.match(version, /(?:^|\s)0\.43\.0$/);
  await command('ffprobe', ['-version']);
  const encoders = (await command('ffmpeg', ['-hide_banner', '-encoders'])).stdout;
  assert.match(encoders, /\blibvpx\b/);
  return { head, version };
}

const pre = await preflight();
if (args[0] === '--prepare') {
  console.log(JSON.stringify({ phase: 'prepare', status: 'passed', ...pre, browserStarted: false }));
  process.exit(0);
}

process.umask(0o077);
const id = randomUUID(), dir = path.join(evidenceRoot, `issue54-${id}`);
await fsp.mkdir(dir, { mode: 0o700 });
const video = path.join(dir, 'recording.webm'), logPath = path.join(dir, 'run.jsonl');
const log = await fsp.open(logPath, 'wx', 0o600);
const append = async (entry) => log.write(`${JSON.stringify({ at: new Date().toISOString(), ...entry })}\n`);
const session = `i54-${id}`;
const browserEnv = { ...env, TMPDIR: path.join(dir, 'tmp'), AGENT_BROWSER_CONFIG: path.join(dir, 'config.json'),
  AGENT_BROWSER_SOCKET_DIR: '.', AGENT_BROWSER_NAMESPACE: `i54-${id.slice(0, 12)}` };
const socketDir = path.join(dir, 'sockets'), profile = path.join(dir, 'profile');
const result = { schema: 'issue54-ac5-experiment-v1', runId: id, issue: 54, dataKind: 'fixture',
  startedAt: new Date().toISOString(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  git: { head: pre.head, dirty: false }, command: ['node', 'test-case-board/tests/e2e-cdp-fixture/run.mjs', ...args],
  environment: { node: process.version, platform: process.platform,
    arch: process.arch, chromeExecutable: chrome, agentBrowser: pre.version },
  test: { caseId: 'AC-5-fixture', status: 'not-run', completedAt: null,
    workerExitCode: null, workerSignal: null, workerTargetIdentity: 'unverified' },
  recording: { start: 'not-attempted', stop: 'not-attempted', save: 'not-verified',
    sameTargetAtStart: null, sameContextAtStart: null, sameContextSetAtStart: null,
    activeDuringOperation: 'unverified', captureTargetIdentity: 'unverified',
    ptsToWallClockMapping: 'unverified', operationCoverage: 'unverified',
    readback: { status: 'not-attempted', visualInspection: 'unverified' } },
  artifacts: { log: 'run.jsonl', video: 'recording.webm' }, error: null,
  interruption: null, conclusion: 'incomplete' };
let server, opened = false, startAttempted = false, interrupted = null, interruptionAt = null;
let finalized = false, lateSignal = null, exitCode = 1, worker = null, workerClosed = null;
const onSignal = (signal) => {
  if (finalized) {
    if (!lateSignal) { lateSignal = signal; console.error(JSON.stringify({ interruption: signal, phase: 'after-result-finalization' })); }
    process.exitCode = 1;
    return;
  }
  if (!interrupted) { interrupted = signal; interruptionAt = new Date().toISOString(); }
  if (worker?.exitCode === null && worker?.signalCode === null) worker.kill('SIGTERM');
};
const onInt = () => onSignal('SIGINT'), onTerm = () => onSignal('SIGTERM');
process.on('SIGINT', onInt); process.on('SIGTERM', onTerm);
const timer = setTimeout(() => onSignal('timeout'), 120000);
const ensureRunning = () => { if (interrupted) throw new Error(`interrupted: ${interrupted}`); };
async function browser(commandArgs, cleanup = false) {
  if (!cleanup) ensureRunning();
  const { stdout } = await command('npx', ['--yes', 'agent-browser@0.43.0', '--session', session, '--json', ...commandArgs],
    { cwd: socketDir, env: browserEnv, timeout: cleanup ? 30000 : 60000 });
  const response = JSON.parse(stdout);
  if (!response.success) throw new Error(`agent-browser ${commandArgs[0]} failed: ${response.error || 'unknown'}`);
  return response.data ?? {};
}
async function observe(label, endpoint, fixtureURL) {
  const tabs = await browser(['tab']);
  const cdp = await CDP.connect(endpoint);
  try {
    const targets = await cdp.send('Target.getTargets');
    const contexts = await cdp.send('Target.getBrowserContexts');
    const identity = pageIdentity(tabs, targets, contexts, fixtureURL);
    await append({ type: 'identity', phase: label, ...publicIdentity(identity) });
    return identity;
  } finally { cdp.close(); }
}
async function shaFile(file) {
  const h = createHash('sha256');
  for await (const chunk of fs.createReadStream(file)) h.update(chunk);
  return h.digest('hex');
}
async function readVideo() {
  const stat = await fsp.lstat(video);
  assert.ok(stat.isFile() && stat.size > 0, 'video missing or empty');
  await fsp.chmod(video, 0o600);
  const file = await fsp.open(video, 'r'); try { await file.sync(); } finally { await file.close(); }
  const firstHash = await shaFile(video);
  const metadata = JSON.parse((await command('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=codec_name,width,height:format=duration', '-of', 'json', video])).stdout);
  assert.ok(metadata.streams?.length && Number(metadata.format?.duration) > 0, 'video stream/duration missing');
  await command('ffmpeg', ['-v', 'error', '-xerror', '-i', video, '-map', '0:v:0', '-f', 'null', '-'], { timeout: 120000 });
  const probe = JSON.parse((await command('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_frames', '-show_entries', 'frame=pts_time', '-of', 'json', video], { timeout: 120000 })).stdout);
  assert.ok(probe.frames?.length, 'no decoded frames');
  let previous = -Infinity;
  const pts = probe.frames.map((frame) => {
    assert.ok(frame.pts_time !== undefined && frame.pts_time !== '', 'frame PTS missing');
    const value = Number(frame.pts_time);
    assert.ok(Number.isFinite(value) && value >= previous, 'invalid frame PTS'); previous = value; return value;
  });
  const secondHash = await shaFile(video);
  assert.equal(firstHash, secondHash, 'video changed during readback');
  return { status: 'passed', sha256: secondHash, bytes: stat.size, decodedFrames: pts.length,
    first: { index: 0, pts: pts[0] }, last: { index: pts.length - 1, pts: pts.at(-1) },
    stream: metadata.streams[0], duration: Number(metadata.format.duration), visualInspection: 'unverified' };
}

try {
  await fsp.mkdir(socketDir, { mode: 0o700 }); await fsp.mkdir(profile, { mode: 0o700 });
  await fsp.mkdir(browserEnv.TMPDIR, { mode: 0o700 });
  await fsp.writeFile(browserEnv.AGENT_BROWSER_CONFIG, '{}\n', { flag: 'wx', mode: 0o600 });
  const html = await fsp.readFile(path.join(here, 'index.html'));
  server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/') res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }).end(html);
    else res.writeHead(404).end();
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const url = `http://127.0.0.1:${server.address().port}/`;
  // Setup only: navigation loads the fixture; no input test happens before start.
  opened = true;
  await browser(['--profile', profile, '--executable-path', chrome, '--no-webmcp', 'open', url]);
  const endpoint = checkEndpoint((await browser(['get', 'cdp-url'])).cdpUrl);
  const before = await observe('before-record-start', endpoint, url);
  startAttempted = true;
  await append({ type: 'record-start', phase: 'attempted' });
  await browser(['record', 'start', video]); result.recording.start = 'passed';
  await append({ type: 'record-start', phase: 'passed' });
  const endpointAfter = checkEndpoint((await browser(['get', 'cdp-url'])).cdpUrl);
  assert.equal(endpointAfter, endpoint, 'browser endpoint changed after recording start');
  const after = await observe('after-record-start', endpointAfter, url);
  result.recording.sameTargetAtStart = before.targetId === after.targetId;
  result.recording.sameContextAtStart = before.contextId === after.contextId;
  result.recording.sameContextSetAtStart = JSON.stringify(before.contexts) === JSON.stringify(after.contexts);
  result.recording.targetChangedAtStart = before.targetId !== after.targetId;
  result.recording.contextChangedAtStart = before.contextId !== after.contextId;
  result.recording.contextSetChangedAtStart = JSON.stringify(before.contexts) !== JSON.stringify(after.contexts);
  ensureRunning();
  result.test.status = 'running';
  worker = fork(path.join(here, 'worker.mjs'), [], { cwd: repo, env, stdio: ['ignore', 'ignore', 'pipe', 'ipc'] });
  let finished = null, workerError = null, writes = Promise.resolve();
  worker.stderr.on('data', (data) => { writes = writes.then(() => append({ type: 'worker-stderr', text: String(data).slice(0, 2000) })); });
  worker.on('message', (message) => { if (message.type === 'finished') finished = message; writes = writes.then(() => append({ type: 'worker', ...message })); });
  workerClosed = new Promise((resolve) => { worker.once('error', (error) => { workerError = error.message; }); worker.once('close', (code, signal) => resolve({ code, signal })); });
  worker.send({ endpoint: endpointAfter, identity: after, url });
  const exit = await workerClosed; await writes; worker = null;
  result.test.workerExitCode = exit.code; result.test.workerSignal = exit.signal;
  if (workerError) throw new Error(workerError);
  ensureRunning();
  assert.ok(exit.code === 0 && exit.signal === null && finished?.status === 'passed', 'native input worker failed');
  const post = await observe('after-worker', endpointAfter, url);
  assert.equal(post.targetId, after.targetId, 'target changed during operation');
  assert.equal(post.contextId, after.contextId, 'context changed during operation');
  ensureRunning();
  result.test.workerTargetIdentity = publicIdentity(after);
  result.test.status = 'passed';
  result.test.completedAt = new Date().toISOString();
} catch (error) {
  result.error = error.message;
  if (startAttempted && result.recording.start !== 'passed') result.recording.start = 'failed';
  if (result.test.status === 'running') result.test.status = 'failed';
  await append({ type: 'error', message: error.message });
} finally {
  clearTimeout(timer);
  if (worker && workerClosed) {
    if (worker.exitCode === null && worker.signalCode === null) worker.kill('SIGTERM');
    let cleanupTimer;
    let exit = await Promise.race([workerClosed, new Promise((resolve) => { cleanupTimer = setTimeout(() => resolve(null), 3000); })]);
    clearTimeout(cleanupTimer);
    if (!exit) { worker.kill('SIGKILL'); exit = await workerClosed; }
    result.test.workerExitCode = exit.code; result.test.workerSignal = exit.signal;
  }
  if (startAttempted) {
    try { const stopped = await browser(['record', 'stop'], true); result.recording.stop = 'passed'; await append({ type: 'record-stop', data: stopped }); }
    catch (error) { result.recording.stop = 'failed'; await append({ type: 'record-stop-error', message: error.message }); }
    try { result.recording.readback = await readVideo(); result.recording.save = 'verified'; }
    catch (error) { result.recording.readback = { status: 'failed', error: error.message, visualInspection: 'unverified' }; }
  }
  if (opened) { try { await browser(['close'], true); } catch (error) { await append({ type: 'close-error', message: error.message }); result.error ||= 'browser close failed'; } }
  if (server) await new Promise((resolve) => server.close(resolve));
  await log.sync(); await log.close();
  try {
    const first = await shaFile(logPath), second = await shaFile(logPath);
    assert.equal(first, second); result.artifacts.logSha256 = second; result.artifacts.logStatus = 'verified';
  } catch { result.artifacts.logStatus = 'failed'; }
  // Finalize without yielding between the interruption snapshot and readback.
  result.finishedAt = new Date().toISOString();
  result.interruption = interrupted ? { reason: interrupted, observedAt: interruptionAt } : null;
  const assessment = experimentConclusion(result);
  result.conclusion = assessment.conclusion; exitCode = assessment.exitCode;
  const resultPath = path.join(dir, 'result.json');
  finalized = true;
  fs.writeFileSync(resultPath, JSON.stringify(result, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  const saved = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  assert.equal(saved.runId, id, 'result readback failed');
  console.log(JSON.stringify({ result: resultPath, test: result.test, recording: result.recording,
    conclusion: result.conclusion, error: result.error, interruption: result.interruption }));
  // Report signals observed after result finalization separately and fail the process.
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setTimeout(resolve, 0));
  process.removeListener('SIGINT', onInt); process.removeListener('SIGTERM', onTerm);
}
process.exitCode = lateSignal ? 1 : exitCode;
