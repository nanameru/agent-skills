---
version: alpha
name: Washei Consulting (和製コンサル 高密度)
description: 日本のビジネス／コンサル文化が生んだ高密度資料スタイル。スライド上端の「タイトル＋キーメッセージ帯」で結論を断言し、本文は箱・矢印・マトリクスの図解でロジックを圧縮する。会議後に独りで読まれても意味が通る「一人歩きする資料」を狙う。ネイビー基調＋グレー＋差し色1。

meta:
  archetype: washei-consulting
  origin: 日本の提案書／外資系コンサル和製版／山口周『外資系コンサルのスライド作成術』の図解修辞／パワポ研のキーメッセージ構造
  locale: ja
  density: high
  mood: [trustworthy, logical, dense, authoritative, structured]
  tags:
    style: [trust, clear, dynamic]
    docType: [proposal, company-intro, service, mid-term-plan]
    industry: [consulting, saas, finance, manufacturing]
    color: [navy, two-tone]

canvas:
  width: 1920px
  height: 1080px
  aspectRatio: "16:9"
  exportWidthIn: 13.333
  exportHeightIn: 7.5
  background: "{colors.canvas}"
  margin: 64px

grid:
  columns: 12
  gutter: 20px
  margin: 64px
  baseline: 8px

colors:
  primary: "#0b2a4a"
  canvas: "#ffffff"
  ink: "#1a2b3c"
  muted: "#5b6b7b"
  surface: "#f4f7fb"
  surface-strong: "#e7eef6"
  hairline: "#d2dce6"
  accent: "#e8731a"
  accent-soft: "#fdeada"
  positive: "#1f8a5b"
  on-primary: "#ffffff"

typography:
  kicker:
    fontFamily: "'Noto Sans JP', 'Yu Gothic', 'Hiragino Kaku Gothic ProN', sans-serif"
    fontSize: 18px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0.08em
  slide-title:
    fontFamily: "'Noto Sans JP', 'Yu Gothic', sans-serif"
    fontSize: 38px
    fontWeight: 700
    lineHeight: 1.25
  key-message:
    fontFamily: "'Noto Sans JP', 'Yu Gothic', sans-serif"
    fontSize: 26px
    fontWeight: 700
    lineHeight: 1.4
  lead:
    fontFamily: "'Noto Sans JP', 'Yu Gothic', sans-serif"
    fontSize: 22px
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: "'Noto Sans JP', 'Yu Gothic', sans-serif"
    fontSize: 19px
    fontWeight: 400
    lineHeight: 1.7
  bullet:
    fontFamily: "'Noto Sans JP', 'Yu Gothic', sans-serif"
    fontSize: 19px
    fontWeight: 400
    lineHeight: 1.6
  box-title:
    fontFamily: "'Noto Sans JP', 'Yu Gothic', sans-serif"
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.3
  caption:
    fontFamily: "'Noto Sans JP', 'Yu Gothic', sans-serif"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.4
  kpi-number:
    fontFamily: "'Noto Sans JP', 'Yu Gothic', sans-serif"
    fontSize: 72px
    fontWeight: 700
    lineHeight: 1.0
    letterSpacing: -0.01em
  kpi-label:
    fontFamily: "'Noto Sans JP', 'Yu Gothic', sans-serif"
    fontSize: 17px
    fontWeight: 500
    lineHeight: 1.3
  source:
    fontFamily: "'Noto Sans JP', 'Yu Gothic', sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.3
  page-number:
    fontFamily: "'Noto Sans JP', 'Yu Gothic', sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1

rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 12px
  full: 9999px

spacing:
  xs: 6px
  sm: 12px
  md: 20px
  lg: 32px
  xl: 56px
  margin: 64px
  gutter: 20px

