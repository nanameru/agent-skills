---
version: alpha
name: Maximalist Gradient (Canva-bold / Y2K-adjacent)
description: 鮮烈なグラデーション（ピンク→紫→青、シアン→バイオレット）を主役に、抽象ブロブ／浮遊シェイプ、ハイコントラストのカラーブロッキング、超特大の極太見出しで「まず目を引く」表現的スタイル。クリエイターイベント／音楽フェス／デザインカンファレンス向けのエキスパンシブで楽しいトーン。1スライド1フォーカスを厳守し、白文字は必ずグラデの濃部に乗せて WCAG AA を確保する。

meta:
  archetype: maximalist-gradient
  origin: Canva のグラデ系テンプレート＋2026 maximalist/gradient トレンド（Y2K リバイバル）。クリエイティブ系イベント/プラットフォームのキービジュアル文脈。
  locale: bilingual
  density: low
  mood: [vibrant, expressive, bold, playful, energetic]
  tags:
    style: [pop, dynamic, bold, colorful]
    docType: [event, pitch, service, brand]
    industry: [creative, media, music, design, community]
    color: [gradient, pink, purple, cyan]

canvas:
  width: 1920px
  height: 1080px
  aspectRatio: "16:9"
  exportWidthIn: 13.333
  exportHeightIn: 7.5
  background: "{colors.ink}"
  margin: 104px

grid:
  columns: 12
  gutter: 28px
  margin: 104px
  baseline: 8px

colors:
  hot-pink: "#ff4d9d"
  violet: "#8a4dff"
  electric-blue: "#4d7cff"
  cyan: "#00d4ff"
  deep-violet: "#7b2ff7"
  ink: "#120a24"
  ink-2: "#1c1140"
  canvas: "#ffffff"
  cream: "#fff4fb"
  on-dark: "#ffffff"
  on-light: "#1a0f33"
  muted-on-dark: "#d9c7ff"
  lime: "#caff4d"

typography:
  cover-title:
    fontFamily: "Inter, 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', sans-serif"
    fontSize: 168px
    fontWeight: 900
    lineHeight: 0.92
    letterSpacing: -0.035em
  statement-title:
    fontFamily: "Inter, 'Noto Sans JP', sans-serif"
    fontSize: 104px
    fontWeight: 900
    lineHeight: 1.02
    letterSpacing: -0.03em
  slide-title:
    fontFamily: "Inter, 'Noto Sans JP', sans-serif"
    fontSize: 64px
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: -0.02em
  kicker:
    fontFamily: "Inter, 'Noto Sans JP', sans-serif"
    fontSize: 22px
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: 0.16em
  lead:
    fontFamily: "'Noto Sans JP', Inter, sans-serif"
    fontSize: 26px
    fontWeight: 500
    lineHeight: 1.55
  body:
    fontFamily: "'Noto Sans JP', Inter, sans-serif"
    fontSize: 20px
    fontWeight: 500
    lineHeight: 1.7
  card-title:
    fontFamily: "Inter, 'Noto Sans JP', sans-serif"
    fontSize: 30px
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: -0.01em
  kpi-number:
    fontFamily: "Inter, 'Noto Sans JP', sans-serif"
    fontSize: 320px
    fontWeight: 900
    lineHeight: 0.86
    letterSpacing: -0.04em
  kpi-label:
    fontFamily: "'Noto Sans JP', Inter, sans-serif"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.4
  quote:
    fontFamily: "Inter, 'Noto Sans JP', sans-serif"
    fontSize: 60px
    fontWeight: 800
    lineHeight: 1.18
    letterSpacing: -0.02em
  footer:
    fontFamily: "Inter, 'Noto Sans JP', sans-serif"
    fontSize: 15px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 0.06em

rounded:
  none: 0px
  sm: 12px
  md: 22px
  lg: 36px
  xl: 56px
  full: 9999px

