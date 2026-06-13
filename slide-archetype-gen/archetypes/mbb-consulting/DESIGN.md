---
version: alpha
name: MBB Consulting (戦略コンサル アクションタイトル)
description: McKinsey / BCG / Bain に代表される戦略コンサルティングのスライド流派。各スライドのタイトルそのものが「結論＝一文の主張（アクションタイトル）」であり、タイトルだけを上から読むとストーリー全体（Mintoピラミッド）が通る。本文はタイトルを「証明する」exhibit（チャート／フレームワーク）として存在し、全 exhibit に出典脚注を付す。ネイビー＋グレー＋差し色1（レッド）の禁欲的配色とデータインク規律。

meta:
  archetype: mbb-consulting
  origin: McKinsey & Company / Boston Consulting Group / Bain & Company のストラテジー資料／Barbara Minto『The Pyramid Principle』／Gene Zelazny『Say It With Charts』のexhibit修辞
  locale: ja
  density: medium-high
  mood: [austere, rigorous, analytical, authoritative, restrained]
  tags:
    style: [trust, minimal, clear]
    docType: [proposal, strategy, mid-term-plan, ir, diligence]
    industry: [consulting, finance, manufacturing, saas]
    color: [navy, two-tone, monochrome]

canvas:
  width: 1920px
  height: 1080px
  aspectRatio: "16:9"
  exportWidthIn: 13.333
  exportHeightIn: 7.5
  background: "{colors.canvas}"
  margin: 96px

grid:
  columns: 12
  gutter: 24px
  margin: 96px
  baseline: 8px

colors:
  primary: "#15233b"
  canvas: "#ffffff"
  ink: "#1f2a3a"
  muted: "#6b7686"
  surface: "#f3f5f8"
  surface-strong: "#e6eaf0"
  hairline: "#d4dae3"
  accent: "#c8102e"
  accent-soft: "#f6d6db"
  grey-bar: "#9aa6b4"
  grey-bar-dark: "#5b6675"
  on-primary: "#ffffff"

typography:
  kicker:
    fontFamily: "Arial, 'Helvetica Neue', 'Noto Sans JP', 'Yu Gothic', sans-serif"
    fontSize: 16px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0.14em
  slide-title:
    fontFamily: "Arial, 'Helvetica Neue', 'Noto Sans JP', 'Yu Gothic', sans-serif"
    fontSize: 36px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: -0.005em
  lead:
    fontFamily: "Arial, 'Helvetica Neue', 'Noto Sans JP', 'Yu Gothic', sans-serif"
    fontSize: 22px
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: "Arial, 'Helvetica Neue', 'Noto Sans JP', 'Yu Gothic', sans-serif"
    fontSize: 19px
    fontWeight: 400
    lineHeight: 1.6
  bullet:
    fontFamily: "Arial, 'Helvetica Neue', 'Noto Sans JP', 'Yu Gothic', sans-serif"
    fontSize: 19px
    fontWeight: 400
    lineHeight: 1.55
  exhibit-title:
    fontFamily: "Arial, 'Helvetica Neue', 'Noto Sans JP', 'Yu Gothic', sans-serif"
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.3
  takeaway:
    fontFamily: "Arial, 'Helvetica Neue', 'Noto Sans JP', 'Yu Gothic', sans-serif"
    fontSize: 18px
    fontWeight: 700
    lineHeight: 1.45
  data-label:
    fontFamily: "Arial, 'Helvetica Neue', 'Noto Sans JP', 'Yu Gothic', sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.3
  kpi-number:
    fontFamily: "Arial, 'Helvetica Neue', 'Noto Sans JP', 'Yu Gothic', sans-serif"
    fontSize: 64px
    fontWeight: 700
    lineHeight: 1.0
    letterSpacing: -0.01em
  source:
    fontFamily: "Arial, 'Helvetica Neue', 'Noto Sans JP', 'Yu Gothic', sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.35
  page-number:
    fontFamily: "Arial, 'Helvetica Neue', 'Noto Sans JP', 'Yu Gothic', sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1

rounded:
  none: 0px
  sm: 2px
  md: 4px
  full: 9999px

spacing:
  xs: 6px
  sm: 12px
  md: 20px
  lg: 32px
  xl: 56px
  margin: 96px
  gutter: 24px

