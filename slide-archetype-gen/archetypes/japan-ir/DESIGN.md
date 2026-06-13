---
version: alpha
name: Japan IR (決算説明資料)
description: 日本企業の決算説明会・投資家向け資料（IR）の流派。正確で一目で追える業績報告を最優先し、高い情報量でも「1スライド1メッセージ」を守る。大きく清潔なグラフ（棒・折れ線）でトレンドを語り、章扉・KPIサマリ・前年同期比（YoY）の比較を一貫した型で提示する。保守的でデジタルファースト（潤沢な余白・明快な章構成）。コーポレートブランドのブルー基調＋ニュートラルなグレー、規律あるチャートパレット。

meta:
  archetype: japan-ir
  origin: 日本企業の決算説明会資料／統合報告書のIRパート／東証プライム上場企業の四半期決算説明スライド／機関投資家向けプレゼンの作法
  locale: ja
  density: medium-high
  mood: [trustworthy, accurate, calm, data-led, conservative]
  tags:
    style: [trust, clear, minimal]
    docType: [ir, earnings, mid-term-plan, company-intro]
    industry: [finance, saas, manufacturing, retail]
    color: [navy, blue, two-tone]

canvas:
  width: 1920px
  height: 1080px
  aspectRatio: "16:9"
  exportWidthIn: 13.333
  exportHeightIn: 7.5
  background: "{colors.canvas}"
  margin: 88px

grid:
  columns: 12
  gutter: 24px
  margin: 88px
  baseline: 8px

colors:
  primary: "#0a4a8c"
  primary-deep: "#073a70"
  canvas: "#ffffff"
  ink: "#222b36"
  muted: "#5d6b7a"
  surface: "#f5f8fc"
  surface-strong: "#e8eff7"
  hairline: "#d6dfe9"
  grid-line: "#eaeff5"
  positive: "#15a36a"
  positive-soft: "#e3f5ec"
  negative: "#c8453a"
  negative-soft: "#fbe9e7"
  series-2: "#9aa9b8"
  accent: "#f2a516"
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
    fontSize: 40px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: -0.005em
  key-message:
    fontFamily: "'Noto Sans JP', 'Yu Gothic', sans-serif"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.45
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
  kpi-number:
    fontFamily: "'Noto Sans JP', 'Yu Gothic', sans-serif"
    fontSize: 68px
    fontWeight: 700
    lineHeight: 1.0
    letterSpacing: -0.01em
    fontFeature: "'tnum' 1, 'lnum' 1"
  kpi-label:
    fontFamily: "'Noto Sans JP', 'Yu Gothic', sans-serif"
    fontSize: 17px
    fontWeight: 500
    lineHeight: 1.3
  money:
    fontFamily: "'Noto Sans JP', 'Yu Gothic', sans-serif"
    fontSize: 21px
    fontWeight: 700
    lineHeight: 1.3
    fontFeature: "'tnum' 1, 'lnum' 1"
  axis:
    fontFamily: "'Noto Sans JP', 'Yu Gothic', sans-serif"
    fontSize: 15px
    fontWeight: 500
    lineHeight: 1.2
    fontFeature: "'tnum' 1"
  caption:
    fontFamily: "'Noto Sans JP', 'Yu Gothic', sans-serif"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.4
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
    fontFeature: "'tnum' 1"

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
  margin: 88px
  gutter: 24px

layouts:
  cover:
    description: "決算説明会の表紙。上部に企業名／下部にブランドブルー帯、資料種別（2026年3月期 第2四半期 決算説明会）・日付・証券コード。細い水平アクセント。"
    uses: [kicker, slide-title, lead]
  highlights:
    description: "業績ハイライト。KPIカード3〜4枚（売上高・営業利益・当期純利益・利益率）。各カードに大数値＋前年同期比 YoY バッジ（positive/negative）。"
    uses: [kpi-card, kpi-number, kpi-label, badge-yoy]
  section:
    description: "章扉。ブランドブルー地に大きな章番号（白／薄青）＋章タイトル＋一言サマリ。目次的に当該章をハイライト。"
    uses: [kicker, slide-title, lead]
  revenue-trend:
    description: "★売上推移。インラインSVGの棒グラフ（4〜6本、各期）。各バー上に金額ラベル、最新期を primary、過去期を series-2 で塗り分け。下部に YoY 折れ線または成長率注記。"
    uses: [chart-frame, key-message-bar, source-footnote]
  combo-trend:
    description: "売上＋利益率のコンボチャート。棒（売上, primary）＋折れ線（利益率, accent）。左右に2軸ラベル。凡例チップ。"
    uses: [chart-frame, legend-chip, key-message-bar]
  segment:
    description: "セグメント別内訳。div＋flexの横棒（構成比バー）または積み上げ。各セグメントを色で識別し、金額・構成比・YoY を併記。<table>は使わない。"
    uses: [seg-row, badge-yoy, legend-chip]
  kpi-table:
    description: "主要指標 前期比。div＋gridの財務数値グリッド（科目／当期／前年同期／増減額／増減率）。金額セルは tabular-nums。増減は positive/negative の符号色とバッジ。"
    uses: [fin-grid, badge-yoy, money]
  guidance:
    description: "通期業績見通し。期初予想・修正予想・進捗率を併記。進捗バー（div）＋達成率。前提・リスクを caption で添える。"
    uses: [kpi-card, progress-bar, key-message-bar, source-footnote]
  closing:
    description: "まとめ／ディスクレーマー。要点の再掲＋将来見通しに関する注意書き（免責事項）を source トーンで。"
    uses: [slide-title, key-message-bar, source-footnote]

