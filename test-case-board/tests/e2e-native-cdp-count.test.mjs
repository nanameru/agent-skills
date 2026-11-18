// Offline contract tests against the core helpers. The CDP peer is fake;
// these tests do not connect to a browser or produce recording evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import { nativeInputSatisfied, sendNativeOperation } from '../scripts/e2e-native-cdp.mjs';

const inputMethods = [
  'Input.dispatchTouchEvent',
  'Input.dispatchKeyEvent',
  'Input.dispatchMouseEvent',
];

test('Runtime.evaluate and a dispatchEvent expression cannot satisfy the native Input gate', async () => {
  const result = { nativeCdpOperations: 0, nativeInputOperations: 0 };
  const sent = [];
  const cdp = { async send(...args) { sent.push(args); return { result: { value: true } }; } };
  const expressions = ['1', 'document.body.dispatchEvent(new Event("touchstart"))'];

  for (const [index, expression] of expressions.entries()) {
    await sendNativeOperation({ cdp, test: result, method: 'Runtime.evaluate', params: { expression }, sessionId: 'owned', timeoutMs: 3000 });
    assert.equal(result.nativeCdpOperations, index + 1);
    assert.equal(result.nativeInputOperations, 0);
    assert.equal(nativeInputSatisfied(true, result), false);
  }
  assert.deepEqual(sent.map(([method, params]) => [method, params.expression]), expressions.map((expression) => ['Runtime.evaluate', expression]));
  assert.equal(nativeInputSatisfied(false, result), true);
});

test('only successful touch, key, and mouse Input responses increment native Input', async () => {
  const result = { nativeCdpOperations: 0, nativeInputOperations: 0 };
  const response = { acknowledged: true };
  const cdp = { async send() { return response; } };
  const operations = [
    ['Input.dispatchTouchEvent', 1],
    ['Input.dispatchKeyEvent', 2],
    ['Input.dispatchMouseEvent', 3],
    ['Input.insertText', 3],
    ['Input.dispatchDragEvent', 3],
    ['Runtime.evaluate', 3],
  ];

  for (const [index, [method, expectedInputs]] of operations.entries()) {
    const value = await sendNativeOperation({ cdp, test: result, method, params: {}, sessionId: 'owned', timeoutMs: 3000 });
    assert.strictEqual(value, response);
    assert.equal(result.nativeCdpOperations, index + 1);
    assert.equal(result.nativeInputOperations, expectedInputs);
    assert.equal(nativeInputSatisfied(true, result), true);
  }
});

test('failed native Input responses count as attempts, propagate the error, and do not count as Input', async () => {
  const result = { nativeCdpOperations: 0, nativeInputOperations: 0 };
  for (const [index, method] of inputMethods.entries()) {
    const failure = new Error(`failed ${method}`);
    const cdp = { send() { return Promise.reject(failure); } };
    await assert.rejects(
      sendNativeOperation({ cdp, test: result, method, params: {}, sessionId: 'owned', timeoutMs: 3000 }),
      (error) => error === failure,
    );
    assert.equal(result.nativeCdpOperations, index + 1);
    assert.equal(result.nativeInputOperations, 0);
    assert.equal(nativeInputSatisfied(true, result), false);
  }

  // A later failed call must also preserve a previous successful count.
  result.nativeInputOperations = 2;
  const failure = new Error('synchronous send failure');
  const cdp = { send() { throw failure; } };
  await assert.rejects(
    sendNativeOperation({ cdp, test: result, method: inputMethods[0], params: {}, sessionId: 'owned', timeoutMs: 3000 }),
    (error) => error === failure,
  );
  assert.equal(result.nativeCdpOperations, inputMethods.length + 1);
  assert.equal(result.nativeInputOperations, 2);
});

test('an in-flight Input counts as an attempt before it counts as a successful response', async () => {
  const result = { nativeCdpOperations: 0, nativeInputOperations: 0 };
  let resolveResponse;
  const pending = new Promise((resolve) => { resolveResponse = resolve; });
  const cdp = { send() {
    assert.equal(result.nativeCdpOperations, 1);
    assert.equal(result.nativeInputOperations, 0);
    return pending;
  } };
  const operation = sendNativeOperation({ cdp, test: result, method: 'Input.dispatchMouseEvent', params: { type: 'mouseMoved', x: 1, y: 1 }, sessionId: 'owned', timeoutMs: 3000 });
  assert.equal(result.nativeCdpOperations, 1);
  assert.equal(result.nativeInputOperations, 0);
  assert.equal(nativeInputSatisfied(true, result), false);

  const response = { acknowledged: true };
  resolveResponse(response);
  assert.strictEqual(await operation, response);
  assert.equal(result.nativeCdpOperations, 1);
  assert.equal(result.nativeInputOperations, 1);
  assert.equal(nativeInputSatisfied(true, result), true);
});

test('the helper forwards method, parameters, session and timeout to the same CDP peer', async () => {
  const result = { nativeCdpOperations: 0, nativeInputOperations: 0 };
  const calls = [];
  const cdp = { send(...args) { assert.strictEqual(this, cdp); calls.push(args); return Promise.resolve({}); } };
  const params = { type: 'keyDown', key: ' ', code: 'Space' };
  const targetParams = {};
  await sendNativeOperation({ cdp, test: result, method: 'Input.dispatchKeyEvent', params, sessionId: 'owned-session', timeoutMs: 2345 });
  await sendNativeOperation({ cdp, test: result, method: 'Target.getTargets', params: targetParams, sessionId: undefined, timeoutMs: 6789 });
  assert.deepEqual(calls, [
    ['Input.dispatchKeyEvent', params, 'owned-session', 2345],
    ['Target.getTargets', targetParams, undefined, 6789],
  ]);
  assert.strictEqual(calls[0][1], params);
  assert.strictEqual(calls[1][1], targetParams);
  assert.equal(result.nativeCdpOperations, 2);
  assert.equal(result.nativeInputOperations, 1);
});

test('the native Input gate leaves the non-native default unchanged', () => {
  assert.equal(nativeInputSatisfied(false, {}), true);
  assert.equal(nativeInputSatisfied(false, { nativeInputOperations: 0 }), true);
  assert.equal(nativeInputSatisfied(true, { nativeInputOperations: 0 }), false);
  assert.equal(nativeInputSatisfied(true, { nativeInputOperations: -1 }), false);
  assert.equal(nativeInputSatisfied(true, { nativeInputOperations: 1 }), true);
  assert.equal(nativeInputSatisfied(true, { nativeInputOperations: 3 }), true);
});
