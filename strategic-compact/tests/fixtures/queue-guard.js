'use strict';

// Safety belt inside the real hook child: only the fixture's absolute CLI may
// be spawned. It records violations even when the hook catches an exception.
const fs = require('node:fs');
const path = require('node:path');
const child = require('node:child_process');
const root = process.env.FAKE_ROOT;
const syntheticThread = '00000000-0000-4000-8000-000000000062';
if (!root || !path.isAbsolute(root) || process.env.HOME !== path.join(root, 'home') ||
    process.env.FAKE_SAFE !== 'issue62-synthetic-only' ||
    (process.env.T3CODE_THREAD_ID && process.env.T3CODE_THREAD_ID !== syntheticThread)) {
  throw new Error('unsafe integration fixture environment');
}
const allowed = path.join(root, 'fake-t3');
function refuse(command) {
  fs.writeFileSync(path.join(root, 'guard-violation'), String(command), { mode: 0o600 });
  throw new Error('fixture blocked an unexpected child process');
}
const originalSpawnSync = child.spawnSync;
child.spawnSync = function(command, ...args) {
  if (command !== allowed) return refuse(command);
  return originalSpawnSync.call(this, command, ...args);
};
for (const method of ['spawn', 'exec', 'execSync', 'execFile', 'execFileSync', 'fork']) {
  child[method] = command => refuse(command);
}
