#!/usr/bin/env node
// Local HTTP fixture for T3 preview; this does not drive a browser or record video.
import { mkdtemp, open, readFile, realpath, stat, writeFile } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const checkout = path.resolve(here, '../../..');
const usage = `Usage: node test-case-board/tests/e2e-fixture/t3-server.mjs --evidence-dir PRIVATE_DIR --run-id ID --attempt-id ID
PRIVATE_DIR must already exist, be owner-only and be outside the checkout.
Use non-secret identifiers (letters, digits, dot, underscore or hyphen; 1-64 characters).
The URL is printed to stdout; the private metadata and event paths are printed to stderr.
Stop this process with SIGTERM or SIGINT. No browser or recording is started.\n`;

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--help') { process.stdout.write(usage); return; }
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    if (!['--evidence-dir', '--run-id', '--attempt-id'].includes(key) || !args[i + 1] || options[key]) {
      throw new Error(`invalid arguments\n${usage}`);
    }
    options[key] = args[i + 1];
  }
  if (!options['--evidence-dir'] || !options['--run-id'] || !options['--attempt-id']) throw new Error(usage);
  const runId = options['--run-id'];
  const attemptId = options['--attempt-id'];
  if (![runId, attemptId].every((id) => /^[A-Za-z0-9._-]{1,64}$/.test(id))) throw new Error('invalid run or attempt identifier');
  if (!path.isAbsolute(options['--evidence-dir'])) throw new Error('evidence directory must be an absolute path');
  if (typeof process.getuid !== 'function') throw new Error('cannot verify evidence directory owner on this platform');

  const root = await realpath(options['--evidence-dir']);
  const info = await stat(root);
  if (!info.isDirectory() || (info.mode & 0o077) !== 0 || info.uid !== process.getuid()) {
    throw new Error('evidence directory must already exist and be owner-only');
  }
  const repo = await realpath(checkout);
  if (root === repo || root.startsWith(repo + path.sep)) throw new Error('evidence directory must be outside the checkout');
  const html = await readFile(path.join(here, 'index.html'));
  // A fresh directory and exclusive files ensure that even repeated identifiers
  // cannot overwrite an earlier attempt's server observations.
  const dir = await mkdtemp(path.join(root, 't3-fixture-50-'));
  const metadataPath = path.join(dir, 'fixture.json');
  const eventsPath = path.join(dir, 'server-events.jsonl');
  await writeFile(metadataPath, JSON.stringify({ runId, attemptId }, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  const events = await open(eventsPath, 'wx', 0o600);
  let eventWrites = Promise.resolve();
  let writeFailure;
  let stop;
  const server = http.createServer(async (req, res) => {
    let url;
    try { url = new URL(req.url, 'http://127.0.0.1'); } catch { res.writeHead(400).end(); return; }
    const recognized = ['/', '/clicked', '/pending'].includes(url.pathname);
    if (req.method !== 'GET' || !recognized || url.searchParams.getAll('run').length !== 1 ||
        url.searchParams.getAll('attempt').length !== 1 || url.searchParams.get('run') !== runId ||
        url.searchParams.get('attempt') !== attemptId || [...url.searchParams.keys()].length !== 2) {
      res.writeHead(404, { 'cache-control': 'no-store' }).end(); return;
    }
    const event = { at: new Date().toISOString(), runId, attemptId, event: url.pathname };
    const write = eventWrites.then(() => {
      if (writeFailure) throw writeFailure;
      return events.writeFile(JSON.stringify(event) + '\n');
    });
    eventWrites = write.catch((error) => { writeFailure ||= error; });
    try {
      await write;
      if (url.pathname === '/') res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }).end(html);
      else res.writeHead(204, { 'cache-control': 'no-store' }).end();
    } catch (error) {
      res.writeHead(500, { 'cache-control': 'no-store' }).end();
      process.stderr.write(`fixture event write failed: ${error.message}\n`);
      process.exitCode = 1;
      stop();
    }
  });

  try {
    await new Promise((resolve, reject) => {
      const onError = (error) => reject(error);
      server.once('error', onError);
      server.listen(0, '127.0.0.1', () => { server.off('error', onError); resolve(); });
    });
    const stopped = new Promise((resolve) => {
      let closing = false;
      stop = () => {
        if (closing) return;
        closing = true;
        server.close((error) => {
          if (error) { process.stderr.write(`fixture server close failed: ${error.message}\n`); process.exitCode = 1; }
          resolve();
        });
        server.closeIdleConnections?.();
      };
    });
    server.on('error', (error) => { process.stderr.write(`fixture server error: ${error.message}\n`); process.exitCode = 1; stop(); });
    process.on('SIGTERM', stop);
    process.on('SIGINT', stop);
    const target = new URL(`http://127.0.0.1:${server.address().port}/`);
    target.searchParams.set('run', runId);
    target.searchParams.set('attempt', attemptId);
    process.stderr.write(JSON.stringify({ metadata: metadataPath, events: eventsPath }) + '\n');
    process.stdout.write(target.href + '\n');
    await stopped;
    await eventWrites;
    process.off('SIGTERM', stop);
    process.off('SIGINT', stop);
  } finally {
    await events.close();
  }
}

main().catch((error) => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
