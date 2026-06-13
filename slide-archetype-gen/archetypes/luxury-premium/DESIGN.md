---
version: alpha
name: Luxury / Premium (ラグジュアリー・プレミアム)
description: ハイメゾン／高級ビューティ・ファッションのブランドブックに代表される、抑制＝高級というスタイル。近黒(#0f0d0e)のフルブリード地に極小のゴールド・キッカー、Didone系セリフの巨大な見出し、広大な余白で「静かな自信」を表現する。表紙・章扉・締めは暗、エディトリアル本文はクリーム(#f4efe9)で切り替える。装飾は極限まで削ぎ、ヘアラインのゴールド罫と、CSS/SVGで描いた抽象的なボトル／オーブのシルエットのみ。1スライド1メッセージ、シネマティックでエレガント。

meta:
  archetype: luxury-premium
  origin: ハイメゾン／ラグジュアリー・ビューティのブランドブック・ルックブック（Didoneセリフ＋ゴールド＋広大な余白＋暗×クリームの切替）
  locale: bilingual
  density: very-low
  mood: [elegant, restrained, cinematic, confident, timeless, refined]
  tags:
    style: [luxury, minimal, editorial, premium]
    docType: [brand-book, lookbook, company-intro, pitch]
    industry: [beauty, fashion, cosmetics, hospitality, jewelry]
    color: [black, cream, gold, two-tone]

canvas:
  width: 1920px
  height: 1080px
  aspectRatio: "16:9"
  exportWidthIn: 13.333
  exportHeightIn: 7.5
  background: "{colors.canvas-dark}"
  margin: 160px

grid:
  columns: 12
  gutter: 32px
  margin: 160px
  baseline: 8px

colors:
  canvas-dark: "#0f0d0e"
  canvas-cream: "#f4efe9"
  ink-on-dark: "#f4efe9"
  ink-on-cream: "#1a1614"
  gold: "#b8945f"
  gold-soft: "#cdb286"
  red: "#9b1b30"
  muted: "#8a807a"
  hairline-dark: "#2a2422"
  hairline-cream: "#ddd5c9"

typography:
  kicker:
    fontFamily: "'Inter', 'Noto Sans JP', sans-serif"
    fontSize: 15px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: 0.32em
  cover-title:
    fontFamily: "'Playfair Display', 'Noto Serif JP', Georgia, serif"
    fontSize: 132px
    fontWeight: 500
    lineHeight: 1.04
    letterSpacing: 0.005em
  display:
    fontFamily: "'Playfair Display', 'Noto Serif JP', Georgia, serif"
    fontSize: 92px
    fontWeight: 500
    lineHeight: 1.08
    letterSpacing: 0.005em
  statement:
    fontFamily: "'Playfair Display', 'Noto Serif JP', Georgia, serif"
    fontSize: 64px
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: 0.005em
  section-numeral:
    fontFamily: "'Playfair Display', 'Noto Serif JP', Georgia, serif"
    fontSize: 340px
    fontWeight: 500
    lineHeight: 0.9
    letterSpacing: 0em
  serif-label:
    fontFamily: "'Playfair Display', 'Noto Serif JP', Georgia, serif"
    fontSize: 30px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: 0.01em
  lead:
    fontFamily: "'Inter', 'Noto Sans JP', sans-serif"
    fontSize: 21px
    fontWeight: 300
    lineHeight: 1.85
    letterSpacing: 0.01em
  body:
    fontFamily: "'Inter', 'Noto Sans JP', sans-serif"
    fontSize: 18px
    fontWeight: 300
    lineHeight: 1.95
    letterSpacing: 0.01em
  stat-number:
    fontFamily: "'Playfair Display', 'Noto Serif JP', Georgia, serif"
    fontSize: 200px
    fontWeight: 500
    lineHeight: 0.95
    letterSpacing: 0em
  caption:
    fontFamily: "'Inter', 'Noto Sans JP', sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0.08em
  page-number:
    fontFamily: "'Inter', 'Noto Sans JP', sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1
    letterSpacing: 0.18em

rounded:
  none: 0px
  xs: 2px
  sm: 4px
  pill: 9999px

spacing:
  xs: 8px
  sm: 16px
  md: 32px
  lg: 64px
  xl: 120px
  margin: 160px

layouts:
  cover:
    description: "★署名レイアウト。near-black のフルブリード地に上→下の微トーングラデ（撮影プレースホルダ）。中央に極小ゴールドのキッカー、その下に巨大なDidoneセリフ・タイトルを中央寄せ、最下部に細いゴールド・ヘアラインと日付。"
    uses: [kicker, cover-title, hairline, page-number]
    notes: "余白は画面の半分以上。タイトル以外は極小。"
  manifesto:
    description: "暗地（または クリーム）。1行〜2行のエレガントなセリフ文だけを中央に置くマニフェスト。装飾はゴールドの極小キッカーと細い罫のみ。"
    uses: [kicker, statement, hairline]
  chapter:
    description: "暗地。巨大なセリフ数字（01）を半透明で背面に、手前にゴールドのキッカー＋章タイトル（セリフ）。1スライド1章。"
    uses: [section-numeral, kicker, serif-label]
  editorial:
    description: "クリーム地。左にセリフ見出し＋本文1カラム、右にヘアラインで囲った画像エリア（撮影プレースホルダ＝微トーングラデ＋ボトル/オーブのゴールド線画）。"
    uses: [kicker, display, body, image-frame, product-silhouette]
  collection:
    description: "クリーム地（または暗）。3つの洗練された項目を横並び。各項目はゴールドのインデックス番号＋セリフ・ラベル＋短い本文、項目間は縦ヘアライン。"
    uses: [kicker, serif-label, body, hairline]
  heritage-stat:
    description: "暗地。巨大なセリフ数字（創業年/店舗数など）を中央に1つだけ。上にキッカー、下にキャプション。ヘリテージ感。"
    uses: [kicker, stat-number, caption, hairline]
  closing:
    description: "表紙と対の暗地。中央にセリフのサインオフ＋ゴールドのヘアライン・CTAボタン（塗りではなく細い枠線）。"
    uses: [kicker, statement, cta-hairline, page-number]

components:
  kicker:
    typography: "{typography.kicker}"
    textColor: "{colors.gold}"
  cover-title:
    typography: "{typography.cover-title}"
    textColor: "{colors.ink-on-dark}"
  statement:
    typography: "{typography.statement}"
    textColor: "{colors.ink-on-dark}"
  serif-label:
    typography: "{typography.serif-label}"
    textColor: "{colors.ink-on-cream}"
  body:
    typography: "{typography.body}"
    textColor: "{colors.muted}"
  hairline:
    backgroundColor: "{colors.gold}"
  image-frame:
    backgroundColor: "{colors.canvas-dark}"
    rounded: "{rounded.none}"
  cta-hairline:
    textColor: "{colors.gold}"
    rounded: "{rounded.pill}"
    padding: 18px 44px
  page-number:
    typography: "{typography.page-number}"
    textColor: "{colors.muted}"
  accent-rule-red:
    backgroundColor: "{colors.red}"

components-note: "重要度は塗りの色付き左縦ライン(border-left)で示さない。ゴールドのヘアライン・極小キャプション・余白の配分で階層を作る。赤(#9b1b30)はアクセントとして1デッキに1〜2回まで。"
---

# Luxury / Premium (ラグジュアリー・プレミアム)

## Overview

ハイメゾン（高級ビューティ／ファッションのブランドブック・ルックブック）に典型的な、**「抑制こそが高級」**を体現するスタイルです。情報を足すのではなく削ることで価値を表現します。画面の半分以上を余白に明け渡し、Didone系（Playfair Display）のセリフ見出しを大きく、静かに置く。色数は極端に絞り、ゴールド／シャンパンのアクセントはヘアラインのように細く効かせます。

署名的な要素は4つ。(1) **near-black(#0f0d0e)とクリーム(#f4efe9)の2地の切替**（表紙・章扉・締め＝暗、エディトリアル本文＝クリーム）、(2) **極小・ワイドトラッキングのゴールド・キッカー**（UPPERCASE, letter-spacing 0.32em）、(3) **Didoneセリフの巨大見出し**と巨大なセリフ数字、(4) **ゴールドのヘアライン罫**と、CSS/SVGで描いた抽象的な**ボトル／オーブのゴールド線画**（撮影プレースホルダ）。ブランドブック・ルックブック・高級サービス紹介に最適です。

**Key Characteristics:**
- 地は2種：暗(#0f0d0e)＝表紙/章扉/締め、クリーム(#f4efe9)＝エディトリアル本文。1デッキで交互に。
- 余白は超広大（マージン160px、画面の半分以上が空きであることが多い）。density は very-low。
- 見出し＝Didoneセリフ（Playfair Display）を大きく。本文＝ライトな sans（Inter 300）。
- キッカーは UPPERCASE・ワイドトラッキング(0.32em)・極小・ゴールド。
- 装飾はゴールドのヘアライン罫と、ボトル/オーブの線画のみ。重い3Dや影は使わない。
- 赤(#9b1b30)は1デッキに1〜2回の差し色まで。border-left の色ラインは使わない。
- WCAG: クリーム地は ink(#1a1614)、暗地は ink(#f4efe9) で本文コントラスト ≥ 4.5:1 を確保。

## Colors

- **Canvas-dark** ({colors.canvas-dark} — #0f0d0e): 表紙・章扉・締め・統計の near-black 地。
- **Canvas-cream** ({colors.canvas-cream} — #f4efe9): エディトリアル本文の地。温かみのある生成り。
- **Ink-on-dark** ({colors.ink-on-dark} — #f4efe9): 暗地の上の見出し・本文。
- **Ink-on-cream** ({colors.ink-on-cream} — #1a1614): クリーム地の上の見出し・本文。
- **Gold / Champagne** ({colors.gold} — #b8945f): キッカー・ヘアライン罫・線画・CTA枠。唯一のアクセント。
- **Gold-soft** ({colors.gold-soft} — #cdb286): 暗地でのゴールド明部・グラデ端。
- **Red** ({colors.red} — #9b1b30): 深い高級レッド。差し色として極めて稀に（1デッキ1〜2回）。
- **Muted** ({colors.muted} — #8a807a): 本文補助・キャプション・ページ番号。
- **Hairline-dark** ({colors.hairline-dark} — #2a2422): 暗地での極細罫。
- **Hairline-cream** ({colors.hairline-cream} — #ddd5c9): クリーム地での極細罫。

> コントラスト: ink-on-cream(#1a1614)/cream(#f4efe9) ≈ 13:1（AAA）。ink-on-dark(#f4efe9)/dark(#0f0d0e) ≈ 17:1（AAA）。gold(#b8945f)/dark(#0f0d0e) ≈ 6.3:1（AA、キッカーや見出しに可）。muted(#8a807a)/cream ≈ 3.1（→キャプション等の補助のみ。本文は ink を使う）。

## Typography

見出しは **Didone系セリフ（Playfair Display）** を中〜大ウェイト（400〜500）で大きく。和文は Noto Serif JP で代替。本文・ラベル・キッカーは **ライトな sans（Inter 300〜500）**、和文は Noto Sans JP。キッカーは UPPERCASE・ワイドトラッキング(0.32em)・極小がこの流派の口調。

| Token | Size | Weight | Use |
|---|---|---|---|
| section-numeral | 340px | 500 | 章扉の巨大セリフ数字（半透明・背面） |
| stat-number | 200px | 500 | ヘリテージ統計の巨大数字 |
| cover-title | 132px | 500 | 表紙の巨大セリフ見出し |
| display | 92px | 500 | エディトリアル見出し |
| statement | 64px | 400 | マニフェスト/締めの1行セリフ |
| serif-label | 30px | 500 | コレクション項目のセリフ・ラベル |
| lead | 21px | 300 | リード文（sans・ライト） |
| body | 18px | 300 | 本文（sans・ライト） |
| kicker | 15px | 500 | UPPERCASE・0.32emトラッキング・ゴールド |
| caption | 14px | 400 | キャプション |
| page-number | 13px | 400 | ページ番号・フッター |

**原則**: 見出しは必ずセリフ・大きく・余白を伴う。本文の強調は色ではなく**イタリック or ゴールドの小キャプション**で（マーカーや太い色文字は避ける）。`background-clip:text` は使わない。

## Layout & Grid

台紙 1920×1080、マージン **160px**（極めて広い）、12カラム・ガター32px、ベースライン8px。1スライド1メッセージを徹底し、要素数は最小。コンテンツは中央寄せ、またはマージンに沿った上品な左寄せ。情報密度は **very-low**：本文は1カラム・短く、KPIは1〜3個まで。罫はすべて 1px のゴールド・ヘアライン。

## Slide Layouts

- **cover（署名）**: 暗地＋微トーングラデ。中央にゴールド極小キッカー＋巨大セリフ・タイトル＋最下部にゴールド罫と日付。
- **manifesto**: 1〜2行のセリフ文だけを中央に。余白で語る。
- **chapter**: 巨大セリフ数字（半透明・背面）＋キッカー＋章タイトル。
- **editorial**: クリーム地。左にセリフ見出し＋本文、右にヘアライン枠の画像エリア（ボトル/オーブ線画）。
- **collection**: 3項目を横並び、ゴールド番号＋セリフ・ラベル＋本文、縦ヘアライン区切り。
- **heritage-stat**: 巨大セリフ数字を1つだけ。創業年/店舗数などのヘリテージ表現。
- **closing**: 暗地＋セリフのサインオフ＋ゴールドのヘアラインCTAボタン。

## Elevation & Depth

ほぼフラット。**影は使わない**（高級感は質感ではなく余白とトーンで出す）。奥行きは「near-black 地の微トーングラデ（上明→下暗、もしくは radial の淡い光）」＝撮影プレースホルダで表現する。任意で**ごく微細なグレイン**（フラットなオーバーレイ）は可だが控えめに。階層はゴールド・ヘアラインと余白の量で作る。

## Shapes

角はほぼ直角（rounded: none〜xs 2px）。pill はゴールドのヘアラインCTAボタンのみ full。図形言語は**直線のヘアライン罫**と**ボトル/オーブの細い線画**（SVG, stroke=gold, fill=none）。画像エリアは長方形＋ゴールド1px枠。装飾矩形・カードの塗りは使わない（クリーム/暗の地の上に直接組む）。

## Components

- **kicker**: UPPERCASE・0.32emトラッキング・15px・ゴールド。各スライド先頭の極小ラベル。
- **cover-title / display / statement**: Didoneセリフ。大きく・中央 or 上品な左寄せ。
- **serif-label**: コレクション項目のセリフ見出し（30px）。
- **hairline**: 1px のゴールド罫（横/縦）。区切り・装飾の主役。
- **image-frame**: 長方形＋ゴールド1px枠。中は微トーングラデ＋ボトル/オーブ線画（撮影プレースホルダ）。
- **product-silhouette**: SVGで描く抽象的なボトル/オーブの輪郭（stroke=gold, fill=none）。
- **cta-hairline**: 締めのCTA。**塗りではなくゴールドの細い枠線**＋ゴールド文字（pill）。
- **page-number**: 右下の極小ページ番号（0.18emトラッキング, muted）。
- **accent-rule-red**: 赤(#9b1b30)の極細罫。1デッキ1〜2回の差し色のみ。

## Motion

PPTX 書き出しではアニメーションは限定的（[HTML_INPUT_SPEC](../HTML_INPUT_SPEC.md) §9.4：CSSアニメ/トランジション/ホバーは出力されない）。この流派のリズムは**構成上の「間」**で作る：暗→クリーム→暗の地の切替、章扉での大きな数字の休符、1スライド1メッセージのテンポ。動きに頼らず、静止画として完成させる。

## Do's and Don'ts

- **Do**: 余白を主役に。画面の半分以上を空けて、Didoneセリフを静かに大きく置く。
- **Do**: 地を暗⇄クリームで切り替えてリズムを作る（表紙/章扉/締め＝暗、本文＝クリーム）。
- **Do**: キッカーは UPPERCASE・ワイドトラッキング・極小・ゴールド。
- **Do**: 罫はゴールドの1pxヘアラインだけ。線画は stroke のみ（塗らない）。
- **Don't**: 影・グラデの濃い立体・カードの塗りで“盛らない”。
- **Don't**: 色を増やさない（暗/クリーム/ゴールド/ink/muted以外は赤の差し色のみ）。
- **Don't**: border-left の色ラインで重要度を示さない（ヘアライン・余白・キャプションで）。
- **Don't**: 本文を詰め込まない。1スライド1メッセージを破らない。
- **Don't**: サンセリフの極太見出しにしない（必ずセリフ・大きく・余白付き）。

## Agent Prompt Guide

> **Quick palette**: dark `#0f0d0e` ／ cream `#f4efe9` ／ gold `#b8945f` ／ ink-on-cream `#1a1614` ／ ink-on-dark `#f4efe9` ／ red(差し色) `#9b1b30` ／ muted `#8a807a`。Font: 見出し Playfair Display（Noto Serif JP）／本文 Inter 300（Noto Sans JP）。角ほぼ直角・影なし・マージン160px。
>
> **Prompt**: 「高級ビューティ/ファッションのブランドブック（ラグジュアリー・プレミアム）スタイルで作って。地は2種類を交互に：表紙・章扉・締めは near-black(#0f0d0e)、エディトリアル本文はクリーム(#f4efe9)。見出しはDidoneセリフ(Playfair Display / Noto Serif JP)を巨大に、中央または上品な左寄せ。各スライド先頭に極小のゴールド(#b8945f)キッカー(UPPERCASE・letter-spacing 0.32em)。本文はライトなsans(Inter 300 / Noto Sans JP)で短く1カラム。装飾はゴールドの1pxヘアライン罫と、SVGで描いた抽象的なボトル/オーブの金線画(stroke のみ)だけ。影・カード塗り・多色は使わない。赤(#9b1b30)は1〜2回の差し色まで。マージンは約160pxで余白を主役に、1スライド1メッセージ。締めはゴールドの細枠CTAボタン。」

## HTML→PPTX Notes

- セリフ見出し・キッカー・本文・ヘアライン罫・ボトル/オーブ線画（SVG）はネイティブ図形/テキストになりやすい。見出しは必ず実テキストで置く。
- 表紙/章扉/締めの**near-black 微トーングラデは `linear-gradient`/`radial-gradient`** で（ラスタ化されても本文テキストは別レイヤーの実テキストに保つ）。
- フォント未解決時は PPTX 側で Arial フォールバックになる前提（[HTML_INPUT_SPEC](../HTML_INPUT_SPEC.md) §9.2）。Playfair Display が無い環境では Georgia / Noto Serif JP に落ちるようフォントスタックを必ず指定。
- `background-clip:text` は非対応のため使わない。ゴールド文字は通常の `color` で。
- 微細なグレインは安全のため省略可。入れる場合もフラットなオーバーレイ1枚に留める（重い filter/blend は避ける）。
- 図解・区切りは `<table>` を使わず div＋flex/grid と SVG で組む。

## Iteration Guide

1. まず地のリズム（暗→クリーム→暗）と表紙の“静かな掴み”（巨大セリフ＋ゴールド極小キッカー）を決める。
2. キッカーの口調（UPPERCASE・0.32em・ゴールド）とセリフ見出しのサイズ階層を固定する。
3. 本文は1スライド1メッセージに削る。要素が増えたら別スライドに割る。
4. 罫はゴールドのヘアラインに統一。線画は stroke のみ。色を足したくなったら、まず余白とゴールドで表現できないか検討する。
5. 赤の差し色は最後に1〜2箇所だけ、本当に強調したい1点に。

## References / 参考にした流派・出典

- **参考にした流派**: ハイメゾン／高級ビューティ・ファッションのブランドブック／ルックブック（Didoneセリフ＋ゴールド＋暗×クリームの2地切替＋広大な余白）。
- **視覚的な署名**: 巨大Didoneセリフ見出し / 極小ワイドトラッキングのゴールド・キッカー / ゴールドのヘアライン罫 / ボトル・オーブの金線画 / 暗⇄クリームの地切替 / 章扉の巨大セリフ数字。
- **起点（Slideland 経由の実資料・実在企業の公開ドキュメント）**: [SHISEIDO INTEGRATED REPORT 2025](https://corp.shiseido.com/jp/ir/library/annual/pdf/2025report_jp.pdf)（#Beauty #Luxury #Red）。高級ビューティのブランド表現（抑制の効いた余白・上質なタイポグラフィ・差し色の赤・エディトリアルな構成）の**設計言語のみ**を研究し、**内容（文言・写真・ロゴ・図版・数値）は一切複製せず**、架空ブランド「MAISON ÉCLAT」のオリジナルなコピー・構成・線画で再構築。

> 注: 実資料の文言・ロゴ・写真・数値・図版は複製していません。配色の役割・余白の取り方・タイポグラフィの階層・地の切替という抽象的なエッセンスのみ抽出。比較ビューア（[`../_viewer/index.html`](../_viewer/index.html)）で確認できます。
