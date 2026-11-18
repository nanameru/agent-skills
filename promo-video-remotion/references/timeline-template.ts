// Template for src/data/<topic>.ts — everything the video shows lives here.
export const FPS = 30;
const s = (sec: number) => Math.round(sec * FPS);

export const PROMPT = "…1文で頼む内容(60文字前後)…";
export const PROMPT_HIGHLIGHTS = ["<CLI名>", "<プロダクト名>"];
export const PROMPT_HIGHLIGHT_COLOR = "oklch(0.5343 0.2003 283.97)";

// ── shifts (everything after a beat moves together) ──
export const OVERVIEW_HOLD = s(1.2); // read the prompt at 1x before the click
export const HOLD_AFTER_SEND = s(0.8); // button stays pressed, then hand over
const h = HOLD_AFTER_SEND + OVERVIEW_HOLD;

export const T = {
  fadeInEnd: s(0.5),
  sendStart: s(4.2) + OVERVIEW_HOLD, // cursor clicks send
  splitStart: s(4.2) + h, // whip-pan to the product UI
  splitEnd: s(4.8) + h,
  // …product beats…
  nodeAppear: [s(6.6) + h, s(7.8) + h, s(9.0) + h, s(10.2) + h],
  mcpClick: 386 + h,
  popoverIn: 390 + h,
  zoomStart: 398 + h,
  zoomEnd: 426 + h,
  toggleClick: 444 + h,
  mcpBadgeSwap: 452 + h,
  // ending
  xZoomOutStart: 452 + h + 30,
  xStart: 452 + h + 48,
  xPanEnd: 452 + h + 66,
} as const;
export const X_CARD_FRAMES = 165;
export const DURATION_IN_FRAMES = T.xStart + X_CARD_FRAMES;

// ── layout contract (absolute px in 1920x1080) ──
export const LAYOUT = {
  paneTop: 60,
  paneH: 960,
  claudeFull: { left: 48, width: 1824 },
  jinba: { left: 48, width: 1824 },
} as const;
// Buttons the cursor must hit — the scene MUST draw them exactly here.
export const PUBLISH_BUTTON = { x: 1708, y: 10, w: 100, h: 28 } as const;
export const SEND_BUTTON_CENTER = { x: 1481, y: 685 }; // measure from a still
export const publishButtonCenter = () => ({
  x: LAYOUT.jinba.left + PUBLISH_BUTTON.x + PUBLISH_BUTTON.w / 2,
  y: LAYOUT.paneTop + PUBLISH_BUTTON.y + PUBLISH_BUTTON.h / 2,
});
export const SEND_PRESS = { from: T.sendStart - 2, to: T.sendStart + 6 } as const;

// ── cursor path (absolute px; `at` = arrival frame) ──
export const CURSOR_WAYPOINTS = (() => {
  const pub = publishButtonCenter();
  return [
    { at: 0, x: 1240, y: 820 },
    { at: 96, x: 1240, y: 820, duration: 0 },
    { at: T.sendStart - 6, ...SEND_BUTTON_CENTER, duration: 24, easing: "inOut" as const },
    { at: T.sendStart, ...SEND_BUTTON_CENTER, click: true, duration: 0 },
    { at: T.splitEnd + 24, x: 1500, y: 900, duration: 30, easing: "inOut" as const },
    { at: T.mcpClick - 8, ...pub, duration: 28, easing: "inOut" as const },
    { at: T.mcpClick, ...pub, click: true, duration: 0 },
  ];
})();
