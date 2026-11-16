'use strict';

// This executable is reached only through the test-created absolute shell wrapper.
// It never invokes T3. Unknown arguments fail and are recorded.
const fs = require('node:fs');
const path = require('node:path');
const root = process.env.FAKE_ROOT;
const threadId = '00000000-0000-4000-8000-000000000062';
if (!root || process.env.FAKE_SAFE !== 'issue62-synthetic-only' ||
    process.env.T3CODE_THREAD_ID !== threadId) process.exit(90);
const config = JSON.parse(fs.readFileSync(path.join(root, 'cli-config.json'), 'utf8'));
const argv = process.argv.slice(2);
const show = JSON.stringify(argv) === JSON.stringify(['thread', 'show', threadId, '--messages', '1', '--json']);
const send = JSON.stringify(argv) === JSON.stringify(['thread', 'send', threadId, '/compact', '--json']);
let stateAtSend = null;
if (send) {
  try { stateAtSend = JSON.parse(fs.readFileSync(process.env.FAKE_STATE_FILE, 'utf8')); } catch {}
}
fs.appendFileSync(path.join(root, 'calls.jsonl'), JSON.stringify({ argv, stateAtSend }) + '\n', { mode: 0o600 });
if (!show && !send) process.exit(91);
if (show) {
  if (config.showMode === 'nonzero') process.exit(12);
  if (config.showMode === 'invalid') { process.stdout.write('{'); process.exit(0); }
  process.stdout.write(JSON.stringify({ thread: config.thread, messages: [] }));
  process.exit(0);
}
if (config.sendMode === 'barrier') {
  fs.writeFileSync(path.join(root, 'send-entered'), 'entered', { mode: 0o600 });
  const until = Date.now() + 8000;
  while (!fs.existsSync(path.join(root, 'release-send')) && Date.now() < until) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20);
  }
  if (!fs.existsSync(path.join(root, 'release-send'))) process.exit(92);
}
if (config.sendMode === 'timeout') Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 6500);
if (config.sendMode === 'nonzero') process.exit(17);
if (config.sendMode === 'invalid') { process.stdout.write('{'); process.exit(0); }
process.stdout.write(JSON.stringify(config.receipt));