components:
  kicker:
    typography: "{typography.kicker}"
    textColor: "{colors.primary}"
  slide-title:
    typography: "{typography.slide-title}"
    textColor: "{colors.ink}"
  key-message-bar:
    typography: "{typography.key-message}"
    backgroundColor: "{colors.surface-strong}"
    textColor: "{colors.ink}"
    padding: 18px 26px
    rounded: "{rounded.md}"
  kpi-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 30px
  kpi-number:
    typography: "{typography.kpi-number}"
    textColor: "{colors.primary}"
  kpi-label:
    typography: "{typography.kpi-label}"
    textColor: "{colors.muted}"
  badge-yoy:
    typography: "{typography.caption}"
    backgroundColor: "{colors.positive-soft}"
    textColor: "{colors.positive}"
    rounded: "{rounded.full}"
    padding: 4px 12px
  badge-yoy-neg:
    backgroundColor: "{colors.negative-soft}"
    textColor: "{colors.negative}"
    rounded: "{rounded.full}"
    padding: 4px 12px
  chart-frame:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
  legend-chip:
    typography: "{typography.caption}"
    textColor: "{colors.muted}"
  fin-grid:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
  money:
    typography: "{typography.money}"
    textColor: "{colors.ink}"
  progress-bar:
    backgroundColor: "{colors.surface-strong}"
    rounded: "{rounded.full}"
  seg-row:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.sm}"
  source-footnote:
    typography: "{typography.source}"
    textColor: "{colors.muted}"
  page-number:
    typography: "{typography.page-number}"
    textColor: "{colors.muted}"
---

# Japan IR (決算説明資料)

## Overview

日本企業の決算説明会資料（IR）は、**正確さと一覧性**を最優先する流派です。機関投資家・アナリスト・個人株主という多様な読者が、限られた時間で業績の事実を取り違えなく把握できることが価値の中心にあります。和製コンサルが「箱と矢印でロジックを圧縮する」のに対し、IR資料は**清潔で大きなグラフ**で業績トレンドを語り、章構成・KPIサマリ・前年同期比（YoY）の比較を一貫した型で提示します。

中核は3つ。(1) **1スライド1メッセージ** — 情報量が多くても、そのページで伝える業績上の主張は1つに絞り、タイトルとキーメッセージ帯で言い切る。(2) **グラフ主導のトレンド説明** — 売上推移・利益推移は棒／折れ線のインラインSVGで描き、最新期を強調色、過去期を中立グレーで塗り分ける。(3) **規律ある数値表現** — 財務数値は等幅数字（tabular-nums）で桁を揃え、増減は符号色（positive 緑／negative 赤）とバッジで一目で読める。

ブランドブルーが「信頼・誠実」を、グリーンが「増益・ポジティブな前年比」を担い、グレーが過去期・中立データを支えます。保守的でデジタルファースト、潤沢な余白で「読みやすく、改ざんの余地がない」印象を作ります。

**Key Characteristics:**
- 1スライド1メッセージ。高密度でもページの主張は1つに絞る。
- 業績トレンドは大きく清潔なグラフ（棒・折れ線）で語る。チャート系列色は最大3色。
- 前年同期比（YoY）を常に併記し、増減は符号色＋バッジで示す。
- 章扉・KPIサマリ・財務グリッドを一貫した型で繰り返す。
- 財務数値は等幅数字（tabular-nums / `font-feature: 'tnum'`）で桁を揃える。
- 出典・前提・免責（将来見通しに関する注意）を常設し、IR資料としての信頼性を担保する。
- 重要度は塗りチップ／バッジ／面の塗りで示す（色付き左縦ライン=border-left は使わない）。

