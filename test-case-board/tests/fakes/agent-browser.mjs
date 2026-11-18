#!/usr/bin/env node
// Test double only. This is NOT a browser or a source of real E2E evidence.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
if (args.includes('--version')) {
  if (process.env.TB_FAKE_VERSION_GATE) {
    // Notify the test that preflight is blocked; never start a browser.
    fs.writeFileSync(process.env.TB_FAKE_VERSION_GATE, 'version preflight entered\n', { flag: 'wx', mode: 0o600 });
    setTimeout(() => process.exit(2), 40000); // safety bound if the parent dies
    await new Promise(() => {});
  }
  console.log(`agent-browser ${process.env.TB_FAKE_VERSION || '0.43.0'}`);
  process.exit(0);
}
const pos = args.indexOf('--json');
if (pos < 0) { console.error('fake requires --json'); process.exit(1); }
const command = args.slice(pos + 1);
const socket = process.env.AGENT_BROWSER_SOCKET_DIR;
if (!socket) { console.error('fake requires isolated socket directory'); process.exit(1); }
const state = path.join(socket, 'fake-state.json');
fs.appendFileSync(path.join(socket, 'fake-commands.jsonl'), JSON.stringify(command) + '\n', { mode: 0o600 });
const respond = (success, data = {}, error = undefined) => console.log(JSON.stringify({ success, data, error }));
if (command[0] === 'record' && command[1] === 'start') {
  fs.writeFileSync(state, JSON.stringify({ video: command[2] }), { flag: 'wx', mode: 0o600 });
  respond(true);
} else if (command[0] === 'record' && command[1] === 'stop') {
  if (process.env.TB_FAKE_FINALIZATION_PHASE === 'record-stop') {
    const gate = process.env.TB_FAKE_FINALIZATION_GATE;
    fs.writeFileSync(path.join(gate, 'stop-entered'), 'stop entered\n', { flag: 'wx', mode: 0o600 });
    await new Promise((resolve, reject) => {
      const release = path.join(gate, 'release');
      const watcher = fs.watch(gate, check);
      const deadline = setTimeout(() => { watcher.close(); reject(new Error('fake stop release deadline')); }, 20000);
      watcher.once('error', (error) => { clearTimeout(deadline); watcher.close(); reject(error); });
      function check() {
        if (!fs.existsSync(release)) return;
        clearTimeout(deadline); watcher.close(); resolve();
      }
      check();
    });
  }
  const { video } = JSON.parse(fs.readFileSync(state, 'utf8'));
  const mode = process.env.TB_FAKE_VIDEO_MODE || 'valid';
  if (mode === 'empty') fs.writeFileSync(video, '', { flag: 'wx', mode: 0o600 });
  else if (mode === 'corrupt') fs.writeFileSync(video, 'this is not a video', { flag: 'wx', mode: 0o600 });
  else {
    // Generate synthetic frames, never copy or alter any existing recording.
    const ffmpeg = spawnSync('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'color=c=red:s=64x64:r=4:d=1', '-c:v', 'libvpx', '-pix_fmt', 'yuv420p', '-n', video], { encoding: 'utf8' });
    if (ffmpeg.status !== 0) { console.error(ffmpeg.stderr || ffmpeg.error?.message); process.exit(1); }
  }
  respond(mode !== 'stop-fails', {}, mode === 'stop-fails' ? 'intentional fake stop failure' : undefined);
} else if (command[0] === 'eval' && command[1] === "'INFLIGHT'" && process.env.TB_FAKE_ACTION_GATE) {
  // Hold this fake client after dispatch until the test has observed the worker's SIGTERM.
  const gate = process.env.TB_FAKE_ACTION_GATE;
  fs.writeFileSync(path.join(gate, 'action-started'), 'started\n', { flag: 'wx', mode: 0o600 });
  await new Promise((resolve, reject) => {
    const release = path.join(gate, 'release');
    const watcher = fs.watch(gate, check);
    const deadline = setTimeout(() => { watcher.close(); reject(new Error('fake action release deadline')); }, 20000);
    watcher.once('error', (error) => { clearTimeout(deadline); watcher.close(); reject(error); });
    function check() {
      if (!fs.existsSync(release)) return;
      clearTimeout(deadline); watcher.close(); resolve();
    }
    check();
  });
  fs.appendFileSync(path.join(socket, 'fake-commands.jsonl'), JSON.stringify(['fixture-action-complete']) + '\n', { mode: 0o600 });
  fs.writeFileSync(path.join(gate, 'action-complete'), 'completed\n', { flag: 'wx', mode: 0o600 });
  respond(true, { result: 'INFLIGHT' });
} else if (command[0] === 'tab') respond(true, { tabs: [{ active: true, targetId: 'fake-target' }] });
else if (command[0] === 'eval') respond(true, { result: 'READY' });
else if (['set', 'open', 'click', 'close'].includes(command[0])) respond(true);
else respond(false, {}, `unsupported fake command ${command[0]}`);
