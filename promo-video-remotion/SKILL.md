---
name: promo-video-remotion
description: >
  プロダクトのプロモ動画(15〜30秒・1920x1080・MP4)を Remotion + remocn で作る。
  「チャットに1文頼む → 本物のUIが動いて成果が出る → 山場(公開/トグル等) → Xフォロー」という
  カーソル操作型のデモを、データ駆動のタイムラインと本物UIの再現(スクショ照合・vendoring)で
  組み立て、typecheck → スティル → コンタクトシート → 本レンダー → QuickTime の検証ループで仕上げる。
  「プロモ動画を作って」「デモ動画」「Remotion で動画」「〇〇の紹介動画」「カーソルで操作している動画」
  「jinba-promo みたいに」と頼まれたときに使う。実画面収録の編集は別スキル(video-edit-style-openscreen メモ)を優先検討。
---

# Promo Video (Remotion + remocn)

参照実装: `08-tools/jinba-promo-remotion/`(Issue #333 / PR #334)。新規案件はこれを **コピーして題材を差し替える** のが最短。

## 0. 方針(先に読む)

- **本物に寄せる**: UI は「それっぽいモック」ではなく、本物のスクショを基準にピクセル照合し、可能なら本物のコンポーネント/デザイントークンを vendoring する(出典ヘッダ + `NOTICE.md`)。視聴者は差分に敏感。
- **次回以降の第一候補は実画面**: 「実際に画面を動かしている感じ」が求められる。実画面(Chrome 自動操作/画面収録)を撮り、Remotion はカメラ・カーソル・テロップ・トランジションの編集に徹する構成を先に検討する(メモリ `promo-video-real-screen-feel`)。
- **裏側は動かさない**: 表示するコマンド・応答・ノード・数値はすべて `src/data/*.ts` の事前定義データ。
- **決定論**: `useCurrentFrame` + `interpolate` / `spring` のみ。CSS transition/animation 禁止。フォント計測は canvas `measureText`(Remotion の `loadFont` が読み込み完了を待つので安定)。

## 1. 要件ヒアリング(AskUserQuestion、推測で確定しない)

最低限決めること: 題材(何を頼み、何ができるか)/ 尺 / 画面構成(全幅→分割 or 切替)/ 山場(公開・トグル・通知など)/ 終幕(X フォロー・ロゴ・なし)/ 参考動画(あれば秒範囲)/ 素材(ロゴ・アバター・カバー)。
参考動画があれば `ffmpeg -ss 7 -t 4 -vf fps=3,tile=4x4` でフレームを抜いて特徴を言語化してから設計する。

## 2. プロジェクト準備

```sh
cp -R 08-tools/jinba-promo-remotion 08-tools/<name>-promo-remotion && cd $_
pnpm install && pnpm typecheck
# remocn 部品の追加(components.json に @remocn レジストリ登録済み)
pnpm dlx shadcn@latest add @remocn/<component>
```

よく使う remocn: `cursor` + `use-cursor-path`(waypoint 駆動カーソル、クリックでリップル+押し込み)、`claude-chat`(チャット入力)、`whip-pan` / `zoom-blur`(場面切替)、`drift`(常時微ズーム)、`soft-blur-in`、`scribble-circle`、`x-follow-card`、`terminal-cursor-zoom`(カーソル追従カメラの元ネタ)。一覧は `https://www.remocn.dev/r/registry.json`。

## 3. データ駆動タイムライン(`src/data/<topic>.ts`)

`references/timeline-template.ts` を雛形にする。原則:

- 秒→フレームは `s(sec)`。**後続を一括でずらす定数**(`HOLD_AFTER_SEND`, `OVERVIEW_HOLD` 等)を `+ h` 形式で全キーに足す。尺 `DURATION_IN_FRAMES` も同じ式で。
- **座標契約**をこのファイルに集約(`LAYOUT`、ボタン矩形 `{x,y,w,h}`、`SEND_BUTTON_CENTER`、`publishButtonCenter()` 等)。カーソル経路 `CURSOR_WAYPOINTS` はこれらから導出する。→ 画面担当とカメラ/カーソル担当を **サブエージェントで並列** にできる。
- 強調語(`PROMPT_HIGHLIGHTS`)はブランド色・太字。

## 4. 画面(シーン)

- 左/全幅: `claude-chat`。プロンプトは **1行横スクロール**(`singleLine`)で打ち、引きで折り返しへクロスフェード(`wrapProgress`)。
- 右: 本物 UI。本物のスクショ(1333×896 CSS px などスケールに注意)と `flow-header.tsx` 等のソースを読み、className をそのまま静的化。`size="icon"` が `min-h-9` で 36px になる等、実測で寸法を合わせる。
- 独自タイムラインを持つ部品(x-follow-card 等)は `<Sequence from={T.xStart}>` で包む。

## 5. カメラ振付(`src/camera.ts`)

式: `translate(960 - fx, 540 - fy) scale(s)`, origin `(fx, fy)`(remocn `terminal-cursor-zoom` と同じ)。**scale が 1 に戻るときは fx,fy も中央(960,540)へ戻す**(戻さないと平行移動が残る)。

チャット入力の型(参照動画 7–11s 由来、視聴者に好評):

| フレーム | 動き |
|---|---|
| 30–60 | 入力欄へ 2.4x で寄る |
| 60–108 | キャレット追従(10f 移動平均で滑らかに)。28cps で打つ |
| 108–126 | 1x の俯瞰へ引く。入力欄は折り返しへ。全文を約1.2s 読ませる |
| 送信-22 → 送信 | カーソルが送信へ移動する間に 1.15x へ軽く寄せてクリック |
| クリック後 0.8s | 押した状態で保持 → whip-pan で次画面 |

山場(公開ボタン → ポップオーバー → トグル ON)は 2.4x の punch-in。終幕は X プロフィール画面(本物準拠 `XProfileCard`)でカーソルが「フォロー」→「フォロー中」。終了帯の文章は不要。

## 6. 検証ループ(必ず目で見る)

```sh
pnpm typecheck
node_modules/.bin/remotion still src/index.ts <CompId> $S/f-120.png --frame=120   # 要所を数枚
pnpm render                       # out/<name>.mp4 (h264, yuv420p, crf 18)
bash .agents/skills/promo-video-remotion/scripts/contact-sheet.sh out/<name>.mp4 120,150,330,420   # クリック前後を確認
```

- スティルは Read で見て、カーソルがボタン中心に乗っているか / 重なり / クリップ / フォント を確認。
- レンダー中にネット断があるとフォント取得に失敗し **古い out ファイルが残る**。`rm -f out/*.mp4` してから render し、`ffprobe` の `nb_frames` と終盤フレームで新しい内容か確かめる。

## 7. 納品

```sh
bash .agents/skills/promo-video-remotion/scripts/deliver.sh out/<name>.mp4 <name>_v<尺>s_<tag>
```
Downloads へ **別名(バージョン付き)** で保存し QuickTime で開く。**QuickTime で開いているファイルを上書きしない**(表示が空になる)。

## 8. Git / 共同作業

- Issue → `issue-<n>-<slug>` ブランチ → 小さくコミット(`Refs #n`)→ Draft PR → Project へ。
- 同じブランチに Devin 等が push していることがある。`git fetch` → `git rebase origin/<branch>` → 競合は README など文書中心。push 拒否時は取り込んでから再 push。
- サブエージェント分割: 「画面部品」「レイアウト+座標契約」「カメラ/カーソル」の3系統に分け、共有契約(座標定数名・export 名)をプロンプトに明記。互いのファイルは触らせない。

## 9. 参考

- `references/timeline-template.ts` — データファイル雛形
- `references/camera-pattern.md` — カメラ各段階の式と数値
- `references/checklist.md` — 納品前チェック
