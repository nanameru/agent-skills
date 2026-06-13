---
version: alpha
name: Apple Keynote Minimal
description: Apple の基調講演に代表される、1スライド1メッセージ（しばしば1語・1数値）の映画的ミニマル。漆黒または純白の全面キャンバスに巨大なヘッドラインを置き、本文をほぼ排す。情報ではなく感情に訴え、認知負荷を極限まで下げる。

meta:
  archetype: apple-keynote-minimal
  origin: Apple keynotes / cinematic product launches（系譜として Tome のビジュアルナラティブ）
  locale: bilingual
  density: very-low
  mood: [cinematic, calm, premium, focused, emotional]
  tags:
    style: [minimal, luxury, futuristic]
    docType: [pitch, service, keynote]
    industry: [consumer-tech, hardware, ai, design]
    color: [monochrome, dark]

canvas:
  width: 1920px
  height: 1080px
  aspectRatio: "16:9"
  exportWidthIn: 13.333
  exportHeightIn: 7.5
  background: "{colors.canvas}"
  margin: 160px

grid:
  columns: 12
  gutter: 24px
  margin: 160px
  baseline: 8px

colors:
  primary: "#f5f5f7"
  canvas: "#000000"
  ink: "#f5f5f7"
  muted: "#86868b"
  surface: "#1d1d1f"
  hairline: "#2a2a2c"
  accent: "#2997ff"
  canvas-light: "#ffffff"
  ink-on-light: "#1d1d1f"

typography:
  kicker:
    fontFamily: "'SF Pro Display', -apple-system, 'Helvetica Neue', Arial, sans-serif"
    fontSize: 24px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: 0.01em
  hero:
    fontFamily: "'SF Pro Display', -apple-system, 'Helvetica Neue', sans-serif"
    fontSize: 200px
    fontWeight: 700
    lineHeight: 1.0
    letterSpacing: -0.03em
  slide-title:
    fontFamily: "'SF Pro Display', -apple-system, 'Helvetica Neue', sans-serif"
    fontSize: 96px
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: -0.02em
  lead:
    fontFamily: "'SF Pro Display', -apple-system, 'Helvetica Neue', sans-serif"
    fontSize: 40px
    fontWeight: 400
    lineHeight: 1.3
  body:
    fontFamily: "'SF Pro Text', -apple-system, 'Helvetica Neue', sans-serif"
    fontSize: 30px
    fontWeight: 400
    lineHeight: 1.45
  kpi-number:
    fontFamily: "'SF Pro Display', -apple-system, 'Helvetica Neue', sans-serif"
    fontSize: 320px
    fontWeight: 700
    lineHeight: 0.9
    letterSpacing: -0.04em
  kpi-label:
    fontFamily: "'SF Pro Text', -apple-system, sans-serif"
    fontSize: 28px
    fontWeight: 400
    lineHeight: 1.3
  caption:
    fontFamily: "'SF Pro Text', -apple-system, sans-serif"
    fontSize: 20px
    fontWeight: 400
    lineHeight: 1.4
  source:
    fontFamily: "'SF Pro Text', -apple-system, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.3

rounded:
  none: 0px
  sm: 12px
  md: 20px
  lg: 32px
  full: 9999px

spacing:
  xs: 8px
  sm: 16px
  md: 32px
  lg: 64px
  xl: 120px
  margin: 160px

layouts:
  cover:
    description: "漆黒地・中央に巨大ヘッドライン（1語〜1行）＋上にグラデで光る小さなキッカー。下に一言サブ。"
    uses: [kicker, hero, lead]
  statement:
    description: "1スライド1文。中央寄せの大きな宣言文のみ。背景は黒または白。"
    uses: [slide-title]
  hero-number:
    description: "巨大数値（320px）を中央に1つ。下にラベル1行。数値はグラデまたは accent。"
    uses: [kpi-number, kpi-label]
  product:
    description: "中央に製品/ビジュアル（全面写真 or 大きな図）、下にキャプション1行。文字は最小。"
    uses: [slide-title, caption]
  three-point:
    description: "稀に使う3点。アイコン＋1語×3を等間隔。説明は1行まで。"
    uses: [slide-title, lead]
  closing:
    description: "表紙と対。黒地に短い一言＋ロゴ位置のキャプション。"
    uses: [hero, caption]

