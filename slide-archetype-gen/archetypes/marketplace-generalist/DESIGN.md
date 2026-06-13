---
version: alpha
name: Template-Marketplace Generalist (versatile theme deck)
description: SlidesGo / SlidesCarnival / Envato Elements 系の「テーマパッケージとして完結した汎用ビジネスデッキ」。白地に、藍(indigo)・琥珀(amber)・ティール(teal)の親しみやすい4〜5色セット、太い見出し＋読みやすい本文の組み合わせ、丸み(rounded)のあるカード、そろいのライン系アイコンとフラットなインフォグラフィック(ドーナツ/バー/アイコン統計)。表紙〜目次〜会社/チーム〜タイムライン〜比較〜インフォグラフィック〜クロージングまでをひとつのトーンで通す、誰でも使える「テンプレ一式」感のスタイル。

meta:
  archetype: marketplace-generalist
  origin: テンプレートマーケットプレイス系の汎用ビジネステーマ（SlidesGo / SlidesCarnival / Envato Elements。起点として Slideland の汎用ビジネステンプレ傾向）
  locale: bilingual
  density: medium
  mood: [friendly, versatile, approachable, cohesive, professional]
  tags:
    style: [friendly, clear, pop, versatile]
    docType: [company-intro, pitch, proposal, service, general-business]
    industry: [generic, saas, agency, education, nonprofit]
    color: [indigo, multi, two-tone]

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
  primary: "#3d5af1"
  primary-deep: "#2f49d6"
  secondary: "#f4a623"
  secondary-deep: "#a86a08"
  tertiary: "#1bb8a0"
  tertiary-deep: "#0e8071"
  canvas: "#ffffff"
  ink: "#232a36"
  muted: "#5c6473"
  surface: "#f3f5fa"
  surface-2: "#eef1fb"
  amber-soft: "#fdeccb"
  teal-soft: "#e3f6f2"
  hairline: "#e2e6f0"
  on-primary: "#ffffff"

typography:
  cover-title:
    fontFamily: "Poppins, Inter, 'Noto Sans JP', sans-serif"
    fontSize: 96px
    fontWeight: 800
    lineHeight: 1.04
    letterSpacing: -0.02em
  kicker:
    fontFamily: "Poppins, Inter, 'Noto Sans JP', sans-serif"
    fontSize: 18px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0.12em
  slide-title:
    fontFamily: "Poppins, Inter, 'Noto Sans JP', sans-serif"
    fontSize: 44px
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: -0.01em
  section-label:
    fontFamily: "Poppins, Inter, 'Noto Sans JP', sans-serif"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.3
  lead:
    fontFamily: "'Noto Sans JP', Inter, sans-serif"
    fontSize: 24px
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: "'Noto Sans JP', Inter, sans-serif"
    fontSize: 19px
    fontWeight: 400
    lineHeight: 1.7
  kpi-number:
    fontFamily: "Poppins, Inter, 'Noto Sans JP', sans-serif"
    fontSize: 72px
    fontWeight: 800
    lineHeight: 1.0
    letterSpacing: -0.02em
  kpi-label:
    fontFamily: "'Noto Sans JP', Inter, sans-serif"
    fontSize: 17px
    fontWeight: 500
    lineHeight: 1.4
  caption:
    fontFamily: "'Noto Sans JP', Inter, sans-serif"
    fontSize: 15px
    fontWeight: 500
    lineHeight: 1.5
  footer:
    fontFamily: "'Noto Sans JP', Inter, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1

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
  lg: 40px
  xl: 64px
  margin: 96px

layouts:
  cover:
    description: "テーマカラーの帯。左にテーマ色(indigo)の大きなカラーバンド＋簡素なライン幾何、右に超太の表紙タイトル＋サブタイトル＋会社名/日付。テーマ一式の「顔」。"
    uses: [color-band, cover-title, kicker, footer]
  agenda:
    description: "白地。タイトル＋番号付きリスト。各項目はそろいの丸アイコンチップ＋番号＋見出し。現在地は surface でハイライト可。"
    uses: [slide-title, agenda-item, icon-chip]
  team:
    description: "会社/チーム紹介。3〜4名をイニシャル・アバター(写真ではなく色付き円チップ)＋氏名＋役割＋一言で。役割色で3色を割り当て統一感を出す。"
    uses: [slide-title, member-card, avatar]
  timeline:
    description: "横方向のマイルストーン。インラインSVGの水平線＋ノード、各ノードに年/ラベル＋短文。年度・フェーズの流れを1本で見せる。"
    uses: [slide-title, timeline-svg, caption]
  comparison:
    description: "2〜3カラムのプラン/選択肢比較。各カラムは見出しチップ＋チェック行(○/—)。推奨カラムは塗りでハイライト。"
    uses: [slide-title, compare-column, check-row, pill]
  infographic:
    description: "フラットなインフォグラフィック。左にドーナツ(SVG)、右に2本のバー統計(SVG)＋アイコン統計。数値とアイコンで「テーマ付属の図版」感を出す。"
    uses: [slide-title, donut-svg, bar-svg, stat-icon]
  closing:
    description: "表紙と対のテーマ色バンド。中央に短いお礼メッセージ＋連絡先(メール/サイト/SNS)をアイコン付きで。"
    uses: [cover-title, kicker, contact-row]

