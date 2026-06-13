---
version: alpha
name: Pop Friendly (ポップ・フレンドリー)
description: 日本の親しみやすい消費者向けサービスの会社紹介に代表される、明るいミント/ターコイズ＋黒＋黄マーカーのポップで元気なスタイル。分割表紙（鮮やかな色面＋写真）、白の角丸カード、回転した縦キッカー、角括弧の見出しラベル、ティールのシェブロン・フロー、キーワードの黄色マーカー。親しみやすいが雑にならない“プロフェッショナルなポップ”。

meta:
  archetype: pop-friendly
  origin: 日本の親しみやすい消費者向けサービスの会社紹介/採用デッキ（ポップ・元気・高コントラスト・角丸）
  locale: ja
  density: medium
  mood: [friendly, energetic, approachable, warm, optimistic]
  tags:
    style: [pop, easy-natural, clear]
    docType: [company-intro, recruit, service]
    industry: [consumer, food, lifestyle, hr]
    color: [green, two-tone, colorful]

canvas:
  width: 1920px
  height: 1080px
  aspectRatio: "16:9"
  exportWidthIn: 13.333
  exportHeightIn: 7.5
  background: "{colors.canvas}"
  margin: 80px

grid:
  columns: 12
  gutter: 24px
  margin: 80px
  baseline: 8px

colors:
  primary: "#14dcc6"
  primary-deep: "#0bb6a4"
  ink: "#15171a"
  canvas: "#f4f6f7"
  card: "#ffffff"
  muted: "#646b78"
  hairline: "#e4e7ea"
  marker: "#ffe24d"
  warm: "#ff9e6b"
  on-primary: "#15171a"

typography:
  cover-title:
    fontFamily: "Inter, 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', sans-serif"
    fontSize: 132px
    fontWeight: 900
    lineHeight: 0.98
    letterSpacing: -0.01em
  kicker:
    fontFamily: "Inter, 'Noto Sans JP', sans-serif"
    fontSize: 18px
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: 0.04em
  vlabel:
    fontFamily: "'Noto Sans JP', Inter, sans-serif"
    fontSize: 15px
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: 0.12em
  slide-heading:
    fontFamily: "'Noto Sans JP', Inter, sans-serif"
    fontSize: 40px
    fontWeight: 800
    lineHeight: 1.3
  statement:
    fontFamily: "'Noto Sans JP', Inter, sans-serif"
    fontSize: 54px
    fontWeight: 800
    lineHeight: 1.45
  section-label:
    fontFamily: "Inter, 'Noto Sans JP', sans-serif"
    fontSize: 24px
    fontWeight: 800
    lineHeight: 1.25
  lead:
    fontFamily: "'Noto Sans JP', Inter, sans-serif"
    fontSize: 24px
    fontWeight: 400
    lineHeight: 1.65
  body:
    fontFamily: "'Noto Sans JP', Inter, sans-serif"
    fontSize: 19px
    fontWeight: 400
    lineHeight: 1.75
  chev-label:
    fontFamily: "'Noto Sans JP', Inter, sans-serif"
    fontSize: 24px
    fontWeight: 800
    lineHeight: 1.2
  kpi-number:
    fontFamily: "Inter, 'Noto Sans JP', sans-serif"
    fontSize: 100px
    fontWeight: 900
    lineHeight: 1.0
    letterSpacing: -0.02em
  kpi-label:
    fontFamily: "'Noto Sans JP', Inter, sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.4
  page-number:
    fontFamily: "Inter, sans-serif"
    fontSize: 16px
    fontWeight: 700
    lineHeight: 1

rounded:
  none: 0px
  sm: 10px
  md: 18px
  lg: 28px
  full: 9999px

spacing:
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  margin: 80px

layouts:
  cover:
    description: "★署名。左右分割。左＝鮮やかなミント色面に line-art ロゴ＋黒の超極太大文字見出し＋日付。右＝写真 or 親しみイラスト/暖色グラデ。"
    uses: [logo, cover-title, page-number]
  purpose:
    description: "薄灰地に白の大きな角丸カード。中央に『LABEL｜和ラベル』＋大きな太字の宣言文。左端に回転した縦キッカー。"
    uses: [vlabel, section-label, statement]
  content:
    description: "薄灰地＋白角丸カード。上に角括弧の見出しラベル [テーマ]＋太字見出し。本文のキーワードに黄色マーカー。左端に縦キッカー、左下にページ番号。"
    uses: [vlabel, kicker, slide-heading, marker, page-number]
  process:
    description: "ティールのシェブロン・フロー（登録→…→運営）。各シェブロンは明→濃のグラデ。下に各ステップ説明、キーワードに黄色マーカー。"
    uses: [chev-label, marker]
  value-grid:
    description: "2×2 の親しみカード。アイコン（line-art）＋section-label（英＋和）＋本文。"
    uses: [section-label, body]
  kpi:
    description: "大きくて元気な数値カード3〜4枚。kpi-number（黒）＋ラベル。アクセントに primary の面。"
    uses: [kpi-number, kpi-label]
  closing:
    description: "ミント全面＋黒の大見出し＋黒の角丸CTAボタン。表紙と対。"
    uses: [cover-title, cta]

