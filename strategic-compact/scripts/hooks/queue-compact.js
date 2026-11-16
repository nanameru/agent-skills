#!/usr/bin/env node
'use strict';

// T3 queue bridge. Hook output must not alter either provider's control flow.
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { readStdinJson } = require('../lib/utils');
const { readLatestContextTokens, resolveContextWindow, resolveContextThreshold,
  resolveContextInterval, computeContextBucket } = require('../lib/transcript-context');

const COOLDOWN_MS = 5 * 60 * 1000;
const CLI_TIMEOUT_MS = 5000;
const RUN_FAILURES = new Set(['failed', 'cancelled', 'interrupted', 'rolled_back']);
const RUN_STATUSES = new Set(['preparing', 'queued', 'starting', 'running', 'waiting',
  'completed', 'interrupted', 'failed', 'cancelled', 'rolled_back']);

function privateDirectory(dir) {
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const info = fs.lstatSync(dir);
  if (!info.isDirectory() || info.isSymbolicLink() || (info.mode & 0o077) ||
      (typeof process.getuid === 'function' && info.uid !== process.getuid())) throw Error('unsafe state directory');
}

function saveState(file, state) {
  const tmp = `${file}.${process.pid}.${crypto.randomBytes(8).toString('hex')}.tmp`;
  const fd = fs.openSync(tmp, 'wx', 0o600);
  try {
    fs.writeFileSync(fd, JSON.stringify(state));
    fs.fsyncSync(fd);
  } finally { fs.closeSync(fd); }
  fs.renameSync(tmp, file);
}