components:
  cover-title:
    typography: "{typography.cover-title}"
    textColor: "{colors.ink}"
  kicker:
    typography: "{typography.kicker}"
    textColor: "{colors.primary}"
  slide-title:
    typography: "{typography.slide-title}"
    textColor: "{colors.ink}"
  color-band:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: 32px
  icon-chip:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    padding: 14px
  avatar:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
  pill:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    padding: 8px 20px
  amber-chip:
    backgroundColor: "{colors.amber-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: 6px 16px
  kpi-number:
    typography: "{typography.kpi-number}"
    textColor: "{colors.primary}"
  footer:
    typography: "{typography.footer}"
    textColor: "{colors.muted}"

components-note: "重要度は塗りチップ/バッジ/アイコンで示す（色付き左縦ライン=border-left は使わない）。amber/teal は小さな文字色には使わず、塗り面＋白/ink文字、または大きな図版要素として使う。"
---

# Template-Marketplace Generalist (versatile theme deck)

## Overview

SlidesGo・SlidesCarnival・Envato Elements に代表される、**テンプレートマーケットプレイス系の「汎用ビジネステーマ一式」**を抽出したスタイルです。特定業種に寄せず、表紙・目次・会社/チーム・タイムライン・比較・インフォグラフィック・クロージングという**フルの構成を、ひとつのトーンで通せる**のが特徴。誰が何の用途で使っても破綻しない「親しみやすく・整っていて・完結している」テーマを目指します。

署名的な要素は3つ。(1) **白地＋藍(indigo)・琥珀(amber)・ティール(teal)の親しみやすい4〜5色を役割で固定**、(2) **太い見出し(Poppins/Inter系)＋読みやすい本文(Noto Sans JP)** の組み合わせ、(3) **丸みのあるカード＋そろいのライン系アイコン＋フラットな自作インフォグラフィック(ドーナツ/バー/アイコン統計)**。会社紹介・提案・サービス紹介など、汎用ビジネス全般に向きます。

**Key Characteristics:**
- 白地に、藍(primary)・琥珀(secondary)・ティール(tertiary)＋muted の4〜5色を**役割で固定**して全レイアウトに適用。
- 見出しは太い幾何サンセリフ、本文は Noto Sans JP。スケールとカード角丸を全スライドで統一。
- カードは**大きめ角丸**(16〜24px)＋淡い surface 地＋やわらかい影。
- アイコンは**そろいのライン系インラインSVG**（emoji は使わない）。
- インフォグラフィックは**自作のフラットSVG**（ドーナツ・バー・アイコン統計）でテーマ付属感を出す。
- チームは**イニシャル・アバター（写真ではなく色付き円チップ）**で表現。
- 重要度は塗りチップ/バッジ/アイコンで示す（border-left の色ラインは使わない）。

## Colors