components:
  logo:
    typography: "{typography.section-label}"
    textColor: "{colors.ink}"
  cover-title:
    typography: "{typography.cover-title}"
    textColor: "{colors.ink}"
  vlabel:
    typography: "{typography.vlabel}"
    textColor: "{colors.muted}"
  bracket-label:
    typography: "{typography.kicker}"
    textColor: "{colors.ink}"
  slide-heading:
    typography: "{typography.slide-heading}"
    textColor: "{colors.ink}"
  marker:
    backgroundColor: "{colors.marker}"
    textColor: "{colors.ink}"
  card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.lg}"
    padding: 56px
  chevron:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.ink}"
  pill:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: 8px 20px
  cta:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    padding: 18px 40px
  page-number:
    typography: "{typography.page-number}"
    textColor: "{colors.muted}"

components-note: "重要度は塗りチップ/黄色マーカー/バッジで示す（色付き左縦ライン=border-left は使わない）。"
---

# Pop Friendly (ポップ・フレンドリー)

## Overview

日本の親しみやすい消費者向けサービス（会社紹介・採用デッキ）に典型的な、**明るく元気で、でも雑にならない“プロフェッショナルなポップ”**スタイルです。鮮やかなミント/ターコイズの色面と黒文字の高コントラスト、黄色マーカーによるキーワード強調、白の角丸カードで、**親しみと信頼を両立**します。

署名要素は4つ。(1) **左右分割の表紙**（鮮やかな色面＋写真/イラスト）と黒の超極太大文字、(2) **角括弧の見出しラベル**`[テーマ]`＋太字Gothic見出し、(3) **キーワードの黄色マーカー**、(4) **ティールのシェブロン・フロー**。非専門家の聴衆、toC サービス、採用・カルチャーデッキに最適です。

**Key Characteristics:**
- 表紙＝左右分割。鮮やかミント色面＋黒の超極太大文字＋写真/イラスト。
- 薄灰地に**白の大きな角丸カード**を載せる。
- 本文の要点は**黄色マーカー**（下線やボールドより“手書き感”）。
- 図解は**ティールのシェブロン・フロー**や2×2の親しみカード。
- 左端に**回転した縦キッカー**、左下に `n/総数` のページ番号。
- 高コントラスト（黒×ミント×黄）だが、角丸と余白で柔らかく。

## Colors

