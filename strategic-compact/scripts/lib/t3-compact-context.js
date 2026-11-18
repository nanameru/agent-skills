'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { readFileTail } = require('./file-tail');

const RECENT_MS = 2 * 60 * 1000;
const TAIL_BYTES = 256 * 1024;
const MAX_RECENT_LOGS = 64;
const MAX_BINDING_LOG_BYTES = 12 * 1024 * 1024;
const MIGRATION_WARNING = /^\[\d{2}:\d{2}:\d{2}\.\d+\] WARN \(#\d+\): Database migration history diverges from this build; recorded migration ids are skipped, not reconciled by name\.[ \t]+\{\r?\n(?:^[ \t][^\r\n]*\r?\n)*^\}[ \t]*(?:\r?\n|$)/gm;
const NATIVE_LINE = /^\[([^\]]+)\] NTIVE: (.*)$/;
const THREAD_ENV_KEY = 'shell_environment_policy.set.T3CODE_THREAD_ID';

function parseCliOutput(stdout) {
  // T3 writes the migration warning (including its indented details) to stdout.
  // Parse the entire remaining document so competing receipts and truncated JSON fail.
  return JSON.parse(stdout.replace(MIGRATION_WARNING, ''));
}

function usableThreadId(value) {
  return typeof value === 'string' && value.length > 0 && !/[\s\x00-\x1f\x7f]/.test(value) &&
    !value.startsWith('-');
}

function nativeFrame(line) {
  const match = NATIVE_LINE.exec(line);
  if (!match) return null;
  try {
    const row = JSON.parse(match[2]);
    if (row.provider === 'codex' && row.protocol === 'codex.app-server' &&
        row.kind === 'protocol' && typeof row.providerSessionId === 'string' &&
        row.providerSessionId && row.event?.stage === 'decoded' && row.event.payload) {
      return { epoch: row.providerSessionId, ...row.event, at: Date.parse(match[1]) };
    }
  } catch { /* an incomplete or unrecognized line cannot establish identity */ }
  return null;
}

function activeEpochs(file, input, now) {
  const tail = readFileTail(file, TAIL_BYTES);
  if (!tail) throw Error('unreadable provider log');
  const epochs = new Set();
  for (const line of tail.text.split('\n')) {
    if (!line.includes(input.session_id) || !line.includes(input.turn_id)) continue;
    const frame = nativeFrame(line);
    if (!frame || frame.direction !== 'incoming' || !(frame.at >= now - RECENT_MS && frame.at <= now)) continue;
    const { method, params } = frame.payload;
    if (params?.threadId !== input.session_id) continue;
    if ((method === 'turn/started' && params.turn?.id === input.turn_id) ||
        (['thread/tokenUsage/updated', 'hook/started'].includes(method) && params.turnId === input.turn_id)) {
      epochs.add(frame.epoch);
    }
  }
  return epochs;
}

function findBinding(file, epoch, nativeId) {
  const log = readFileTail(file, MAX_BINDING_LOG_BYTES);
  if (!log || log.truncated) return null;
  const requests = new Map();
  const matches = new Set();
  for (const line of log.text.split('\n')) {
    const frame = nativeFrame(line);
    if (!frame || frame.epoch !== epoch) continue;
    const { id, method, params, result } = frame.payload;
    if (typeof id !== 'number' && typeof id !== 'string') continue;
    if (frame.direction === 'outgoing' && ['thread/start', 'thread/resume'].includes(method)) {
      const threadId = params?.config?.[THREAD_ENV_KEY];
      // Pair the RPC by ID: one app-server can serve several T3 threads.
      requests.set(id, requests.has(id) ? null : threadId);
    } else if (frame.direction === 'incoming' && requests.has(id)) {
      const threadId = requests.get(id);
      requests.delete(id);
      if (result?.thread?.id === nativeId) matches.add(usableThreadId(threadId) ? threadId : null);
    }
  }
  return matches.size === 1 ? matches.values().next().value : null;
}

function resolveCodexThread(input, baseDir, now = Date.now()) {
  if (!path.isAbsolute(baseDir)) return null;
  const directory = path.join(baseDir, 'userdata', 'logs', 'provider');
  try {
    const logs = fs.readdirSync(directory, { withFileTypes: true })
      .filter(entry => entry.isFile() && /^events\..+\.log$/.test(entry.name))
      .map(entry => path.join(directory, entry.name))
      .filter(file => fs.statSync(file).mtimeMs >= now - RECENT_MS);
    if (logs.length > MAX_RECENT_LOGS) return null;

    let observed;
    for (const file of logs) {
      for (const epoch of activeEpochs(file, input, now)) {
        // Two sources claiming the same live native turn are ambiguous.
        if (observed) return null;
        observed = { file, epoch };
      }
    }
    return observed ? findBinding(observed.file, observed.epoch, input.session_id) : null;
  } catch { return null; }
}

function resolveThreadId(input, harness, env = process.env) {
  if (env.T3CODE_THREAD_ID !== undefined) {
    return usableThreadId(env.T3CODE_THREAD_ID) ? env.T3CODE_THREAD_ID : null;
  }
  if (harness !== 'codex') return null;
  return resolveCodexThread(input, env.T3CODE_HOME ?? path.join(os.homedir(), '.t3'));
}

module.exports = { parseCliOutput, resolveCodexThread, resolveThreadId };
