// Test-only phase gates. This module is enabled only by the fake regression.
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { PassThrough } = require('node:stream');

const gate = process.env.TB_FAKE_FINALIZATION_GATE;
const phase = process.env.TB_FAKE_FINALIZATION_PHASE;
const signal = process.env.TB_FAKE_FINALIZATION_SIGNAL;
const root = process.env.TB_FAKE_FINALIZATION_ROOT;
const marker = (name) => path.join(gate, name);
const touch = (name) => fs.writeFileSync(marker(name), `${name}\n`, { flag: 'wx', mode: 0o600 });
const isRunFile = (file, name) => typeof file === 'string' && root && path.basename(file) === name && path.resolve(file).startsWith(path.resolve(root) + path.sep);

function waitForRelease() {
  return new Promise((resolve, reject) => {
    const watcher = fs.watch(gate, check);
    const deadline = setTimeout(() => { watcher.close(); reject(new Error('finalization gate release deadline')); }, 20000);
    watcher.once('error', (error) => { clearTimeout(deadline); watcher.close(); reject(error); });
    function check() {
      if (!fs.existsSync(marker('release'))) return;
      clearTimeout(deadline); watcher.close(); resolve();
    }
    check();
  });
}

if (process.argv[2] === '--sync-finalization-gate') {
  // The entrypoint is blocked in spawnSync while this helper waits. The test
  // sends the signal before releasing it, without sleeping for a guessed time.
  const waiting = waitForRelease();
  touch('phase-armed');
  waiting.catch(() => { process.exitCode = 1; });
} else if (gate && phase && signal && process.argv[1]?.endsWith(`${path.sep}test-case-board${path.sep}scripts${path.sep}test-board.mjs`)) {
  function armAsyncPhase() {
    // Never install an observer in place of a missing product handler: the
    // old version must still terminate by the signal in its unhandled phase.
    if (process.listenerCount(signal) > 0) {
      process.once(signal, () => touch('signal-observed'));
    }
    touch('phase-armed');
  }

  if (phase === 'record-stop') {
    const watcher = fs.watch(gate, () => {
      if (!fs.existsSync(marker('stop-entered'))) return;
      watcher.close(); clearTimeout(deadline); armAsyncPhase();
    });
    watcher.unref();
    const deadline = setTimeout(() => watcher.close(), 20000);
    deadline.unref();
  } else if (phase === 'log-hash') {
    const original = fs.createReadStream;
    let armed = false;
    fs.createReadStream = function (file, ...args) {
      if (armed || !isRunFile(file, 'run.log')) return original.call(this, file, ...args);
      armed = true;
      const stream = new PassThrough();
      armAsyncPhase();
      waitForRelease().then(() => {
        const source = original.call(fs, file, ...args);
        source.once('error', (error) => stream.destroy(error));
        source.pipe(stream);
      }, (error) => stream.destroy(error));
      return stream;
    };
  } else if (phase === 'result-write') {
    let armed = false;
    function blockAtResultWrite(file) {
      if (armed || !isRunFile(file, 'result.json')) return;
      armed = true;
      const env = { ...process.env };
      delete env.NODE_OPTIONS;
      const child = spawnSync(process.execPath, [__filename, '--sync-finalization-gate'], { env, stdio: 'ignore', timeout: 25000 });
      if (child.status !== 0) throw new Error('finalization gate helper did not complete');
    }
    const writeSync = fs.writeFileSync;
    fs.writeFileSync = function (file, ...args) {
      blockAtResultWrite(file);
      return writeSync.call(this, file, ...args);
    };
    const writeAsync = fsp.writeFile;
    fsp.writeFile = function (file, ...args) {
      blockAtResultWrite(file);
      return writeAsync.call(this, file, ...args);
    };
  }
}