spacing:
  xs: 8px
  sm: 16px
  md: 28px
  lg: 48px
  xl: 88px
  margin: 104px

layouts:
  cover:
    description: "★署名レイアウト。pink→violet→blue 135° のフルブリードグラデ地。背面に有機ブロブと浮遊シェイプ（low opacity）。中央〜下に超特大の極太見出し（白）＋ピル状キッカー。"
    uses: [kicker, cover-title, pill, blob]
  statement:
    description: "グラデ全面に1本の大胆な宣言文のみ。フォーカスは1つ。白文字はグラデ濃部（左上〜中央）に。"
    uses: [statement-title, kicker]
  feature-cards:
    description: "3枚のカラーブロックカード。各カードは別グラデ（pink系/cyan系/lime系）の塗り、白 or 濃インクのタイトル＋本文。アイコンはインラインSVG。"
    uses: [slide-title, card, card-title, body]
  big-number:
    description: "グラデヒーロー数値。1つの巨大数値を主役に、左右にラベルと短い説明。背面ブロブ。"
    uses: [kpi-number, kpi-label, kicker]
  gallery-grid:
    description: "2×2 の鮮烈タイル。各タイルは別グラデ＋短いラベル。色のリズムで魅せる。"
    uses: [slide-title, tile]
  quote:
    description: "濃インク地（or グラデ）に大きな引用／ハイライト文。話者をピルで。1フォーカス。"
    uses: [quote, pill, kicker]
  closing:
    description: "表紙と対のフルグラデ。中央に短いCTA見出し＋塗りピルのCTAボタン＋ハンドル。"
    uses: [statement-title, kicker, cta, pill]

components:
  kicker:
    typography: "{typography.kicker}"
    textColor: "{colors.on-dark}"
  cover-title:
    typography: "{typography.cover-title}"
    textColor: "{colors.on-dark}"
  slide-title:
    typography: "{typography.slide-title}"
    textColor: "{colors.on-light}"
  card:
    rounded: "{rounded.lg}"
    padding: 40px
  pill:
    backgroundColor: "{colors.on-dark}"
    textColor: "{colors.deep-violet}"
    rounded: "{rounded.full}"
    padding: 12px 28px
  cta:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: 22px 52px
  tile:
    rounded: "{rounded.lg}"
    padding: 36px
  footer:
    typography: "{typography.footer}"
    textColor: "{colors.muted-on-dark}"

components-note: "重要度は塗り（ピル/バッジ/カラーブロック）で示す。色付き左縦ライン（border-left）は使わない。アイコンは絵文字でなくインラインSVG。"
---

# Maximalist Gradient (Canva-bold / Y2K-adjacent)

## Overview

「とにかく、まず目を引く」ためのスタイルです。**鮮烈なグラデーション**（ピンク→紫→青、シアン→バイオレット）を画面いっぱいに敷き、**有機的なブロブ**や**浮遊する幾何シェイプ**を背面に散らし、**超特大の極太見出し**を白で打ち抜きます。カラーブロッキングとハイコントラストで、クリエイターイベント・音楽フェス・デザインカンファレンスのキービジュアルのような、エキスパンシブで楽しいトーンを作ります。

署名的な要素は3つ。(1) **フルブリードのビビッドグラデ＋抽象ブロブ＋超特大見出し**、(2) **カラーブロックされたフィーチャーカード**（各カードが別グラデ）、(3) **巨大なグラデヒーロー数値**。表現的でありながら、**1スライド1フォーカス**を厳守して散らからせません。

このスタイルは色のコントラストが命取りになりやすいため、**WCAG AA を最重要ガードレール**として扱います。白文字は必ずグラデの**濃い側**（pink/violet/deep-violet 側）に乗せ、本文サイズの文字はローカル背景に対して **≥4.5:1** を確保します。明るい cyan/lime のグラデ上には白文字を載せず、濃インク文字を使います。

