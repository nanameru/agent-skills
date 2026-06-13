---
version: alpha
name: Data Dashboard (Dark) (BIダッシュボード ダークモード)
description: BIダッシュボードの文法をスライドに持ち込んだ高密度・ダークモードの定量表示スタイル。深いチャコール／ネイビーの地に、ニュートラルなパネルカードでKPI・複数チャート・タイムラインを区画化し、ネオン寄りのアクセント三色（シアン／バイオレット／アンバー）を「チャートと強調」だけに使って視線を誘導する。投資家アップデート・経営報告・四半期オペレビューなど、数値を一望させる文書向け。

meta:
  archetype: data-dashboard-dark
  origin: BIツール（Looker / Tableau / Grafana）のダークテーマ／投資家向けボードデック／GitHub Dark配色／ターミナル系ダッシュボードUI
  locale: ja
  density: high
  mood: [analytical, focused, technical, premium, data-dense]
  tags:
    style: [futuristic, trust, dynamic, clear]
    docType: [ir, exec-review, ops-review, board-update, pitch]
    industry: [saas, ai, finance, infrastructure]
    color: [dark, navy, neon-accent, three-tone]

canvas:
  width: 1920px
  height: 1080px
  aspectRatio: "16:9"
  exportWidthIn: 13.333
  exportHeightIn: 7.5
  background: "{colors.canvas}"
  margin: 72px

grid:
  columns: 12
  gutter: 24px
  margin: 72px
  baseline: 8px

colors:
  canvas: "#0d1117"
  surface: "#161b22"
  surface-2: "#1c2430"
  ink: "#e6edf3"
  muted: "#8b949e"
  hairline: "#2a313c"
  accent: "#38d6c8"
  accent-2: "#a371f7"
  accent-3: "#f0a93b"
  positive: "#3fb950"
  negative: "#f85149"
  on-accent: "#0d1117"

typography:
  kicker:
    fontFamily: "'Inter', 'SF Pro Display', 'Noto Sans JP', sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.12em
  slide-title:
    fontFamily: "'Inter', 'SF Pro Display', 'Noto Sans JP', sans-serif"
    fontSize: 40px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.01em
  key-message:
    fontFamily: "'Inter', 'SF Pro Display', 'Noto Sans JP', sans-serif"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.4
  lead:
    fontFamily: "'Inter', 'SF Pro Display', 'Noto Sans JP', sans-serif"
    fontSize: 22px
    fontWeight: 400
    lineHeight: 1.55
  body:
    fontFamily: "'Inter', 'SF Pro Display', 'Noto Sans JP', sans-serif"
    fontSize: 19px
    fontWeight: 400
    lineHeight: 1.6
  bullet:
    fontFamily: "'Inter', 'SF Pro Display', 'Noto Sans JP', sans-serif"
    fontSize: 19px
    fontWeight: 400
    lineHeight: 1.5
  card-label:
    fontFamily: "'Inter', 'SF Pro Display', 'Noto Sans JP', sans-serif"
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: 0.02em
  kpi-number:
    fontFamily: "'Inter', 'SF Mono', 'SF Pro Display', 'Noto Sans JP', monospace"
    fontSize: 56px
    fontWeight: 700
    lineHeight: 1.0
    letterSpacing: -0.02em
    fontFeature: "'tnum' 1, 'zero' 1"
  kpi-label:
    fontFamily: "'Inter', 'SF Pro Display', 'Noto Sans JP', sans-serif"
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.3
  metric:
    fontFamily: "'Inter', 'SF Mono', 'Noto Sans JP', monospace"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.2
    fontFeature: "'tnum' 1"
  axis:
    fontFamily: "'Inter', 'SF Mono', 'Noto Sans JP', monospace"
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.2
    fontFeature: "'tnum' 1"
  caption:
    fontFamily: "'Inter', 'SF Pro Display', 'Noto Sans JP', sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.4
  source:
    fontFamily: "'Inter', 'SF Pro Display', 'Noto Sans JP', sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.3
  page-number:
    fontFamily: "'Inter', 'SF Mono', 'Noto Sans JP', monospace"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1
    fontFeature: "'tnum' 1"

