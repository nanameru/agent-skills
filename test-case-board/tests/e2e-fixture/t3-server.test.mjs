// Node HTTP/process integration only: no browser, T3 preview, recording or E2E.
// Set T3_FIXTURE_TEST_PRIVATE_DIR to an existing owner-only directory outside
// the checkout. Test observations are retained there; this test deletes nothing.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const here = path.dirname(fileURLToPath(import.meta.url));
const checkout = path.resolve(here, '../../..');
const serverFile = path.join(here, 't3-server.mjs');

async function privateRoot() {
  const requested = process.env.T3_FIXTURE_TEST_PRIVATE_DIR;
  assert.ok(requested && path.isAbsolute(requested), 'set T3_FIXTURE_TEST_PRIVATE_DIR to an existing private directory');
  assert.equal(typeof process.getuid, 'function');
  const root = await realpath(requested);
  const info = await stat(root);
  assert.ok(info.isDirectory() && !(info.mode & 0o077) && info.uid === process.getuid(), 'test root must be owner-only');
  const repo = await realpath(checkout);
  assert.ok(root !== repo && !root.startsWith(repo + path.sep), 'test root must be outside the checkout');
  return root;
}

function launch(root, runId, attemptId) {
  const child = spawn(process.execPath, [serverFile, '--evidence-dir', root, '--run-id', runId, '--attempt-id', attemptId], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '', stderr = '';
  let readyResolve, readyReject;
  const ready = new Promise((resolve, reject) => { readyResolve = resolve; readyReject = reject; });
  let settled = false;
  const timer = setTimeout(() => {
    if (!settled) { settled = true; readyReject(new Error('fixture server did not start')); }
  }, 10000);
  function checkReady() {
    if (settled || !stdout.includes('\n') || !stderr.includes('\n')) return;
    try {
      const url = new URL(stdout.split('\n')[0]);
      const paths = JSON.parse(stderr.split('\n')[0]);
      settled = true; clearTimeout(timer); readyResolve({ url, paths });
    } catch (error) { settled = true; clearTimeout(timer); readyReject(error); }
  }
  child.stdout.on('data', (part) => { stdout += part; checkReady(); });
  child.stderr.on('data', (part) => { stderr += part; checkReady(); });
  child.once('error', (error) => { if (!settled) { settled = true; clearTimeout(timer); readyReject(error); } });
  const closed = new Promise((resolve) => child.once('close', (code, signal) => {
    if (!settled) { settled = true; clearTimeout(timer); readyReject(new Error(`fixture exited before start: ${code}/${signal}: ${stderr}`)); }
    resolve({ code, signal, stdout, stderr });
  }));
  return { child, ready, closed };
}

async function stop(server, signal) {
  assert.equal(server.child.kill(signal), true);
  const exit = await server.closed;
  assert.equal(exit.code, 0, exit.stderr);
  assert.equal(exit.signal, null);
}

function eventUrl(url, pathname) {
  const target = new URL(url);
  target.pathname = pathname;
  return target;
}

test('local fixture serves the existing page and records acknowledged events privately for separate attempts', async (t) => {
  const root = await privateRoot();
  const testDir = await mkdtemp(path.join(root, 't3-server-test-'));
  const children = [];
  t.after(async () => {
    for (const server of children) {
      if (server.child.exitCode === null && server.child.signalCode === null) server.child.kill('SIGTERM');
      await server.closed;
    }
  });
  const first = launch(testDir, 'run-01', 'attempt-01');
  children.push(first);
  const { url, paths } = await first.ready;
  assert.equal(url.protocol, 'http:');
  assert.equal(url.hostname, '127.0.0.1');
  assert.ok(Number(url.port) > 0);
  assert.equal(url.searchParams.get('run'), 'run-01');
  assert.equal(url.searchParams.get('attempt'), 'attempt-01');
  for (const file of [paths.metadata, paths.events]) {
    assert.ok(file.startsWith(testDir + path.sep));
    assert.equal((await stat(file)).mode & 0o777, 0o600);
  }
  assert.equal((await stat(path.dirname(paths.events))).mode & 0o777, 0o700);
  assert.deepEqual(JSON.parse(await readFile(paths.metadata, 'utf8')), { runId: 'run-01', attemptId: 'attempt-01' });

  const page = await fetch(url);
  assert.equal(page.status, 200);
  assert.match(page.headers.get('content-type'), /^text\/html/);
  assert.equal(await page.text(), await readFile(path.join(here, 'index.html'), 'utf8'));
  const wrongAttempt = eventUrl(url, '/clicked');
  wrongAttempt.searchParams.set('attempt', 'other');
  assert.equal((await fetch(wrongAttempt)).status, 404);
  assert.equal((await fetch(eventUrl(url, '/unknown'))).status, 404);
  assert.equal((await fetch(eventUrl(url, '/clicked'), { method: 'POST' })).status, 404);
  const duplicateRun = eventUrl(url, '/clicked');
  duplicateRun.searchParams.append('run', 'run-01');
  assert.equal((await fetch(duplicateRun)).status, 404);
  assert.equal((await fetch(eventUrl(url, '/clicked'))).status, 204);
  assert.equal((await fetch(eventUrl(url, '/pending'))).status, 204);
  // Reading before shutdown also checks that a 204 acknowledges the saved event.
  const firstBytes = await readFile(paths.events, 'utf8');
  const firstEvents = firstBytes.trim().split('\n').map((line) => JSON.parse(line));
  assert.deepEqual(firstEvents.map((event) => event.event), ['/', '/clicked', '/pending']);
  for (const event of firstEvents) {
    assert.equal(event.runId, 'run-01');
    assert.equal(event.attemptId, 'attempt-01');
    assert.ok(Number.isFinite(Date.parse(event.at)));
  }
  await stop(first, 'SIGTERM');

  const retry = launch(testDir, 'run-02', 'attempt-02');
  children.push(retry);
  const second = await retry.ready;
  assert.notEqual(second.paths.events, paths.events);
  assert.equal((await fetch(eventUrl(second.url, '/clicked'))).status, 204);
  await stop(retry, 'SIGINT');
  assert.equal(await readFile(paths.events, 'utf8'), firstBytes);
  const retryEvents = (await readFile(second.paths.events, 'utf8')).trim().split('\n').map((line) => JSON.parse(line));
  assert.equal(retryEvents.length, 1);
  assert.equal(retryEvents[0].runId, 'run-02');
  assert.equal(retryEvents[0].attemptId, 'attempt-02');
  assert.equal(retryEvents[0].event, '/clicked');

  const duplicate = launch(testDir, 'run-01', 'attempt-01');
  children.push(duplicate);
  const third = await duplicate.ready;
  assert.notEqual(third.paths.events, paths.events);
  await stop(duplicate, 'SIGTERM');
  assert.equal(await readFile(paths.events, 'utf8'), firstBytes);
});

test('local fixture rejects a missing evidence directory before accepting requests', async () => {
  const root = await privateRoot();
  const testDir = await mkdtemp(path.join(root, 't3-server-negative-'));
  const child = spawn(process.execPath, [serverFile, '--evidence-dir', path.join(testDir, 'missing'), '--run-id', 'run', '--attempt-id', 'attempt'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '', stderr = '';
  child.stdout.on('data', (part) => { stdout += part; });
  child.stderr.on('data', (part) => { stderr += part; });
  const exit = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code, signal) => resolve({ code, signal }));
  });
  assert.equal(exit.code, 1);
  assert.equal(exit.signal, null);
  assert.equal(stdout, '');
  assert.match(stderr, /ENOENT/);
});