function cliJson(cli, args) {
  const result = spawnSync(cli, args, { encoding: 'utf8', timeout: CLI_TIMEOUT_MS,
    maxBuffer: 2 * 1024 * 1024, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  if (result.error) return { failure: result.error.code === 'ETIMEDOUT' ? 'timeout' : 'launch_error' };
  if (result.status !== 0) return { failure: 'nonzero_exit' };
  try { return { value: JSON.parse(result.stdout) }; } catch { return { failure: 'invalid_json' }; }
}

function showThread(cli, threadId) {
  const result = cliJson(cli, ['thread', 'show', threadId, '--messages', '1', '--json']);
  const value = result.value;
  return value && value.thread && value.thread.threadId === threadId ? value.thread : null;
}

function validInput(input, harness) {
  if (!input || !['claude', 'codex'].includes(harness) ||
      !['Stop', 'PreCompact', 'PostCompact'].includes(input.hook_event_name) ||
      typeof input.session_id !== 'string' || !input.session_id ||
      input.agent_id || input.agent_transcript_path) return false;
  if (harness === 'codex' && (typeof input.turn_id !== 'string' || !input.turn_id)) return false;
  if (input.hook_event_name === 'Stop') {
    return input.stop_hook_active === false && typeof input.transcript_path === 'string' && !!input.transcript_path;
  }
  return input.trigger === 'manual' || input.trigger === 'auto';
}

function usageBucket(input) {
  const usage = readLatestContextTokens(input.transcript_path);
  if (!usage) return -1;
  const { windowTokens } = resolveContextWindow(usage.tokens, usage.model);
  const threshold = resolveContextThreshold(process.env, windowTokens);
  return computeContextBucket(usage.tokens, threshold, resolveContextInterval(process.env));
}

function observeRun(state, thread) {
  const request = state.request;
  if (!request || !request.runId || !thread) return;
  if (thread.activeRunId === request.runId && thread.latestRunId === request.runId &&
      ['preparing', 'queued', 'starting', 'running', 'waiting'].includes(thread.status)) {
    request.runState = thread.status;
  } else if (thread.latestRunId === request.runId && RUN_FAILURES.has(thread.status)) {
    request.runState = thread.status;
    request.state = 'failed';
  } else if (thread.latestRunId === request.runId && thread.status === 'completed') {
    request.runState = 'completed';
  }
}

function handle(input, harness, cli, threadId, stateFile, hazardFile) {
  let state;
  try { state = JSON.parse(fs.readFileSync(stateFile, 'utf8')); }
  catch (err) { if (err.code !== 'ENOENT') throw err; state = { version: 1, native: {}, request: null, lastBucket: -1, buckets: {} }; }
  if (state.version !== 1 || !state.native || typeof state.lastBucket !== 'number') throw Error('invalid state');
  const event = input.hook_event_name;
  const thread = showThread(cli, threadId);
  if (!thread) state.lastReadFailureAt = Date.now();
  observeRun(state, thread);
  const activeRequest = state.request && state.request.runId && thread && thread.activeRunId === state.request.runId;

  const sessionKey = crypto.createHash('sha256').update(JSON.stringify([harness, input.session_id])).digest('hex');
  const ownRequest = activeRequest && state.request.sessionKey === sessionKey && state.request.harness === harness;
  if (event === 'PreCompact') {
    state.native = { active: true, trigger: input.trigger, sessionKey, harness, startedAt: Date.now() };
    if (ownRequest && input.trigger === 'manual') state.request.preObserved = true;
    saveState(stateFile, state);
    return;
  }
  if (event === 'PostCompact') {
    const paired = state.native.active && state.native.trigger === input.trigger &&
      state.native.sessionKey === sessionKey && state.native.harness === harness;
    if (!state.native.active || paired) {
      state.native = { active: false, trigger: input.trigger, completedAt: Date.now() };
    }
    if (paired && ownRequest && input.trigger === 'manual' && state.request.preObserved) {
      state.request.state = 'compact_completed';
      state.request.compactCompletedAt = Date.now();
      state.lastBucket = state.request.bucket;
      if (!state.buckets) state.buckets = {};
      state.buckets[sessionKey] = state.request.bucket;
    }
    saveState(stateFile, state);
    return;
  }

  // Always persist observations, even when a subsequent guard suppresses sending.
  saveState(stateFile, state);
  if (!thread || fs.existsSync(hazardFile) || state.native.active ||
      (state.native.completedAt && Date.now() - state.native.completedAt < COOLDOWN_MS)) return;
  const prior = state.request;
  if (prior) {
    // A later, distinct active run demonstrates that the observed compact run
    // no longer occupies the current turn. Its final run status remains separate.
    if (prior.state !== 'compact_completed' || !thread.activeRunId ||
        thread.activeRunId === prior.runId || thread.latestRunId !== thread.activeRunId) return;
  }
  const bucket = usageBucket(input);
  // Old state without session ownership retains its conservative global bucket.
  const lastBucket = state.buckets ? (state.buckets[sessionKey] ?? -1) : state.lastBucket;
  if (bucket < 0 || bucket <= lastBucket) return;

  // Persist before the side effect. Any crash, nonzero exit, malformed receipt,
  // or timeout remains latched as unknown; automatic retry is never safe.
  state.request = { state: 'unknown', runState: 'unknown', bucket, sessionKey, harness, claimedAt: Date.now() };
  saveState(stateFile, state);
  const sendResult = cliJson(cli, ['thread', 'send', threadId, '/compact', '--json']);
  const receipt = sendResult.value;
  if (receipt && receipt.threadId === threadId && typeof receipt.runId === 'string' && receipt.runId.trim() &&
      typeof receipt.messageId === 'string' && receipt.messageId.trim() && RUN_STATUSES.has(receipt.status) &&
      ['queued', 'started'].includes(receipt.delivery)) {
    state.request.state = receipt.delivery === 'queued' ? 'queued' : 'accepted';
    state.request.runId = receipt.runId;
    state.request.delivery = receipt.delivery;
    // Receipt status is not evidence of compaction completion.
    state.request.runState = receipt.status === 'queued' ? 'queued' : 'unknown';
    saveState(stateFile, state);
  } else {
    state.request.sendOutcome = sendResult.failure || 'invalid_receipt';
    saveState(stateFile, state);
  }
}

async function main() {
  const harness = process.argv[2];
  const input = await readStdinJson({ timeoutMs: 1000 });
  const cli = process.env.T3CODE_CLI_PATH;
  const threadId = process.env.T3CODE_THREAD_ID;
  if (!validInput(input, harness) || !cli || !path.isAbsolute(cli) || !threadId ||
      typeof threadId !== 'string' || !threadId.trim() || threadId !== threadId.trim()) return;
  const base = path.join(os.homedir(), '.local', 'state', 'strategic-compact');
  privateDirectory(base);
  const key = crypto.createHash('sha256').update(threadId).digest('hex');
  const stateFile = path.join(base, `${key}.json`);
  const lock = path.join(base, `${key}.lock`);
  const hazard = path.join(base, `${key}.unsafe`);
  try { fs.mkdirSync(lock, { mode: 0o700 }); }
  catch (err) {
    // Missing a native event during contention must not silently permit a send.
    if (input.hook_event_name !== 'Stop') {
      try { fs.closeSync(fs.openSync(hazard, 'wx', 0o600)); } catch { /* already unsafe */ }
    }
    return;
  }
  try { handle(input, harness, cli, threadId, stateFile, hazard); }
  finally { try { fs.rmdirSync(lock); } catch { /* stale lock stays fail-closed */ } }
}

main().catch(() => {}).finally(() => {
  // Claude PreCompact stdout becomes summary instructions; leave it empty.
  if (process.argv[2] === 'codex') process.stdout.write('{}\n');
});