components:
  kicker:
    typography: "{typography.kicker}"
    textColor: "{colors.accent}"
  hero:
    typography: "{typography.hero}"
    textColor: "{colors.ink}"
  slide-title:
    typography: "{typography.slide-title}"
    textColor: "{colors.ink}"
  lead:
    typography: "{typography.lead}"
    textColor: "{colors.muted}"
  kpi-number:
    typography: "{typography.kpi-number}"
    textColor: "{colors.ink}"
  pill:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: 12px 28px
  source-footnote:
    typography: "{typography.source}"
    textColor: "{colors.muted}"
---

# Apple Keynote Minimal

## Overview

Apple の基調講演スタイルは、**「1スライドで伝えることは1つだけ」**を極限まで突き詰めたミニマリズムです。多くのスライドは1語、または1つの数値、または1枚のビジュアルだけ。箇条書きは原則使わず、認知負荷を最小化して聴衆の注意を**話者と1つのメッセージ**に集中させます。

本質は「情報を載せる」ではなく**「感情を設計する」**こと。漆黒（#000）または純白（#fff）の余白がドラマを生み、巨大なタイポグラフィと中央配置が映画的な間（ま）をつくります。プレゼンター主導（話者が言葉を補う）の前提なので、資料単体での情報量は意図的に薄い。製品発表・ビジョン提示・カンファレンス登壇に最適です。

**Key Characteristics:**
- 1スライド1メッセージ（多くは1語/1数値/1ビジュアル）。箇条書きを避ける。
- 漆黒 or 純白の全面キャンバス。余白＝演出。
- 巨大ヘッドライン（96〜320px）を中央に。SF Pro Display。
- 色はモノクロ＋アクセント1（青のグロー）。多色にしない。
- プレゼンター前提＝資料は薄く、語りで補う。

## Colors

ダーク基調を既定とし、明るくしたいスライドだけ `canvas-light`（白）に反転します。

