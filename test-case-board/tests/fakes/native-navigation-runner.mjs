// Offline fake IPC runner. No real input, browser, recording, or E2E evidence.
export const contractVersion = 'test-board-native-cdp-v1';
export async function run({ step, cdp, page }) {
  const scenario = process.env.TB_MOCK_SCENARIO;
  const initial = process.env.TB_MOCK_INITIAL, next = process.env.TB_MOCK_NEXT;
  const input = () => cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1, y: 1 }, page.sessionId);
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
    } else if (scenario === 'undeclared-caught') {
      try { await page.navigate(`${initial}&undeclared=1`); } catch {}
      await input();
    } else { await page.navigate(initial); await page.navigate(next); await input(); }
  });
}