- **Primary / Indigo** ({colors.primary} — #3d5af1): 主役。見出しアクセント・アイコン・図版の基調。白地で 5.3:1（AA）。
- **Primary-deep** ({colors.primary-deep} — #2f49d6): 塗り面に白文字を載せるとき・表紙バンドの濃端。白文字 6.9:1（AA）。
- **Secondary / Amber** ({colors.secondary} — #f4a623): 強調・差し色。**文字色には使わず**、塗りチップ＋ink文字 or 大きな図版要素として。
- **Secondary-deep** ({colors.secondary-deep} — #a86a08): amber 系を文字として使いたいときの濃色（白地 4.4:1）。
- **Tertiary / Teal** ({colors.tertiary} — #1bb8a0): 第3の役割色。ドーナツ/バー/アイコンの面に。
- **Tertiary-deep** ({colors.tertiary-deep} — #0e8071): teal 塗りに白文字を載せるとき（白文字 4.8:1）。
- **Canvas** ({colors.canvas} — #ffffff): 本文地。
- **Ink** ({colors.ink} — #232a36): 本文・見出し。白地 14.4:1（AAA）。
- **Muted** ({colors.muted} — #5c6473): 補助・キャプション・フッター。白地 5.96:1 / surface 5.46:1（AA）。
- **Surface / Surface-2** (#f3f5fa / #eef1fb): カード・チップの地。
- **Amber-soft / Teal-soft** (#fdeccb / #e3f6f2): 淡いトーンのチップ地（ink文字でAA）。
- **Hairline** ({colors.hairline} — #e2e6f0): 罫線・区切り。

> コントラスト検証: ink/canvas 14.4:1。muted/canvas 5.96:1・muted/surface 5.46:1。primary/canvas 5.3:1・primary/surface-2 4.73:1。white/primary 5.3:1・white/primary-deep 6.9:1・white/teal-deep 4.8:1。ink/amber-soft 12.4:1。**amber #f4a623 と teal #1bb8a0 は本文サイズの文字色に使わない**（塗り面・図版専用）。

## Typography

見出しは**幾何サンセリフを太く(800)**（英＝Poppins/Inter、和＝Noto Sans JP）。本文は Noto Sans JP 400。テンプレ感の要は「見出しと本文の太さ差」と「全スライドで同じスケール」を崩さないこと。

| Token | Size | Weight | Use |
|---|---|---|---|
| cover-title | 96px | 800 | 表紙/クロージングの大見出し |
| kpi-number | 72px | 800 | 数値ハイライト（indigo） |
| slide-title | 44px | 800 | 各スライドの見出し |
| section-label | 24px | 700 | カード/チームの見出し |
| lead | 24px | 400 | リード文 |
| body | 19px | 400 | 本文 |
| kicker | 18px | 700 | アイブロー（トラッキング広め・indigo） |
| caption | 15px | 500 | 図版キャプション |
| footer | 14px | 500 | フッター |

**原則**: 見出しは ink の太字、kicker のみ indigo。本文の強調は **indigo の太字**（amber/teal は文字に使わない）。和文代替：Noto Sans JP → Yu Gothic / Hiragino Kaku Gothic ProN。

## Layout & Grid

台紙 1920×1080、マージン 96px、12カラム・ガター24px。コンテンツは「左上 kicker → 見出し → 図版/カード → フッター」。情報密度は **medium**。角丸は中〜大（16〜24px）でテーマ全体を柔らかく。**全レイアウトで同じカード角丸・同じ余白・同じ4〜5色**を守ることが「テーマ一式」感の核心。

## Slide Layouts

- **cover（署名）**: 左に indigo カラーバンド＋簡素なライン幾何、右に超太タイトル＋サブ＋会社名/日付。
- **agenda**: 番号付きリスト。各行はそろいの丸アイコンチップ＋番号＋見出し。現在地を surface で。
- **team**: 3〜4名をイニシャル・アバター（色付き円）＋氏名＋役割＋一言。役割に3色を割当て。
- **timeline**: 横一本のSVGライン＋ノード。各ノードに年/フェーズ＋短文。
- **comparison**: 2〜3カラムのプラン比較。チェック行(○/—)、推奨列を塗りでハイライト。
- **infographic**: 左ドーナツ(SVG)＋右に2本のバー統計＋アイコン統計。フラットでカラフル。
- **closing**: 表紙と対の indigo バンド＋お礼＋連絡先（アイコン付き）。

## Elevation & Depth

影はやわらかく拡散（`0 12px 30px rgba(35,42,54,.08)` 程度）。カードは「淡 surface ＋大角丸＋軽い影」。立体は控えめ、フラット寄り。色面（indigo/amber/teal の塗りチップ）と余白で階層を作り、影に頼りすぎない。

## Shapes

中〜大の角丸（16〜24px、チップ/アバター/pill は full）。図形言語は角丸矩形・円・pill・水平タイムライン・ドーナツ・バー。アイコンは**単色ラインのインラインSVG**（primary か muted、面のときのみ amber/teal）。写真は使わず、チームは色付き円のイニシャルで代替。

## Components

- **cover-title**: ink・800・超大。バンドの右に左寄せ。
- **kicker**: indigo・700・トラッキング広め。
- **slide-title**: ink・800。
- **color-band**: indigo（→primary-deep）塗り＋白文字。表紙/クロージングの面。
- **card**: 淡 surface・大角丸・軽い影。
- **icon-chip**: surface-2 地の丸チップ＋indigo ラインアイコン。
- **avatar**: 色付き円＋白のイニシャル文字（写真の代替）。役割で indigo/teal-deep/amber 面を割当て（amber 面は ink 文字）。
- **pill / amber-chip**: 推奨/ステータスのバッジ。indigo は白文字、amber-soft は ink 文字。
- **donut / bar（SVG）**: フラットなインフォグラフィック。配色は indigo/amber/teal。
- **footer**: `ページ番号 ｜ セクション名` 左、`会社名` 右、muted。

## Motion

PPTX 出力のためアニメーションは限定的（[HTML_INPUT_SPEC](../HTML_INPUT_SPEC.md) §9.4）。構成上のリズムは「表紙バンド → 白地コンテンツ群 → 対のバンドでクロージング」の往復で作る。スライド内の動きは想定しない。

## Do's and Don'ts

- **Do**: 4〜5色を役割で固定し、全レイアウトで同じ色・同じ角丸・同じスケールを使う。
- **Do**: アイコンはそろいのライン系インラインSVGで統一。インフォグラフィックは自作フラットSVG。
- **Do**: チームは色付きイニシャル・アバターで（写真を持ち込まない）。
- **Do**: 強調は塗りチップ/バッジ/indigo太字で。
- **Don't**: amber/teal を本文サイズの文字色に使わない（コントラスト不足。塗り面・図版専用）。
- **Don't**: emoji をアイコン代わりに使わない（ライン系SVGで）。
- **Don't**: border-left の色ラインで重要度を示さない（塗りチップ/バッジで）。
- **Don't**: レイアウトごとに角丸や色を変えて「テーマ一式」感を崩さない。

## Agent Prompt Guide

> **Quick palette**: indigo `#3d5af1` ／ amber `#f4a623` ／ teal `#1bb8a0` ／ ink `#232a36` ／ muted `#5c6473` ／ surface `#f3f5fa`。Font: Poppins/Inter（見出し800）+ Noto Sans JP（本文）。角丸 16〜24px。
>
> **Prompt**: 「テンプレートマーケットプレイス系(SlidesGo/Envato風)の親しみやすい汎用ビジネステーマで、表紙〜目次〜チーム〜タイムライン〜比較〜インフォグラフィック〜クロージングを“ひとつのトーンで通る一式”として作って。白地に藍(#3d5af1)・琥珀(#f4a623)・ティール(#1bb8a0)＋muted(#5c6473)の4〜5色を役割で固定。見出しは太い幾何サンセリフ(ink)、本文は Noto Sans JP。カードは大きめ角丸(16〜24px)＋淡 surface。アイコンはそろいのライン系インラインSVG(emoji禁止)。インフォグラフィックはドーナツ・2本バー・アイコン統計の自作フラットSVG。チームは写真ではなく色付きイニシャル・アバター。強調は塗りチップ/バッジ/indigo太字（border-leftの色ライン禁止、amber/tealは文字色に使わず塗り面・図版専用）。フッターは『ページ｜セクション …… 会社名』。」

## HTML→PPTX Notes

- 見出し・カード・pill・チップ・アバター円はネイティブ図形/テキストになる。
- ドーナツ・バー・タイムライン・アイコンは**インラインSVG**で（ベクター保持されやすい。[HTML_INPUT_SPEC](../HTML_INPUT_SPEC.md) §8.3）。SVG の色は**リテラルHEX**で書く（`var()`/`currentColor` は使わない）。
- 表紙/クロージングの indigo バンドは標準 `linear-gradient` か単色塗りで。`background-clip:text` は使わない。
- 図解は `<table>` を使わず div＋flex/grid と SVG で組む。
- やわらかい影は box-shadow で表現（過度なぼかしはラスタ化しやすい）。

## Iteration Guide

1. まず4〜5色の**役割割当て**（primary=基調 / amber=差し色 / teal=第3 / muted=補助）を固定する。
2. カード角丸・タイプスケール・フッターを全レイアウトで共通化する。
3. レイアウトを cover / agenda / team / timeline / comparison / infographic / closing の型に当てはめる。
4. インフォグラフィック(ドーナツ/バー/アイコン)とアイコンセットを**そろいのSVG**で用意し、テーマ一式感を担保する。
5. 色を足したくなったら、まず既存4〜5色の役割内で表現できないか検討する。

## References / 参考にした流派・出典

- **参考にした流派**: テンプレートマーケットプレイス系の汎用ビジネステーマ。完結したデッキ一式（表紙〜クロージング）を、そろいのアイコン/インフォグラフィックと4〜5色＋ペアフォントで通すスタイル。
- **出典（テンプレートマーケットプレイス）**:
  - SlidesGo — https://slidesgo.com
  - SlidesCarnival — https://www.slidescarnival.com
  - Envato Elements（Presentation Templates）— https://elements.envato.com
- **起点**: Slideland の汎用ビジネステンプレ傾向（業種を問わない「一式で使えるテーマ」の構成・配色・図版のまとめ方）を研究の起点とした。
- 本定義は公開情報から抽出した**流派の解釈（inspired interpretation）**であり、特定テンプレートの文言・図版・配色を複製したものではない。社名・コピー・図解はすべてオリジナルの架空内容（"Brightpath" 等）で再構築している。

> 注: 実テンプレートのアセット（ロゴ・図版・写真・固有の配色データ）は同梱・複製していません。色の役割・余白・タイポ・レイアウトの“まとめ方”のエッセンスのみ抽出。
