---
version: alpha
name: Trust SaaS (信頼感のあるモダンSaaS)
description: 日本のモダンSaaS企業紹介デッキに代表される、信頼感と先進性を両立するスタイル。フルブリードの青→水色グラデ表紙にガラス質の3Dモチーフ、白地コンテンツに「青の太い見出し＋句点」、キーワードのインライン青ハイライト、ソフトなグラデ見出しバーのパネル、2軸マップ。清潔・誠実・洗練。

meta:
  archetype: trust-saas
  origin: 日本のモダンSaaS会社紹介/採用デッキ（クリーンな青基調・グラデ・カードUI・2軸図解）
  locale: ja
  density: medium
  mood: [trustworthy, modern, clean, confident, approachable]
  tags:
    style: [trust, clear, stylish]
    docType: [company-intro, recruit, service]
    industry: [saas, ai, finance, hr]
    color: [blue, gradient]

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
  primary: "#2c4bf0"
  primary-deep: "#1b2fb8"
  accent: "#6a5cf0"
  sky: "#6aa8f5"
  canvas: "#ffffff"
  ink: "#171a2b"
  muted: "#5b6478"
  surface: "#f4f6ff"
  surface-2: "#eaeeff"
  hairline: "#e3e7f6"
  on-primary: "#ffffff"

typography:
  cover-title:
    fontFamily: "Inter, 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', sans-serif"
    fontSize: 124px
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: -0.03em
  kicker:
    fontFamily: "Inter, 'Noto Sans JP', sans-serif"
    fontSize: 18px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0.04em
  slide-heading:
    fontFamily: "Inter, 'Noto Sans JP', sans-serif"
    fontSize: 40px
    fontWeight: 800
    lineHeight: 1.3
    letterSpacing: -0.005em
  section-label:
    fontFamily: "Inter, 'Noto Sans JP', sans-serif"
    fontSize: 26px
    fontWeight: 800
    lineHeight: 1.25
  lead:
    fontFamily: "'Noto Sans JP', Inter, sans-serif"
    fontSize: 24px
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: "'Noto Sans JP', Inter, sans-serif"
    fontSize: 19px
    fontWeight: 400
    lineHeight: 1.75
  panel-title:
    fontFamily: "Inter, 'Noto Sans JP', sans-serif"
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.3
  kpi-number:
    fontFamily: "Inter, 'Noto Sans JP', sans-serif"
    fontSize: 84px
    fontWeight: 800
    lineHeight: 1.0
    letterSpacing: -0.02em
  kpi-label:
    fontFamily: "'Noto Sans JP', Inter, sans-serif"
    fontSize: 18px
    fontWeight: 500
    lineHeight: 1.4
  footer:
    fontFamily: "'Noto Sans JP', Inter, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1

rounded:
  none: 0px
  sm: 8px
  md: 14px
  lg: 22px
  full: 9999px

spacing:
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 72px
  margin: 88px

layouts:
  cover:
    description: "★署名レイアウト。フルブリードの青→水色 135deg グラデ地。左にガラス質の半透明3Dシェイプを重ね、右に超極太の白見出し。上にロゴ、下に日付。"
    uses: [logo, cover-title, kicker]
  agenda:
    description: "白地。青の見出し＋句点。番号付きの目次を縦に。現在地を surface でハイライト可。"
    uses: [slide-heading, body, footer]
  statement:
    description: "白地に青の太い見出し（句点付き）＋リード文。リード内のキーワードを青/violet でインラインハイライト。"
    uses: [slide-heading, lead, highlight]
  value-grid:
    description: "2カラム（または2×N）の価値観/特徴グリッド。各項目は section-label（英＋和）＋本文。"
    uses: [slide-heading, section-label, body]
  twin-panel:
    description: "課題→解決などの対比。各パネルは上にグラデ見出しバー（角丸）＋淡いtinted本文。"
    uses: [slide-heading, gradient-panel, highlight]
  quadrant:
    description: "2軸マップ（縦軸×横軸ラベル）。象限に要素、自社ポジションを pill＋グラデで強調。"
    uses: [slide-heading, quadrant, pill]
  kpi:
    description: "数値ハイライト3〜4枚。kpi-number（青）＋ラベル。淡い surface カード。"
    uses: [kpi-number, kpi-label]
  closing:
    description: "表紙と対の青グラデ全面。中央に短いメッセージ＋採用/CTA のグラデボタン。"
    uses: [cover-title, kicker, cta]

components:
  logo:
    typography: "{typography.section-label}"
    textColor: "{colors.ink}"
  cover-title:
    typography: "{typography.cover-title}"
    textColor: "{colors.on-primary}"
  slide-heading:
    typography: "{typography.slide-heading}"
    textColor: "{colors.primary}"
  highlight:
    textColor: "{colors.primary}"
  gradient-panel-header:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: 14px 22px
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: 32px
  pill:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    padding: 8px 20px
  cta:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    padding: 18px 40px
  footer:
    typography: "{typography.footer}"
    textColor: "{colors.muted}"