layouts:
  cover:
    description: "白地に左寄せ。細い差し色ルール＋kicker、その下に資料タイトル（プロジェクト名）。下端に発行元・日付・confidential注記。装飾は最小、罫線1本で締める。"
    uses: [kicker, slide-title, lead]
  agenda:
    description: "ストーリーを「タイトルの羅列」で見せる目次。各行＝そのページのアクションタイトル要約。番号は控えめなグレー、現在地のみ差し色マーカー。"
    uses: [slide-title, bullet]
  section:
    description: "ネイビー全面の章扉。大きな章番号（白）＋章タイトル＋一言の論点。差し色は細いルール1本のみ。"
    uses: [kicker, slide-title, lead]
  content:
    description: "★中核。上端に『アクションタイトル帯』（タイトル＝一文の結論）。その下に exhibit（チャート/フレームワーク）。exhibit上部に『EXHIBIT n』kicker＋exhibitタイトル。下端に出典脚注とページ番号。"
    uses: [action-title-banner, exhibit-frame, exhibit-title, source-footnote, page-number]
  framework:
    description: "2×2マトリクス または 3ピラー。各象限/柱は矩形＋見出し＋要点。推奨領域のみ差し色 accent-soft で塗る。フレーム名は『EXHIBIT n』。"
    uses: [exhibit-frame, exhibit-title, quadrant, pillar]
  chart-exhibit:
    description: "インライン SVG の棒/ウォーターフォール。グレー基調の棒に、主張を支える1本だけ差し色。各棒に data-label、軸はhairline、ベースに data ink 規律。"
    uses: [exhibit-frame, exhibit-title, svg-bar, data-label, source-footnote]
  comparison:
    description: "2カラム対比（現状 vs あるべき姿 / Option A vs B）。推奨側のみ差し色のヘッダーチップ。div+flex で対称配置。"
    uses: [exhibit-frame, exhibit-title, compare-col, takeaway]
  closing:
    description: "リコメンデーション再掲。番号付きの推奨アクション3点＋次の意思決定事項。差し色は推奨見出しのみ。"
    uses: [action-title-banner, bullet, takeaway]

components:
  kicker:
    typography: "{typography.kicker}"
    textColor: "{colors.accent}"
  action-title-banner:
    typography: "{typography.slide-title}"
    textColor: "{colors.primary}"
    borderBottom: "2px solid {colors.primary}"
    padding: 0 0 16px 0
  slide-title:
    typography: "{typography.slide-title}"
    textColor: "{colors.primary}"
  exhibit-frame:
    backgroundColor: "{colors.canvas}"
    border: "1px solid {colors.hairline}"
    rounded: "{rounded.md}"
    padding: 28px
  exhibit-title:
    typography: "{typography.exhibit-title}"
    textColor: "{colors.ink}"
  quadrant:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    border: "1px solid {colors.hairline}"
    rounded: "{rounded.md}"
    padding: 22px
  quadrant-hot:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.ink}"
    border: "1px solid {colors.accent}"
    rounded: "{rounded.md}"
    padding: 22px
  pillar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    border: "1px solid {colors.hairline}"
    rounded: "{rounded.md}"
    padding: 24px
  svg-bar:
    fill: "{colors.grey-bar}"
  svg-bar-accent:
    fill: "{colors.accent}"
  takeaway:
    typography: "{typography.takeaway}"
    textColor: "{colors.primary}"
  badge-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.sm}"
    padding: 4px 12px
  kpi-number:
    typography: "{typography.kpi-number}"
    textColor: "{colors.primary}"
  source-footnote:
    typography: "{typography.source}"
    textColor: "{colors.muted}"
  page-number:
    typography: "{typography.page-number}"
    textColor: "{colors.muted}"
---

# MBB Consulting (戦略コンサル アクションタイトル)

## Overview

戦略コンサルティング（McKinsey / BCG / Bain＝通称 MBB）のスライドは、**「タイトルがすべて」**という思想に立ちます。タイトルは「現状概要」「市場分析」のような**ラベル**ではなく、**そのページで証明すべき一文の主張＝アクションタイトル**です。デッキ全体のタイトルだけを上から読むと、それだけで論旨（Barbara Minto のピラミッド・プリンシプル）が通る — これが横の流れ（horizontal flow / storyline）です。

各スライドの本文は、そのタイトルを**証明するためだけに存在**します（1スライド1メッセージ）。本文は文章の羅列ではなく **exhibit**（チャート・フレームワーク・比較表）として提示し、「EXHIBIT 1」のようなキッカーで番号を振り、**必ず出典脚注**を添えます（聞き手が60秒で1枚を理解し、後から検証もできる）。

