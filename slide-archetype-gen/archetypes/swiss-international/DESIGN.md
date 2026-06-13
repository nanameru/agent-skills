---
version: alpha
name: Swiss International Typographic
description: 1950年代スイス・デザイン（Müller-Brockmann, Helvetica/Univers）の流れを汲む、数理的グリッド・客観性・装飾排除のスタイル。黒・白・赤一点という最小の色彩で、タイポグラフィと余白だけで階層をつくる。あらゆる「clean corporate」スライドの祖型。

meta:
  archetype: swiss-international
  origin: 1950s Swiss / International Typographic Style — Josef Müller-Brockmann, Armin Hofmann, Helvetica & Univers
  locale: bilingual
  density: low
  mood: [objective, timeless, rigorous, calm, confident]
  tags:
    style: [minimal, trust, clear]
    docType: [company-intro, service, proposal, pitch]
    industry: [saas, design, consulting, manufacturing]
    color: [monochrome, red-accent]

canvas:
  width: 1920px
  height: 1080px
  aspectRatio: "16:9"
  exportWidthIn: 13.333
  exportHeightIn: 7.5
  background: "{colors.canvas}"
  margin: 120px

grid:
  columns: 12
  gutter: 24px
  margin: 120px
  baseline: 8px

colors:
  primary: "#111111"
  canvas: "#ffffff"
  ink: "#111111"
  muted: "#6b6b6b"
  surface: "#f2f2f2"
  hairline: "#111111"
  accent: "#e2231a"
  on-accent: "#ffffff"

typography:
  kicker:
    fontFamily: "Helvetica Neue, Arial, 'Helvetica', sans-serif"
    fontSize: 18px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 0.16em
  slide-title:
    fontFamily: "Helvetica Neue, Arial, sans-serif"
    fontSize: 72px
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: -0.015em
  key-message:
    fontFamily: "Helvetica Neue, Arial, sans-serif"
    fontSize: 34px
    fontWeight: 400
    lineHeight: 1.3
  lead:
    fontFamily: "Helvetica Neue, Arial, sans-serif"
    fontSize: 26px
    fontWeight: 400
    lineHeight: 1.45
  body:
    fontFamily: "Helvetica Neue, Arial, sans-serif"
    fontSize: 22px
    fontWeight: 400
    lineHeight: 1.55
  bullet:
    fontFamily: "Helvetica Neue, Arial, sans-serif"
    fontSize: 22px
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: "Helvetica Neue, Arial, sans-serif"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.35
  kpi-number:
    fontFamily: "Helvetica Neue, Arial, sans-serif"
    fontSize: 120px
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: -0.03em
  kpi-label:
    fontFamily: "Helvetica Neue, Arial, sans-serif"
    fontSize: 18px
    fontWeight: 500
    lineHeight: 1.2
  source:
    fontFamily: "Helvetica Neue, Arial, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.3
  section-number:
    fontFamily: "Helvetica Neue, Arial, sans-serif"
    fontSize: 240px
    fontWeight: 700
    lineHeight: 0.9
    letterSpacing: -0.04em
  page-number:
    fontFamily: "Helvetica Neue, Arial, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1

rounded:
  none: 0px
  sm: 0px
  md: 0px
  lg: 0px
  full: 9999px

spacing:
  xs: 8px
  sm: 16px
  md: 24px
  lg: 48px
  xl: 96px
  margin: 120px
  gutter: 24px