components-note: "重要度は塗り/グラデ/バッジで示す（色付き左縦ライン=border-left は使わない）。"
---

# Trust SaaS (信頼感のあるモダンSaaS)

## Overview

日本のモダンSaaS企業（会社紹介・採用デッキ）に典型的な、**信頼感と先進性を同時に出す**スタイルです。表紙は青→水色のフルブリードグラデにガラス質の3Dモチーフで“テック感”を、本文は白地に整然としたカードと図解で“誠実さ・読みやすさ”を担保します。

署名的な要素は3つ。(1) **表紙の青グラデ＋ガラス3D＋超極太の白見出し**、(2) **青の太い見出し＋句点（。）** と本文中の**キーワードを青/violet でインラインハイライト**、(3) **上にグラデ見出しバーを載せた角丸パネル**と**2軸マップ**による図解。会社紹介・採用・サービス紹介に最適です。

**Key Characteristics:**
- 表紙＝青→水色 135° グラデ全面＋半透明ガラスの3Dシェイプ＋白の超極太見出し。
- 本文の見出しは**青・極太・句点付き**。リード文のキーワードを青/violet で強調。
- グラデ見出しバー付きの**角丸パネル**、淡い lavender の tinted 面。
- 2カラムの価値観グリッド（英語の section-label ＋ 和文本文）。
- 2軸マップで自社ポジションを pill＋グラデで強調。
- フッターは `ページ番号 ｜ セクション名 …… ©Company`。
- 重要度は塗り/グラデ/バッジで示す（border-left の色ラインは使わない）。

## Colors

