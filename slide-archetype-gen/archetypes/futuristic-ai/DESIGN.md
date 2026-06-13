---
version: alpha
name: Futuristic AI Tech
description: ディープテック/AI企業の「前進する未来」を体現するエネルギッシュなダーク基調。漆黒に近い地にグラデーションメッシュとネオンのグロー、細いグリッドやパーティクルのモチーフを重ね、製品やシステムを div ボックス＋インラインSVGの配線で描くアーキテクチャ図中心の構成。中密度。Apple ミニマルの「静けさ・余白」とは対照的に、グラデーションと図解で躍動感を出しつつも規律を保つ。
meta:
  archetype: futuristic-ai
  origin: AI/SaaS product launches・deep-tech keynotes（系譜として Vercel / Linear / OpenAI ビジュアル）
  locale: bilingual
  density: medium
  mood: [futuristic, energetic, innovative, technical, premium]
  tags:
    style: [futuristic, dynamic, trust]
    docType: [pitch, service, product-launch, vision]
    industry: [ai, saas, deep-tech, web3]
    color: [dark, gradient, two-tone]

canvas:
  width: 1920px
  height: 1080px
  aspectRatio: "16:9"
  exportWidthIn: 13.333
  exportHeightIn: 7.5
  background: "{colors.canvas}"
  margin: 112px

grid:
  columns: 12
  gutter: 24px
  margin: 112px
  baseline: 8px

colors:
  primary: "#7c5cff"
  canvas: "#07080d"
  canvas-2: "#0b0d16"
  ink: "#eef1f8"
  muted: "#8a90a6"
  surface: "#12141f"
  surface-2: "#171a28"
  hairline: "#23263a"
  accent: "#7c5cff"
  accent-2: "#22d3ee"
  positive: "#5cf2a4"
  glow-violet: "#7c5cff"
  glow-cyan: "#22d3ee"

typography:
  kicker:
    fontFamily: "'JetBrains Mono', 'SF Mono', ui-monospace, 'Roboto Mono', monospace"
    fontSize: 22px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: 0.18em
  hero:
    fontFamily: "'Space Grotesk', 'Inter', -apple-system, 'Noto Sans JP', sans-serif"
    fontSize: 132px
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: -0.02em
  slide-title:
    fontFamily: "'Space Grotesk', 'Inter', -apple-system, 'Noto Sans JP', sans-serif"
    fontSize: 64px
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: -0.015em
  statement:
    fontFamily: "'Space Grotesk', 'Inter', -apple-system, 'Noto Sans JP', sans-serif"
    fontSize: 88px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -0.02em
  lead:
    fontFamily: "'Inter', -apple-system, 'Noto Sans JP', sans-serif"
    fontSize: 32px
    fontWeight: 400
    lineHeight: 1.4
  body:
    fontFamily: "'Inter', -apple-system, 'Noto Sans JP', sans-serif"
    fontSize: 22px
    fontWeight: 400
    lineHeight: 1.5
  bullet:
    fontFamily: "'Inter', -apple-system, 'Noto Sans JP', sans-serif"
    fontSize: 24px
    fontWeight: 400
    lineHeight: 1.45
  tag:
    fontFamily: "'JetBrains Mono', 'SF Mono', ui-monospace, monospace"
    fontSize: 18px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: 0.12em
  node-label:
    fontFamily: "'JetBrains Mono', 'SF Mono', ui-monospace, monospace"
    fontSize: 20px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: 0.04em
  kpi-number:
    fontFamily: "'Space Grotesk', 'Inter', -apple-system, sans-serif"
    fontSize: 260px
    fontWeight: 600
    lineHeight: 0.92
    letterSpacing: -0.03em
  kpi-label:
    fontFamily: "'Inter', -apple-system, 'Noto Sans JP', sans-serif"
    fontSize: 26px
    fontWeight: 400
    lineHeight: 1.3
  caption:
    fontFamily: "'Inter', -apple-system, 'Noto Sans JP', sans-serif"
    fontSize: 20px
    fontWeight: 400
    lineHeight: 1.4
  source:
    fontFamily: "'JetBrains Mono', 'SF Mono', ui-monospace, monospace"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: 0.06em

rounded:
  none: 0px
  sm: 10px
  md: 16px
  lg: 24px
  xl: 32px
  full: 9999px

spacing:
  xs: 8px
  sm: 16px
  md: 24px
  lg: 48px
  xl: 80px
  margin: 112px