layouts:
  cover:
    description: "左下揃えのアシンメトリ表紙。上にキッカー（赤の細ラベル）、左下に大見出し、最下に細い水平罫。右上は空けて余白で緊張をつくる。"
    uses: [kicker, slide-title, lead, page-number]
    notes: "タイトルは左フラッシュ・ラグ右。中央寄せにしない。"
  agenda:
    description: "番号付き目次。01–05 を等間隔の水平罫で区切り、項目は左揃え。番号は muted、本文は ink。"
    uses: [kicker, slide-title, bullet]
  section:
    description: "巨大な章番号（240px）を背景的に左に置き、右に章タイトル。赤は章番号にのみ少量。"
    uses: [section-number, kicker, slide-title]
  content:
    description: "上にキッカー＋アクション寄りの見出し、その下に細い赤の短い罫（80px）。本文は左カラム、補助は右カラム。"
    uses: [kicker, slide-title, key-message, bullet]
  two-column:
    description: "12グリッドを 6/6 で分割、ガター24px。左右の高さを罫線で揃える。"
    uses: [slide-title, body, hairline]
  kpi:
    description: "数値を巨大（120px）に、ラベルは下に小さく。3つ並べる場合は等幅3カラム、間に縦罫。"
    uses: [kpi-number, kpi-label, source]
  comparison:
    description: "2カラムの対比。見出し行を太い水平罫で締め、各行を細罫で区切る。装飾色は使わず罫だけで構造化。"
    uses: [slide-title, body, hairline]
  quote:
    description: "大きな引用文を左揃えで。引用符は使わず、赤の短い縦罫1本で示す。出典は下に caption。"
    uses: [key-message, source]
  closing:
    description: "表紙と対になる構図。中央やや下に短いメッセージ、最下に水平罫と連絡先 caption。"
    uses: [slide-title, lead, caption]

components:
  kicker:
    typography: "{typography.kicker}"
    textColor: "{colors.accent}"
  slide-title:
    typography: "{typography.slide-title}"
    textColor: "{colors.ink}"
  accent-rule:
    backgroundColor: "{colors.accent}"
    height: 4px
    width: 80px
  hairline:
    backgroundColor: "{colors.hairline}"
    height: 1px
  key-message-bar:
    typography: "{typography.key-message}"
    textColor: "{colors.ink}"
    backgroundColor: "{colors.canvas}"
    padding: 0px
  bullet:
    typography: "{typography.bullet}"
    textColor: "{colors.ink}"
  kpi-card:
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.none}"
    padding: 0px
  kpi-number:
    typography: "{typography.kpi-number}"
    textColor: "{colors.ink}"
  source-footnote:
    typography: "{typography.source}"
    textColor: "{colors.muted}"
  page-number:
    typography: "{typography.page-number}"
    textColor: "{colors.muted}"
---

# Swiss International Typographic

## Overview

スイス・デザイン（International Typographic Style）は、1950年代のチューリヒ／バーゼルで確立した、**客観性・明快さ・体系性**を信条とするビジュアル言語です。Josef Müller-Brockmann の数理的グリッド理論と、Helvetica / Univers のニュートラルなサンセリフがその核。**装飾は「ノイズ」**とみなし、内容そのものをグリッドと余白で構造化します。

スライドにおける本質は「色や図版で飾る」のではなく「**配置と階層だけで説得する**」こと。ほぼ白地・黒文字・赤一点。中央寄せを避け、左フラッシュとアシンメトリな余白で緊張感をつくります。どの時代にも古びない=タイムレスに見えるため、デザインリテラシーの高いブランド、プレミアムB2B、「誠実で真面目」に見せたい資料に最適です。

**Key Characteristics:**
- 厳格な12カラム・グリッドとベースライン（8px）に全要素をスナップ。
- 黒・白・赤一点のみ。赤は1スライドに1箇所、面積を最小に。
- ネオ・グロテスク1書体。階層はサイズと太さ（400/700）だけでつくる。
- 左揃え・ラグ右。中央寄せ・両端揃えはしない。
- 角丸ゼロ・影ゼロ。階層は罫線（hairline）と余白で表現。
- 余白は「余り」ではなく設計対象。右上や下部を意図的に空ける。

## Colors

パレットは高コントラストのニュートラルと、ただ一つの喚起色（赤）で構成します。色は「役割」を持ち、気分で増やしません。

