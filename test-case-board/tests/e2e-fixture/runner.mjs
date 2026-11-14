// Real browser fixture: the only browser access is the versioned entrypoint API.
import assert from 'node:assert/strict';

export const contractVersion = 'test-board-agent-browser-v1';

export async function run({ step, command }) {
  const target = new URL(process.env.TB_FIXTURE_URL || '');
  assert.equal(target.protocol, 'http:');
  assert.equal(target.hostname, '127.0.0.1');
  assert.ok(target.port && !target.username && !target.password && !target.hash);
  const scenario = process.env.TB_FIXTURE_SCENARIO;
  assert.ok(['success', 'assertion', 'sigint', 'sigterm', 'timeout'].includes(scenario));

  await step('open-fixture', () => command('open', target.href));
  await step('assert-ready', async () => {
    await command('wait', '--fn', "document.querySelector('#status')?.textContent === 'READY'");
    const { result } = await command('eval', "document.querySelector('#status')?.textContent");
    assert.equal(result, 'READY');
  });
  await step('click-action', () => command('click', '#action'));
  await step('assert-clicked', async () => {
    await command('wait', '--fn', "document.querySelector('#status')?.textContent === 'CLICKED' && window.fixtureReported === true");
    const { result } = await command('eval', "document.querySelector('#status')?.textContent");
    assert.equal(result, 'CLICKED');
  });
  await step('collect-console', async () => {
    const messages = await command('console');
    console.log(`fixture-console=${JSON.stringify(messages)}`);
  });
  if (scenario === 'assertion') {
    await step('intentional-assertion-failure', async () => {
      const { result } = await command('eval', "document.querySelector('#status')?.textContent");
      assert.equal(result, 'INTENTIONALLY-ABSENT', 'intentional fixture assertion');
    });
  }
  if (['sigint', 'sigterm', 'timeout'].includes(scenario)) {
    await step('pending-interruption', async () => {
      // The server sees this request only after record start and this step began.
      // The unresolved promise keeps the step active until the entrypoint stops it.
      await command('eval', `(async () => {
        const url = new URL('/pending', location.href);
        url.search = location.search;
        await fetch(url);
        return await new Promise(() => {});
      })()`);
      throw new Error('pending operation unexpectedly completed');
    });
  }
}