- **Canvas (Dark)** ({colors.canvas} — #000000): 既定の全面背景。純黒。
- **Ink** ({colors.ink} — #f5f5f7): 文字。純白よりわずかに落としたオフホワイト。
- **Muted** ({colors.muted} — #86868b): サブ・キャプション。Apple の象徴的グレー。
- **Surface** ({colors.surface} — #1d1d1f): ピル/カードの面（多用しない）。
- **Accent** ({colors.accent} — #2997ff): 強調1点（数値・キッカー・リンク）。青のグロー。
- **Canvas-light** ({colors.canvas-light} — #ffffff) / **Ink-on-light** (#1d1d1f): 白地スライド用の反転ペア。

> 黒地に ink ≈ 18:1（AAA）。accent #2997ff on 黒 ≈ 5.6:1（大文字可）。

## Typography

**SF Pro Display / Text**（不可なら Helvetica Neue / Arial）。見出しは Display、本文は Text。ウェイトは Regular 400・Medium 500・Semibold 600・Bold 700 を使い分けるが、**1スライドに1〜2サイズ**。

| Token | Size | Weight | Use |
|---|---|---|---|
| kpi-number | 320px | 700 | 1数値の主役 |
| hero | 200px | 700 | 表紙の1語 |
| slide-title | 96px | 600 | 宣言文 |
| lead | 40px | 400 | サブ1行 |
| body | 30px | 400 | 稀な本文（1〜2行） |
| caption/source | 16–20px | 400 | 注記 |

**原則**: 文字は大きく、少なく。タイトな負レタースペーシング（-0.02〜-0.04em）が署名。和文は **Hiragino Sans / Noto Sans JP W6**、`letterSpacing` は 0 に。

## Layout & Grid

台紙 1920×1080、マージン **160px**（広い）。ほとんどのレイアウトは**中央寄せ**（この流派だけは中央寄せが正）。1スライド1要素を画面中央に置き、周囲を大きく空ける。情報密度は **very-low**。

## Slide Layouts

- **cover**: 中央に1語ヒーロー＋上にグローのキッカー＋下にサブ1行。
- **statement**: 宣言文1つだけ。
- **hero-number**: 320px の1数値＋ラベル1行。
- **product**: 全面ビジュアル＋キャプション1行。
- **closing**: 黒地に短い一言。

## Elevation & Depth

影は使わず、**グラデーションの発光（glow）**で奥行きを出す。例: アクセント文字や数値に放射状グラデの淡い光輪、背景にごく僅かな径の大きいラジアルグラデ。カードを使う場合は surface(#1d1d1f) のベタ面＋大きな角丸のみ。

## Shapes

大きな角丸（20〜32px、ピルは full）。Apple 的なソフトな矩形。鋭角は避ける。アイコンは細い単色ライン。装飾図形は最小限。

## Components

- **hero / slide-title**: 中央配置の巨大テキスト。
- **kicker**: accent 色・中サイズ・中央。グローを添えてよい。
- **pill**: surface 地の丸ピル（「New」等のラベル）。
- **kpi-number**: 320px。accent かオフホワイト。
- **source-footnote**: 画面下中央、muted、極小。

## Do's and Don'ts

- **Do**: 1スライド1メッセージを死守する（1語/1数値/1ビジュアル）。
- **Do**: 余白を大胆に取り、中央に置く。
- **Do**: 色はモノクロ＋アクセント1点。
- **Don't**: 箇条書きや本文ブロックを置かない（説明は語りで）。
- **Don't**: 複数の主張を1枚に詰めない。
- **Don't**: 多色・装飾・派手なグラデ面を持ち込まない（グローは可、面の虹色は不可）。

## Agent Prompt Guide

> **Quick palette**: canvas `#000000` ／ ink `#f5f5f7` ／ muted `#86868b` ／ accent `#2997ff`。Font: SF Pro Display/Text（和文 Hiragino Sans）。中央寄せ・巨大文字・余白大。
>
> **Prompt**: 「Apple Keynote 風のミニマルでスライドを作って。漆黒(#000)地・オフホワイト(#f5f5f7)文字・アクセントは青(#2997ff)1点。各スライドは1メッセージだけ（1語・1数値・1ビジュアルのいずれか）を画面中央に巨大に置く。箇条書きと本文ブロックは使わない。SF Pro Display、マージン160pxで余白を大きく。強調は青のグローで。」

## HTML→PPTX Notes

- 文字・大きな角丸矩形・ピルはネイティブ図形/テキストになる。
- **グロー表現**は `text-shadow`/`box-shadow` の淡い大ぼかし。PPTX では影として近似されるが、放射グラデを `radial-gradient` の背景 `<div>` で置くとラスタ化することがある → 重要なグローは控えめにし、テキスト自体は必ず実テキストで置く（編集可能性を優先）。
- 背景の巨大ラジアルグラデは1枚の `<div>` に限定し、その上のテキストは別レイヤーに（テキストがラスタに巻き込まれないように）。
- SF Pro 未解決時は Helvetica/Arial にフォールバック（字面が近く崩れにくい）。

## Iteration Guide

1. まず「この1枚で言いたい1語」を決める。足りなければスライドを増やす（詰め込まない）。
2. 色を足したくなったら、まずアクセントを削れないか検討する。
3. 白地に反転したいスライドは `canvas-light`/`ink-on-light` ペアを使う。

## References / 参考にした流派・出典

- **参考にした流派**: Apple Keynote / シネマティック・ミニマル（WWDC・製品発表）。系譜として Tome。
- **視覚的な署名**: 1スライド1メッセージ / 漆黒 or 純白 / 巨大タイポ中央 / 感情＞情報。
- 出典:
  - [Apple のプレゼン手法（解説）](https://www.crappypresentations.com/presentation-tips-and-tricks/apple-product-presentations)

> 注: 本定義は特定の PowerPoint ファイルの複製ではなく、上記の流派・ギャラリーから**デザイン思考とエッセンスを抽出**して再構築したもの。比較ビューア（[`../_viewer/index.html`](../_viewer/index.html)）で「作ったスライド」と上記の参照元を見比べられる。横断タクソノミは[スライドランド](https://www.slideland.tech/)（style×docType×industry×color）に準拠。

**起点（Slideland 経由の実スライド・実在企業の公開デッキ）**: [NOT A HOTEL SOFTWARE DECK (2025/11/06)](https://speakerdeck.com/notahotel/04)（#ブラック #スタイリッシュ #不動産）— 黒基調・シネマティックな国内プレミアム実例。Apple系ミニマルの国内近似。