- **Primary** ({colors.primary} — #2c4bf0): 見出し・ロゴ・図解の主色。信頼の青。
- **Primary-deep** ({colors.primary-deep} — #1b2fb8): グラデの濃端・強調。
- **Accent / Violet** ({colors.accent} — #6a5cf0): グラデのもう一端、インラインハイライトの第2色。
- **Sky** ({colors.sky} — #6aa8f5): 表紙グラデの明端。
- **Canvas** ({colors.canvas} — #ffffff): 本文地。
- **Ink** ({colors.ink} — #171a2b): 本文・濃い見出し。
- **Muted** ({colors.muted} — #5b6478): 補助・フッター。
- **Surface / Surface-2** (#f4f6ff / #eaeeff): カード・tinted パネルの地（淡い lavender-blue）。
- **Hairline** ({colors.hairline} — #e3e7f6): 罫線・境界。

> コントラスト: ink/canvas ≈ 14:1（AAA）。primary/white ≈ 6.6:1（AA）。青地に白 ≈ 6.6:1。

## Typography

見出しは**幾何学サンセリフを極太（800）**で（英語＝Inter 等、和文＝Noto Sans JP）。本文は Noto Sans JP 400。見出しは青、末尾に**句点（。）**を付けるのがこの流派の口調。

| Token | Size | Weight | Use |
|---|---|---|---|
| cover-title | 124px | 800 | 表紙の超極太見出し（白） |
| kpi-number | 84px | 800 | 数値ハイライト |
| slide-heading | 40px | 800 | 見出し（青・句点付き） |
| section-label | 26px | 800 | 価値観/特徴の見出し（英＋和） |
| lead | 24px | 400 | リード文 |
| body | 19px | 400 | 本文 |
| footer | 14px | 500 | フッター |

**原則**: 見出しは青・極太。本文の強調は**インラインの青/violet 太字**（下線やマーカーではなく色で）。

## Layout & Grid

台紙 1920×1080、マージン 88px、12カラム・ガター24px。コンテンツスライドは「左上ロゴ → 青見出し（句点）→ リード/図解 → フッター」。情報密度は **medium**（IRより軽く、Appleより重い）。角丸は中〜大（14〜22px）で柔らかく。

## Slide Layouts

- **cover（署名）**: 青→水色グラデ全面＋ガラス3D＋白の超極太見出し。
- **statement**: 青見出し（句点）＋リード（キーワード青ハイライト）。
- **value-grid**: 2カラムの価値観（section-label 英＋和）。
- **twin-panel**: 課題/解決の2パネル、上にグラデ見出しバー。
- **quadrant**: 2軸マップ、自社ポジションを pill＋グラデ強調。
- **kpi**: 数値カード3〜4枚。
- **closing**: 青グラデ全面＋CTAボタン。

## Elevation & Depth

影はやわらかく拡散（`0 20px 50px rgba(44,75,240,.10)` 程度）。カードは「白〜淡 lavender ＋大きめ角丸＋柔らかい影」。表紙のガラス3Dは半透明＋ぼかし＋光のハイライトで“質感”を出す。フラットすぎず、過剰に立体的にもしない。

## Shapes

中〜大の角丸（14〜22px、pill は full）。図形言語は角丸矩形・pill・2軸の矢印。表紙のガラスモチーフは角丸の半透明パネルを回転・重ねて構成。アイコンは単色ライン（primary）。

## Components

- **cover-title**: 白・800・超大。グラデ地の右側に左寄せ。
- **slide-heading**: 青・800・**末尾に句点**。
- **highlight**: 本文中キーワードの青/violet 太字。
- **gradient-panel-header**: 角丸パネルの上端、primary→accent のグラデ見出しバー＋白文字。本文は surface。
- **card**: 白/淡 lavender・大角丸・柔らかい影。
- **pill / cta**: primary 塗りの角丸ピル/ボタン（CTA はグラデ可）。
- **footer**: `n ｜ セクション名` 左、`©Company` 右、muted。

## Do's and Don'ts

- **Do**: 表紙は青→水色グラデ＋ガラス3D＋白の超極太見出しで“掴む”。
- **Do**: 見出しは青・極太・句点付き。本文の要点は青/violet のインライン太字で。
- **Do**: パネルは上にグラデ見出しバー＋淡 lavender 本文。角丸は大きめ。
- **Do**: フッターを全コンテンツ面に常設（ページ｜セクション ©）。
- **Don't**: 原色の多色を散らさない（青＋violet のグラデ系に統一）。
- **Don't**: border-left の色ラインで重要度を示さない（塗り/グラデ/バッジで）。
- **Don't**: 角を尖らせすぎない（モダンSaaSの柔らかさを保つ）。

## Agent Prompt Guide

> **Quick palette**: primary `#2c4bf0` ／ violet `#6a5cf0` ／ sky `#6aa8f5` ／ ink `#171a2b` ／ surface `#f4f6ff`。Font: Inter + Noto Sans JP（見出し800）。角丸大。
>
> **Prompt**: 「日本のモダンSaaS会社紹介の信頼感スタイルで作って。表紙は青(#2c4bf0)→水色(#6aa8f5)の135°グラデ全面に、半透明ガラスの3Dシェイプを左に重ね、右に白の超極太見出し。本文は白地で、見出しは青・極太・末尾に句点(。)、リード文のキーワードは青/violet(#6a5cf0)のインライン太字で強調。図解は『上にグラデ見出しバーを載せた角丸パネル』と『2軸マップ(縦軸×横軸ラベル＋自社ポジションを青pillで強調)』。2カラムの価値観グリッドは英語ラベル＋和文。フッターは『ページ｜セクション …… ©社名』。角丸は大きめ、色は青＋violetに統一。」

## HTML→PPTX Notes

- 見出し・カード・pill・グラデ見出しバー・2軸マップ（SVG）はネイティブ図形/テキストになる。
- 表紙のフルブリード**グラデ＋ガラス3D（blur/box-shadow）はラスタ化**しやすい（[HTML_INPUT_SPEC](../HTML_INPUT_SPEC.md) §8.4）。表紙見出しは必ず実テキストで別レイヤーに置き、編集可能性を確保する。
- インラインハイライトは `<b>`/`<span>` の色変えで（`background-clip:text` は使わない）。
- 図解は `<table>` を使わず div＋flex/grid と SVG で組む。

## Iteration Guide

1. まず表紙の“掴み”（グラデ＋ガラス3D＋白見出し）を決める。
2. 見出しの口調（青・極太・句点）と本文ハイライト色を固定する。
3. 図解は twin-panel / quadrant / value-grid の型に当てはめる。
4. 色を足したくなったら、まず青＋violet のグラデで表現できないか検討する。

## References / 参考にした流派・出典

- **参考にした流派**: 日本のモダンSaaS会社紹介/採用デッキ（クリーンな青基調・グラデ・カードUI・2軸図解）。
- **視覚的な署名**: 青→水色グラデ表紙＋ガラス3D / 青の太い見出し＋句点 / キーワードの青ハイライト / グラデ見出しバーの角丸パネル / 2軸マップ。
- **起点（Slideland 経由の実スライド・実在企業の公開デッキ）**: [LayerX Company Deck](https://speakerdeck.com/layerx/company-deck)（#会社紹介資料 #AI #ブルー #スタイリッシュ）。実デッキの設計言語（配色・グラデ・見出しの口調・カード/図解の型）を研究し、**内容は複製せず**オリジナルのブランド・コピー・図解で再構築。

> 注: 実スライドの文言・ロゴ・図版は複製していません。配色・余白・タイポ・レイアウトのエッセンスのみ抽出。比較ビューア（[`../_viewer/index.html`](../_viewer/index.html)）で実物と並べて確認できます。