- **Primary / Mint** ({colors.primary} — #14dcc6): 署名色。色面・シェブロン・pill・表紙。
- **Primary-deep** ({colors.primary-deep} — #0bb6a4): シェブロンのグラデ濃端。
- **Ink** ({colors.ink} — #15171a): 見出し・本文・ミント上の文字（黒）。
- **Canvas** ({colors.canvas} — #f4f6f7): 薄灰の地。
- **Card** ({colors.card} — #ffffff): 角丸カード。
- **Marker** ({colors.marker} — #ffe24d): キーワードの黄色マーカー。
- **Warm** ({colors.warm} — #ff9e6b): 第2ポップ色（イラスト/アクセント、控えめに）。
- **Muted** ({colors.muted} — #646b78): 縦キッカー・ページ番号・補助。

> コントラスト: ink/mint ≈ 9:1（AAA）。ink/canvas ≈ 15:1。黄マーカー上の ink ≈ 12:1。色は明るいが**文字は必ず黒**で可読性を確保。

## Typography

見出しは**極太（800〜900）の幾何学サンセリフ**（英語大文字）＋**太字 Gothic**（Noto Sans JP）。明朝は使わない。本文は 400。要点は**黄色マーカー**で（色下線やマーカー風 background）。

| Token | Size | Weight | Use |
|---|---|---|---|
| cover-title | 132px | 900 | 表紙の超極太大文字（黒・英大文字） |
| kpi-number | 100px | 900 | 数値ハイライト |
| statement | 54px | 800 | 中央の宣言文 |
| slide-heading | 40px | 800 | 見出し |
| chev-label | 24px | 800 | シェブロンのラベル |
| body | 19px | 400 | 本文 |

**原則**: 見出しは極太・黒。強調は黄マーカー。色は明るくても文字は黒で締める。

## Layout & Grid

台紙 1920×1080、マージン 80px、12カラム。コンテンツは「薄灰地 → 白の大きな角丸カード → 中身」。左端に回転縦キッカー、左下に `n/総数`。角丸は大きめ（18〜28px）。情報密度は **medium**。

## Slide Layouts

- **cover（署名）**: 左右分割。ミント色面＋黒大文字＋写真/イラスト。
- **purpose**: 白角丸カードに中央寄せの宣言文＋`LABEL｜和`。
- **content**: 角括弧ラベル＋太字見出し＋黄マーカー本文。
- **process**: ティールのシェブロン・フロー＋黄マーカー。
- **value-grid**: 2×2 の親しみカード（line-art アイコン）。
- **kpi**: 元気な大きい数値カード。
- **closing**: ミント全面＋黒見出し＋黒CTA。

## Elevation & Depth

影はやわらかく（`0 14px 40px rgba(20,30,40,.06)`）。白カードを薄灰地に浮かせる。立体は控えめ、角丸と余白で“やさしさ”を出す。ミント色面はベタ塗り（フラット）。

## Shapes

大きな角丸（18〜28px、pill/ボタンは full）。シェブロンは矢羽根（SVG）。アイコンは**line-art（黒・一定線幅）**で親しみを出す。イラストはフラット＆シンプル。

## Components

- **cover-title**: 黒・900・英大文字・超大。
- **bracket-label**: `[テーマ]` の角括弧ラベル＋太字見出し。
- **marker**: キーワードの黄色マーカー（`linear-gradient(transparent 58%, #ffe24d 58%)`）。
- **chevron**: ティール明→濃グラデの矢羽根、黒ラベル。
- **card**: 白・大角丸・柔らかい影。
- **pill / cta**: ミント pill、黒の角丸CTA。
- **vlabel**: 左端の回転縦キッカー（muted）。
- **page-number**: `n/総数`、左下、muted。

## Do's and Don'ts

- **Do**: 表紙は鮮やかミント色面＋黒の超極太大文字で“元気に掴む”。
- **Do**: 要点は黄色マーカーで（手書き感の強調）。
- **Do**: 白の大きな角丸カードで内容を“やさしく”囲う。
- **Do**: ミント上も文字は黒で可読性を確保。
- **Don't**: 文字をミントや黄の上で薄い色にしない（必ず黒）。
- **Don't**: border-left の色ラインで重要度を示さない（マーカー/塗りで）。
- **Don't**: 角を尖らせない・色を濁らせない（明るく・クリーンに）。

## Agent Prompt Guide

> **Quick palette**: mint `#14dcc6` ／ ink(黒) `#15171a` ／ canvas `#f4f6f7` ／ marker(黄) `#ffe24d`。Font: Inter + Noto Sans JP（見出し800〜900）。角丸大。
>
> **Prompt**: 「日本の親しみやすいtoCサービスのポップ・フレンドリー会社紹介で作って。表紙は左右分割＝左が鮮やかなミント(#14dcc6)色面に line-art ロゴ＋黒の超極太大文字(英大文字)＋日付、右が写真 or フラットイラスト。本文は薄灰(#f4f6f7)地に白の大きな角丸カードを載せ、見出しは角括弧ラベル[テーマ]＋太字Gothic。本文の要点は黄色マーカー(#ffe24d)で強調。図解はティール明→濃グラデのシェブロン・フローと2×2の親しみカード(line-artアイコン)。ミントや黄の上でも文字は必ず黒。左端に回転した縦キッカー、左下に『n/総数』のページ番号。角丸は大きめ、明るくクリーンに。」

## HTML→PPTX Notes

- 色面・角丸カード・pill・シェブロン（SVG）・数値はネイティブ図形/テキストになる。
- **黄色マーカー**は `linear-gradient(transparent 58%, #ffe24d 58%)` をテキスト背景に。PPTX ではハイライト/ラスタになる場合があるが、テキストは実テキストのまま残る（`background-clip:text` は使わない）。
- 表紙右の写真は CORS セーフ or data URL。写真がなければフラットイラスト（インライン SVG）で代替（ベクター保持）。
- シェブロンは SVG polygon で（clip-path は PPTX 非対応のため使わない）。図解の表は div＋flex で。

## Iteration Guide

1. まず表紙の“掴み”（ミント色面＋黒大文字＋写真/イラスト）を決める。
2. 黄マーカーは1スライド2〜3語まで（多用すると散らかる）。
3. 図解は process(シェブロン) / value-grid / kpi の型に当てはめる。
4. 第2色（warm）を足すのはイラスト/アクセントのみ。文字色は黒を保つ。

## References / 参考にした流派・出典

- **参考にした流派**: 日本の親しみやすい消費者向けサービスの会社紹介/採用デッキ（ポップ・元気・高コントラスト・角丸・黄マーカー）。
- **視覚的な署名**: 分割表紙（鮮やか色面＋写真）／黒の超極太大文字／角括弧の見出しラベル／キーワードの黄色マーカー／ティールのシェブロン・フロー。
- **起点（Slideland 経由の実スライド・実在企業の公開デッキ）**: [akippa株式会社 Company Deck](https://speakerdeck.com/akippa/akippazhu-shi-hui-she-company-deck)（#会社紹介資料 #自動車 #グリーン #ポップ）。実デッキの設計言語（鮮やか色面の分割表紙・黒大文字・角括弧ラベル・黄マーカー・シェブロン・フロー）を研究し、**内容は複製せず**オリジナルのブランド・コピー・図解で再構築。

> 注: 実スライドの文言・写真・ロゴ・図版は複製していません。配色・余白・タイポ・レイアウトのエッセンスのみ抽出。比較ビューア（[`../_viewer/index.html`](../_viewer/index.html)）で実物と並べて確認できます。