ビジュアルは禁欲的です。ネイビーとグレーを基調に、**差し色は1色だけ**（クラシックなコンサルレッド）。チャートはグレーの棒に「主張を支える1本」だけ差し色を載せる **data-ink 規律**で、装飾を削ぎ落とします。和製コンサル流派が「タイトル＋別立てのキーメッセージ帯＋高密度図解」で語るのに対し、MBB はより austere で、**タイトル帯そのものが一文の主張を担い**、本文は exhibit として簡潔に証明する点が異なります。

**Key Characteristics:**
- 全コンテンツスライドのタイトルは「一文の主張（アクションタイトル）」。ラベルにしない。
- タイトルだけを上から読むとストーリーが通る（horizontal flow / Mintoピラミッド）。
- 本文はタイトルを証明する exhibit。1スライド1メッセージを徹底。
- 全 exhibit に「EXHIBIT n」キッカーと出典脚注を付す。
- 配色は navy＋grey＋差し色1（red）。チャートは data-ink 規律でグレー基調＋差し色1本。
- 重要度は塗りチップ／面の塗り（accent-soft）で示す。色付き左縦ライン（border-left）は使わない。

## Colors

- **Primary / Navy** ({colors.primary} — #15233b): タイトル帯の罫線・章扉・見出し・図解の主構造。権威と信頼の基調。
- **Ink** ({colors.ink} — #1f2a3a): 本文・exhibit内テキスト。純黒を避けたインク。
- **Muted** ({colors.muted} — #6b7686): 脚注・出典・軸ラベル・補助テキスト。
- **Surface** ({colors.surface} — #f3f5f8): フレームワークのセル地。極淡のグレー。
- **Surface-strong** ({colors.surface-strong} — #e6eaf0): 見出し行・強調面。
- **Hairline** ({colors.hairline} — #d4dae3): 罫線・exhibit枠・軸線。
- **Accent / Consulting Red** ({colors.accent} — #c8102e): 主張を支える要素のみ。**1スライド1〜2箇所まで**。チャートでは「結論を担う1本」だけ。
- **Accent-soft** ({colors.accent-soft} — #f6d6db): 推奨象限・推奨列の淡い塗り。
- **Grey-bar** ({colors.grey-bar} — #9aa6b4) / **Grey-bar-dark** ({colors.grey-bar-dark} — #5b6675): チャートの非強調棒のグレー2段階。

> コントラスト: ink/canvas ≈ 12:1（AAA）。navy面に on-primary 白 ≈ 13:1。accent(red)/white ≈ 5.1:1 → 本文サイズでも可だが、規律として面・チャートの強調・小さなラベルに限定する。

## Typography

クリーンなサンセリフ（**Arial / Helvetica Neue** — BCG/Bain の質感）。和文は **Noto Sans JP / Yu Gothic** にフォールバック。McKinsey はタイトルに Georgia（セリフ）を用いる伝統があるが、PPTX 書き出しのフォント解決を優先し、本流派は**サンセリフ統一**とする。明朝は使わない。

| Token | Size | Weight | Use |
|---|---|---|---|
| slide-title | 36px | 700 | アクションタイトル（一文の主張・navy） |
| takeaway | 18px | 700 | exhibit内の小結論 |
| exhibit-title | 20px | 700 | exhibit見出し |
| kpi-number | 64px | 700 | 数値ハイライト |
| body / bullet | 19px | 400 | 本文・箇条書き |
| data-label | 16px | 400 | チャートの数値・軸ラベル |
| kicker | 16px | 700 | 「EXHIBIT n」等のアイブロー |
| source / page-number | 13–14px | 400–500 | 出典・ページ番号 |

**原則**: タイトルは一文で、述語を持つ主張にする（「〜は〜である／〜すべき」）。本文は19px以上・行間1.5以上を死守。強調は太字＋差し色を要点のみ。letter-spacing はタイトルでわずかに詰める（-0.005em）程度に抑える。

## Layout & Grid

台紙 1920×1080。マージン 96px（austere＝広めの余白で権威と読みやすさを担保）、12カラム・ガター24px、8pxベースライン。**縦の構造**は全コンテンツスライドで固定：上から「アクションタイトル帯（下に navy 2px の罫線）→ EXHIBIT キッカー＋exhibitタイトル → exhibit本体 → 出典脚注／ページ番号」。

情報密度は **medium-high**。和製コンサルより**余白が広く要素が少ない**。1枚で主張は1つ、それを支える exhibit も1つ（多くて2つ）。横の流れ（タイトルの連なり）でストーリーを運ぶため、各ページは「証明1単位」に絞る。

## Slide Layouts

- **content（中核）**: アクションタイトル帯（navy罫線下線）＋ EXHIBIT n ＋ exhibit ＋ 出典の4段固定。
- **framework**: 2×2マトリクス または 3ピラー。推奨領域のみ accent-soft で塗る。
- **chart-exhibit**: インライン SVG の棒／ウォーターフォール。グレー基調＋差し色1本＋data-label。
- **comparison**: 現状 vs あるべき姿 / Option 対比。推奨側のみ差し色ヘッダー。
- **section**: navy 全面の章扉、章番号は白・差し色は細ルール1本。
- **agenda**: タイトルの羅列でストーリーを提示（横の流れの可視化）。
- **closing**: リコメンデーション3点＋次の意思決定。

## Elevation & Depth

影は**原則なし**。階層は hairline の罫線・面の塗り分け・余白で表現する austere なフラット設計。exhibit は「白地＋1px hairline 枠」で囲い、強調セルのみ面を塗る。**色付き左縦ライン（border-left アクセント）は使わない** — 推奨や重要度は accent-soft の面塗りか差し色チップ（badge）で示す。タイトル帯の下の navy 2px ルールだけが唯一の構造線。

## Shapes

角丸はほぼ無し〜極小（2〜4px）でドキュメント然とした実務的印象に。exhibit枠・マトリクス・棒はシャープな矩形。チャートの棒は角丸なしの矩形 SVG。アイコンは使うなら単色ライン（navy）に限定し、多色イラスト・写真装飾は持ち込まない。矢印が必要なら細い線＋小さな三角（grey）。

## Components

- **action-title-banner（アクションタイトル帯）**: スライド最上部。タイトル＝**一文の主張**を navy で置き、直下に navy 2px の罫線。和製コンサルのような別立てキーメッセージ帯は持たず、**タイトルが結論を兼ねる**。
- **exhibit-frame / exhibit-title**: 白地＋hairline枠の exhibit 容器。上に「EXHIBIT n」kicker（差し色）＋exhibitタイトル。
- **svg-bar / svg-bar-accent**: チャートの棒。既定はグレー、主張を担う1本のみ差し色。各棒に data-label。
- **quadrant / quadrant-hot / pillar**: フレームワークの矩形セル。推奨のみ accent-soft（hot）。
- **takeaway**: exhibit 内の小結論（navy 太字）。
- **badge-accent**: 差し色の角small矩形チップ。推奨ラベル等。
- **source-footnote / page-number**: 下端固定、muted。出典は「Source: …（n=, 年）」形式で全 exhibit に常設。

## Motion

PPTX 書き出しではアニメーションは限定的（[HTML_INPUT_SPEC](../HTML_INPUT_SPEC.md) §9.4：CSS animation / transition / hover は live 挙動として書き出されない）。本流派は構成上のリズムのみを扱う：タイトルの連なりが論理の「歩み」を作る（horizontal flow）ので、ページ送り＝主張の積み上げになるよう順序を設計する。動きで語らず、静止した1枚で60秒成立させる。

## Do's and Don'ts

- **Do**: タイトルを必ず一文の主張（述語を持つ結論）にする。
- **Do**: タイトルだけを上から読んでストーリーが通るか検証する（horizontal flow）。
- **Do**: 全 exhibit に「EXHIBIT n」と出典脚注を付ける。
- **Do**: チャートはグレー基調にし、主張を担う1本だけ差し色にする（data-ink 規律）。
- **Do**: 1スライド1メッセージ。証明に不要な要素は削る。
- **Don't**: タイトルをラベル（「概要」「市場環境」）にしない。
- **Don't**: 差し色レッドを2箇所以上に散らさない。グレー／ネイビーで構造化する。
- **Don't**: 色付き左縦ライン（border-left）で重要度を示さない。面塗り／チップで示す。
- **Don't**: 装飾的な `<table>`・濃い影・グラデの多用・多色チャートを持ち込まない。
- **Don't**: 出典のない exhibit を出さない。

## Agent Prompt Guide

> **Quick palette**: navy `#15233b` ／ ink `#1f2a3a` ／ grey-bar `#9aa6b4` ／ surface `#f3f5f8` ／ accent(red) `#c8102e` ／ accent-soft `#f6d6db`。Font: Arial / Helvetica Neue（和文 Noto Sans JP）。角丸 2–4px。マージン 96px。
>
> **Prompt**: 「MBB（McKinsey/BCG/Bain）の戦略コンサルスタイルでスライドを作って。各コンテンツスライドの**タイトルは“一文の主張（アクションタイトル）”**にする（“概要”のようなラベル禁止）。タイトルだけを上から読むとストーリーが通るように（Mintoピラミッド／horizontal flow）構成する。各スライドは上から『アクションタイトル帯（navy #15233b、直下に navy 2px 罫線）→ “EXHIBIT n”キッカー（赤 #c8102e）＋exhibitタイトル → exhibit本体（インラインSVGの棒/ウォーターフォール、または2×2マトリクス・3ピラー）→ 出典脚注（Source: …）＋ページ番号』。1スライド1メッセージ、本文はタイトルを証明するためだけに置く。チャートはグレー #9aa6b4 基調で、主張を支える1本だけ赤 #c8102e（data-ink 規律）。差し色は1スライド1〜2箇所まで。Arial（和文 Noto Sans JP）、本文19px/行間1.5以上、マージン96px。表は使わず div+flex/grid で。色付き左縦ラインは使わず重要度は面塗り（#f6d6db）やチップで示す。影なしのフラット、罫線と余白で階層化。」

## HTML→PPTX Notes

- アクションタイトル帯の navy 2px 罫線・exhibit枠の hairline・チップ・矩形セルはすべて `<div>` でネイティブ図形化できる。
- 棒チャート／ウォーターフォールは**インライン SVG**（`<rect>`＋`<line>`＋`<text>`）で組む。`<canvas>` は不可（[HTML_INPUT_SPEC](../HTML_INPUT_SPEC.md) §8.4：ラスタ化）。SVG はベクター保持されやすく、PPTX 上で図形として扱える。
- 2×2マトリクス・3ピラーは div＋grid/flex で（`<table>` を使わない方針）。セルが個別ネイティブ図形になり編集しやすい。
- 影は使わない設計なので blur/box-shadow のラスタ化要因が無く、フィデリティが高い。
- 差し色面・グレー棒はベタ塗りなので忠実に再現される。グラデは原則使わない。
- Arial/Helvetica Neue 未解決時でも PPTX 標準フォントに近いため字面ズレが小さい。和文は Noto Sans JP 未解決時に MS ゴシック系フォールバック前提で、改行位置に字数の余裕を持たせる。

## Iteration Guide

1. まず**全タイトル（一文の主張）を先に書き切る**。それを上から読んでストーリーが通るか（horizontal flow）を検証してから本文に着手する。
2. 各タイトルに対し「それを証明する exhibit は何か」を1つだけ選ぶ（chart / framework / comparison）。
3. exhibit には必ず「EXHIBIT n」と出典を付ける。出典が書けない主張は載せない。
4. 差し色を足したくなったら、まず既存の差し色を1つ減らせないか検討する（data-ink 規律）。
5. 新しい exhibit 型は `layouts` に追加し、本文 Slide Layouts にも1行加える。

## References / 参考にした流派・出典

- **参考にした流派**: MBB（McKinsey / BCG / Bain）戦略コンサル。Minto ピラミッド原則。特定ファイルではなく3社共通の作法。
- **視覚的な署名**: アクションタイトル / 水平フロー / EXHIBIT 表記 / 抑制された2〜3色 / 出典脚注。
- 出典:
  - [Consulting slide standards（Deckary）](https://deckary.com/blog/consulting-slide-standards)
  - [Consulting slide structure（Analyst Academy）](https://www.theanalystacademy.com/consulting-slide-structure/)
  - [Strategy consulting slide design（Poesius）](https://poesius.com/blog/strategy-consulting-slide-design-principles)

> 注: 本定義は特定の PowerPoint ファイルの複製ではなく、上記の流派・ギャラリーから**デザイン思考とエッセンスを抽出**して再構築したもの。比較ビューア（[`../_viewer/index.html`](../_viewer/index.html)）で「作ったスライド」と上記の参照元を見比べられる。横断タクソノミは[スライドランド](https://www.slideland.tech/)（style×docType×industry×color）に準拠。

**起点（Slideland 経由の実スライド・実在企業の公開デッキ）**: [株式会社アズーム 2026年9月期 第2四半期決算説明資料](https://contents.xj-storage.jp/xcontents/AS03634/61c72267/2cf4/47c3/b0e4/32c6759e9792/140120260430514812.pdf)（#決算説明資料 #不動産 #信頼感 #ライトブルー）— 構造化され信頼感のある決算資料。MBBの国内近似。