rounded:
  none: 0px
  sm: 6px
  md: 10px
  lg: 14px
  pill: 9999px

spacing:
  xs: 6px
  sm: 12px
  md: 20px
  lg: 32px
  xl: 48px
  margin: 72px
  gutter: 24px

layouts:
  cover:
    description: "ダークヒーロー表紙。canvas全面に薄いグリッド線＋上部にkicker、中央左寄せに大タイトル、下部に期間メタとアクセント水平ライン。背景に微かなaccentのグロー1点のみ。"
    uses: [kicker, slide-title, lead, accent-rule]
  kpi-overview:
    description: "4〜6枚のKPIカードをグリッド配置。各カードは card-label＋kpi-number＋前期比バッジ（positive/negative）＋極小スパークラインSVG。数値はtabular-nums。"
    uses: [kpi-card, kpi-number, delta-badge, sparkline]
  chart-grid:
    description: "2×2のチャートグリッド。棒・折れ線(エリア)・ドーナツ・積み上げ棒の小型インラインSVGを各カードに収める。各カードに小見出しと1行の読み取り。"
    uses: [chart-card, chart-svg, legend, card-label]
  single-big-chart:
    description: "1枚の大型インラインSVG折れ線/エリアチャート＋凡例＋右側に注釈KPI。X/Y軸ラベル・グリッド線を薄いhairlineで描く。"
    uses: [chart-card, chart-svg, legend, axis-label, callout]
  table-as-cards:
    description: "ランキング/内訳をdiv＋flex/gridで構築（<table>不使用）。各行はrank＋名称＋数値（tabular）＋シェアバー。ヘッダ行はmutedラベル。"
    uses: [rank-row, bar-inline, metric, delta-badge]
  timeline:
    description: "横長マイルストーン帯。水平の軸線上にノード（accent）＋日付＋ラベル。完了/進行/予定をfill/borderで区別。"
    uses: [timeline-node, card-label, caption]
  closing:
    description: "結論の再掲＋ネクストアクション。ダーク地にaccentチップのCTAと連絡メタ。"
    uses: [slide-title, key-message-bar, delta-badge]

components:
  kicker:
    typography: "{typography.kicker}"
    textColor: "{colors.accent}"
  slide-title:
    typography: "{typography.slide-title}"
    textColor: "{colors.ink}"
  key-message-bar:
    typography: "{typography.key-message}"
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    padding: 18px 26px
    rounded: "{rounded.md}"
  kpi-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 28px
    border: "1px solid {colors.hairline}"
  chart-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 24px
    border: "1px solid {colors.hairline}"
  card-label:
    typography: "{typography.card-label}"
    textColor: "{colors.muted}"
  kpi-number:
    typography: "{typography.kpi-number}"
    textColor: "{colors.ink}"
  delta-badge-positive:
    backgroundColor: "rgba(63,185,80,0.16)"
    textColor: "{colors.positive}"
    rounded: "{rounded.pill}"
    padding: 4px 12px
  delta-badge-negative:
    backgroundColor: "rgba(248,81,73,0.16)"
    textColor: "{colors.negative}"
    rounded: "{rounded.pill}"
    padding: 4px 12px
  accent-chip:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.pill}"
    padding: 6px 16px
  legend-dot:
    rounded: "{rounded.pill}"
    size: 10px
  rank-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: 14px 20px
    border: "1px solid {colors.hairline}"
  bar-inline:
    backgroundColor: "{colors.surface-2}"
    fillColor: "{colors.accent}"
    rounded: "{rounded.sm}"
  timeline-node:
    fillColor: "{colors.accent}"
    borderColor: "{colors.hairline}"
  source-footnote:
    typography: "{typography.source}"
    textColor: "{colors.muted}"
  page-number:
    typography: "{typography.page-number}"
    textColor: "{colors.muted}"