layouts:
  cover:
    description: "ネイビー全面または上1/3ネイビー帯の表紙。会社名・資料種別・日付。差し色の細い水平アクセント。"
    uses: [kicker, slide-title, lead]
  agenda:
    description: "番号付き目次。各項目を surface のチップに入れ、現在地をハイライト可能。"
    uses: [slide-title, bullet]
  section:
    description: "ネイビー地の章扉。大きな章番号（差し色）＋章タイトル＋一言サマリ。"
    uses: [kicker, slide-title, lead]
  content:
    description: "★中核レイアウト。上端にタイトル、その直下に full幅のキーメッセージ帯（結論の断言）。本文は図解。下端に出典脚注とページ番号。"
    uses: [slide-title, key-message-bar, box, source-footnote, page-number]
  three-box:
    description: "横3分割の図解ボックス。各ボックスは box-title＋本文。矢印（→）で連結し因果やプロセスを示す。"
    uses: [box, arrow]
  matrix:
    description: "2×2マトリクス。軸ラベル＋4象限。重要象限を差し色 accent-soft で塗る。"
    uses: [box, kicker]
  kpi:
    description: "数値ハイライト3〜4枚。kpi-number（ネイビー）＋ラベル＋前年比バッジ（positive）。"
    uses: [kpi-card, kpi-number, kpi-label]
  process:
    description: "横長のステップフロー。番号付き丸＋ステップ名＋矢印。所要や担当を caption で添える。"
    uses: [box, arrow, caption]
  closing:
    description: "結論の再掲＋ネクストステップ。差し色のCTAチップ。"
    uses: [slide-title, key-message-bar, bullet]

components:
  kicker:
    typography: "{typography.kicker}"
    textColor: "{colors.accent}"
  slide-title:
    typography: "{typography.slide-title}"
    textColor: "{colors.primary}"
  key-message-bar:
    typography: "{typography.key-message}"
    backgroundColor: "{colors.surface-strong}"
    textColor: "{colors.ink}"
    padding: 20px 28px
    rounded: "{rounded.md}"
  box:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: 24px
  box-strong:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: 24px
  box-title:
    typography: "{typography.box-title}"
    textColor: "{colors.primary}"
  badge-positive:
    backgroundColor: "{colors.positive}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    padding: 4px 12px
  badge-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    padding: 4px 12px
  kpi-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: 28px
  source-footnote:
    typography: "{typography.source}"
    textColor: "{colors.muted}"
  page-number:
    typography: "{typography.page-number}"
    textColor: "{colors.muted}"
---

# Washei Consulting (和製コンサル 高密度)

## Overview

日本のビジネス文化では、資料は会議の場だけでなく**「後で独りで読まれる」**ことを前提に作られます（=一人歩きする資料）。そのため1スライドの情報量は欧米のピッチより意図的に高く、しかし**構造化**によって読み解けるように設計します。

中核は2つ。(1) スライド上端の**「タイトル＋キーメッセージ帯」** — 帯の中で結論を断言し、本文を読まなくても主張が伝わる（パワポ研／MBBのアクションタイトル思想の和製版）。(2) **図解（箱・矢印・マトリクス）** — 文章ではなく箱と矢印でロジックを圧縮し、因果・比較・プロセスを視覚化する（山口周『外資系コンサルのスライド作成術』の図解修辞）。

ネイビー基調が「信頼・誠実」を、差し色オレンジが「要点・行動」を担います。営業資料・提案書・中期計画など、説得と記録を兼ねる文書に最適です。

**Key Characteristics:**
- 上端に「タイトル＋キーメッセージ帯」。帯で結論を断言する。
- 本文は図解優先（箱＋矢印＋マトリクス）。文章ベタ打ちにしない。
- 情報密度は高め。ただしグリッドと余白で迷子にさせない。
- ネイビー＋グレー＋差し色オレンジの3色運用。色に役割を持たせる。
- 下端に出典脚注・ページ番号を常設（記録資料としての信頼性）。
- 重要度は塗りチップ／バッジ／色面で示す（色付き左縦ライン=border-left は使わない）。

## Colors

