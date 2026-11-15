// Offline integration of the actual common entrypoint/worker with fake CLI, CDP,
// and synthetic video. This does not exercise Chrome, capture, or real ownership.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyNativeTargets, navigationURL } from '../scripts/e2e-native-cdp.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const cli = path.join(repo, 'test-case-board/bin/test-board');
const browser = path.join(repo, 'test-case-board/tests/fakes/native-cli.mjs');
const preload = path.join(repo, 'test-case-board/tests/fakes/native-preload.mjs');
const runner = path.join(repo, 'test-case-board/tests/fakes/native-navigation-runner.mjs');
const initial = 'http://127.0.0.1:3010/?run=synthetic';
const next = `${initial}&view=two`;

// The existing fake test root is private and must already exist outside the checkout.
assert.ok(process.env.TB_FAKE_TEST_DIR, 'TB_FAKE_TEST_DIR must name an existing private directory');
const root = await realpath(process.env.TB_FAKE_TEST_DIR);
const rootStat = await stat(root);
assert.ok(rootStat.isDirectory() && !(rootStat.mode & 0o077) && (typeof process.getuid !== 'function' || rootStat.uid === process.getuid()));
assert.ok(root !== repo && !root.startsWith(repo + path.sep));
const batch = path.join(root, `fake-native56-${randomUUID()}`);
await mkdir(batch, { mode: 0o700 });