---

# Data Dashboard (Dark) (BIダッシュボード ダークモード)

## Overview

BIツール（Looker / Tableau / Grafana）のダークテーマが定着させた「定量表示の文法」を、そのままスライドに移植した流派です。狙いは**密度を保ったまま一望でスキャンできること**。地を深いチャコール／ネイビー（#0d1117）に落とすことで、(1) チャートのアクセント色が浮き上がり視線が自然に数値へ向かう、(2) 長時間の数値レビューでも目が疲れにくい、(3) 経営・投資家向けの「計器盤」らしいプレミアム感が出る、という3つの効果を得ます。

中核は2つ。(1) **ニュートラルなパネルカードでの区画化** — KPI・各チャート・ランキングを surface(#161b22) のカードに入れ、高密度でも「塊」として読ませる。(2) **アクセント三色の役割固定** — シアン(#38d6c8)／バイオレット(#a371f7)／アンバー(#f0a93b) を系列・強調・チャートにだけ使い、本文の大面積フィルには絶対に使わない。増減は positive(#3fb950) / negative(#f85149) のバッジで示します。

数値は等幅寄り（tabular-nums）で桁を揃え、計器盤らしい正確さを演出します。投資家アップデート・四半期オペレビュー・経営ボード報告など「数字を一望させる」文書に最適です。

**Key Characteristics:**
- 深いチャコール/ネイビーの地（#0d1117）にニュートラルなカードで区画化する。
- KPIカード＋マルチチャートグリッド＋タイムラインで「計器盤」を構成する。
- アクセント三色（シアン/バイオレット/アンバー）はチャート・強調のみ。本文フィルには使わない。
- 数値は tabular-nums で桁揃え。等幅寄りフォントで正確さを出す。
- 増減は塗りバッジ（positive/negative）で示す。色付き左縦ライン（border-left）は使わない。
- すべてのチャートはインラインSVG（rect/path/circle/text）で描く。

## Colors

- **Canvas** ({colors.canvas} — #0d1117): 地色。深いチャコール／ネイビー。全スライド共通の背景。
- **Surface** ({colors.surface} — #161b22): KPI/チャート/ランキングカードの面。
- **Surface-2** ({colors.surface-2} — #1c2430): キーメッセージ帯・バーの軌道・入れ子の面。
- **Ink** ({colors.ink} — #e6edf3): 本文・数値・見出し。canvas に対し ≈ 14:1（AAA）。
- **Muted** ({colors.muted} — #8b949e): ラベル・軸・脚注。canvas に対し ≈ 5.6:1（AA）。
- **Hairline** ({colors.hairline} — #2a313c): カード境界・グリッド線・軸。
- **Accent / Cyan** ({colors.accent} — #38d6c8): 第1系列・主要チャート・CTAチップ。視線の主誘導。
- **Accent-2 / Violet** ({colors.accent-2} — #a371f7): 第2系列・対比カテゴリ。
- **Accent-3 / Amber** ({colors.accent-3} — #f0a93b): 第3系列・注意喚起・ハイライト。
- **Positive** ({colors.positive} — #3fb950): 増加・達成（前期比＋のバッジ・上昇トレンド）。
- **Negative** ({colors.negative} — #f85149): 減少・未達（前期比−のバッジ・下降トレンド）。

> コントラスト: ink/canvas ≈ 14:1（AAA）。muted/canvas ≈ 5.6:1（AA本文可）。accent はチャートの線/面・小さなチップにのみ使い、**accent上に本文テキストを長く載せない**（cyan/dark の組合せはチップ程度に限定）。バッジは半透明フィル（rgba …,0.16）＋濃いアクセント文字で AA を確保する。

## Typography

クリーンなサンセリフ（**Inter** / SF Pro、和文は **Noto Sans JP**）を基調に、数値・軸ラベルは等幅寄り（SF Mono 等）で **tabular-nums** を効かせて桁を揃えます。見出し・KPI数値は 700、本文は 400、ラベルは 500。

| Token | Size | Weight | Use |
|---|---|---|---|
| slide-title | 40px | 700 | スライド見出し（ink） |
| key-message | 24px | 600 | キーメッセージ帯（結論） |
| kpi-number | 56px | 700 | KPIの大数値（tabular-nums） |
| metric | 20px | 600 | 表/ランキングの数値（tabular） |
| card-label / kpi-label | 16px | 500 | カードのラベル |
| body / bullet | 19px | 400 | 本文・箇条書き |
| axis | 13px | 500 | チャート軸・目盛（tabular） |
| caption / source | 13–14px | 400 | 注釈・出典 |

**原則**: ダーク地でも本文は **19px以上・行間1.6以上**を死守し、ink(#e6edf3) で AAA を確保。数値は必ず `font-feature-settings: 'tnum' 1`（tabular-nums）で桁位置を固定する。アクセント色は数字テキストの強調に点で使ってよいが、**本文段落の文字色には使わない**。

## Layout & Grid

台紙 1920×1080。マージン 72px、12カラム・ガター24px、8pxベースライン。ダッシュボードは**カードのグリッド配置が命**：KPIは2〜3列×2行、チャートは2×2、ランキングは縦積みのカード行で構成する。各スライドは上から「kicker → slide-title（＋必要ならキーメッセージ帯）→ カードグリッド → 出典/ページ番号」の構造を共有する。

情報密度は **high** だが、(1) カードで塊化、(2) hairline の薄い境界で分離、(3) アクセントを最小点に絞る、の3点で計器盤の可読性を保つ。1スライド1テーマ（例:「成長KPI」「収益内訳」「稼働の時系列」）に絞り、欲張って2テーマを1枚に混ぜない。

## Slide Layouts

- **cover（表紙）**: ダークヒーロー。薄いグリッド背景＋大タイトル＋期間メタ＋accentの細い水平ライン。グローは1点まで。
- **kpi-overview**: KPIカード4〜6枚のグリッド。各カードに大数値・前期比バッジ・極小スパークライン。スキャンの起点。
- **chart-grid**: 2×2の小型チャート（棒/折れ線エリア/ドーナツ/積み上げ棒）。各カードに小見出しと1行の読み取り。
- **single-big-chart**: 大型の折れ線/エリア1枚＋凡例＋右に注釈KPI。トレンドを主役にする回。
- **table-as-cards**: ランキング/内訳を div＋flex で。rank＋名称＋数値（tabular）＋シェアバー。`<table>` は使わない。
- **timeline**: 横長マイルストーン帯。軸線＋ノード（完了/進行/予定を塗り分け）。
- **closing**: 結論再掲＋ネクストアクション＋連絡メタ。accentチップのCTA。

## Elevation & Depth

ダーク地では**面の明度差**で階層を作る：canvas(#0d1117) < surface(#161b22) < surface-2(#1c2430)。カードは「やや明るい面＋1pxの hairline 境界」で浮かせ、影は**極薄**（`0 1px 2px rgba(0,0,0,.4)` 程度）か無しにする。重いブラー／ガラス（backdrop-filter）は**避ける**（HTML_INPUT_SPEC §8.4/§9.3 でラスタ化要因）。アクセントの「グロー」が欲しい場合は `text-shadow` か `box-shadow` の弱い1点に留め、フラットなフィル＋細い境界を基本にする。**色付き左縦ライン（border-left アクセント）で重要度を示さない** — 重要度は塗りバッジ・チップ・フィルで表現する。

## Shapes

角丸は中庸（6〜14px）でUIカードらしい実務感。カードは矩形、KPIの増減バッジ・凡例ドット・CTAは pill（9999px）。チャートはすべて**インラインSVG**：棒=`<rect>`、折れ線/エリア=`<path>` または `<polyline>/<polygon>`、ドーナツ/円=`<circle>` の `stroke-dasharray` か `<path>` 弧、軸/グリッド=`<line>`、ラベル=`<text>`。アイコンは単色ラインSVG（muted か accent）。多色イラスト・写真は基本使わない（計器盤の世界観を保つ）。

## Components

- **kpi-card**: surface 面・hairline 境界・角丸14px。card-label＋kpi-number（tabular）＋delta-badge＋極小スパークライン。
- **chart-card**: surface 面のチャート枠。小見出し（card-label）＋インラインSVGチャート＋凡例。
- **key-message-bar**: surface-2 地・ink 文字・角丸10px。slide-title 直下に置き、結論を1文で断言する。
- **delta-badge（positive/negative）**: 半透明フィル＋濃いアクセント文字の pill。`▲ +12.4%` / `▼ −3.1%` の形式。
- **accent-chip / legend-dot**: CTAや系列の識別。accent三色を点で使う。
- **rank-row / bar-inline**: ランキング行と内訳バー。div＋flex で組み、`<table>` を使わない。
- **timeline-node**: 軸線上の円。完了=accent塗り、進行=accent境界+surface塗り、予定=hairline境界。
- **source-footnote / page-number**: 下端固定、muted。出典は「Source: …（n=, 期間）」形式。

## Motion

PPTX 書き出しではアニメーションは限定的（[HTML_INPUT_SPEC](../HTML_INPUT_SPEC.md) §9.4）。CSSアニメ／トランジション／ホバーは**現在の静的状態のみ**が反映される前提で設計する。チャートは「最終フレーム（描画済みのSVG）」をそのまま静止画として読ませる。構成上のリズムは、cover→kpi-overview→chart-grid→single-big-chart→table-as-cards→timeline→closing の順で「全体KPI→分解→深掘り→時系列→結論」と視点をズームしていく流れで作る。

## Do's and Don'ts

- **Do**: 地は深いチャコール/ネイビー、カードは surface で区画化する。
- **Do**: アクセント三色は系列・チャート・強調のみ。本文や大面積フィルには使わない。
- **Do**: 数値は tabular-nums で桁揃え。増減は positive/negative の塗りバッジで示す。
- **Do**: すべてのチャートをインラインSVGで描く（rect/path/circle/line/text）。
- **Do**: 1スライド1テーマに絞り、カードで塊化して密度を可読にする。
- **Don't**: 本文テキストの文字色にネオンのアクセントを使わない（可読性とトーンが崩れる）。
- **Don't**: 色付き左縦ライン（border-left）で重要度を示さない。塗り/バッジで示す。
- **Don't**: 重いブラー/ガラス（backdrop-filter）や濃い影を多用しない（ラスタ化）。
- **Don't**: 装飾的な `<table>` を使わない。div＋flex/grid で組む。
- **Don't**: `background-clip: text` を使わない（PPTX非対応）。

## Agent Prompt Guide

> **Quick palette**: canvas `#0d1117` ／ surface `#161b22` ／ surface-2 `#1c2430` ／ ink `#e6edf3` ／ muted `#8b949e` ／ hairline `#2a313c` ／ accent(cyan) `#38d6c8` ／ accent-2(violet) `#a371f7` ／ accent-3(amber) `#f0a93b` ／ positive `#3fb950` ／ negative `#f85149`。Font: Inter / Noto Sans JP、数値は等幅寄り＋tabular-nums。角丸10〜14px。
>
> **Prompt**: 「BIダッシュボード風のダークモードでスライドを作って。地は深いチャコール/ネイビー #0d1117、各要素は surface #161b22 のカードに入れて区画化。KPIカード（大数値はtabular-nums、前期比は positive #3fb950 / negative #f85149 の塗りバッジ、極小スパークライン付き）＋2×2のチャートグリッド（棒・折れ線エリア・ドーナツ・積み上げ棒）＋大型折れ線1枚＋ランキング（div＋flexのカード、表は使わない）＋タイムライン、という計器盤構成。チャートはすべてインラインSVG（rect/path/circle/line/text）で描く。アクセントはシアン #38d6c8 / バイオレット #a371f7 / アンバー #f0a93b をチャートと強調だけに使い、本文 ink #e6edf3 はAAAを確保。本文19px/行間1.6。色付き左縦ラインは使わず、重いブラーや濃い影は避けてフラットなフィル＋1pxのhairline境界で階層化。」

## HTML→PPTX Notes

- **チャートはインラインSVGで**：棒=`<rect>`、折れ線/エリア=`<path>`/`<polyline>`/`<polygon>`、ドーナツ=`<circle>`＋`stroke-dasharray`（または弧 `<path>`）、軸/グリッド=`<line>`、数値ラベル=`<text>`。これでベクターが保持されやすい（[HTML_INPUT_SPEC](../HTML_INPUT_SPEC.md) §8.3）。`<canvas>` は禁止。
- **カード・バッジ・チップ・バー**は `<div>`／角丸矩形なのでネイティブ図形になり、PPTX側で編集しやすい。
- **ダーク背景はベタ塗り**（`background:#0d1117`）にする。微妙なグローは弱い `box-shadow`/`text-shadow` 1点に留める。`backdrop-filter` の多用や濃いブラーは §8.4 でラスタ化するので避ける。
- **数値の桁揃え**は `font-feature-settings: 'tnum' 1`。フォント未解決時は PPTX で Arial にフォールバックするため、等幅前提で桁幅が崩れても破綻しないレイアウト（右寄せ・固定幅セル）にしておく。
- **Noto Sans JP / Inter 未解決時**は和文が MS ゴシック系、欧文が Arial にフォールバック。改行位置は字数に余裕を持たせる。
- **凡例ドット**等の極小円は SVG `<circle>` か小さな角丸 `<div>` で。アイコンは単色ライン SVG（多色は避ける）。

## Iteration Guide

1. まず「このスライドの1テーマ（KPI / 内訳 / 時系列 / ランキング）」を決め、対応する layout を選ぶ。
2. 数値を先に確定し、tabular-nums で桁を揃えてからチャートのSVG座標を計算する。
3. アクセントを足したくなったら、既存の三色のうち1つで足りないか先に検討する（四色目を増やさない）。
4. 新しいチャート型は `layouts` に追加し、本文 Slide Layouts と Shapes にも1行ずつ加える。
5. 密度が苦しくなったら、1枚を2テーマに分割する（カードを詰め込みすぎない）。

## References / 参考にした流派・出典

- **参考にした流派**: データダッシュボード（ダークBI）。BIダッシュボードのスライド転用、暗背景＋ネオン強調。
- **視覚的な署名**: 暗背景 / KPIカード＋チャート群 / ネオン3色アクセント / コンパートメント化。
- 出典:
  - [Dark KPI dashboard template（SlideBazaar）](https://slidebazaar.com/templates/kpi-dashboard-financial-ratio-powerpoint-google-slides/kpi-dashboard-template-dark/)

> 注: 本定義は特定の PowerPoint ファイルの複製ではなく、上記の流派・ギャラリーから**デザイン思考とエッセンスを抽出**して再構築したもの。比較ビューア（[`../_viewer/index.html`](../_viewer/index.html)）で「作ったスライド」と上記の参照元を見比べられる。横断タクソノミは[スライドランド](https://www.slideland.tech/)（style×docType×industry×color）に準拠。

**起点（Slideland 経由の実スライド・実在企業の公開デッキ）**: [株式会社ラクス 2026年3月期 決算説明資料](https://ssl4.eir-parts.net/doc/3923/tdnet/2810964/00.pdf)（#決算説明資料 #SaaS #オレンジ）— KPI・チャートが豊富なSaaS決算。ダークBIは国際流派で、内容的な国内近似として参照（配色はダークに翻案）。
