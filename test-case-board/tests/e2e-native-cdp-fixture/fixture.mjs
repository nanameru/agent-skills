// Observes actual DOM events only. It never synthesizes input events.
const surface = document.querySelector('#surface');
const labels = Object.fromEntries(['touch', 'space', 'pan', 'zoom'].map((id) => [id, document.getElementById(id)]));
const state = { events: [], space: false, view: { x: 0, y: 0, zoom: 1 } };
window.nativeFixture = state;
const note = (event, extra = {}) => state.events.push({ type: event.type, trusted: event.isTrusted, ...extra });
let dragging = null;

for (const type of ['touchstart', 'touchend', 'touchcancel']) {
  surface.addEventListener(type, (event) => {
    note(event, { touches: event.touches.length, changed: event.changedTouches.length });
    labels.touch.textContent = `${event.type}: ${event.isTrusted ? 'trusted' : 'untrusted'}`;
  }, { passive: true });
}
for (const type of ['pointerdown', 'pointerup', 'pointercancel']) {
  surface.addEventListener(type, (event) => {
    note(event, { pointerType: event.pointerType, button: event.button, buttons: event.buttons });
    if (type === 'pointercancel' && event.pointerType === 'touch') {
      labels.touch.textContent = `touch cancelled, pointercancel: ${event.isTrusted ? 'trusted' : 'untrusted'}`;
    }
  });
}
window.addEventListener('keydown', (event) => {
  if (event.code !== 'Space') return;
  event.preventDefault();
  state.space = true;
  note(event, { key: event.key, code: event.code, keyCode: event.keyCode });
});
window.addEventListener('keyup', (event) => {
  if (event.code !== 'Space') return;
  event.preventDefault();
  note(event, { key: event.key, code: event.code, keyCode: event.keyCode });
  state.space = false;
});
surface.addEventListener('mousedown', (event) => {
  note(event, { x: event.clientX, y: event.clientY, button: event.button, buttons: event.buttons, space: state.space });
  if (event.button === 0) dragging = { x: event.clientX, y: event.clientY };
});
window.addEventListener('mousemove', (event) => {
  if (!dragging) return;
  state.view.x += event.clientX - dragging.x;
  state.view.y += event.clientY - dragging.y;
  dragging = { x: event.clientX, y: event.clientY };
  note(event, { x: event.clientX, y: event.clientY, buttons: event.buttons, viewX: state.view.x, viewY: state.view.y });
  labels.pan.textContent = `Moving: ${Math.round(state.view.x)}, ${Math.round(state.view.y)}`;
});
window.addEventListener('mouseup', (event) => {
  if (!dragging) return;
  note(event, { x: event.clientX, y: event.clientY, button: event.button, buttons: event.buttons, space: state.space });
  dragging = null;
  labels.pan.textContent = `Released at ${Math.round(state.view.x)}, ${Math.round(state.view.y)}`;
});
surface.addEventListener('click', (event) => {
  note(event, { button: event.button, buttons: event.buttons, space: state.space });
  if (state.space) labels.space.textContent = `Space held; click ${event.isTrusted ? 'trusted' : 'untrusted'}`;
});
surface.addEventListener('wheel', (event) => {
  note(event, { deltaX: event.deltaX, deltaY: event.deltaY, ctrlKey: event.ctrlKey });
  if (!event.ctrlKey) return;
  event.preventDefault();
  state.view.zoom = Math.min(4, state.view.zoom * Math.exp(-event.deltaY * 0.0025));
  labels.zoom.textContent = `Ctrl + wheel ${event.isTrusted ? 'trusted' : 'untrusted'}; zoom ${state.view.zoom.toFixed(3)}`;
}, { passive: false });