- **Primary / Navy** ({colors.primary} — #0b2a4a): 見出し・帯・章扉・図解の主構造。信頼の基調色。
- **Ink** ({colors.ink} — #1a2b3c): 本文。純黒を避けた濃紺寄りインク。
- **Muted** ({colors.muted} — #5b6b7b): 脚注・補助・軸ラベル。
- **Surface** ({colors.surface} — #f4f7fb): 図解ボックスの地。やや青みの淡灰。
- **Surface-strong** ({colors.surface-strong} — #e7eef6): キーメッセージ帯・強調面。
- **Hairline** ({colors.hairline} — #d2dce6): 罫線・ボックス境界。
- **Accent / Orange** ({colors.accent} — #e8731a): 要点・CTA・キッカー・重要象限。**1スライド2〜3箇所まで**。
- **Accent-soft** ({colors.accent-soft} — #fdeada): 重要セルの淡い塗り。
- **Positive** ({colors.positive} — #1f8a5b): 増加・達成のバッジ（前年比＋等）。

> コントラスト: ink/canvas ≈ 13:1（AAA）。navy面に on-primary 白 ≈ 13:1。accent/white ≈ 3.4:1 → 大きな文字・面のみ可、本文には使わない。

## Typography

和文ゴシック（**Noto Sans JP**、不可なら Yu Gothic / Hiragino Kaku Gothic）。明朝は使わない。見出し・帯は 700、本文は 400、キーワードのみインライン 700 で強調。

| Token | Size | Weight | Use |
|---|---|---|---|
| slide-title | 38px | 700 | スライド見出し（navy） |
| key-message | 26px | 700 | キーメッセージ帯（結論断言） |
| kpi-number | 72px | 700 | 数値ハイライト |
| box-title | 20px | 700 | 図解ボックス見出し |
| body / bullet | 19px | 400 | 本文・箇条書き |
| caption / source | 13–15px | 400 | 注釈・出典 |

**原則**: 高密度でも本文は19px以上・行間1.6以上を死守。強調は「太字＋差し色の下線/マーカー」ではなく、**太字またはバッジ**で。

## Layout & Grid

台紙 1920×1080。マージン 64px（密度確保のため Swiss より狭い）、12カラム・ガター20px。**縦の構造が命**：上から「タイトル → キーメッセージ帯 → 図解本文 → 脚注/ページ番号」の4段を全コンテンツスライドで固定する。

情報密度は **high** だが、(1) 図解ボックスで塊化、(2) 8pxベースラインで整列、(3) 余白で塊間を分離、の3点で可読性を担保する。1スライド1メッセージ＝「帯の結論1つ」を本文全体で支える。

## Slide Layouts

- **content（中核）**: タイトル＋キーメッセージ帯＋図解＋脚注の4段固定。
- **three-box**: 横3ボックスを矢印で連結（課題→原因→打ち手 等）。
- **matrix**: 2×2。重要象限を accent-soft で塗り、バッジで注記。
- **kpi**: 数値カード3〜4枚。前年比は positive バッジ。
- **process**: 番号付きステップフロー＋所要/担当の caption。
- **section**: navy 地の章扉、章番号は差し色。

## Elevation & Depth

影は**最小限**（`0 1px 2px rgba(11,42,74,.06)` 程度）か、影なしで罫線（hairline）と塗り分けで階層化。図解ボックスは「淡灰の面＋細い境界」で示し、**色付きの左縦ライン（border-left アクセント）は使わない** — 重要度は面の塗り（navy / accent-soft）かバッジで示す。

## Shapes

角丸は小さめ（4〜8px）で実務的な印象に。矢印は塗りの三角＋線、またはシェブロン（▶）。マトリクス・ボックスは矩形。アイコンは単色ライン（差し色 or navy）。多色イラストは避ける。

## Components

- **key-message-bar（キーメッセージ帯）**: surface-strong 地・navy/ink 文字・角丸8px。タイトル直下に full幅。**結論を1文で断言**。
- **box / box-strong**: 図解の基本単位。box-strong（navy地・白字）は強調する1つだけに。
- **badge-positive / badge-accent**: 丸ピル。前年比・要点ラベル。
- **kpi-card**: 淡灰カード。kpi-number（navy）＋ラベル＋バッジ。
- **source-footnote / page-number**: 下端固定、muted。出典は「出典: …（n=, 年月）」形式。

## Do's and Don'ts

- **Do**: 上端の帯で必ず結論を断言する（本文を読まなくても主張が伝わる）。
- **Do**: 本文は文章より図解（箱＋矢印）を優先する。
- **Do**: 差し色オレンジは要点に2〜3箇所まで。残りは navy/グレーで構造化。
- **Do**: 出典・ページ番号を常設し、記録資料として信頼させる。
- **Don't**: 帯を飾りにしない（「概要」等のラベルで終わらせない＝結論を書く）。
- **Don't**: 色付き左縦ライン（border-left）で重要度を示さない。塗り/バッジで示す。
- **Don't**: 装飾的な `<table>` を使わない。div＋flex で組む。
- **Don't**: 明朝・多色イラスト・3色を超える配色を持ち込まない。

## Agent Prompt Guide

> **Quick palette**: navy `#0b2a4a` ／ ink `#1a2b3c` ／ surface `#f4f7fb` ／ accent(orange) `#e8731a` ／ positive `#1f8a5b`。Font: Noto Sans JP。角丸8px。
>
> **Prompt**: 「和製コンサルの高密度スタイルでスライドを作って。各コンテンツスライドは上から『タイトル(navy #0b2a4a) → キーメッセージ帯(淡灰 #e7eef6 の角丸帯に結論を1文で断言) → 図解本文(箱＋矢印＋2×2マトリクス) → 出典脚注＋ページ番号』の4段構成。Noto Sans JP、本文19px/行間1.6。差し色はオレンジ #e8731a を要点に2〜3箇所だけ。表は使わず div＋flex の図解で。色付き左縦ラインは使わず、重要度は塗り面とバッジで示す。情報密度は高めだが余白とベースラインで整列。」

## HTML→PPTX Notes

- 箱・帯・バッジ・矢印（三角＋線）はすべて `<div>`／インライン SVG で**ネイティブ図形**化できる。
- 2×2マトリクスは div＋flex/grid で（`<table>` を使わない方針）。これによりセルが個別のネイティブ図形になり、PPTX 上で編集しやすい。
- 影は薄め（`box-shadow` は AA 範囲）。濃い影や blur はラスタ化要因になるので避ける。
- バッジの角丸ピルはネイティブ角丸矩形になる。差し色面はベタ塗りなのでフィデリティが高い。
- Noto Sans JP 未解決時は PPTX 側で MS ゴシック系にフォールバック。和文字面が変わるので、改行位置は字数に余裕を持たせる。

## Iteration Guide

1. まず「帯の結論文」を決めてから本文の図解を設計する（結論駆動）。
2. 図解は three-box / matrix / process のいずれかの型に当てはめる。
3. 差し色を足したくなったら、既存の差し色を1つ減らせないか先に検討する。
4. 新しい図解型は `layouts` に追加し、本文 Slide Layouts にも1行加える。

## References / 参考にした流派・出典

- **参考にした流派**: 和製コンサル高密度（提案書・営業資料）。日本の「一人歩きする資料」文化＋外資系コンサル和製版。
- **視覚的な署名**: タイトル＋キーメッセージ帯 / 箱・矢印・2×2図解 / 高密度 / ネイビー＋差し色。
- 出典:
  - [パワポ研（note）](https://note.com/powerpoint_jp/n/n7ab95a1513bb)
  - [山口周『外資系コンサルのスライド作成術』](https://www.amazon.co.jp/dp/4492557202)
  - [外資コンサルのPowerPoint（think-cell）](https://www.think-cell.com/ja/resources/content-hub/learning-from-the-global-consulting-firms-powerpoint)

> 注: 本定義は特定の PowerPoint ファイルの複製ではなく、上記の流派・ギャラリーから**デザイン思考とエッセンスを抽出**して再構築したもの。比較ビューア（[`../_viewer/index.html`](../_viewer/index.html)）で「作ったスライド」と上記の参照元を見比べられる。横断タクソノミは[スライドランド](https://www.slideland.tech/)（style×docType×industry×color）に準拠。

**起点（Slideland 経由の実スライド・実在企業の公開デッキ）**: [株式会社クラウドワークス 2026年9月期 第1四半期決算説明資料](https://contents.xj-storage.jp/xcontents/AS80447/1e62b3c0/9f24/4ea8/95cb/301f7d32517a/20260213134853305s.pdf)（#決算説明資料 #人材 #ネイビー #信頼感）— ネイビー基調・高密度で構造化された国内資料。和製コンサルの直接の起点。
