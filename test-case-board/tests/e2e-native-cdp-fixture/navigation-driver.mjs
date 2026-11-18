#!/usr/bin/env node
// Explicit opt-in: starts one real browser at a time through the common entrypoint.
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { lstat, mkdir, open, readFile, readdir, realpath, stat } from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyIframeObservations, verifyNavigationResult } from './navigation-verify.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const entry = path.join(repo, 'test-case-board/bin/test-board');
const runner = path.join(here, 'navigation-runner.mjs');
const usage = 'Usage: node test-case-board/tests/e2e-native-cdp-fixture/navigation-driver.mjs --commit FULL_SHA --browser AGENT_BROWSER_EXECUTABLE --chrome APPROVED_CHROME_EXECUTABLE [--iframe|--worker-v3]\n';
let suiteRef = null;

async function hashFile(file) {
  const h = createHash('sha256');
  for await (const chunk of createReadStream(file)) h.update(chunk);
  return h.digest('hex');
}
async function retainedFiles(dir, files = []) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    if (item.isSymbolicLink()) continue;
    if (item.isDirectory()) {
      if (!['profile', 'sockets'].includes(item.name)) await retainedFiles(file, files);
    } else if (item.isFile() && (/^(?:result\.json|run\.jsonl|run\.log|recording\.webm)$/.test(item.name) || /(?:-result\.json|\.webm|\.log|\.jsonl)$/.test(item.name))) files.push(file);
  }
  return files;
}
async function snapshot(files) {
  const out = new Map();
  for (const file of files) out.set(file, await hashFile(file));
  return out;
}
async function unchanged(saved) {
  for (const [file, digest] of saved) assert.equal(await hashFile(file), digest, 'previous evidence changed or disappeared');
}
async function privateFile(file) {
  const info = await lstat(file);
  assert.ok(info.isFile() && !(info.mode & 0o077), 'artifact is not an owner-only regular file');
}
async function main() {
  if (process.argv.length === 3 && process.argv[2] === '--help') { process.stdout.write(usage); return; }
  const args = process.argv.slice(2), opts = {};
  const workerMode = args.at(-1) === '--worker-v3';
  if (workerMode) args.pop();
  const iframeMode = workerMode || args.at(-1) === '--iframe';
  if (args.at(-1) === '--iframe') args.pop();
  assert.equal(args.length, 6, usage);
  for (let i = 0; i < args.length; i += 2) {
    assert.ok(['--commit', '--browser', '--chrome'].includes(args[i]) && !opts[args[i]] && args[i + 1], usage);
    opts[args[i]] = args[i + 1];
  }
  assert.match(opts['--commit'], /^[a-f0-9]{40}$/);
  assert.ok(path.isAbsolute(opts['--browser']) && path.isAbsolute(opts['--chrome']));
  const git = (...args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8' }).trim();
  assert.equal(git('rev-parse', 'HEAD'), opts['--commit']);
  assert.equal(git('status', '--porcelain=v1', '--untracked-files=all'), '', 'checkout is not clean');
  const evidence = await realpath(path.join(os.homedir(), '.local/share/agent-skills/e2e-evidence'));
  const root = await stat(evidence);
  assert.ok(root.isDirectory() && !(root.mode & 0o077) && (typeof process.getuid !== 'function' || root.uid === process.getuid()), 'private root unavailable');
  const oldFailure = path.join(evidence, 'issue54-469061bd-cf2f-409c-831b-85ca4a5a1e24');
  const oldProof = path.join(evidence, 'issue54-e2d65d80-2b77-4908-82ba-c9efcf03889d');
  for (const file of [path.join(oldFailure, 'result.json'), path.join(oldFailure, 'run.jsonl'), path.join(oldProof, 'result.json'), path.join(oldProof, 'run.jsonl'), path.join(oldProof, 'recording.webm')]) await privateFile(file);
  const oldFiles = [];
  for (const item of await readdir(evidence, { withFileTypes: true })) {
    if (item.isDirectory() && /^issue(?:54|56)-[0-9a-f-]{36}$/i.test(item.name)) await retainedFiles(path.join(evidence, item.name), oldFiles);
  }
  const preserved = await snapshot(oldFiles);
  if (iframeMode) {
    // The caller supplies the private original directory. Never write to it or
    // print its path/content; known hashes are checked before every attempt and
    // in finally, in addition to the existing #54/#56 evidence snapshots.
    const supplied = process.env.TB_56_PRODUCT_FAILURE_DIR;
    assert.ok(supplied && path.isAbsolute(supplied), 'private product-failure directory required');
    const original = await realpath(supplied);
    const expected = {
      'result.json': '23e32cac2c01f4bc316f721ad923471157c4bab046eb824d58a99d90918a06b1',
      'run.log': '8f2ec83ca2790d7b86e80e3650d5e5f508c2558f73ac293beaa107e9633e84dd',
      'recording.webm': 'd57627c10c6a3ae145f58829929e0bc566972d3cf4f93a3e61b31aba08aff326',
    };
    for (const [name, digest] of Object.entries(expected)) {
      const file = path.join(original, name);
      await privateFile(file); assert.equal(await hashFile(file), digest, 'original product evidence hash mismatch');
      preserved.set(file, digest);
    }
  }
  if (workerMode) {
    const supplied = process.env.TB_56_PRODUCT_FAILURE_24_DIR;
    assert.ok(supplied && path.isAbsolute(supplied), 'private #24 product-failure directory required');
    const original = await realpath(supplied);
    const expected = {
      'result.json': '8923a4738249255e6dd0c49e02ef7fba8773f0746cf1d5a7492a0d7d62d43bfd',
      'run.log': '3fda72d641c03e633ccdda74d239d946bdd295a9f15c512c201465a8aca466e0',
      'recording.webm': 'fa4905f5459d32ed70fff0d6e6fdf0411dae04177cc668bd84899d4fab873d56',
    };
    for (const [name, digest] of Object.entries(expected)) {
      const file = path.join(original, name);
      await privateFile(file); assert.equal(await hashFile(file), digest, 'original #24 product evidence hash mismatch');
      preserved.set(file, digest);
    }
  }
  process.umask(0o077);
  const suiteName = `issue56-${randomUUID()}`;
  const suite = path.join(evidence, suiteName);
  await mkdir(suite, { mode: 0o700 });
  suiteRef = suiteName;
  const html = await readFile(path.join(here, 'index.html'));
  // Constant, inert srcdoc and an opaque sandbox create a candidate child
  // target without changing the original page, input sequence, or timing.
  // Whether Chrome exposes it as a TargetInfo iframe is checked, never assumed.
  const iframeHtml = Buffer.from(html.toString('utf8').replace('</main>', '<iframe title="Isolated fixture frame" tabindex="-1" sandbox srcdoc="&lt;!doctype html&gt;&lt;html lang=\'en\'&gt;&lt;head&gt;&lt;title&gt;Isolated fixture frame&lt;/title&gt;&lt;/head&gt;&lt;body&gt;&lt;p&gt;Isolated local fixture&lt;/p&gt;&lt;/body&gt;&lt;/html&gt;"></iframe></main>'));
  const script = await readFile(path.join(here, 'fixture.mjs'));
  let active = null;
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    if (!active || (url.pathname !== '/fixture.mjs' && url.searchParams.get('run') !== active.id)) { res.writeHead(404).end(); return; }
    if (url.pathname === '/') res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }).end(iframeMode ? iframeHtml : html);
    else if (url.pathname === '/fixture.mjs') res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-store' }).end(script);
    else if (url.pathname === '/pending' && active.scenario === 'sigterm') {
      active.pendingSeen = true;
      const attempt = active;
      res.once('finish', () => setImmediate(() => {
        if (active === attempt && !attempt.signalSent) attempt.signalSent = attempt.child.kill('SIGTERM');
      }));
      res.writeHead(204, { 'cache-control': 'no-store' }).end();
    } else res.writeHead(404).end();
  });
  const seenRuns = new Set();
  try {
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    for (const scenario of ['success', 'undeclared', 'sigterm', 'retry']) {
      await unchanged(preserved);
      const id = randomUUID();
      const caseId = 'TC-056-NAVIGATION';
      const url = `http://127.0.0.1:${server.address().port}/?run=${id}`;
      const next = `${url}&view=two`, denied = `${url}&view=undeclared`;
      const cliArgs = ['e2e', '--provider', 'native-cdp', '--case', caseId, '--runner', runner,
        '--browser', opts['--browser'], '--chrome', opts['--chrome'], '--url', url, '--allow-url', url, '--allow-url', next,
        '--evidence-dir', suite, '--data-kind', 'fixture', '--issue', '56',
        '--environment', 'Issue 56 localhost native navigation fixture', '--timeout-ms', '120000'];
      const names = ['PATH', 'HOME', 'USER', 'TMPDIR', 'TMP', 'TEMP', 'LANG', 'LC_ALL', 'TZ', 'SYSTEMROOT', 'WINDIR'];
      const env = Object.fromEntries(names.filter((name) => process.env[name] !== undefined).map((name) => [name, process.env[name]]));
      env.TB_NATIVE_SCENARIO = 'success'; env.TB_56_SCENARIO = scenario;
      env.TB_56_INITIAL_URL = url; env.TB_56_QUERY_URL = next; env.TB_56_DENIED_URL = denied;
      if (iframeMode) env.TB_56_IFRAME = '1';
      if (workerMode) env.TB_56_WORKER_V3 = '1';
      // Open owner-only diagnostics before spawn so interrupted runs retain output.
      const stdoutFile = path.join(suite, `entrypoint-${id}-stdout.log`);
      const stderrFile = path.join(suite, `entrypoint-${id}-stderr.log`);
      const stdoutHandle = await open(stdoutFile, 'wx', 0o600);
      let stderrHandle, exit, facts;
      try {
        stderrHandle = await open(stderrFile, 'wx', 0o600);
        const child = spawn(entry, cliArgs, { cwd: repo, env, stdio: ['ignore', stdoutHandle.fd, stderrHandle.fd] });
        active = { id, scenario, child, pendingSeen: false, signalSent: false };
        exit = await new Promise((resolve) => {
          child.once('error', () => resolve({ code: null, signal: null, error: true }));
          child.once('close', (code, signal) => resolve({ code, signal }));
        });
        facts = active;
      } finally {
        active = null;
        try { await stdoutHandle.sync(); if (stderrHandle) await stderrHandle.sync(); }
        finally { await stdoutHandle.close(); if (stderrHandle) await stderrHandle.close(); }
      }
      // Always check older evidence before accepting or retrying this attempt.
      await unchanged(preserved);
      assert.ok(!exit.error, 'entrypoint failed to start');
      const stdout = await readFile(stdoutFile, 'utf8');
      const output = JSON.parse(stdout.trim().split('\n').filter(Boolean).at(-1));
      assert.match(output.result, /^TC-056-NAVIGATION-[0-9a-f-]{36}\/result\.json$/i);
      const resultPath = await realpath(path.join(suite, output.result));
      assert.ok(resultPath.startsWith(suite + path.sep), 'result escaped its private suite');
      const runDir = path.dirname(resultPath);
      const runInfo = await stat(runDir);
      assert.ok(runInfo.isDirectory() && !(runInfo.mode & 0o077), 'run directory is not private');
      await privateFile(resultPath);
      const result = JSON.parse(await readFile(resultPath, 'utf8'));
      verifyNavigationResult(result, { scenario, commit: opts['--commit'], exit, initial: url, next, denied, workerV3: workerMode });
      assert.ok(!seenRuns.has(result.runId), 'run UUID reused'); seenRuns.add(result.runId);
      if (scenario === 'sigterm') { assert.equal(facts.pendingSeen, true); assert.equal(facts.signalSent, true); }
      const video = path.join(runDir, result.artifacts.video), log = path.join(runDir, result.artifacts.log);
      await privateFile(video); await privateFile(log);
      assert.equal(await hashFile(video), result.recording.readback.sha256);
      assert.equal(await hashFile(log), result.artifacts.logSha256);
      const logEntries = (await readFile(log, 'utf8')).split('\n').flatMap((line) => {
        try { return [JSON.parse(line)]; } catch { return []; }
      });
      if (iframeMode) verifyIframeObservations(logEntries, { workerV3: workerMode });
      const observations = logEntries.filter((item) => item.type === 'native-observation');
      if (scenario === 'sigterm') {
        assert.deepEqual(observations.slice(0, 3).map((item) => item.phase), ['initial-target', 'before-record-start', 'after-record-start']);
        const last = observations.at(-1);
        const pending = result.steps.find((item) => item.id === 'pending-interruption');
        assert.equal(last?.phase, 'step-before');
        assert.ok(Number.isFinite(Date.parse(last.time)) && Date.parse(last.time) <= Date.parse(pending.startedAt));
      } else if (iframeMode) {
        assert.equal(observations.at(-1)?.phase, 'after-worker', 'final ownership observation missing');
      }
      const entries = logEntries.filter((item) => item.type === 'cdp-send');
      // Page.navigate is recorded as a navigation entry rather than cdp-send.
      assert.equal(entries.length + 2, result.test.nativeCdpOperations, 'CDP attempt count differs from log');
      const navs = logEntries.filter((item) => item.type === 'navigation');
      assert.deepEqual(navs.map((item) => [item.step, item.status]), [
        ['same-url-reload', 'passed'], ['declared-query-navigation', 'passed'],
        ...(scenario === 'undeclared' ? [['undeclared-navigation', 'failed']] : []),
      ]);
      assert.deepEqual(observations.slice(0, 3).map((item) => item.phase), ['initial-target', 'before-record-start', 'after-record-start']);
      for (const id of ['same-url-reload', 'declared-query-navigation']) {
        const phases = observations.filter((item) => item.step === id).map((item) => item.phase);
        assert.ok(phases.indexOf('navigation-before') >= 0 && phases.indexOf('navigation-after') > phases.indexOf('navigation-before') && phases.indexOf('step-after') > phases.indexOf('navigation-after'));
      }
      const inputs = entries.filter((item) => /^Input\.dispatch(?:Touch|Key|Mouse)Event$/.test(item.method));
      assert.equal(inputs.length, result.test.nativeInputOperations, 'native Input success count differs from attempts');
      for (const [method, count] of [['Input.dispatchTouchEvent', 4], ['Input.dispatchKeyEvent', 2], ['Input.dispatchMouseEvent', 23]]) {
        assert.equal(inputs.filter((item) => item.method === method).length, count, 'unexpected native Input method count');
      }
      for (const [file, digest] of await snapshot(await retainedFiles(runDir))) preserved.set(file, digest);
      for (const diagnostic of [stdoutFile, stderrFile]) { await privateFile(diagnostic); preserved.set(diagnostic, await hashFile(diagnostic)); }
      process.stdout.write(JSON.stringify({ scenario, result: `${suiteName}/${output.result}`, exit: exit.code, workerSignal: result.test.signal, test: result.test.status, readback: result.recording.readback.status, visualInspection: 'unverified' }) + '\n');
    }
  } finally {
    if (server.listening) await new Promise((resolve) => server.close(resolve));
    await unchanged(preserved);
  }
}

try { await main(); }
catch { process.stderr.write(`native navigation fixture driver stopped; inspect retained private evidence${suiteRef ? `: ${suiteRef}` : ''} before any further run\n`); process.exitCode = 1; }
