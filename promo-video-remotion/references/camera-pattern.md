# Camera pattern

`transform = translate(960 - fx, 540 - fy) scale(s)`, `transform-origin: fx fy` で焦点 (fx, fy) を画面中央へ。
scale→1 に戻す局面では **必ず fx,fy も (960,540) へ lerp**(倍率1でも平行移動が残る事故防止)。

| 段階 | 区間 | scale | 焦点 |
|---|---|---|---|
| 寄り | 30→60 | 1→2.4 (inOut cubic) | 中央→キャレット |
| 追従 | 60→108 | 2.4 | キャレット(直近10fの移動平均) |
| 俯瞰 | 108→126 | 2.4→1 | →中央。入力欄を1行→折り返しへクロスフェード(8f) |
| 読ませる | 126→送信-22 | 1 | 中央 |
| 押す | 送信-22→送信 | 1→1.15 | (1180,600) 付近 |
| 保持 | 送信→切替 | 1.15 | 同上 |
| 戻し | 切替中 | 1.15→1 | →中央 |
| 山場 | zoomStart→zoomEnd | 1→2.4 | ポップオーバー中心 |
| 終幕前 | xZoomOutStart→xStart | 2.4→1 | →中央 |

キャレット座標: `caretStageX(prompt, count, highlights)`(canvas measureText、強調語は weight 600)→ stage→composition 変換
(`stageScale = min(paneW/1280, paneH/720)`、stage は pane 中央配置)。
カーソルはズーム層の内側に置き、`size = 40 / zoom` で見た目の大きさを一定にする。
