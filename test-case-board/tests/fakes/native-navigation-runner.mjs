// Offline fake IPC runner. No real input, browser, recording, or E2E evidence.
export const contractVersion = 'test-board-native-cdp-v1';
export async function run({ step, cdp, page }) {
  const scenario = process.env.TB_MOCK_SCENARIO;
  const initial = process.env.TB_MOCK_INITIAL, next = process.env.TB_MOCK_NEXT;
  const input = () => cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1, y: 1 }, page.sessionId);
  if (scenario === 'start-caught') {
    try { await step('rejected-step', async () => { await input(); }); } catch {}
    try { await step('later-step', async () => { await input(); }); }
    catch { throw new Error('synthetic later error'); }
    return;
  }
  if (scenario === 'start-caught-parent') {
    try { await step('rejected-step', async () => { await input(); }); } catch {}
    // Exercise the parent independently of the real worker's first-failure
    // latch: send a deliberately contradictory later report through its IPC.
    await new Promise((resolve, reject) => {
      const id = 999999;
      const onMessage = (message) => {
        if (message?.type !== 'reply' || message.id !== id) return;
        process.off('message', onMessage);
        if (message.error) reject(new Error(message.error));
        else if (message.value !== true) reject(new Error('parent did not acknowledge the finished report'));
        else resolve();
      };
      process.on('message', onMessage);
      process.send({ type: 'finished', id, status: 'failed', step: 'later-step', error: 'synthetic later error' }, (error) => {
        if (error) { process.off('message', onMessage); reject(error); }
      });
    });
    await new Promise((resolve) => process.stdout.write('{"type":"fixture-parent-finished-ack"}\n', resolve));
    // Prevent the worker from replacing this injected report with its own.
    process.exit(1);
  }
  if (scenario === 'outside') { try { page.navigate(initial); } catch {} }
  await step('mock-step', async () => {
    if (scenario === 'legacy') { await input(); return; }
    if (scenario === 'parallel') {
      const first = page.navigate(initial); try { page.navigate(next); } catch {} await first;
    } else if (scenario === 'unawaited') { page.navigate(initial); }
    else if (scenario?.startsWith('direct-')) {
      try { await cdp.send(scenario.slice(7), { url: next }, page.sessionId); } catch {}
      await input();
    } else if (scenario === 'failure-caught') {
      try { await page.navigate(next); } catch {}
      await input();
    } else if (scenario === 'second-failure-caught') {
      await page.navigate(initial);
      try { await page.navigate(next); } catch {}
      await input();
    } else if (scenario === 'undeclared-caught') {
      try { await page.navigate(`${initial}&undeclared=1`); } catch {}
      await input();
    } else { await page.navigate(initial); await page.navigate(next); await input(); }
  });
}