- **Primary / Ink** ({colors.ink} — #111111): 見出し・本文・罫線の主色。純黒(#000)よりわずかに締めたインク。
- **Canvas** ({colors.canvas} — #ffffff): 地色。原則すべて白地。
- **Muted** ({colors.muted} — #6b6b6b): キャプション・出典・番号など従属情報。
- **Surface** ({colors.surface} — #f2f2f2): ごく稀に使う面（比較表の偶数行など）。多用しない。
- **Accent** ({colors.accent} — #e2231a): スイス・レッド。**CTA／キッカー／章番号／短い罫**にのみ、1スライド1箇所。
- **Hairline** ({colors.hairline} — #111111): 構造を刻む罫線。インクと同色（1px）。

> コントラスト: ink/canvas = 約 16:1（WCAG AAA）。muted/canvas = 約 5.1:1（AA本文可）。

## Typography

書体は **Helvetica Neue**（不可なら Arial）一択。ファミリ内のウェイト差（Regular 400 / Bold 700）だけで全階層を構成し、書体を混ぜません。

- **見出し**: 700・タイトなレタースペーシング（-0.015em）。スイス様式の署名は「詰まった大見出し」。
- **本文**: 400・22px・行間1.55。読みやすさ最優先。
- **キッカー**: 700・全大文字・トラッキング広め（0.16em）。赤で配置。
- 和文を使う場合の代替: **Noto Sans JP / Yu Gothic Medium**。日本語見出しは字面が大きいので `letterSpacing` を 0 に戻し、`fontWeight` は 700 のままにする。

| Token | Size | Weight | Use |
|---|---|---|---|
| section-number | 240px | 700 | 章扉の巨大番号 |
| kpi-number | 120px | 700 | 数値強調 |
| slide-title | 72px | 700 | スライド見出し |
| key-message | 34px | 400 | キーメッセージ |
| lead | 26px | 400 | リード文 |
| body / bullet | 22px | 400 | 本文・箇条書き |
| kicker | 18px | 700 | ラベル（全大文字・赤） |
| caption / source | 14–15px | 400 | 出典・脚注 |

**原則**: 1スライドに2ウェイトまで。斜体・下線・影は使わない。強調は色（赤）か太さで。

## Layout & Grid

台紙 1920×1080（16:9 = PPTX 13.333″×7.5″）。**左右マージン 120px**、12カラム・ガター24px、ベースライン8px。すべての要素の上端・左端をグリッドにスナップさせます。

余白哲学: 画面を埋めない。情報密度は **low**。1スライド1メッセージを徹底し、「言いたいこと1つ＋それを支える最小の要素」だけを置く。右上や下半分を大胆に空けることで、置かれた要素が際立ちます。

整列はすべて**左フラッシュ・ラグ右**。両端揃え（justify）と中央揃えは原則禁止（表紙・章扉含む）。

## Slide Layouts

- **cover**: 左下に大見出し、上に赤キッカー、最下に水平罫。右上は空ける。
- **agenda**: 01–05 の番号付き、等間隔の水平罫で区切る。番号 muted・項目 ink。
- **section**: 240px の章番号を左に大きく、右に章タイトル。赤は番号のみ。
- **content**: キッカー＋見出し＋赤の短い罫（80px×4px）＋本文。補助は右6カラム。
- **two-column / comparison**: 6/6 分割。**罫線だけ**で構造化（塗りに頼らない）。
- **kpi**: 120px の数値＋下に小ラベル。3つ並列時は縦罫で区切る。
- **quote**: 赤の縦罫1本＋大きな引用文。引用符記号は使わない。
- **closing**: 表紙と対の構図。短いメッセージ＋連絡先 caption。

## Elevation & Depth

**影は使わない（フラット）**。階層は3手段でつくる：(1) サイズと太さのコントラスト、(2) 罫線（1px インク、または4px 赤の短い罫）、(3) 余白。カードを使う場合も影や角丸ではなく、細い罫の枠で示す。

## Shapes

角丸は**ゼロ**（`rounded.*` はすべて 0px、`full` のみ例外で円形指標に使用可）。図形言語は矩形と直線、そして極小の正方形・円のドット。写真を使う場合はトリミングを矩形・直角に。アイコンは線幅一定の極シンプルなライン/ソリッド（装飾的な多色アイコンは不可）。

## Components

- **kicker（キッカー）**: 全大文字・赤・トラッキング0.16em。各スライド上部のラベル。
- **slide-title**: 72px/700。左揃え。
- **accent-rule（赤の短い罫）**: 80px×4px の赤い水平バー。見出し直下に1本だけ。
- **hairline**: 1px インクの罫。セクション区切り・表の行間。
- **kpi-number**: 120px/700。ラベルは下に18px/500・muted。
- **source-footnote / page-number**: 14px・muted。左下／右下に固定。

## Do's and Don'ts

- **Do**: 赤は1スライド1箇所、面積最小（罫・キッカー・1語）に限定する。
- **Do**: すべて左フラッシュで揃え、上端をグリッドにスナップする。
- **Do**: 階層はサイズ・太さ・罫線・余白でつくる。
- **Do**: 1スライド1メッセージ、密度を上げすぎない。
- **Don't**: 中央寄せ・両端揃えにしない（表紙も）。
- **Don't**: 角丸・ドロップシャドウ・グラデーションを足さない。
- **Don't**: 書体を2つ以上、ウェイトを3つ以上混ぜない。
- **Don't**: 赤以外の装飾色や多色アイコンを持ち込まない。

## Agent Prompt Guide

> **Quick palette**: ink `#111111` ／ canvas `#ffffff` ／ muted `#6b6b6b` ／ accent(red) `#e2231a`。Font: Helvetica Neue / Arial（和文 Noto Sans JP）。角丸0・影0・左揃え。
>
> **Prompt**: 「Swiss / International Typographic スタイルでスライドを作って。白地・黒文字（#111111）・赤一点（#e2231a）のみ。Helvetica Neue 1書体、ウェイトは400と700だけ。12カラム左右マージン120pxのグリッドに左フラッシュで揃え、中央寄せ・角丸・影・グラデは禁止。階層は文字サイズと罫線と余白でつくる。赤は1スライド1箇所だけ、短い罫かキッカーに使う。1スライド1メッセージで密度は低め。」

## HTML→PPTX Notes

- ほぼ全要素が**ネイティブ図形・テキストとして書き出せる**理想的な流派（矩形・直線・テキストのみ、blur/mask 不使用）。
- 赤の短い罫・水平罫は `<div>`（背景色＋固定 width/height）で表現 → ネイティブ矩形になる。
- Helvetica Neue は埋め込み不可環境では PPTX 側で Arial にフォールバックするが、字面がほぼ同じため崩れない（むしろ安全）。
- 章番号 240px など極大テキストもテキストボックスとして編集可能なまま出る。
- グラデーション・影を使わないので**ラスタ化が一切発生しない**＝最高のフィデリティ。

## Iteration Guide

1. 1コンポーネントずつ編集する。
2. トークン参照（`{colors.accent}`, `{typography.slide-title}`）を直接使う。
3. 赤の使用箇所を増やしたくなったら、まず既存の赤を削れないか検討する（赤は希少資源）。
4. 新レイアウトは `layouts` に別キーで追加し、本文 Slide Layouts にも1行加える。

## References / 参考にした流派・出典

- **参考にした流派**: スイス派 / International Typographic Style（1950年代スイス, Josef Müller-Brockmann・Armin Hofmann）。書体 Helvetica / Univers。特定1社ではなくこの流派全体。
- **視覚的な署名**: 数理的グリッド / 黒・白・赤一点 / 左フラッシュ揃え / 装飾排除。
- 出典:
  - [Swiss Style（Wikipedia）](https://en.wikipedia.org/wiki/Swiss_Style_(design))
  - [International Typographic Style（Wikipedia）](https://en.wikipedia.org/wiki/International_Typographic_Style)
  - [Swiss Style の原則（PRINT Mag）](https://www.printmag.com/featured/swiss-style-principles-typefaces-designers/)

> 注: 本定義は特定の PowerPoint ファイルの複製ではなく、上記の流派・ギャラリーから**デザイン思考とエッセンスを抽出**して再構築したもの。比較ビューア（[`../_viewer/index.html`](../_viewer/index.html)）で「作ったスライド」と上記の参照元を見比べられる。横断タクソノミは[スライドランド](https://www.slideland.tech/)（style×docType×industry×color）に準拠。

**起点（Slideland 経由の実スライド・実在企業の公開デッキ）**: [FABRIC TOKYO 会社紹介資料 / We are hiring](https://speakerdeck.com/yuichirom/we-are-hiring)（#ミニマル #ライトブルー #ファッション）— ミニマルの国内実例。Swiss はモノクロ＋グリッドの国際流派で、その日本的近似として参照。
