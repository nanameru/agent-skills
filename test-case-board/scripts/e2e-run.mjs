#!/usr/bin/env node
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createHash, randomUUID } from 'node:crypto';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';

const exec = promisify(execFile);
const worker = fileURLToPath(new URL('./e2e-worker.mjs', import.meta.url));
const help = `Usage: test-board e2e --case ID --runner FILE --browser EXECUTABLE --evidence-dir PRIVATE_DIR --data-kind fixture|mock|live [--timeout-ms 120000]\nSee test-case-board/references/e2e-entrypoint.md for the v1 runner contract.\n`;
const sha = (data) => createHash('sha256').update(data).digest('hex');
async function hashFile(file) {
  const hash = createHash('sha256');
  for await (const chunk of fs.createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}
async function command(bin, args, options = {}) {
  return exec(bin, args, { encoding: 'utf8', timeout: 30000, maxBuffer: 16 * 1024 * 1024, ...options });
}
async function boundedWait(promise, ms) {
  let timer;
  try { await Promise.race([promise, new Promise((resolve) => { timer = setTimeout(resolve, ms); })]); }
  finally { clearTimeout(timer); }
}
async function git(...args) { return (await command('git', args, { encoding: 'buffer' })).stdout; }
async function identity() {
  const head = (await git('rev-parse', 'HEAD')).toString().trim();
  let repository = null;
  try {
    const remote = (await git('remote', 'get-url', 'origin')).toString().trim();
    const match = /^(?:https?:\/\/[^/@]+@|https?:\/\/|ssh:\/\/[^/@]+@|[^@/]+@)([^/:]+)[:/]([^?#]+?)(?:\.git)?$/.exec(remote);
    if (match) repository = `${match[1]}/${match[2].replace(/\.git$/, '')}`;
  } catch { /* local-only repository */ }
  const diff = await git('diff', '--binary', '--no-ext-diff', 'HEAD', '--');
  const names = (await git('ls-files', '--others', '--exclude-standard', '-z')).toString().split('\0').filter(Boolean).sort();
  const untracked = [];
  for (const name of names) {
    const stat = await fsp.lstat(name);
    if (stat.isSymbolicLink()) untracked.push({ path: name, kind: 'symlink', sha256: sha(await fsp.readlink(name)) });
    else if (stat.isFile()) untracked.push({ path: name, kind: 'file', sha256: await hashFile(name), mode: stat.mode & 0o777 });
    else throw new Error('unsupported untracked entry');
  }
  const staged = await git('diff', '--cached', '--binary', '--no-ext-diff', '--');
  const unstaged = await git('diff', '--binary', '--no-ext-diff', '--');
  return { repository, head, dirty: !!(diff.length || staged.length || unstaged.length || untracked.length), trackedDiffSha256: sha(diff), stagedDiffSha256: sha(staged), unstagedDiffSha256: sha(unstaged), untracked };
}
async function readVideo(file) {
  const stat = await fsp.lstat(file);
  if (!stat.isFile() || !stat.size) throw new Error('video missing, empty, or not a regular file');
  const handle = await fsp.open(file, 'r');
  try { await handle.sync(); } finally { await handle.close(); }
  const firstHash = await hashFile(file);
  const { stdout } = await command('ffprobe', ['-v','error','-select_streams','v:0','-show_entries','stream=codec_name,width,height:format=duration','-of','json',file]);
  const probe = JSON.parse(stdout);
  if (!probe.streams?.length || !(Number(probe.format?.duration) > 0)) throw new Error('no video stream or duration');
  await command('ffmpeg', ['-v','error','-xerror','-i',file,'-map','0:v:0','-f','null','-'], { timeout: 120000 });
  const child = spawn('ffprobe', ['-v','error','-select_streams','v:0','-show_frames','-show_entries','frame=pts_time','-of','flat',file], { stdio: ['ignore','pipe','pipe'] });
  let stderr = '';
  child.stderr.on('data', (s) => { stderr += s; });
  let count = 0, first = null, last = null, invalid = false;
  const timer = setTimeout(() => child.kill('SIGKILL'), 120000);
  const done = new Promise((resolve, reject) => { child.once('error', reject); child.once('close', (code) => resolve(code)); });
  try {
    for await (const line of createInterface({ input: child.stdout, crlfDelay: Infinity })) {
      const m = /^frames\.frame\.(\d+)\.pts_time="?([^"\s]+)"?$/.exec(line);
      if (!m) continue;
      const index = Number(m[1]), pts = Number(m[2]);
      if (index !== count || !Number.isFinite(pts) || (last && pts < last.pts)) invalid = true;
      const item = { index, pts };
      first ??= item; last = item; count++;
    }
    const code = await done;
    if (code !== 0 || invalid || !count) throw new Error(`decoded frame PTS unavailable: ${stderr.slice(0, 500)}`);
  } finally { clearTimeout(timer); }
  const secondHash = await hashFile(file);
  if (firstHash !== secondHash) throw new Error('video changed during readback');
  return { status: 'passed', bytes: stat.size, sha256: secondHash, stream: probe.streams[0], duration: Number(probe.format.duration), decodedFrames: count, first, last, visualInspection: 'unverified' };
}
// The native CLI accepts global options in command arguments. Validate the
// entire grammar instead of filtering a few known global flags.
async function runnerCommand(args, dir) {
  const fail = () => { throw new Error('unsupported browser command arguments'); };
  if (!Array.isArray(args) || !args.length || args.some((x) => typeof x !== 'string' || x.includes('\0'))) return fail();
  const [name, ...rest] = args;
  const value = (x) => typeof x === 'string' && !!x && !x.startsWith('-');
  const text = (x) => typeof x === 'string' && !x.startsWith('-');
  const allValues = (xs) => xs.every(value);
  const one = new Set(['open','click','dblclick','press','hover','focus','check','uncheck','eval']);
  if (one.has(name) && rest.length === 1 && value(rest[0])) return args;
  if (['fill','type'].includes(name) && rest.length === 2 && value(rest[0]) && text(rest[1])) return args;
  if (name === 'select' && rest.length >= 2 && value(rest[0]) && rest.slice(1).every(text)) return args;
  if (name === 'scroll' && (rest.length === 1 || rest.length === 2) && ['up','down','left','right'].includes(rest[0]) && (rest.length === 1 || /^\d+$/.test(rest[1]))) return args;
  if (name === 'is' && rest.length === 2 && ['visible','enabled','checked'].includes(rest[0]) && value(rest[1])) return args;
  if (name === 'get') {
    if (rest.length === 1 && ['title','url'].includes(rest[0])) return args;
    if (rest.length === 2 && ['text','html','value','count','box','styles'].includes(rest[0]) && value(rest[1])) return args;
    if (rest.length === 3 && rest[0] === 'attr' && allValues(rest.slice(1))) return args;
  }
  if (name === 'wait') {
    if (rest.length === 1 && value(rest[0])) return args;
    if (rest.length === 2 && ['--url','--load','--fn','--text'].includes(rest[0]) && value(rest[1]) && (rest[0] !== '--load' || ['load','domcontentloaded','networkidle'].includes(rest[1]))) return args;
    if (rest.length === 3 && value(rest[0]) && !/^\d+$/.test(rest[0]) && rest[1] === '--state' && ['visible','hidden','attached','detached'].includes(rest[2])) return args;
    if (rest.length === 4 && rest[0] === '--load' && ['load','domcontentloaded','networkidle'].includes(rest[1]) && rest[2] === '--timeout' && /^\d+$/.test(rest[3])) return args;
  }
  if (name === 'snapshot') {
    const flags = new Set(['--interactive','--urls','--compact','--delta','--full']);
    for (let i = 0; i < rest.length; i++) {
      if (flags.has(rest[i])) continue;
      if (rest[i] === '--depth' && /^\d+$/.test(rest[i + 1] || '')) { i++; continue; }
      if (rest[i] === '--selector' && value(rest[i + 1])) { i++; continue; }
      return fail();
    }
    return args;
  }
  if (['errors','console'].includes(name) && (rest.length === 0 || (rest.length === 1 && rest[0] === '--clear'))) return args;
  if (name === 'find') {
    const locator = rest[0];
    let i = 1;
    if (!['role','text','label','placeholder','alt','title','testid','first','last','nth'].includes(locator)) return fail();
    if (locator === 'nth' && !/^\d+$/.test(rest[i++] || '')) return fail();
    if (!value(rest[i++])) return fail();
    if (i < rest.length && !rest[i].startsWith('-')) {
      const action = rest[i++];
      if (!['click','fill','check','hover','text'].includes(action)) return fail();
      if (action === 'fill' && !text(rest[i++])) return fail();
    }
    while (i < rest.length) {
      if (rest[i] === '--exact') { i++; continue; }
      if (rest[i] === '--name' && value(rest[i + 1])) { i += 2; continue; }
      return fail();
    }
    return args;
  }
  if (name === 'screenshot') {
    const parts = rest[0] === '--full' ? rest.slice(1) : rest;
    if (parts.length !== 1 || !/^[A-Za-z0-9][A-Za-z0-9._-]*\.(?:png|jpe?g)$/i.test(parts[0])) return fail();
    const destination = path.join(dir, parts[0]);
    try { await fsp.lstat(destination); return fail(); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    return ['screenshot', ...(rest[0] === '--full' ? ['--full'] : []), destination];
  }
  return fail();
}
async function main(argv) {
  if (argv.includes('--help') || argv.length === 0) { process.stdout.write(help); return 0; }
  const opts = {};
  for (let i = 0; i < argv.length; i += 2) {
    if (!['--case','--runner','--browser','--evidence-dir','--data-kind','--timeout-ms','--issue','--environment'].includes(argv[i]) || !argv[i+1] || opts[argv[i]]) throw new Error('invalid arguments; see --help');
    opts[argv[i]] = argv[i+1];
  }
  for (const key of ['--case','--runner','--browser','--evidence-dir','--data-kind']) if (!opts[key]) throw new Error(`${key} is required`);
  if (!/^[\w.-]+$/.test(opts['--case']) || !['fixture','mock','live'].includes(opts['--data-kind'])) throw new Error('invalid case or data kind');
  const timeoutMs = Number(opts['--timeout-ms'] || 120000);
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 86400000) throw new Error('invalid timeout');
  const browser = path.resolve(opts['--browser']), runner = path.resolve(opts['--runner']);
  const root = await fsp.realpath(opts['--evidence-dir']);
  const rootStat = await fsp.stat(root);
  if (!rootStat.isDirectory() || (rootStat.mode & 0o077) || (typeof process.getuid === 'function' && rootStat.uid !== process.getuid())) throw new Error('evidence directory must exist and be private (owner only)');
  const repo = await fsp.realpath((await command('git', ['rev-parse','--show-toplevel'])).stdout.trim());
  if (root === repo || root.startsWith(repo + path.sep)) throw new Error('evidence directory must be outside the worktree');
  const id = randomUUID();
  const dir = path.join(root, `${opts['--case']}-${id}`);
  await fsp.mkdir(dir, { mode: 0o700 });
  const video = path.join(dir, 'recording.webm'), logPath = path.join(dir, 'run.log');
  const log = fs.createWriteStream(logPath, { flags: 'wx', mode: 0o600 });
  let logError = null;
  log.on('error', (error) => { logError = error; });
  const result = { schema: 'test-board-e2e-result-v1', runId: id, caseId: opts['--case'], issue: opts['--issue'] || null, runner: path.basename(runner), dataKind: opts['--data-kind'], startedAt: new Date().toISOString(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, environment: { platform: process.platform, arch: process.arch, node: process.version, description: opts['--environment'] || 'unspecified', agentBrowser: null, captureMethod: 'unobserved' }, git: null, test: { status: 'not-run', exitCode: null, signal: null, failedStep: null }, recording: { start: 'not-attempted', stop: 'not-attempted', save: 'not-verified', targetContinuity: 'not-verified', captureTargetIdentity: 'unverified', readback: { status: 'not-attempted', visualInspection: 'unverified' } }, artifacts: { video: 'recording.webm', log: 'run.log' }, steps: [], error: null };
  const session = `tb-${randomUUID()}`;
  const browserEnv = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('AGENT_BROWSER_')));
  if (process.env.AGENT_BROWSER_EXECUTABLE_PATH) browserEnv.AGENT_BROWSER_EXECUTABLE_PATH = path.resolve(process.env.AGENT_BROWSER_EXECUTABLE_PATH);
  const socketDir = path.join(dir, 'sockets');
  browserEnv.AGENT_BROWSER_SOCKET_DIR = '.';
  browserEnv.AGENT_BROWSER_NAMESPACE = `tb-${randomUUID()}`;
  browserEnv.AGENT_BROWSER_CONFIG = path.join(dir, 'browser-config.json');
  const controller = new AbortController();
  let child, workerClosed, interrupted = null, startAttempted = false, browserOpened = false, currentStep = null, operations = 0, protocolError = false, readyResolve, readyReject, readyId, finishMessage = null, killTimer, pendingRequest = null;
  const ready = new Promise((resolve, reject) => { readyResolve = resolve; readyReject = reject; });
  // A signal during preflight can reject before execution reaches await ready.
  // Observe it immediately without changing what the later await receives.
  ready.catch(() => {});
  const append = (obj) => { log.write(`${JSON.stringify({ time: new Date().toISOString(), ...obj })}\n`); };
  const interrupt = (why) => { if (interrupted) return; interrupted = why; controller.abort(); child?.kill('SIGTERM'); if (child) killTimer = setTimeout(() => child.kill('SIGKILL'), 3000); readyReject(new Error(why)); };
  const onInt = () => interrupt('SIGINT'), onTerm = () => interrupt('SIGTERM');
  process.on('SIGINT', onInt); process.on('SIGTERM', onTerm);
  const timer = setTimeout(() => interrupt('timeout'), timeoutMs);
  async function browserCommand(args, cleanup = false) {
    const started = new Date().toISOString();
    try {
      if (!cleanup && controller.signal.aborted) throw new Error('browser command interrupted before dispatch');
      // A disconnected CLI does not cancel an already dispatched daemon action.
      // Let that client settle (bounded by its existing timeout) before cleanup
      // queues record stop behind the daemon's state lock.
      const output = await command(browser, ['--session',session,'--json',...args], { timeout: cleanup ? 30000 : timeoutMs, env: browserEnv, cwd: socketDir });
      const parsed = JSON.parse(output.stdout || '{}');
      if (!parsed.success) throw new Error(parsed.error || 'agent-browser command failed');
      append({ type: 'browser-command', step: currentStep, args, started, status: 'passed' });
      return parsed.data ?? {};
    } catch (error) { append({ type: 'browser-command', step: currentStep, args, started, status: 'failed', error: error.message }); throw error; }
  }
  let targetHash = null;
  async function checkTarget() {
    const info = await browserCommand(['tab']);
    const active = Array.isArray(info.tabs) ? info.tabs.filter((tab) => tab.active === true) : [];
    if (info.tabs?.length !== 1 || active.length !== 1 || typeof active[0].targetId !== 'string' || !active[0].targetId) { protocolError = true; throw new Error('cannot establish a single active browser target'); }
    const observed = sha(active[0].targetId);
    if (targetHash && targetHash !== observed) { protocolError = true; throw new Error('active browser target changed'); }
    targetHash = observed;
    append({ type: 'target-observation', step: currentStep, targetHash: observed, tabCount: 1 });
  }
  try {
    await fsp.mkdir(socketDir, { mode: 0o700 });
    await fsp.writeFile(browserEnv.AGENT_BROWSER_CONFIG, '{}\n', { flag: 'wx', mode: 0o600 });
    // agent-browser 0.43.0 appends namespaces/<namespace>/run/<session>.sock
    // to the raw socket directory and rejects Unix socket paths over 103 bytes.
    const socketPath = `./namespaces/${browserEnv.AGENT_BROWSER_NAMESPACE}/run/${session}.sock`;
    if (Buffer.byteLength(socketPath) > 103) throw new Error('agent-browser socket path exceeds 103 bytes');
    result.git = await identity();
    const space = await fsp.statfs(root);
    if (Number(space.bavail) * Number(space.bsize) < 64 * 1024 * 1024) throw new Error('less than 64 MiB available for evidence');
    await fsp.access(runner, fs.constants.R_OK); await fsp.access(browser, fs.constants.X_OK);
    const version = (await command(browser, ['--version'])).stdout.trim();
    if (!/(?:^|\s)0\.43\.0$/.test(version)) throw new Error(`requires agent-browser 0.43.0; got ${version}`);
    result.environment.agentBrowser = version;
    await command('ffmpeg', ['-version']); await command('ffprobe', ['-version']);
    const encoders = (await command('ffmpeg', ['-hide_banner','-encoders'])).stdout;
    if (!/\blibvpx\b/.test(encoders)) throw new Error('ffmpeg libvpx encoder unavailable');
    if (interrupted) throw new Error(interrupted);
    child = spawn(process.execPath, [worker, runner, opts['--case']], { stdio: ['ignore','pipe','pipe','ipc'] });
    child.stdout.pipe(log, { end: false }); child.stderr.pipe(log, { end: false });
    workerClosed = new Promise((resolve) => { child.once('error', (err) => { readyReject(err); resolve({ code: null, signal: null }); }); child.once('close', (code, signal) => { result.test.exitCode = code; result.test.signal = signal; readyReject(new Error(finishMessage?.error || 'runner exited before ready')); resolve({ code, signal }); }); });
    let handling = false;
    child.on('message', async (msg) => {
      const reply = (value, error) => { if (child.connected) child.send({ type: 'reply', id: msg.id, value, error }); };
      if (handling) { protocolError = true; reply(null, 'concurrent runner requests are unsupported'); return; }
      handling = true;
      let settleRequest;
      pendingRequest = new Promise((resolve) => { settleRequest = resolve; });
      try {
        if (msg.type === 'ready') { if (readyId) throw new Error('duplicate ready'); readyId = msg.id; readyResolve(); return; }
        if (msg.type === 'step-start') { if (currentStep) { protocolError = true; throw new Error('overlapping step'); } currentStep = msg.step; result.steps.push({ id: msg.step, startedAt: new Date().toISOString(), status: 'running' }); }
        else if (msg.type === 'step-end') { if (currentStep !== msg.step) { protocolError = true; throw new Error('step mismatch'); } Object.assign(result.steps.at(-1), { status: msg.status, finishedAt: new Date().toISOString(), error: msg.error || null }); if (msg.status === 'failed') result.test.failedStep = msg.step; currentStep = null; }
        else if (msg.type === 'command') {
          if (!currentStep || currentStep !== msg.step) { protocolError = true; throw new Error('unsupported browser command or step'); }
          let validated;
          try { validated = await runnerCommand(msg.args, dir); } catch (error) { protocolError = true; throw error; }
          await checkTarget();
          let value;
          try { operations++; value = await browserCommand(validated); } finally { await checkTarget(); }
          return reply(value);
        } else if (msg.type === 'finished') { finishMessage = msg; }
        else throw new Error('unsupported runner message');
        reply(true);
      } catch (error) { reply(null, error.message); }
      finally { handling = false; pendingRequest = null; settleRequest(); }
    });
    await ready;
    browserOpened = true;
    await browserCommand(['set','viewport','1280','720']);
    await checkTarget();
    startAttempted = true;
    await browserCommand(['record','start',video]); result.recording.start = 'passed';
    await checkTarget();
    // Runner waits for this explicit release before invoking its test.
    if (child.connected) child.send({ type: 'reply', id: readyId, value: true });
    result.test.status = 'running';
    const exit = await workerClosed;
    if (pendingRequest) { protocolError = true; controller.abort(); await pendingRequest; }
    result.test.exitCode = exit.code; result.test.signal = exit.signal;
    result.test.status = !interrupted && !protocolError && exit.code === 0 && finishMessage?.status === 'passed' && operations > 0 && result.steps.length > 0 && result.steps.every((s) => s.status === 'passed') ? 'passed' : 'failed';
    if (finishMessage?.step && !result.test.failedStep) result.test.failedStep = finishMessage.step;
    if (finishMessage?.error) result.error = finishMessage.error;
    if (!finishMessage || !operations) result.error ||= 'runner did not complete the supported contract with browser operations';
    await checkTarget();
    if (!protocolError) result.recording.targetContinuity = 'passed';
  } catch (error) { result.error = interrupted || error.message; if (startAttempted && result.recording.start !== 'passed') result.recording.start = 'failed'; if (result.test.status === 'running') result.test.status = 'failed'; }
  finally {
    clearTimeout(timer);
    clearTimeout(killTimer);
    if (child && child.exitCode === null && child.signalCode === null) { child.kill('SIGTERM'); await boundedWait(workerClosed, 3000); if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL'); }
    if (workerClosed) await boundedWait(workerClosed, 3000);
    if (pendingRequest) { protocolError = true; controller.abort(); await pendingRequest; }
    if (interrupted) { result.error = interrupted; result.test.failedStep ||= currentStep; if (result.test.status === 'running') result.test.status = 'failed'; }
    if (startAttempted) {
      try { await browserCommand(['record','stop'], true); result.recording.stop = 'passed'; } catch (error) { result.recording.stop = 'failed'; append({ type: 'stop-error', error: error.message }); }
      try { result.recording.readback = await readVideo(video); result.recording.save = 'verified'; } catch (error) { result.recording.readback = { status: 'failed', error: error.message, visualInspection: 'unverified' }; }
    }
    if (browserOpened) { try { await browserCommand(['close'], true); } catch {} }
    process.removeListener('SIGINT', onInt); process.removeListener('SIGTERM', onTerm);
    result.finishedAt = new Date().toISOString();
    if (!log.destroyed) await new Promise((resolve) => { log.once('error', resolve); log.end(resolve); });
    if (logError) { result.artifacts.logStatus = 'failed'; result.artifacts.logError = logError.message; }
    else {
      try {
        const first = await hashFile(logPath), second = await hashFile(logPath);
        if (first !== second) throw new Error('log changed during readback');
        result.artifacts.logSha256 = second; result.artifacts.logStatus = 'verified';
      }
      catch (error) { result.artifacts.logStatus = 'failed'; result.artifacts.logError = error.message; }
    }
    // Allure's documented result schema is separate from the authoritative result.
    // Hard links keep the original recording and log as the attachment bytes.
    let allureOutput = null;
    try {
      const attachments = [];
      const logName = `${randomUUID()}-attachment.txt`;
      if (result.artifacts.logStatus !== 'verified') throw new Error('log unavailable');
      await fsp.link(logPath, path.join(dir, logName));
      attachments.push({ name: 'run log', source: logName, type: 'text/plain' });
      if (result.recording.readback.status === 'passed') {
        const videoName = `${randomUUID()}-attachment.webm`;
        await fsp.link(video, path.join(dir, videoName));
        attachments.push({ name: 'original recording', source: videoName, type: 'video/webm' });
      }
      const evidenceOk = result.recording.start === 'passed' && result.recording.stop === 'passed' && result.recording.targetContinuity === 'passed' && result.recording.save === 'verified' && result.recording.readback.status === 'passed' && result.artifacts.logStatus === 'verified';
      const allure = { uuid: id, historyId: sha(opts['--case']), testCaseId: opts['--case'], fullName: opts['--case'], name: opts['--case'], status: !evidenceOk ? 'broken' : result.test.status === 'passed' ? 'passed' : result.test.status === 'not-run' ? 'broken' : 'failed', statusDetails: { message: `test=${result.test.status}; recording start=${result.recording.start}, stop=${result.recording.stop}, target=${result.recording.targetContinuity}, save=${result.recording.save}, readback=${result.recording.readback.status}; log=${result.artifacts.logStatus}` }, start: Date.parse(result.startedAt), stop: Date.parse(result.finishedAt), labels: [{ name: 'framework', value: 'test-board-agent-browser-v1' }], steps: result.steps.map((s) => ({ name: s.id, status: s.status === 'passed' ? 'passed' : 'failed', start: Date.parse(s.startedAt), stop: s.finishedAt ? Date.parse(s.finishedAt) : Date.parse(result.finishedAt) })), attachments };
      const allureFile = `${id}-result.json`;
      allureOutput = { file: path.join(dir, allureFile), body: JSON.stringify(allure, null, 2) + '\n' };
      result.artifacts.allure = { status: 'prepared', result: allureFile, render: 'unverified' };
    } catch (error) { result.artifacts.allure = { status: 'failed', error: error.message }; }
    const resultPath = path.join(dir, 'result.json');
    try {
      await fsp.writeFile(resultPath, JSON.stringify(result, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
      const saved = await fsp.readFile(resultPath, 'utf8');
      if (saved !== JSON.stringify(result, null, 2) + '\n') throw new Error('result readback mismatch');
    } catch {
      console.error(`test-board e2e: ${JSON.stringify({ result: 'not-saved', test: { status: result.test.status, exitCode: result.test.exitCode, signal: result.test.signal }, recording: { start: result.recording.start, stop: result.recording.stop, save: result.recording.save, readback: result.recording.readback.status }, priorFailure: Boolean(result.error), failure: interrupted || 'result-write-or-readback-failed' })}`);
      throw new Error('result write or readback failed');
    }
    if (allureOutput) {
      try { await fsp.writeFile(allureOutput.file, allureOutput.body, { flag: 'wx', mode: 0o600 }); }
      catch { console.error('test-board e2e: Allure result write failed'); }
    }
    process.stdout.write(JSON.stringify({ result: resultPath, test: result.test, recording: result.recording }) + '\n');
  }
  return result.test.status === 'passed' && result.recording.start === 'passed' && result.recording.stop === 'passed' && result.recording.targetContinuity === 'passed' && result.recording.save === 'verified' && result.recording.readback.status === 'passed' && result.artifacts.logStatus === 'verified' ? 0 : 1;
}
try { process.exitCode = await main(process.argv.slice(2)); } catch (error) { console.error(`test-board e2e: ${error.message}`); process.exitCode = 1; }