## Colors

- **Primary / Brand Blue** ({colors.primary} — #0a4a8c): 見出しアクセント・章扉・棒グラフの当期・進捗バー。信頼の基調色。
- **Primary-deep** ({colors.primary-deep} — #073a70): 章扉のグラデ下端・ホバー相当の濃い面。
- **Ink** ({colors.ink} — #222b36): 本文・スライドタイトル。純黒を避けた濃灰。
- **Muted** ({colors.muted} — #5d6b7a): 脚注・軸ラベル・補助テキスト。
- **Surface** ({colors.surface} — #f5f8fc): KPIカード・財務グリッドの地。青みの淡灰。
- **Surface-strong** ({colors.surface-strong} — #e8eff7): キーメッセージ帯・強調面。
- **Hairline** ({colors.hairline} — #d6dfe9): 罫線・カード境界。
- **Grid-line** ({colors.grid-line} — #eaeff5): チャートの目盛り横線（極薄）。
- **Positive** ({colors.positive} — #15a36a): 増収増益・前年比プラスのバッジと符号。
- **Positive-soft** ({colors.positive-soft} — #e3f5ec): プラスバッジの淡い地。
- **Negative** ({colors.negative} — #c8453a): 減益・前年比マイナスの符号とバッジ。
- **Negative-soft** ({colors.negative-soft} — #fbe9e7): マイナスバッジの淡い地。
- **Series-2** ({colors.series-2} — #9aa9b8): 過去期・前年データの中立グレー（チャート第2系列）。
- **Accent** ({colors.accent} — #f2a516): 折れ線（利益率等）のハイライト1色のみ。**1スライド1〜2箇所まで**。

> コントラスト: ink/canvas ≈ 12.5:1（AAA）。primary面に on-primary 白 ≈ 7.6:1（AAA）。positive/white ≈ 3.2:1 → バッジは緑地に濃緑文字＋淡地で確保。本文には差し色を使わない。

## Typography

和文ゴシック（**Noto Sans JP**、不可なら Yu Gothic / Hiragino Kaku Gothic）。明朝は使わない。見出し・キーメッセージは 700、本文は 400。**財務数値・グラフ軸・金額セルには等幅数字**（`font-feature-settings: 'tnum' 1, 'lnum' 1`）を効かせ、桁の縦位置を揃えて読み違いを防ぐ。

| Token | Size | Weight | Use |
|---|---|---|---|
| slide-title | 40px | 700 | スライド見出し（ink） |
| key-message | 24px | 700 | キーメッセージ帯（業績の結論） |
| kpi-number | 68px | 700 | KPIハイライト数値（tnum） |
| money | 21px | 700 | 財務グリッドの金額セル（tnum） |
| axis | 15px | 500 | グラフ軸ラベル（tnum） |
| body / bullet | 19px | 400 | 本文・箇条書き |
| caption / source | 13–15px | 400 | 注釈・出典・免責 |

**原則**: 本文は19px以上・行間1.6以上を死守。金額・前年比・軸の数字は必ず tabular-nums を効かせる（`money` / `kpi-number` / `axis` / `page-number` の `fontFeature` 参照）。強調は太字またはバッジで行い、差し色の下線/マーカーは使わない。

## Layout & Grid

台紙 1920×1080。マージン 88px（IRらしい潤沢な余白）、12カラム・ガター24px、8pxベースライン。コンテンツスライドは上から「**タイトル → キーメッセージ帯 → グラフ／グリッド本文 → 出典脚注／ページ番号**」の縦4段を基本とし、章をまたいで一貫させます。

情報密度は **medium-high**。和製コンサルより図解は少なく、代わりに(1)大きなグラフで塊化、(2)8pxベースラインで整列、(3)余白で塊間を分離して可読性を担保します。1スライド1メッセージ＝「帯の業績結論1つ」をグラフ本文全体で裏付けます。

## Slide Layouts

- **cover（表紙）**: 企業名＋資料種別（◯年◯月期 第◯四半期 決算説明会）＋日付・証券コード。下部ブランドブルー帯。
- **highlights**: KPIカード3〜4枚（売上高・営業利益・純利益・利益率）＋YoY バッジ。決算サマリの定番ページ。
- **section（章扉）**: ブランドブルー地、大きな章番号、章タイトル＋一言サマリ。
- **revenue-trend（中核）**: インラインSVGの棒グラフで売上推移。最新期 primary、過去期 series-2。金額ラベルと YoY 注記。
- **combo-trend**: 棒（売上）＋折れ線（利益率, accent）の2軸コンボ。凡例チップ付き。
- **segment**: div＋flexの構成比横棒でセグメント別内訳。金額・構成比・YoY を併記（`<table>` 不使用）。
- **kpi-table**: div＋gridの財務数値グリッド（科目／当期／前年同期／増減）。金額は tabular-nums、増減はバッジ。
- **guidance**: 通期見通し。期初・修正予想と進捗バー、達成率。前提を caption で。
- **closing**: 要点再掲＋免責（将来見通しに関する注意書き）。

## Elevation & Depth

影は**最小限**（`0 1px 2px rgba(10,74,140,.06)` 程度）か影なしで、罫線（hairline）と淡い面（surface）の塗り分けで階層化します。KPIカード・財務グリッドは「淡灰の面＋細い境界」で示し、**色付きの左縦ライン（border-left アクセント）は使わない** — 重要度は面の塗り（primary / positive-soft）かバッジで示します。チャートの目盛りは grid-line（極薄）で、グラフ自体を主役にします。

## Shapes

角丸は小さめ〜中（4〜12px）で実務的かつ清潔に。棒グラフのバーは角丸なしまたは上端2pxの矩形、折れ線は2〜3pxのストローク＋小さな節点。凡例は丸／角丸チップ。アイコンは単色ライン（primary or muted）。多色イラストやドロップシャドウの効いた3Dグラフは避け、フラットで正確なベクター表現に徹します。

## Components

- **key-message-bar（キーメッセージ帯）**: surface-strong 地・ink 文字・角丸8px。タイトル直下に full幅で**業績の結論を1文で断言**。
- **kpi-card**: 淡灰カード（角丸12px）。kpi-number（primary）＋ラベル＋YoY バッジ。
- **badge-yoy / badge-yoy-neg**: 丸ピル。前年同期比。プラスは positive（緑）、マイナスは negative（赤）。符号（＋/▲）を明示。
- **chart-frame**: グラフの台。インラインSVGで bars/lines/axis を rect/path/text として描く。系列色は primary / series-2 / accent の最大3色。
- **legend-chip**: 凡例。小さな色チップ＋ラベル（muted）。
- **fin-grid**: div＋gridの財務数値グリッド。金額セルは `money`（tabular-nums）。増減列は符号色。
- **progress-bar**: 通期進捗。surface-strong の地に primary の塗りで達成率を可視化。
- **source-footnote / page-number**: 下端固定、muted。出典は「出典: …」、免責は「※将来見通しに関する記述は…」形式。

## Motion

PPTX 書き出しではアニメーションは限定的です（[HTML_INPUT_SPEC](../HTML_INPUT_SPEC.md) §9.4：CSS animation/transition は live behavior として書き出されない）。本流派は静的でも成立する設計を旨とし、運用上のリズムは「章扉で区切り → ハイライト → 推移グラフ → 見通し → まとめ」というページ順の構成で生みます。アニメは使うとしても登場順の強調程度に留め、現在の視覚状態だけで意味が通るようにします。

## Do's and Don'ts

- **Do**: 1スライド1メッセージ。帯で当期業績の結論を言い切る。
- **Do**: 業績トレンドは大きく清潔なグラフ（棒・折れ線）で語る。
- **Do**: 前年同期比（YoY）を常に併記し、増減を符号色＋バッジで示す。
- **Do**: 金額・軸・前年比の数字は tabular-nums で桁を揃える。
- **Do**: 出典・前提・免責（将来見通しに関する注意）を常設する。
- **Don't**: チャートの系列色を3色超にしない（primary / グレー / accent 1色まで）。
- **Don't**: 色付き左縦ライン（border-left）で重要度を示さない。塗り/バッジで示す。
- **Don't**: 装飾的な `<table>` を使わない。財務グリッドは div＋grid で組む。
- **Don't**: 明朝・多色イラスト・3D影付きグラフ・グラデ多用を持ち込まない。

## Agent Prompt Guide

> **Quick palette**: brand-blue `#0a4a8c` ／ ink `#222b36` ／ surface `#f5f8fc` ／ positive(green) `#15a36a` ／ negative(red) `#c8453a` ／ series-grey `#9aa9b8` ／ accent `#f2a516`。Font: Noto Sans JP。金額・軸は tabular-nums。角丸8〜12px。
>
> **Prompt**: 「日本の決算説明資料（IR）スタイルでスライドを作って。各コンテンツスライドは上から『タイトル(ink #222b36) → キーメッセージ帯(淡青 #e8eff7 の角丸帯に当期業績の結論を1文) → グラフ／財務グリッド本文 → 出典脚注＋ページ番号』。売上推移はインラインSVGの棒グラフ（最新期はブランドブルー #0a4a8c、過去期はグレー #9aa9b8）、利益率は折れ線(accent #f2a516)のコンボで。前年同期比(YoY)を必ず併記し、増益は緑 #15a36a、減益は赤 #c8453a のバッジ＋符号(＋/▲)。財務数値の表は `<table>` を使わず div＋grid、金額は tabular-nums で桁を揃える。Noto Sans JP、本文19px/行間1.6、マージン88pxで余白多め。チャート系列色は最大3色。色付き左縦ラインは使わず塗り面とバッジで強調。」

## HTML→PPTX Notes

- 棒グラフ・折れ線・軸・目盛りはすべて**インライン SVG**（`<rect>` / `<path>` / `<line>` / `<text>`）で描く。`<canvas>` やランタイム描画のチャートライブラリは使わない（[HTML_INPUT_SPEC](../HTML_INPUT_SPEC.md) §9.1）。SVGはベクターとして保持されやすく、PPTX上で編集可能な図形に近づく。
- 棒（rect）はベタ塗りなのでフィデリティが高い。最新期 primary／過去期 series-2 の塗り分けはそのまま再現される。折れ線は `path` の stroke で表現し、節点は小さな `circle`。
- 財務グリッドは div＋grid で組む（`<table>` 不使用方針）。これにより各セルが個別のネイティブ図形・テキストボックスになり、PPTX 上で編集しやすい。金額は `font-feature-settings:'tnum'` でブラウザ段階で等幅化してから書き出す。
- バッジの角丸ピルはネイティブ角丸矩形になる。positive/negative の淡地はベタ塗りで安定。
- グラデは表紙・章扉の `linear-gradient(...)` のみ最小限に。`background-clip: text` は非対応のため使わない。
- Noto Sans JP 未解決時は PPTX 側で MS ゴシック系にフォールバック。和文字面が変わるので、金額ラベルや軸は字数に余裕を持たせる。

## Iteration Guide

1. まず「帯の業績結論文」を決めてから、それを裏付けるグラフ／グリッドを設計する（結論駆動）。
2. トレンドは revenue-trend（棒）／ combo-trend（棒＋折れ線）／ segment（構成比横棒）のいずれかの型に当てはめる。
3. チャート系列色を足したくなったら、まず既存の3色（primary / series-2 / accent）で表現できないか検討する。
4. 前年同期比・進捗率は必ず数値とバッジの両方で示し、符号（＋/▲）を省略しない。
5. 新しいグラフ型は `layouts` に追加し、本文 Slide Layouts にも1行加える。

## References / 参考にした流派・出典

- **参考にした流派**: 日本 IR / 決算説明資料。実在企業のIR資料デザイン傾向（incdesign・Cone・enpreth のまとめ）。
- **視覚的な署名**: ブランド色＋グレー / 章扉＋KPI要約 / 大きく清潔なグラフ / 前年同期比バッジ / tabular数値。
- 出典:
  - [決算説明資料まとめ（incdesign）](https://incdesign.jp/results_250724/)
  - [IRスライドの作り方（Cone）](https://cone-c-slide.com/see-sla/blog/ir-slide/)
  - [IR資料デザイン（enpreth）](https://enpreth.jp/media/ir-document-design/)

> 注: 本定義は特定の PowerPoint ファイルの複製ではなく、上記の流派・ギャラリーから**デザイン思考とエッセンスを抽出**して再構築したもの。比較ビューア（[`../_viewer/index.html`](../_viewer/index.html)）で「作ったスライド」と上記の参照元を見比べられる。横断タクソノミは[スライドランド](https://www.slideland.tech/)（style×docType×industry×color）に準拠。

**起点（Slideland 経由の実スライド・実在企業の公開デッキ）**: [株式会社U-NEXT HOLDINGS 統合報告書2024](https://ssl4.eir-parts.net/doc/9418/ir_material_for_fiscal_ym4/174133/00.pdf)（#統合報告書 #エンターテイメント #ライトブルー #爽やか）— 清潔で爽やかな統合報告書の代表例。日本IRの直接の起点。