layouts:
  cover:
    description: "ダークなグラデーションヒーロー。中央〜左にモノのキッカー（ラベル）＋大きなタイトル、背後に径の大きいラジアルグロー1枚。下にサブ1行とタグ。"
    uses: [kicker, hero, lead, tag]
    notes: "グローは radial-gradient の <div> 1枚に閉じ込め、テキストは別レイヤーで実テキスト。"
  statement:
    description: "グラデーション地に大きな主張文1つ。1語だけ accent/accent-2 のソリッド色で強調（グラデclipは使わない）。"
    uses: [statement]
  architecture-diagram:
    description: "システム/パイプライン図。div のノードボックスを横または格子に並べ、インラインSVGの線・矢印で接続。要所に小さなグローノード（円）。各ノードはモノのラベル＋短い説明。"
    uses: [slide-title, node-box, connector, node-label, tag]
    notes: "接続線・矢印・接合点ノードはすべて1枚のインラインSVGで描く。ボックスは div。"
  feature-grid:
    description: "3〜4枚のフィーチャーカード。各カードにネオンのSVGアイコン（チップ内）＋見出し＋本文。重要度は塗りチップ/グローで示す（左罫線は使わない）。"
    uses: [slide-title, feature-card, tag]
  metric-hero:
    description: "巨大数値1つを中央にグロー付きで。下にラベルと出典。脇に小さな補助メトリクスを並べてもよい。"
    uses: [kpi-number, kpi-label, source]
  roadmap:
    description: "横方向のフェーズ（3〜4）。フェーズチップをインラインSVGの水平軸でつなぎ、各フェーズに見出しと箇条1〜2行。現在地はグローで示す。"
    uses: [slide-title, phase-chip, connector, bullet]
  closing:
    description: "表紙と対のCTA。グラデーション地に短い一言＋モノのURL/ハンドル＋ピル状CTA。"
    uses: [statement, tag, cta-pill]

components:
  kicker:
    typography: "{typography.kicker}"
    textColor: "{colors.accent-2}"
  hero:
    typography: "{typography.hero}"
    textColor: "{colors.ink}"
  slide-title:
    typography: "{typography.slide-title}"
    textColor: "{colors.ink}"
  statement:
    typography: "{typography.statement}"
    textColor: "{colors.ink}"
  lead:
    typography: "{typography.lead}"
    textColor: "{colors.muted}"
  tag:
    typography: "{typography.tag}"
    textColor: "{colors.accent-2}"
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.full}"
    padding: 8px 18px
  node-box:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    borderColor: "{colors.hairline}"
    padding: 24px 28px
  node-label:
    typography: "{typography.node-label}"
    textColor: "{colors.accent-2}"
  feature-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    borderColor: "{colors.hairline}"
    padding: 36px
  icon-chip:
    backgroundColor: "{colors.surface-2}"
    rounded: "{rounded.md}"
    padding: 16px
  phase-chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: 10px 22px
  kpi-number:
    typography: "{typography.kpi-number}"
    textColor: "{colors.ink}"
  cta-pill:
    backgroundColor: "{colors.accent}"
    textColor: "#07080d"
    rounded: "{rounded.full}"
    padding: 18px 40px
  source-footnote:
    typography: "{typography.source}"
    textColor: "{colors.muted}"
---

# Futuristic AI Tech

## Overview

ディープテック/AI企業の「前進する未来（forward-motion）」を視覚化する流派です。漆黒に近いダーク地（#07080d）を基盤に、エレクトリックバイオレット→シアンのグラデーション、ネオンのグロー、細いグリッドやパーティクルのモチーフを重ねて、**革新が動いている**という躍動感を出します。製品やシステムは div のボックスとインラインSVGの配線で描く**アーキテクチャ図/パイプライン図**が主役になりがちで、情報密度は中程度。

Apple Keynote Minimal が「静けさ・余白・1メッセージ」で引き算するのに対し、この流派は**グラデーションと図解で足し算**します。ただし無秩序ではなく、ネオンは色数を絞り（violet・cyan・lime の3点）、テキストは原則ソリッドな ink（グラデーションでクリップしない）に保ち、グローはモデレートに留めることで「派手だが規律ある」テックの質感を作ります。AI/SaaS・ディープテック・暗号/web3 のプロダクトローンチやビジョンデッキに最適です。

