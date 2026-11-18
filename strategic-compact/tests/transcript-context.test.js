'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  DEFAULT_TRANSCRIPT_TAIL_BYTES,
  readLatestContextTokens
} = require('../scripts/lib/transcript-context');

function transcript(t, content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'compact-context-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'synthetic.jsonl');
  fs.writeFileSync(file, content);
  return file;
}

function jsonl(...records) {
  return records.map(record => JSON.stringify(record)).join('\n');
}

function claude(usage, model = 'claude-test') {
  return { type: 'assistant', message: { model, usage } };
}

function event(usage) {
  return {
    type: 'event_msg',
    payload: {
      type: 'token_count',
      info: {
        last_token_usage: usage,
        total_token_usage: { input_tokens: 987654, cached_input_tokens: 654321, total_tokens: 999999 }
      }
    }
  };
}

function usageRecord(usage) {
  return {
    type: 'token_usage_record',
    payload: {
      usage,
      turn_total_tokens: 876543,
      thread_total_tokens: 987654
    }
  };
}

test('Claude sums the three input partitions and ignores output or cumulative totals', t => {
  const file = transcript(t, jsonl(claude({
    input_tokens: 11000,
    cache_read_input_tokens: 22000,
    cache_creation_input_tokens: 33000,
    output_tokens: 777777,
    reasoning_output_tokens: 888888,
    total_tokens: 999999
  })));
  assert.deepEqual(readLatestContextTokens(file), { tokens: 66000, model: 'claude-test' });

  fs.writeFileSync(file, jsonl(claude({ cache_read_input_tokens: 25, cache_creation_input_tokens: 5 })));
  assert.deepEqual(readLatestContextTokens(file), { tokens: 30, model: 'claude-test' });
});

for (const [name, makeRecord] of [
  ['event_msg / token_count', event],
  ['token_usage_record', usageRecord]
]) {
  test(`${name} uses input_tokens once, without cached, output, or cumulative totals`, t => {
    const file = transcript(t, jsonl(makeRecord({
      input_tokens: 41000,
      cached_input_tokens: 30000,
      output_tokens: 555555,
      reasoning_output_tokens: 666666,
      total_tokens: 777777,
      turn_total_tokens: 888888,
      thread_total_tokens: 999999
    })));
    assert.deepEqual(readLatestContextTokens(file), { tokens: 41000, model: '' });
  });

  test(`${name} returns the latest valid smaller record, not an older maximum`, t => {
    const file = transcript(t, [
      jsonl(claude({ input_tokens: 190000 }), makeRecord({ input_tokens: 12000, cached_input_tokens: 8000 })),
      '{broken json',
      jsonl(null, { type: 'unrelated', payload: { input_tokens: 999999 } }),
      ''
    ].join('\n'));
    assert.deepEqual(readLatestContextTokens(file), { tokens: 12000, model: '' });
  });
}

test('a later Claude record takes priority over an older larger Codex record', t => {
  const file = transcript(t, jsonl(event({ input_tokens: 190000 }), claude({
    input_tokens: 3000,
    cache_read_input_tokens: 4000,
    cache_creation_input_tokens: 5000
  })));
  assert.deepEqual(readLatestContextTokens(file), { tokens: 12000, model: 'claude-test' });
});

test('malformed, unrelated, null, and cumulative-only records never mask usable usage', t => {
  const unusable = [
    null,
    [],
    {},
    { type: 'event_msg', payload: null },
    { type: 'event_msg', payload: { type: 'other', info: { last_token_usage: { input_tokens: 999999 } } } },
    { type: 'event_msg', payload: { type: 'token_count', info: { total_token_usage: { input_tokens: 999999 } } } },
    event({ cached_input_tokens: 900000, output_tokens: 800000, reasoning_output_tokens: 700000, total_tokens: 999999 }),
    usageRecord({ cached_input_tokens: 900000, output_tokens: 800000, reasoning_output_tokens: 700000, total_tokens: 999999 }),
    { type: 'token_usage_record', payload: { usage: null, turn: { input_tokens: 999999 }, thread: { input_tokens: 999999 } } },
    claude(null),
    claude({ output_tokens: 999999, total_tokens: 999999 })
  ];
  const file = transcript(t, [jsonl(event({ input_tokens: 12000 })), '{broken json', jsonl(...unusable)].join('\n'));
  assert.deepEqual(readLatestContextTokens(file), { tokens: 12000, model: '' });

  fs.writeFileSync(file, ['{broken json', jsonl(...unusable)].join('\n'));
  assert.equal(readLatestContextTokens(file), null);
  assert.equal(readLatestContextTokens(path.join(path.dirname(file), 'missing.jsonl')), null);
  assert.equal(readLatestContextTokens(null), null);
});

test('invalid token values are skipped instead of masking an older valid record', t => {
  const file = transcript(t, '');
  const invalid = [null, 0, -1, 1.5, '12000', true, [], {}, Number.MAX_SAFE_INTEGER + 1];
  for (const value of invalid) {
    for (const makeRecord of [event, usageRecord]) {
      const bad = makeRecord({ input_tokens: value, cached_input_tokens: 999999 });
      fs.writeFileSync(file, jsonl(claude({ input_tokens: 42 }), bad));
      assert.deepEqual(readLatestContextTokens(file), { tokens: 42, model: 'claude-test' }, `${makeRecord.name}: ${JSON.stringify(value)}`);
    }
  }

  for (const usage of [
    { input_tokens: -1, cache_read_input_tokens: 10 },
    { input_tokens: null, cache_read_input_tokens: 10 },
    { input_tokens: '10', cache_read_input_tokens: 10 },
    { input_tokens: 1.5, cache_creation_input_tokens: 10 },
    { input_tokens: Number.MAX_SAFE_INTEGER, cache_read_input_tokens: 1 }
  ]) {
    fs.writeFileSync(file, jsonl(event({ input_tokens: 42 }), claude(usage)));
    assert.deepEqual(readLatestContextTokens(file), { tokens: 42, model: '' }, JSON.stringify(usage));
  }
});

test('tail reading retains an exact-boundary record and rejects a partial first line', t => {
  const record = JSON.stringify(usageRecord({ input_tokens: 12345 }));
  const suffix = `${record}\n`;
  const tailBytes = Buffer.byteLength(suffix);
  const file = transcript(t, `前の記録\n${suffix}`);
  assert.deepEqual(readLatestContextTokens(file, { tailBytes }), { tokens: 12345, model: '' });

  // The suffix looks like valid JSON, but it is part of a larger malformed line.
  fs.writeFileSync(file, `前${suffix}`);
  assert.equal(readLatestContextTokens(file, { tailBytes }), null);

  // A file exactly as long as the requested tail is not a partial record.
  fs.writeFileSync(file, suffix);
  assert.deepEqual(readLatestContextTokens(file, { tailBytes }), { tokens: 12345, model: '' });
});

test('default tail bound does not reach an older usage beyond 256 KiB', t => {
  assert.equal(DEFAULT_TRANSCRIPT_TAIL_BYTES, 256 * 1024);
  const file = transcript(t, `${jsonl(event({ input_tokens: 12345 }))}\n${'x'.repeat(DEFAULT_TRANSCRIPT_TAIL_BYTES + 10)}`);
  assert.equal(readLatestContextTokens(file), null);
});
