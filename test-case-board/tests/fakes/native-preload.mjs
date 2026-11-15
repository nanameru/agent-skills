// Offline fake CDP peer injected into the real entrypoint. No browser/server.
import fs from 'node:fs';
import { CDP } from '../../scripts/e2e-native-cdp.mjs';
if (process.env.TB_56_MOCK === '1' && process.argv[1]?.endsWith('/test-board.mjs')) {
  const initial = process.argv[process.argv.indexOf('--url') + 1];
  const fault = process.env.TB_MOCK_FAULT || '';
  const at = Number(process.env.TB_MOCK_AT || 0);
  let url = initial, observations = 0, generation = 0, eventHandlers = new Map();
  const trace = (event) => fs.appendFileSync(process.env.TB_MOCK_TRACE, `${event}\n`);
  function target() { return { type: 'page', targetId: 'fake-target', browserContextId: 'fake-context', url }; }
  CDP.connect = async () => ({
    on(method, fn) { if (!eventHandlers.has(method)) eventHandlers.set(method, new Set()); eventHandlers.get(method).add(fn); return () => eventHandlers.get(method)?.delete(fn); },
    close() {},
    async send(method, params = {}, sid) {
      if (method === 'Target.getTargets') {
        observations++; trace(`observe:${observations}`);
        let page = target();
        if (observations === at && fault === 'target') page = { ...page, targetId: 'other-target' };
        if (observations === at && fault === 'page-swap') page = { ...page, targetId: 'replacement-page' };
        if (observations === at && fault === 'post-url') { url = initial; page = { ...page, url: `${initial}&unexpected=1` }; }
        const targetInfos = [page];
        if (process.env.TB_MOCK_IFRAME === '1') {
          const parent = { type: 'iframe', targetId: `frame-${generation}`, parentId: page.targetId, browserContextId: 'fake-context' };
          const nested = { type: 'iframe', targetId: `nested-${generation}`, parentId: parent.targetId, browserContextId: 'fake-context' };
          const worker = { type: 'service_worker', targetId: 'stable-worker', browserContextId: 'fake-context' };
          if (observations === at) {
            if (fault === 'iframe-parent-missing') delete parent.parentId;
            if (fault === 'iframe-parent-unknown') parent.parentId = 'unknown-parent';
            if (fault === 'iframe-context-missing') delete parent.browserContextId;
            if (fault === 'iframe-context-different') parent.browserContextId = 'other-context';
            if (fault === 'iframe-cycle') parent.parentId = nested.targetId;
            if (fault === 'iframe-intermediate-worker') parent.parentId = worker.targetId;
            if (fault === 'non-iframe-changed') worker.type = 'shared_worker';
            if (fault === 'non-iframe-context') worker.browserContextId = 'other-context';
            if (fault === 'iframe-becomes-worker') parent.type = 'service_worker';
            if (fault === 'new-page') targetInfos.push({ ...page, targetId: 'extra-page' });
            if (fault === 'unknown-target') targetInfos.push({ type: 'iframe', targetId: 'unknown-frame', browserContextId: 'fake-context' });
            if (fault === 'unknown-type') targetInfos.push({ type: 'mystery', targetId: 'unknown-type', browserContextId: 'fake-context' });
          }
          targetInfos.push(parent);
          if (!(observations === at && fault === 'iframe-becomes-worker')) targetInfos.push(nested);
          if (!(observations === at && fault === 'non-iframe-removed')) targetInfos.push(worker);
        }
        if (observations === at && fault === 'target-set') targetInfos.push({ type: 'service_worker', targetId: 'extra' });
        return { targetInfos };
      }
      if (method === 'Target.getBrowserContexts') return { browserContextIds: observations === at && fault === 'context' ? ['other'] : ['fake-context'] };
      if (method === 'Target.attachToTarget') return { sessionId: 'fake-session' };
      if (method === 'Target.getTargetInfo') {
        let page = target();
        if (observations === at && fault === 'session') page = { ...page, targetId: 'other-target' };
        if (observations === at && fault === 'post-url') page = { ...page, url: `${initial}&unexpected=1` };
        return { targetInfo: page };
      }
      if (method === 'Page.enable') return {};
      if (method === 'Page.navigate') {
        trace('dispatch');
        if (fault === 'response-error') return { errorText: 'synthetic failure', frameId: 'frame' };
        if (fault === 'no-commit') return { frameId: 'frame', loaderId: 'loader' };
        await new Promise((resolve) => setTimeout(resolve, 25));
        url = params.url;
        generation++;
        trace('commit');
        for (const fn of eventHandlers.get('Page.frameNavigated') || []) fn({ frame: { id: 'frame', loaderId: 'loader', url } }, sid);
        return { frameId: 'frame', loaderId: 'loader' };
      }
      if (method === 'Runtime.evaluate') return { result: { value: true } };
      if (method.startsWith('Input.')) { trace('input'); return {}; }
      throw new Error(`unexpected fake method ${method}`);
    },
  });
}