**Key Characteristics:**
- 表紙＝ pink→violet→blue 135° のフルブリードグラデ＋有機ブロブ＋浮遊シェイプ（低opacity・背面）＋白の超特大見出し。
- 見出しは**幾何サンセリフ Inter 800〜900** の極太・超特大。1スライドに支配的な見出し／数値を1つだけ。
- カラーブロックされたフィーチャーカード（カードごとに別グラデ）。
- 巨大なグラデヒーロー数値（big-number）。
- ピル／バッジはビビッド塗り。アイコンは**インラインSVG**（絵文字は使わない）。
- 白文字はグラデ濃部に、本文は ≥4.5:1。明部に白文字を載せない。
- 重要度は塗り（ピル/バッジ/カラーブロック）で示す（border-left の色ラインは使わない）。

## Colors

- **Hot-pink** ({colors.hot-pink} — #ff4d9d): メイングラデの起点。ビビッドの主役。
- **Violet** ({colors.violet} — #8a4dff): メイングラデの中点。
- **Electric-blue** ({colors.electric-blue} — #4d7cff): メイングラデの終点。
- **Cyan** ({colors.cyan} — #00d4ff): セカンダリ（cyan→violet）の明端。**白文字を載せない**明色。
- **Deep-violet** ({colors.deep-violet} — #7b2ff7): セカンダリの濃端。ピル文字色。
- **Ink / Ink-2** ({colors.ink} — #120a24 / #1c1140): 濃地・quote 背景。白文字を安全に乗せられる濃部。
- **Canvas / Cream** (#ffffff / #fff4fb): 明カード地・濃インク文字用。
- **On-dark / On-light** (#ffffff / #1a0f33): グラデ濃部の白文字／明部の濃文字。
- **Muted-on-dark** ({colors.muted-on-dark} — #d9c7ff): 濃地のフッター・補助文字。
- **Lime** ({colors.lime} — #caff4d): CTA・差し色アクセント。濃インク文字とセットで。

> コントラスト指針: white/#120a24 ≈ 18:1（AAA）。white/#7b2ff7 ≈ 5.6:1（AA）。white/#ff4d9d ≈ 2.6:1（**本文NG／特大見出しのみ**）。明色（cyan/lime）上は #1a0f33 等の濃文字を使う。本文 ≥4.5:1 を必ず満たす。

## Typography

見出しは**幾何学サンセリフを極太〜超極太（800〜900）**で、超特大に。英字は Inter、和文は Noto Sans JP。本文は Noto Sans JP 500。グラデ／カラーブロック上では白 or 濃インクのどちらかを**コントラストで選ぶ**のがこの流派の作法です。

| Token | Size | Weight | Use |
|---|---|---|---|
| cover-title | 168px | 900 | 表紙の超特大見出し（白） |
| kpi-number | 320px | 900 | グラデヒーロー数値 |
| statement-title | 104px | 900 | 宣言文・CTA見出し |
| slide-title | 64px | 800 | スライド見出し |
| quote | 60px | 800 | 引用／ハイライト |
| card-title | 30px | 800 | カードタイトル |
| lead | 26px | 500 | リード文 |
| body | 20px | 500 | 本文 |
| footer | 15px | 700 | フッター（トラッキング広め） |

**原則**: 1スライドに支配的な見出し／数値は1つ。強調は色（ピル・バッジ・カラーブロック）で示し、`background-clip:text` のグラデ文字は使わない（見出しは**単色ベタ**）。

**和文代替フォント**: Inter 未解決時は Noto Sans JP / Hiragino Kaku Gothic ProN / Yu Gothic。PPTX 側で Arial フォールバックになる前提で太さ（800〜900）を選ぶ。

## Layout & Grid

台紙 1920×1080、マージン 104px、12カラム・ガター28px。表現的だが構造は単純に保ち、**1スライド1フォーカス**。グラデ面はフルブリード（端まで）。装飾（ブロブ・シェイプ）は必ず**内容の背面・低opacity・1モチーフ**に限定。角丸は大きめ（36〜56px、ピルは full）で柔らかく弾むトーン。情報密度は **low**（魅せ重視）。

## Slide Layouts

- **cover（署名）**: pink→violet→blue グラデ全面＋ブロブ＋浮遊シェイプ＋白の超特大見出し＋ピルキッカー。
- **statement**: グラデ全面に宣言文1本のみ。白文字は濃部に。
- **feature-cards**: 3枚のカラーブロックカード（各カード別グラデ）。
- **big-number**: 巨大グラデ数値1つ＋ラベル＋短い説明。
- **gallery-grid**: 2×2 のビビッドタイル。色のリズムで魅せる。
- **quote**: 濃インク地に大きな引用／ハイライト＋話者ピル。
- **closing**: 表紙と対のグラデ全面＋CTAボタン（lime 塗り）＋ハンドル。

## Elevation & Depth

影は色付きで濃く拡散（`0 30px 70px rgba(120,40,200,0.35)` 程度）。深度は**重なり**（ブロブ→カード→見出しの3層）と**色の前後関係**で出す。ブロブはぼかし（blur 40〜60px）で背面に。カードは大角丸＋色影で浮かせる。フラットではなく、レイヤードで楽しい奥行き。

## Shapes

大きな角丸（36〜56px、ピルは full）。図形言語は**有機ブロブ**（`border-radius` の非対称指定）、円・角丸矩形・三角の**浮遊シェイプ**、ピル。ブロブとシェイプは低opacityで背面に数個、回転を付けて散らす。アイコンは**インラインSVG**（単色 or 白、絵文字は不可）。

## Components

- **cover-title / statement-title**: 白・900・超特大。グラデ濃部に左寄せ or 中央。
- **kicker**: 白・800・トラッキング広め（ラベル/アイブロー）。
- **pill**: 白塗り＋deep-violet 文字の角丸ピル（グラデ上のラベル）。
- **card / tile**: ビビッドグラデ塗りのカラーブロック。大角丸＋色影。タイトルは白 or 濃インク（背景の明度で選ぶ）。
- **kpi-number**: 超特大数値。グラデ濃部に白、または明地に濃インク。
- **cta**: lime 塗り＋濃インク文字の角丸ボタン。
- **footer**: `ページ番号 ｜ セクション` 左、`ハンドル/URL` 右、muted-on-dark。

## Motion

構成上のリズムは「グラデ濃淡の振り」と「ブロブの配置」で作る。PPTX ではアニメーションは限定的（[HTML_INPUT_SPEC](../HTML_INPUT_SPEC.md) §9.4：CSS animation/transition は書き出されない）。動きはレイアウトの静的な勢い（傾き・はみ出し・対角構図）で表現する。

## Do's and Don'ts

- **Do**: グラデはビビッドに、フルブリードで。pink→violet→blue / cyan→violet のファミリーに統一。
- **Do**: 見出し／数値は1スライド1つだけ、超特大・極太で。
- **Do**: 白文字はグラデ濃部に。明色（cyan/lime）上は濃インク文字。本文 ≥4.5:1 を死守。
- **Do**: ブロブ・浮遊シェイプは背面・低opacity・1モチーフで。
- **Do**: 重要度は塗りピル／バッジ／カラーブロックで。
- **Don't**: グラデの明部に白の本文を載せない（コントラスト崩壊）。
- **Don't**: `background-clip:text` のグラデ文字を使わない（見出しは単色ベタ）。
- **Don't**: 1スライドに見出しを2つ以上、フォーカスを散らさない。
- **Don't**: 絵文字を機能アイコンに使わない（インラインSVG）。border-left の色ラインで重要度を示さない。

## Agent Prompt Guide

> **Quick palette**: pink `#ff4d9d` → violet `#8a4dff` → blue `#4d7cff`（メイン135°）／ cyan `#00d4ff` → deep-violet `#7b2ff7`（セカンダリ）／ ink `#120a24` ／ lime `#caff4d`（CTA）。Font: Inter 800–900 + Noto Sans JP。角丸大・ピル full。
>
> **Prompt**: 「Canva 風のマキシマリスト・グラデで作って。表紙は pink(#ff4d9d)→violet(#8a4dff)→blue(#4d7cff) の135°フルブリードグラデに、有機ブロブと浮遊シェイプを低opacityで背面に散らし、中央〜下に超特大の極太見出し（白・Inter 900）＋白ピルのキッカー。各スライドはフォーカス1つ。フィーチャーは3枚のカラーブロックカード（カードごとに別グラデ）、数値は巨大なグラデヒーロー数値1つ。WCAG AA厳守で、白文字はグラデの濃い側に置き、本文は背景に対し4.5:1以上。cyan/lime の明色上には白でなく濃インク(#1a0f33)文字。アイコンはインラインSVG（絵文字禁止）、見出しはグラデclipではなく単色ベタ。CTAは lime(#caff4d) 塗り＋濃インク文字のピル。フッターは『ページ｜セクション …… @handle』。」

## HTML→PPTX Notes

- **グラデ／ブロブ／ぼかしシェイプはラスタ化されやすい**（[HTML_INPUT_SPEC](../HTML_INPUT_SPEC.md) §8.4）。装飾としては許容。**見出し・本文・数値・ピルのテキストは必ず実テキストで別レイヤー（背面グラデの上）**に置き、編集可能性を確保する。
- グラデは標準 `linear-gradient(...)` のみ。`background-clip:text` は非対応のため使わない（見出しは単色 `color`）。
- ブロブは `border-radius` の非対称指定＋ `filter: blur()`（ラスタ化前提）。浮遊シェイプは単色矩形/円/三角はネイティブ図形に残りやすい。
- カラーブロックカードの単純グラデ矩形・ピル・角丸矩形はネイティブ図形になりやすい。
- アイコン・図はインラインSVG（**リテラル16進**で色指定、`var()` は使わない）。`table/tr/td` は使わず div＋flex/grid。

## Iteration Guide

1. まず表紙の“掴み”（フルグラデ＋ブロブ＋超特大見出し）を決める。
2. グラデファミリー（pink→violet→blue / cyan→violet）を固定し、全スライドで一貫させる。
3. 各スライドのフォーカスを1つに絞る（見出し or 数値 or 引用）。
4. 白文字を置く前にローカル背景のコントラストを確認（濃部=白、明部=濃インク）。
5. 装飾を足したくなったら、まず1モチーフ・背面・低opacityで足せるか検討する。

## References / 参考にした流派・出典

- **参考にした流派**: Canva のグラデーション系テンプレート（[Canva gradient templates](https://www.canva.com/templates/s/gradient/)）と、2026年の maximalist / gradient（Y2K リバイバル）トレンド。鮮烈なグラデ・カラーブロッキング・超特大見出し・抽象ブロブという設計言語を抽出。
- **起点（Slideland 経由の #カラフル/#ダイナミック 系）**: [DeNA 統合報告書 2025](https://asset.dena.com/files/jp/ir/pdf/report/00_2025.pdf)（カラフル・ダイナミックなグラデ表現の参照点）。配色のエネルギーと面の使い方を研究し、**内容は複製せず**オリジナルのフィクションのブランド・イベント・コピー・図解で再構築。
- **視覚的な署名**: pink→violet→blue のフルブリードグラデ表紙＋抽象ブロブ＋超特大白見出し / カラーブロックのフィーチャーカード / 巨大グラデヒーロー数値 / ビビッドピル。

> 注: 実在ブランド・実スライドの文言・ロゴ・図版は複製していません。配色のエネルギー・余白・タイポの勢い・レイアウトのエッセンスのみ抽出し、フィクションのクリエイティブブランドとして構成しています。比較ビューア（[`../_viewer/index.html`](../_viewer/index.html)）で確認できます。
