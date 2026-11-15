#!/usr/bin/env node
// Offline CLI double; synthetic media remains the existing fake's responsibility.
import fs from 'node:fs';
const args = process.argv.slice(2);
const pos = args.indexOf('--json');
const cmd = pos < 0 ? [] : args.slice(pos + 1);
if (cmd[0] === '--profile') {
  console.log(JSON.stringify({ success: true, data: {} }));
} else if (cmd[0] === 'get' && cmd[1] === 'cdp-url') {
  const file = 'fake-cdp-count';
  let n = 0; try { n = Number(fs.readFileSync(file, 'utf8')); } catch {}
  n++; fs.writeFileSync(file, String(n));
  const changed = process.env.TB_MOCK_FAULT === 'endpoint' && n === Number(process.env.TB_MOCK_AT);
  const browserChanged = process.env.TB_MOCK_FAULT === 'browser' && n === Number(process.env.TB_MOCK_AT);
  console.log(JSON.stringify({ success: true, data: { cdpUrl: `ws://127.0.0.1:${changed ? 9223 : 9222}/devtools/browser/${browserChanged ? 'other' : 'fake'}` } }));
} else {
  await import('./agent-browser.mjs');
}
