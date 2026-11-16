// Offline IPC fixture: no browser, server, files, or E2E evidence.
export const contractVersion = process.env.TB_STEP_FIXTURE_MODE === 'agent'
  ? 'test-board-agent-browser-v1' : 'test-board-native-cdp-v1';

const mark = (name, error) => process.send({ type: 'fixture', name, ...(error ? { error: String(error.message || error) } : {}) });

export async function run(api) {
  const { step, cdp, page, command } = api;
  const operation = () => cdp.send('Runtime.evaluate', { expression: '1' }, page.sessionId);
  const scenario = process.env.TB_STEP_FIXTURE_SCENARIO;

  if (scenario === 'agent-start-caught') {
    try {
      await step('first', async () => { mark('forbidden-first-callback'); await command('snapshot'); });
    } catch (error) { mark('first-caught', error); }
    await step('second', async () => { mark('second-callback'); await command('snapshot'); });
  } else if (scenario === 'native-start-uncaught') {
    await step('first', async () => { mark('forbidden-first-callback'); await operation(); });
  } else if (scenario === 'native-start-derived') {
    try {
      await step('first', async () => { mark('forbidden-first-callback'); await operation(); });
    } catch (error) { mark('first-caught', error); }
    try {
      await step('second', async () => { mark('forbidden-second-callback'); await operation(); });
    } catch (error) {
      mark('second-caught', error);
      throw new Error('fixture later derived error');
    }
  } else if (scenario === 'native-start-caught' || scenario === 'native-end-caught') {
    try {
      await step('first', async () => { mark('first-callback'); await operation(); });
    } catch (error) { mark('first-caught', error); }
    try {
      await step('second', async () => { mark('forbidden-second-callback'); await operation(); });
      mark('forbidden-second-passed');
    } catch (error) { mark('second-caught', error); }
    try { await operation(); mark('forbidden-outside-passed'); }
    catch (error) { mark('outside-caught', error); }
  } else if (scenario === 'ordered') {
    cdp.on('fixture.probe', ({ name }) => mark(name));
    await step('ordered', async () => {
      mark('callback');
      await operation();
      mark('first-operation-resolved');
      await operation();
      mark('second-operation-resolved');
    });
  } else if (scenario === 'unawaited') {
    await step('unawaited', async () => { operation(); });
  } else if (scenario === 'parallel') {
    await step('parallel', async () => {
      const first = operation();
      try { operation(); } catch (error) { mark('parallel-caught', error); }
      await first;
    });
  } else if (scenario === 'nested') {
    await step('outer', async () => {
      try { await step('inner', async () => mark('forbidden-inner-callback')); }
      catch (error) { mark('nested-caught', error); }
    });
  } else if (scenario === 'outside') {
    try { await operation(); } catch (error) { mark('outside-caught', error); }
  } else {
    throw new Error('unknown offline IPC fixture scenario');
  }
}
