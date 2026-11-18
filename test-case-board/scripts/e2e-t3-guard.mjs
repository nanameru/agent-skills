// A single-run, in-process protocol guard. Only the harness dispatches T3 tools.
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createInterface } from 'node:readline';
import { isDeepStrictEqual } from 'node:util';
import { receipt, finalize } from './e2e-t3-lifecycle.mjs';

const id = value => typeof value === 'string' && value.trim().length > 0;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const time = value => typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(value) && Number.isFinite(Date.parse(value));
const fail = message => { throw new Error(message); };
const equal = isDeepStrictEqual;
const owns = (c, tab) => c?.available === true && c.tabId === tab && c.control?.ownedByCaller === true && c.control?.owner === 'agent' && Array.isArray(c.tabs) && c.tabs.some(t => t.tabId === tab && t.ownedByCaller === true && t.owner === 'agent');
const steps = new Set(['preview_act', 'preview_evaluate', 'preview_snapshot', 'preview_screenshot']);

export async function createGuard(runDir) {
  const dir = await fs.realpath(runDir), st = await fs.stat(dir);
  if (!st.isDirectory() || st.mode & 0o077 || (process.getuid && st.uid !== process.getuid())) fail('run directory must be owner-only');
  const meta = JSON.parse(await fs.readFile(path.join(dir, 'run.json'), 'utf8'));
  if (meta.schema !== 'test-board-t3-run-v1' || path.basename(dir) !== `${meta.caseId}-${meta.runId}`) fail('invalid run directory');
  if ((await fs.readFile(path.join(dir, 'run.log'), 'utf8')).length) fail('guard requires an empty run journal');
  try { await fs.access(path.join(dir, 'result.json')); fail('run already finalized'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  // Never remove this marker: an interrupted guard cannot start a second writer.
  await fs.writeFile(path.join(dir, 'guard-owner'), 'single guarded session\n', { flag: 'wx', mode: 0o600 });

  let stage = 'initial', tab = null, priorTabs = null, ticket = null, operation = null;
  let previous = 0, testWritten = false, poisoned = false, stepFailed = false, stopIssued = false, closed = false;
  const calls = new Set(), responses = new Set(), operations = new Set();
  const atNow = () => new Date(Math.max(Date.now(), previous)).toISOString();
  const persist = entry => receipt(dir, entry);
  async function poison(message, details = null, when = null, interruption = null) {
    if (closed) return;
    poisoned = true;
    ticket = null;
    // A second test entry intentionally makes the original analyzer fail if a
    // protocol fault occurs after the test was already recorded as passing.
    const observedAt = time(when) && Date.parse(when) >= previous ? when : atNow();
    await persist({ kind: 'test', at: observedAt,
      status: 'failed', exitCode: 1, signal: null, interruption,
      guardFailure: { message, details } });
    previous = Date.parse(observedAt);
    testWritten = true;
  }
  function issue(tool, args, boundary, op = null) {
    ticket = { ticketId: randomUUID(), runId: meta.runId, tool, arguments: args,
      boundary, operationId: op?.operationId ?? null };
    return { ticket };
  }
  function issueBoundary(boundary) {
    const op = operation;
    if (boundary === 'before' || boundary === 'after') return issue('preview_status', { tabId: tab }, boundary, op);
    if (op.kind === 'stop') stopIssued = true;
    return issue(op.tool, op.arguments, 'operation', op);
  }
  function setupOperation(kind, command, emergency = false) {
    const operationId = randomUUID();
    if (!id(operationId) || operations.has(operationId)) fail('missing or duplicate operationId');
    operations.add(operationId);
    let tool, args, stepId;
    if (kind === 'step') {
      if (!id(command.stepId)) fail('stepId is required before dispatch');
      if (!steps.has(command.tool)) fail('unsupported step tool');
      if (!object(command.arguments)) fail('step arguments required');
      if (command.arguments.tabId !== undefined && command.arguments.tabId !== tab) fail('step tab mismatch');
      tool = command.tool; args = { ...command.arguments, tabId: tab }; stepId = command.stepId;
    } else {
      tool = kind === 'start' ? 'preview_recording_start' : 'preview_recording_stop';
      args = { tabId: tab };
    }
    operation = { kind, operationId, tool, arguments: args, stepId };
    return issueBoundary(emergency ? 'operation' : 'before');
  }
  async function begin(command) {
    if (ticket) fail('previous tool call is still pending');
    if (command.kind === 'stop' && tab && !closed) {
      if (!testWritten) fail('test receipt required before stop');
      if (stage === 'done' || stage === 'stopping') fail('stop already dispatched');
      stage = 'stopping';
      return setupOperation('stop', command);
    }
    if (poisoned || stepFailed) fail('run failed; only cleanup is permitted');
    if (command.kind === 'initial' && stage === 'initial') return issue('preview_status', {}, 'initial');
    if (command.kind === 'open' && stage === 'status') {
      if (!object(command.arguments) || command.arguments.reuseExistingTab !== false || command.arguments.tabId !== undefined) fail('open must request a new tab');
      return issue('preview_open', command.arguments, 'open');
    }
    if (command.kind === 'start' && stage === 'opened') return setupOperation('start', command);
    if (command.kind === 'step' && stage === 'started' && !testWritten) return setupOperation('step', command);
    fail('operation is out of sequence');
  }
  async function accept(envelope) {
    if (!ticket) fail('no pending ticket');
    if (!object(envelope) || !equal(envelope.ticket, ticket)) fail('ticket, boundary, operationId, run, tool or arguments mismatch');
    if (envelope.tool !== ticket.tool) fail('actual tool does not match ticket');
    if (!id(envelope.callId) || !id(envelope.responseId)) fail('callId and responseId are required');
    if (calls.has(envelope.callId) || responses.has(envelope.responseId)) fail('duplicate callId or responseId');
    if (!time(envelope.startedAt) || !time(envelope.finishedAt) || Date.parse(envelope.startedAt) > Date.parse(envelope.finishedAt) || Date.parse(envelope.startedAt) < previous) fail('call timestamps missing or out of order');
    if (!object(envelope.response) || (envelope.response.isError !== undefined && typeof envelope.response.isError !== 'boolean')) fail('invalid actual response');
    const response = envelope.response, ok = response.isError !== true, content = response.structuredContent;
    if (ok && !object(content)) fail('successful response lacks structuredContent');
    const { boundary, tool, operationId } = ticket;
    if (boundary === 'operation' && operation.kind === 'step') {
      if (!['passed', 'failed'].includes(envelope.outcome) || (!ok && envelope.outcome !== 'failed')) fail('step outcome missing or invalid');
    }
    if (boundary === 'initial' && (!ok || !((content.available === false && content.tabId === null && content.tabs === undefined) || (content.available === true && Array.isArray(content.tabs))))) fail('initial status failed or incomplete');
    if (boundary === 'open' && (!ok || !id(content.tabId) || priorTabs.has(content.tabId) || !owns(content, content.tabId))) fail('open did not create an owned tab');
    if ((boundary === 'before' || boundary === 'after') && (!ok || !owns(content, tab))) fail('status target or ownership mismatch');
    if (boundary === 'operation' && operation.kind === 'start' && ok && (content.tabId !== tab || content.recording !== true || !time(content.startedAt))) fail('invalid recording start response');
    if (boundary === 'operation' && operation.kind === 'stop' && ok && (content.tabId !== tab || content.mimeType !== 'video/mp4' || !id(content.path) || !(content.sizeBytes > 0))) fail('invalid recording stop response');

    calls.add(envelope.callId); responses.add(envelope.responseId); previous = Date.parse(envelope.finishedAt);
    const common = { at: envelope.finishedAt, ok, startedAt: envelope.startedAt,
      call: { ticket, tool: envelope.tool, callId: envelope.callId, responseId: envelope.responseId, actualResponse: response } };
    if (ok) common.structuredContent = content; else common.error = response;
    if (boundary === 'initial') {
      await persist({ kind: 'status', ...common });
      priorTabs = new Set((content.tabs || []).map(t => t.tabId)); stage = 'status'; ticket = null; return { accepted: true };
    }
    if (boundary === 'open') {
      await persist({ kind: 'open', ...common, arguments: ticket.arguments });
      tab = content.tabId; stage = 'opened'; ticket = null; return { accepted: true, tabId: tab };
    }
    if (boundary === 'before' || boundary === 'after') {
      await persist({ kind: 'status', ...common, position: boundary, operationId });
      ticket = null;
      if (boundary === 'before') return issueBoundary('operation');
      const kind = operation.kind;
      operation = null;
      if (kind === 'start') stage = 'started';
      if (kind === 'stop') stage = 'done';
      return { accepted: true };
    }
    const entry = { kind: operation.kind, ...common, operationId };
    if (operation.kind === 'step') {
      entry.stepId = operation.stepId; entry.tool = tool; entry.outcome = envelope.outcome;
      if (envelope.outcome === 'failed') stepFailed = true;
    }
    await persist(entry);
    ticket = null;
    if (!ok) stepFailed = true;
    // Even an unsuccessful tool call receives a fresh after-status before cleanup.
    return issueBoundary('after');
  }
  async function testResult(value) {
    if (ticket || stage !== 'started' || testWritten || poisoned) fail('test is out of sequence');
    if (!object(value) || !['passed','failed','not-run'].includes(value.status) || !(value.exitCode === null || Number.isInteger(value.exitCode)) || !(value.signal === null || typeof value.signal === 'string') || !Object.hasOwn(value, 'interruption') || !time(value.at) || Date.parse(value.at) < previous) fail('invalid test result');
    if (stepFailed && value.status === 'passed') fail('failed step cannot produce a passed test');
    await persist({ ...value, kind: 'test' });
    previous = Date.parse(value.at); testWritten = true;
    return { accepted: true };
  }
  async function handle(command) {
    if (closed) throw new Error('guard already finalized');
    try {
      if (!object(command)) fail('command must be an object');
      if (command.action === 'begin') return await begin(command);
      if (command.action === 'accept') return await accept(command.envelope);
      if (command.action === 'test') return await testResult(command.result);
      // If a pre-stop status cannot be accepted, do not trap an active recording.
      // This intentionally leaves the old analyzer's before/after violation intact.
      if (command.action === 'cleanup') {
        if (!poisoned || !testWritten || !tab || stopIssued || ticket) fail('emergency cleanup unavailable');
        stage = 'stopping';
        return setupOperation('stop', command, true);
      }
      if (command.action === 'abort') {
        if (!object(command.error) || !id(command.error.name) || !time(command.at) || Date.parse(command.at) < previous) fail('abort requires name and observation time');
        await poison(`interrupted: ${command.error.name}`, command.error, command.at,
          { reason: command.error.name, observedAt: command.at });
        return { accepted: true, cleanupRequired: !!tab };
      }
      if (command.action === 'finalize') {
        if (!testWritten) await poison('finalize before test');
        closed = true;
        return await finalize(dir);
      }
      fail('unknown guard action');
    } catch (error) {
      await poison(error.message, command?.action === 'accept' ? command.envelope : null);
      throw error;
    }
  }
  return { handle };
}

// NDJSON: each input line produces one output line. It never calls a T3 tool.
export async function guardCli(runDir) {
  const guard = await createGuard(runDir);
  const lines = createInterface({ input: process.stdin, crlfDelay: Infinity });
  for await (const line of lines) {
    try {
      let command;
      try { command = JSON.parse(line); } catch { command = null; }
      process.stdout.write(JSON.stringify({ ok: true, result: await guard.handle(command) }) + '\n');
    }
    catch (error) { process.stdout.write(JSON.stringify({ ok: false, error: error.message }) + '\n'); }
  }
}