**Key Characteristics:**
- 漆黒に近いダーク地（#07080d）＋径の大きいラジアルグローで奥行き。
- アクセントは violet(#7c5cff)→cyan(#22d3ee) のグラデーション＋lime(#5cf2a4) を「稼働中/ポジティブ」に。
- 見出しは geometric sans（Space Grotesk/Inter）、ラベル/タグは mono（JetBrains Mono）の大文字トラッキング。
- アーキテクチャ図はボックス（div）＋インラインSVGの線/矢印/グローノードで構築。
- グローは控えめな box-shadow/text-shadow。重いブラーでラスタ化させない。
- 見出しテキストは必ずソリッド色（`background-clip:text` は使わない）。

## Colors

ダーク基調を既定とし、グラデーションは**アクセント図形と背景グローにだけ**使います。本文テキストは ink ソリッドのまま、グラデは面に閉じ込めます。

- **Canvas** ({colors.canvas} — #07080d): 既定の全面背景。漆黒に近い藍黒。
- **Canvas-2** ({colors.canvas-2} — #0b0d16): グラデーション地のもう一方の端。
- **Ink** ({colors.ink} — #eef1f8): 本文・見出しの基準色。やや青みのオフホワイト。
- **Muted** ({colors.muted} — #8a90a6): サブ・キャプション・補足。
- **Surface** ({colors.surface} — #12141f) / **Surface-2** (#171a28): カード/ノード/タグの面。
- **Hairline** ({colors.hairline} — #23263a): カード・ノードの細い枠線。
- **Accent** ({colors.accent} — #7c5cff): 主アクセント（バイオレット）。グラデの起点・強調語・CTA。
- **Accent-2** ({colors.accent-2} — #22d3ee): 副アクセント（シアン）。キッカー/タグ/ノードラベル・グラデの終点。
- **Positive** ({colors.positive} — #5cf2a4): 「稼働中/成長/ポジティブ」を示すライム。稼働インジケータや上昇に限定。

> 黒地に ink #eef1f8 ≈ 16:1（AAA）。muted #8a90a6 on canvas ≈ 5.6:1（本文可）。accent-2 #22d3ee on canvas ≈ 9:1。accent #7c5cff on canvas ≈ 4.6:1（大文字・非本文用に限定）。本文は ink/muted を使う。

## Typography

**見出し = Space Grotesk（不可なら Inter）**、**ラベル/タグ/ノード = JetBrains Mono（不可なら SF Mono）** の大文字トラッキング。本文は Inter。和文代替は **Noto Sans JP**。mono は英数ラベル専用とし、和文を mono に流し込まない。

| Token | Size | Weight | LineHeight | Use |
|---|---|---|---|---|
| hero | 132px | 600 | 1.02 | 表紙のタイトル |
| statement | 88px | 600 | 1.1 | 宣言文 |
| slide-title | 64px | 600 | 1.08 | 各スライド見出し |
| kpi-number | 260px | 600 | 0.92 | メトリクスの主役数値 |
| lead | 32px | 400 | 1.4 | リード/サブ |
| bullet | 24px | 400 | 1.45 | 箇条書き |
| body | 22px | 400 | 1.5 | 本文 |
| node-label | 20px | 500 | 1.3 | 図のノードID（mono） |
| kicker / tag | 18–22px | 500 | — | アイブロー/タグ（mono・大文字） |
| caption / source | 16–20px | 400 | — | 注記・出典（source は mono） |

**原則**: 見出しはタイトな負レタースペーシング（-0.015〜-0.03em）。mono ラベルは正トラッキング（0.06〜0.18em）＋ `text-transform: uppercase`。1スライドに見出し1階層＋本文1階層を基本とし、フォントサイズの種類を増やしすぎない。和文は letterSpacing を 0 に寄せる。

## Layout & Grid

台紙 1920×1080、マージン **112px**、12カラム/gutter 24px、baseline 8px。Apple ミニマルほど余白を取らず、図やカードを画面に展開する**中密度**。中央寄せに固執せず、左揃えの見出し＋右にビジュアル/図、という非対称構図も多用します。背景には径の大きいラジアルグロー1〜2枚を `<div>` で敷き、その上にコンテンツを別レイヤーで重ねます。

## Slide Layouts

- **cover**: ダークグラデーション地に左寄せのモノキッカー＋大タイトル＋サブ。背後にラジアルグロー1枚。下端にタグ列。
- **statement**: グラデーション地に主張文1つ。1語だけ accent/accent-2 のソリッド色で強調。
- **architecture-diagram**: div ノードを横/格子に配置し、インラインSVGの線・矢印・グローノードで接続。各ノードに mono のID＋短い説明。データの流れを左→右で読ませる。
- **feature-grid**: 3〜4枚のカードにネオンSVGアイコンチップ＋見出し＋本文。重要度はチップの塗り/グローで示す（色付き左罫線は使わない）。
- **metric-hero**: 巨大数値1つをグロー付き中央に。下にラベルと出典。脇に小さな補助メトリクスを並べてよい。
- **roadmap**: 横方向の3〜4フェーズをSVG水平軸でつなぎ、現在地をグローで示す。
- **closing**: グラデーション地に短い一言＋mono URL＋CTAピル。

## Elevation & Depth

影は使うが、主役は**グラデーションの発光（glow）**。手段は3層：(1) 背景の径の大きい `radial-gradient` を敷いた `<div>`（1スライド1〜2枚に限定）、(2) アクセント図形・ノード・CTAの控えめな `box-shadow`（例 `0 0 40px rgba(124,92,255,.35)`）、(3) 重要語・数値の `text-shadow`（淡く小径）。カード/ノードは surface ベタ面＋1px hairline 枠＋大きな角丸。**重いブラー（filter:blur の多用）はラスタ化を招く**ため避け、グローはモデレートに。

## Shapes

角丸は中〜大（md 16 / lg 24 / xl 32px、タグ/CTA/チップは full）。配線（コネクタ）・矢印・接合ノードは**すべてインラインSVG**で描く。ノードボックスは div の角丸矩形。グリッド/パーティクルのモチーフは淡い線のSVGまたは控えめな繰り返しグラデで、主張しすぎないこと。鋭すぎる直角は避け、テック感はネオンとグリッドで出す。

## Components

- **kicker**: mono・accent-2・大文字トラッキング。表紙/各見出しのアイブロー。
- **slide-title / hero / statement**: ink ソリッドの見出し。強調語のみ accent/accent-2。
- **tag**: surface 地の丸タグ（mono・大文字）。「LIVE」「v2.0」等のラベル。重要度はタグの塗りで示す。
- **node-box**: surface 地＋hairline 枠＋大角丸。中に mono の node-label と短い説明。アーキ図の基本部品。
- **connector**: インラインSVGの線・矢印・小さなグロー円。データフローを示す。
- **feature-card**: surface 地のカード。アイコンチップ＋見出し＋本文。
- **icon-chip**: surface-2 の角丸チップにネオンSVGアイコン（accent/accent-2 ストローク）。
- **phase-chip / cta-pill**: full 角丸のピル。CTAは accent 塗り＋暗い文字でコントラスト確保。
- **kpi-number**: 260px の数値。グロー付き。
- **source-footnote**: 画面下、mono・muted・極小。

## Motion

紙（PPTX）では構成上のリズムで「前進感」を表現します：左→右へ流れるアーキ図、フェーズが進むロードマップ、数値が立ち上がるメトリクス。実アニメーションは [HTML_INPUT_SPEC](../HTML_INPUT_SPEC.md) §9.4 の通り PPTX では限定的（CSSアニメ/トランジション/ホバーは書き出されない）。動きはレイアウトの方向性と矢印で示し、ランタイム依存の演出に頼らないこと。

## Do's and Don'ts

- **Do**: ダーク地＋violet→cyan グラデを面とグローにだけ使い、テキストは ink ソリッドに保つ。
- **Do**: アーキ図はボックス（div）＋インラインSVGの線/矢印/グローノードで。データは左→右で読ませる。
- **Do**: ネオンは3色（violet/cyan/lime）に絞り、lime は「稼働/ポジティブ」専用に。
- **Do**: 重要度は塗りチップ・バッジ・グローで示す。
- **Don't**: `background-clip:text` でグラデ文字にしない（非対応・編集不能化）。見出しは実テキストのソリッド色。
- **Don't**: 重いブラーや多色の虹グラデで全面を埋めてラスタ化させない。
- **Don't**: カード/ノードに色付きの左縦罫線（border-left アクセント）で重要度を示さない。
- **Don't**: mono フォントに和文を流し込まない（英数ラベル専用）。
- **Don't**: 1スライドに図・カード・数値を詰め込みすぎない（中密度を守る）。

## Agent Prompt Guide

> **Quick palette**: canvas `#07080d` ／ ink `#eef1f8` ／ muted `#8a90a6` ／ surface `#12141f` ／ accent(violet) `#7c5cff` ／ accent-2(cyan) `#22d3ee` ／ positive(lime) `#5cf2a4`。Headings: Space Grotesk/Inter（和文 Noto Sans JP）。Labels/tags: JetBrains Mono 大文字。グラデは面とグローだけ、文字は ink ソリッド。
>
> **Prompt**: 「Futuristic AI Tech 風でスライドを作って。漆黒に近いダーク地(#07080d)に、エレクトリックバイオレット(#7c5cff)→シアン(#22d3ee)のグラデーションと控えめなネオングローで前進感を出す。見出しは Space Grotesk/Inter のソリッドなオフホワイト(#eef1f8)、ラベル/タグ/図のノードIDは JetBrains Mono の大文字トラッキング。アーキテクチャ図は div のノードボックスをインラインSVGの線と矢印・小さなグロー円で接続して左→右で流す。メトリクスは巨大数値1つをグロー付きで。lime(#5cf2a4)は稼働中/ポジティブ専用。`background-clip:text` は使わず文字はソリッド色。重いブラーは避け、重要度は塗りチップ/バッジ/グローで示す。マージン112pxの中密度。」

## HTML→PPTX Notes

- **グラデは `<div>` の `linear-gradient`/`radial-gradient` のみ**。背景の径の大きいラジアルグローは1スライド1〜2枚の `<div>` に閉じ込め、その上のテキストは別レイヤー（テキストがラスタに巻き込まれないように）。
- **見出しのグラデ文字は禁止**（`background-clip:text` 非対応）。強調語は accent/accent-2 の**ソリッド color** で。
- **コネクタ/矢印/グローノードはインラインSVG**で描く（ベクター保持されやすい）。`<line>`/`<path>`/`<polygon>`/`<circle>` を使い、矢印は `<marker>` か小さな `<polygon>` で。
- グローは `box-shadow`/`text-shadow` の**控えめな**ぼかし（径 40px 前後・低 alpha）。`filter:blur` の多用は §8.4 でラスタ化するため避ける。
- アイコンは細線のインラインSVG（accent/accent-2 ストローク）。emoji を機能アイコンに使わない。
- 表は使わず div+flex で組む（装飾的な表は避ける方針）。
- フォント未解決時は Space Grotesk→Inter→Arial、mono→Arial にフォールバックする前提でレイアウトに余裕を持たせる。

## Iteration Guide

1. まず「このデッキの主役図（アーキ/パイプライン）」を1枚決め、それを軸に前後を組む。
2. 色を足したくなったら、まず violet/cyan/lime の3点で表現できないか検討する（色数を増やさない）。
3. グローが強すぎてラスタ化が疑われたら、半径と alpha を下げるか、`box-shadow` を細い hairline 枠＋淡い影に置き換える。
4. 図の接続が読みにくければ、ノード数を減らすか、流れを必ず一方向（左→右 or 上→下）に整える。
5. 密度が上がりすぎたらカード/ノードを別スライドに分割し、中密度を保つ。

## References / 参考にした流派・出典

- **参考にした流派**: Futuristic / AI / Tech。AI・ディープテック企業のビジョンデッキ、2026トレンド（ダーク＋グロー＋グラデメッシュ）。
- **視覚的な署名**: 暗背景＋グロー / グラデメッシュ / アーキ図 / mono ラベル / 革新の表現。
- 出典:
  - [2026 デザイントレンド（Digital Synopsis）](https://digitalsynopsis.com/design/graphic-design-trends-2026/)

> 注: 本定義は特定の PowerPoint ファイルの複製ではなく、上記の流派・ギャラリーから**デザイン思考とエッセンスを抽出**して再構築したもの。比較ビューア（[`../_viewer/index.html`](../_viewer/index.html)）で「作ったスライド」と上記の参照元を見比べられる。横断タクソノミは[スライドランド](https://www.slideland.tech/)（style×docType×industry×color）に準拠。

**起点（Slideland 経由の実スライド・実在企業の公開デッキ）**: [アジアクエスト株式会社 2025年12月期 決算説明資料](https://contents.xj-storage.jp/xcontents/AS09120/9899f8aa/2916/42cb/b149/3d6fe0064da0/140120260212558286.pdf)（#決算説明資料 #開発 #近未来 #レッド）— 「近未来」タグの国内テック実例。Futuristic/AI の国内起点。