async function invoke({ scenario = 'normal', fault = '', at = 0, destination = next, declarations = [initial, next], iframe = false } = {}) {
  const trace = path.join(batch, `trace-${randomUUID()}`);
  const names = ['PATH', 'HOME', 'USER', 'TMPDIR', 'TMP', 'TEMP', 'LANG', 'LC_ALL', 'TZ', 'SYSTEMROOT', 'WINDIR'];
  const env = Object.fromEntries(names.filter((k) => process.env[k] !== undefined).map((k) => [k, process.env[k]]));
  Object.assign(env, { NODE_OPTIONS: `--import=${preload}`, TB_56_MOCK: '1', TB_MOCK_TRACE: trace,
    TB_MOCK_SCENARIO: scenario, TB_MOCK_FAULT: fault, TB_MOCK_AT: String(at), TB_MOCK_INITIAL: initial, TB_MOCK_NEXT: destination,
    TB_MOCK_IFRAME: iframe ? '1' : '0' });
  const args = ['e2e', '--provider', 'native-cdp', '--case', 'TC-056-MOCK', '--runner', runner, '--browser', browser,
    '--chrome', process.execPath, '--url', initial, '--evidence-dir', batch, '--data-kind', 'fixture', '--issue', '56',
    '--environment', 'offline fake CDP and synthetic video', '--timeout-ms', '30000',
    ...declarations.flatMap((url) => ['--allow-url', url])];
  const child = spawn(cli, args, { cwd: repo, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '', stderr = '';
  child.stdout.on('data', (s) => { stdout += s; }); child.stderr.on('data', (s) => { stderr += s; });
  const exit = await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', (code, signal) => resolve({ code, signal })); });
  const lines = stdout.trim().split('\n').filter(Boolean);
  assert.ok(lines.length, `entrypoint did not save a result: ${stderr}`);
  const output = JSON.parse(lines.at(-1));
  const result = JSON.parse(await readFile(path.join(batch, output.result), 'utf8'));
  const log = (await readFile(path.join(batch, path.dirname(output.result), 'run.log'), 'utf8')).split('\n').flatMap((line) => { try { return [JSON.parse(line)]; } catch { return []; } });
  let calls = []; try { calls = (await readFile(trace, 'utf8')).trim().split('\n'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  return { exit, result, log, calls };
}

test('URL declarations normalize exactly and reject non-loopback, different origin, credentials and patterns', () => {
  const origin = 'http://localhost:3000';
  assert.equal(navigationURL('HTTP://LOCALHOST:3000/a/../b?x=1#part', origin), 'http://localhost:3000/b?x=1#part');
  // '@' in a query or fragment without an explicit path is not userinfo.
  assert.equal(navigationURL('http://localhost:3000?view=a@b', origin), 'http://localhost:3000/?view=a@b');
  assert.equal(navigationURL('http://localhost:3000#part@two', origin), 'http://localhost:3000/#part@two');
  for (const value of [
    'http://localhost:3001/b', 'http://127.0.0.1:3000/b', 'https://localhost:3000/b',
    'http://user:pass@localhost:3000/b', 'http://@localhost:3000/b', 'http://localhost:3000/*',
    'http://localhost:3000/a b', '/relative', 'file:///tmp/x', 'http://example.com:3000/b',
  ]) assert.throws(() => navigationURL(value, origin), value);
  assert.notEqual(navigationURL('http://localhost:3000/b?x=2', origin), navigationURL('http://localhost:3000/b?x=1', origin));
  assert.notEqual(navigationURL('http://localhost:3000/b#other', origin), navigationURL('http://localhost:3000/b', origin));
});

test('entrypoint rejects more than 100 URL declarations before creating a run', async () => {
  const args = ['e2e', '--provider', 'native-cdp', '--case', 'TC-056-MOCK', '--runner', runner,
    '--browser', browser, '--chrome', process.execPath, '--url', initial, '--evidence-dir', batch,
    '--data-kind', 'fixture', ...Array.from({ length: 101 }, () => ['--allow-url', initial]).flat()];
  const child = spawn(cli, args, { cwd: repo, stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = ''; child.stdout.on('data', (s) => { stdout += s; }); child.stderr.resume();
  const exit = await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', (code, signal) => resolve({ code, signal })); });
  assert.deepEqual(exit, { code: 1, signal: null }); assert.equal(stdout, '');
});

test('without opt-in the original exact URL path remains usable and navigation is unavailable', async () => {
  const old = await invoke({ scenario: 'legacy', declarations: [] });
  assert.equal(old.exit.code, 0); assert.equal(old.result.test.status, 'passed');
  assert.equal(old.result.steps.flatMap((s) => s.navigations || []).length, 0);
  const mismatch = await invoke({ scenario: 'legacy', fault: 'post-url', at: 4, declarations: [] });
  assert.notEqual(mismatch.result.test.status, 'passed'); assert.equal(mismatch.calls.includes('input'), false);
  const rejected = await invoke({ scenario: 'failure-caught', declarations: [] });
  assert.equal(rejected.exit.code, 1); assert.equal(rejected.result.test.status, 'failed');
  assert.equal(rejected.calls.includes('dispatch'), false);
  assert.equal(rejected.result.steps[0].navigations[0].status, 'failed');
  assert.match(rejected.result.steps[0].navigations[0].error, /not declared/);
});

test('normalized declaration matches its equivalent requested URL', async () => {
  const out = await invoke({ declarations: ['http://127.0.0.1:3010/x/../?run=synthetic', next] });
  assert.equal(out.exit.code, 0); assert.equal(out.result.test.status, 'passed');
});

for (const destination of [`${initial}&view=other`, `${initial}#other`, 'http://127.0.0.1:3011/',
  'http://localhost:3010/', 'http://user:pass@127.0.0.1:3010/']) {
  test(`rejects undeclared or invalid destination ${destination}`, async () => {
    const out = await invoke({ scenario: 'failure-caught', destination });
    assert.equal(out.exit.code, 1); assert.equal(out.calls.includes('dispatch'), false);
    assert.equal(out.result.steps[0].navigations[0].status, 'failed');
    assert.equal(out.result.steps[0].status, 'passed');
  });
}

test('same URL reload and query navigation commit before URL and ownership observation', async () => {
  const out = await invoke();
  assert.equal(out.exit.code, 0); assert.equal(out.result.test.status, 'passed');
  const navs = out.result.steps[0].navigations;
  assert.deepEqual(navs.map((n) => [n.requestedURL, n.observedURL, n.status]), [[initial, initial, 'passed'], [next, next, 'passed']]);
  assert.deepEqual(out.calls.slice(0, 11), ['observe:1', 'observe:2', 'observe:3', 'observe:4', 'observe:5', 'dispatch', 'commit', 'observe:6', 'observe:7', 'dispatch', 'commit']);
  assert.ok(out.calls.indexOf('observe:8') > out.calls.lastIndexOf('commit'));
  const phases = out.log.filter((e) => e.type === 'native-observation').map((e) => e.phase);
  assert.deepEqual(phases.slice(0, 4), ['initial-target', 'before-record-start', 'after-record-start', 'step-before']);
  assert.deepEqual(phases.slice(4, 8), ['navigation-before', 'navigation-after', 'navigation-before', 'navigation-after']);
});

test('only an explicit, same-context iframe parent chain to the owned page is exempt', () => {
  const page = { type: 'page', targetId: 'page', browserContextId: 'context' };
  const parent = { type: 'iframe', targetId: 'parent', parentId: 'page', browserContextId: 'context' };
  const child = { type: 'iframe', targetId: 'child', parentId: 'parent', browserContextId: 'context' };
  const worker = { type: 'service_worker', targetId: 'worker', browserContextId: 'context' };
  const classify = (infos, owned = page) => classifyNativeTargets({ targetInfos: infos }, owned);
  const result = classify([child, worker, page, parent]);
  assert.deepEqual(result.fixedTargets, [['page', 'page', 'context'], ['worker', 'service_worker', 'context']]);
  assert.deepEqual(result.ownedIframes.map((i) => i.targetId).sort(), ['child', 'parent']);
  assert.deepEqual(result.ownedIframes.find((i) => i.targetId === 'child').chain.map((i) => i.targetId), ['child', 'parent', 'page']);
  assert.deepEqual(result.unprovenIframes, []);
  const changed = classify([page, worker, { ...parent, targetId: 'new-parent' }, { ...child, targetId: 'new-child', parentId: 'new-parent' }]);
  assert.deepEqual(changed.fixedTargets, result.fixedTargets);
  assert.equal(changed.ownedIframes.length, 2);
  for (const [label, infos, owned] of [
    ['page context absent', [{ ...page, browserContextId: undefined }, parent, child], { ...page, browserContextId: undefined }],
    ['owned page context differs', [{ ...page, browserContextId: 'other' }, parent, child], page],
    ['child context absent', [page, parent, { ...child, browserContextId: undefined }], page],
    ['child context empty', [page, parent, { ...child, browserContextId: '' }], page],
    ['intermediate context absent', [page, { ...parent, browserContextId: undefined }, child], page],
    ['child context differs', [page, parent, { ...child, browserContextId: 'other' }], page],
    ['intermediate context differs', [page, { ...parent, browserContextId: 'other' }, child], page],
    ['missing parent ID', [page, parent, { ...child, parentId: undefined }], page],
    ['parentFrameId is not parentId', [page, parent, { ...child, parentId: undefined, parentFrameId: 'parent' }], page],
    ['openerId is not parentId', [page, parent, { ...child, parentId: undefined, openerId: 'parent' }], page],
    ['unknown parent ID', [page, parent, { ...child, parentId: 'unknown' }], page],
    ['owned page unavailable', [parent, child], page],
    ['cycle', [page, { ...parent, parentId: 'child' }, child], page],
    ['non-iframe intermediate', [page, worker, { ...child, parentId: 'worker' }], page],
  ]) {
    const classified = classify(infos, owned);
    assert.ok(classified.unprovenIframes.some((i) => i.targetId === 'child'), label);
    assert.ok(!classified.ownedIframes.some((i) => i.targetId === 'child'), label);
  }
  for (const infos of [[page, parent, { ...child, targetId: '' }], [page, parent, { ...child, targetId: 'parent' }]]) {
    assert.throws(() => classify(infos), /invalid or duplicate target ID/);
  }
});

test('fake CDP entrypoint permits only proven iframe regeneration and updates the URL after both guards', async () => {
  const out = await invoke({ iframe: true });
  assert.equal(out.exit.code, 0); assert.equal(out.result.test.status, 'passed');
  assert.deepEqual(out.result.steps[0].navigations.map((n) => [n.requestedURL, n.observedURL, n.status]), [[initial, initial, 'passed'], [next, next, 'passed']]);
  const classified = out.log.filter((e) => e.type === 'native-target-classification');
  assert.ok(classified.length >= 9);
  assert.ok(classified.every((e) => e.ownedIframes.length === 2 && e.unprovenIframes.length === 0));
  assert.deepEqual(classified.find((e) => e.phase === 'navigation-before').ownedIframes.map((i) => i.targetId), ['frame-0', 'nested-0']);
  assert.deepEqual(classified.filter((e) => e.phase === 'navigation-after').map((e) => e.ownedIframes[0].targetId), ['frame-1', 'frame-2']);
  assert.ok(out.log.some((e) => e.type === 'native-observation' && e.phase === 'step-after' && e.targets.targetInfos.find((t) => t.type === 'page')?.url === next));
});

const ownershipFaults = [
  ['iframe-parent-missing', /native iframe ownership or context unproven/],
  ['iframe-parent-unknown', /native iframe ownership or context unproven/],
  ['iframe-context-missing', /native iframe ownership or context unproven/],
  ['iframe-context-different', /native iframe ownership or context unproven/],
  ['iframe-cycle', /native iframe ownership or context unproven/],
  ['iframe-intermediate-worker', /native iframe ownership or context unproven/],
  ['new-page', /CDP must report one page target/],
  ['page-swap', /native target set changed/],
  ['unknown-target', /native iframe ownership or context unproven/],
  ['unknown-type', /native target set changed/],
  ['non-iframe-changed', /native target set changed/],
  ['non-iframe-removed', /native target set changed/],
  ['non-iframe-context', /native target set changed/],
  ['iframe-becomes-worker', /native target set changed/],
  ['session', /native owned session changed/],
  ['context', null],
  // Endpoint faults count the initial endpoint lookup as well as observations.
  ['endpoint', /native endpoint changed/],
  ['browser', /native endpoint changed/],
];
for (const [fault, expectedError] of ownershipFaults) {
  test(`fake CDP entrypoint refuses ${fault} after navigation and retains the previous expected URL`, async () => {
    const at = ['endpoint', 'browser'].includes(fault) ? 9 : 8;
    const out = await invoke({ scenario: 'second-failure-caught', iframe: true, fault, at });
    assert.equal(out.exit.code, 1); assert.equal(out.result.test.status, 'failed');
    const step = out.result.steps[0];
    assert.deepEqual(step.navigations.map((n) => n.status), ['passed', 'failed']);
    assert.equal(step.navigations[1].requestedURL, next);
    if (expectedError) assert.match(step.navigations[1].error, expectedError);
    else assert.ok(step.navigations[1].error);
    if (fault === 'context') assert.ok(out.log.some((entry) => entry.type === 'native-observation' && entry.phase === 'navigation-after' && entry.contexts.browserContextIds[0] === 'other'));
    assert.equal(out.calls.filter((call) => call === 'dispatch').length, 2);
    assert.equal(step.status, 'failed');
    assert.match(step.error, /active target must be the fixture/);
    assert.notEqual(out.result.recording.targetContinuity, 'passed');
  });
}

for (const [fault, expectedError] of ownershipFaults) {
  test(`fake CDP entrypoint refuses ${fault} before dispatch`, async () => {
    const at = ['endpoint', 'browser'].includes(fault) ? 6 : 5;
    const out = await invoke({ scenario: 'failure-caught', iframe: true, fault, at });
    assert.equal(out.exit.code, 1); assert.equal(out.result.test.status, 'failed');
    assert.equal(out.calls.includes('dispatch'), false);
    assert.equal(out.result.steps[0].navigations[0].status, 'failed');
    if (expectedError) assert.match(out.result.steps[0].navigations[0].error, expectedError);
    else assert.ok(out.result.steps[0].navigations[0].error);
    if (fault === 'context') assert.ok(out.log.some((entry) => entry.type === 'native-observation' && entry.phase === 'navigation-before' && entry.contexts.browserContextIds[0] === 'other'));
    assert.equal(out.result.steps[0].status, 'passed', 'old URL remains valid at the next boundary');
  });
}

test('caught undeclared request fails overall without dispatch or updating the expected URL', async () => {
  const out = await invoke({ scenario: 'undeclared-caught' });
  assert.equal(out.exit.code, 1); assert.equal(out.result.test.status, 'failed');
  assert.equal(out.calls.includes('dispatch'), false); assert.equal(out.result.steps[0].status, 'passed');
  assert.equal(out.result.steps[0].navigations[0].observedURL, null);
  assert.ok(out.log.some((e) => e.type === 'native-observation' && e.phase === 'step-after'));
});

for (const fault of ['response-error', 'no-commit', 'post-url']) {
  test(`failed ${fault} does not update the expected URL, even when caught`, async () => {
    const out = await invoke({ scenario: 'failure-caught', fault, at: fault === 'post-url' ? 6 : 0 });
    assert.equal(out.exit.code, 1); assert.equal(out.result.test.status, 'failed');
    assert.equal(out.result.steps[0].navigations[0].status, 'failed');
    assert.equal(out.result.steps[0].status, 'passed', 'old expected URL must still match the next step boundary');
    if (fault === 'no-commit') assert.match(out.result.steps[0].navigations[0].error, /commit/);
    if (fault === 'post-url') assert.match(out.result.steps[0].navigations[0].error, /did not reach/);
  });
}

for (const [fault, at] of [['endpoint', 2], ['browser', 3], ['endpoint', 3], ['target', 4], ['context', 5], ['target-set', 5], ['session', 6]]) {
  test(`ownership fault ${fault} at observation ${at} stops the real entrypoint`, async () => {
    const out = await invoke({ scenario: 'failure-caught', fault, at });
    assert.equal(out.exit.code, 1); assert.notEqual(out.result.test.status, 'passed');
    if (at < 6) assert.equal(out.calls.includes('dispatch'), false);
    assert.notEqual(out.result.recording.targetContinuity, 'passed');
    if (fault === 'session' && at === 6) {
      // The fake committed the new URL, but the post-navigation session probe
      // failed. The next boundary must still compare against the old URL.
      assert.match(out.result.steps[0].navigations[0].error, /native owned session changed/);
      assert.equal(out.result.steps[0].status, 'failed');
      assert.match(out.result.steps[0].error, /active target must be the fixture/);
    }
  });
}

for (const scenario of ['outside', 'parallel', 'unawaited', 'direct-Page.navigate', 'direct-Page.reload', 'direct-Page.navigateToHistoryEntry']) {
  test(`worker/entrypoint rejects navigation contract violation ${scenario}`, async () => {
    const out = await invoke({ scenario });
    assert.equal(out.exit.code, 1); assert.equal(out.result.test.status, 'failed');
    if (scenario.startsWith('direct-')) assert.equal(out.calls.includes('dispatch'), false);
  });
}
