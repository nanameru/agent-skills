// Unit/integration boundary double. No browser is launched.
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
export const contractVersion = 'test-board-agent-browser-v1';
export async function run({ step, command }) {
  if (process.env.TB_FAKE_SCENARIO === 'inflight-sigint') {
    process.once('SIGTERM', () => {
      writeFileSync(path.join(process.env.TB_FAKE_ACTION_GATE, 'worker-sigterm'), 'SIGTERM\n', { flag: 'wx', mode: 0o600 });
      process.kill(process.pid, 'SIGTERM');
    });
  }
  await step('fake-command', async () => {
    const { result } = await command('eval', "'READY'");
    assert.equal(result, 'READY');
  });
  if (process.env.TB_FAKE_SCENARIO === 'inflight-sigint') {
    await step('inflight-action', () => command('eval', "'INFLIGHT'"));
  }
  if (process.env.TB_FAKE_SCENARIO === 'assertion') {
    await step('intentional-assertion-failure', async () => assert.equal('actual', 'expected', 'intentional fake assertion'));
  }
  if (process.env.TB_FAKE_SCENARIO === 'global-auto-connect') {
    await step('unsupported-global-auto-connect', () => command('open', 'http://127.0.0.1/', '--auto-connect'));
  }
  if (process.env.TB_FAKE_SCENARIO === 'global-config') {
    await step('unsupported-global-config', () => command('open', 'http://127.0.0.1/', '--config=untrusted.json'));
  }
  if (process.env.TB_FAKE_SCENARIO === 'session') {
    await step('unsupported-session', () => command('open', 'http://127.0.0.1/', '--session=other'));
  }
}
