---
version: alpha
name: Integrated Report (統合報告書 / エディトリアル・コーポレート)
description: 上場企業の統合報告書（Integrated Report）に代表される、価値創造ストーリーをエディトリアルに語る流派。鮮やかなブランドレッドのアクセント、フルブリードの写真（空・地平線・乗り物のトーングラデ）を主役に、清潔な章構成・価値創造モデル（インプット→事業→アウトカム）・KPIハイライト・ESG/マテリアリティを一貫した型で提示する。信頼感があり、雄大で、物語性のあるプレミアム・コーポレート。和文ゴシック＋章ラベルに細い明朝アクセント、財務数値は等幅数字。

meta:
  archetype: integrated-report
  origin: 上場企業の統合報告書（価値創造プロセス／トップメッセージ／マテリアリティ／ESGデータ）／航空・モビリティ・製造業のコーポレートレポートの作法／GRI・IIRC 統合報告フレームワーク
  locale: ja
  density: medium
  mood: [trustworthy, expansive, story-led, premium, editorial]
  tags:
    style: [trust, premium, editorial, clear]
    docType: [integrated-report, ir, company-intro, sustainability]
    industry: [aviation, mobility, manufacturing, infrastructure, finance]
    color: [red, navy, photo, two-tone]

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
  brand: "#c8102e"
  brand-deep: "#9c0c24"
  navy: "#16284b"
  navy-deep: "#0c1530"
  canvas: "#ffffff"
  ink: "#1a1a1a"
  muted: "#6b6b6b"
  hairline: "#e4e4e4"
  sky: "#bcd8f5"
  sky-tint: "#eef4fb"
  surface: "#f6f7f9"
  on-dark: "#ffffff"
  on-brand: "#ffffff"

typography:
  chapter-label:
    fontFamily: "'Noto Serif JP', Georgia, 'Times New Roman', serif"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0.16em
  kicker:
    fontFamily: "'Noto Sans JP', Inter, sans-serif"
    fontSize: 18px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0.14em
  cover-title:
    fontFamily: "'Noto Sans JP', Inter, sans-serif"
    fontSize: 96px
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: -0.02em
  slide-title:
    fontFamily: "'Noto Sans JP', Inter, sans-serif"
    fontSize: 42px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: -0.005em
  lead:
    fontFamily: "'Noto Sans JP', Inter, sans-serif"
    fontSize: 26px
    fontWeight: 400
    lineHeight: 1.7
  body:
    fontFamily: "'Noto Sans JP', Inter, sans-serif"
    fontSize: 19px
    fontWeight: 400
    lineHeight: 1.75
  caption:
    fontFamily: "'Noto Sans JP', Inter, sans-serif"
    fontSize: 15px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0.02em
  kpi-number:
    fontFamily: "Inter, 'Noto Sans JP', sans-serif"
    fontSize: 88px
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: -0.02em
    fontFeature: "'tnum' 1, 'lnum' 1"
  kpi-label:
    fontFamily: "'Noto Sans JP', Inter, sans-serif"
    fontSize: 18px
    fontWeight: 500
    lineHeight: 1.4
  chapter-number:
    fontFamily: "Inter, 'Noto Sans JP', sans-serif"
    fontSize: 320px
    fontWeight: 800
    lineHeight: 0.8
    letterSpacing: -0.03em
    fontFeature: "'tnum' 1, 'lnum' 1"
  source:
    fontFamily: "'Noto Sans JP', Inter, sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
  footer:
    fontFamily: "'Noto Sans JP', Inter, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1
    fontFeature: "'tnum' 1"

rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 14px
  full: 9999px

spacing:
  xs: 8px
  sm: 14px
  md: 24px
  lg: 40px
  xl: 72px
  margin: 96px
  gutter: 24px

layouts:
  cover:
    description: "★署名レイアウト。フルブリードの写真プレースホルダ（空/地平線のトーングラデ linear-gradient(#bcd8f5,#eef4fb) もしくは moody dark linear-gradient(#16284b,#0c1530)）。下端に小さな kicker（英語ラベル）＋大きな日本語タイトル＋レポート年度。任意で最小限の地平線/航空機シルエットの SVG を重ねる。"
    uses: [photo-fill, kicker, cover-title, chapter-label]
  top-message:
    description: "トップメッセージ（会長/社長）。左に大きなリード文（価値創造の宣言）、右にポートレート・プレースホルダ（navy トーングラデ＋人物シルエット）。署名・役職を添える。"
    uses: [slide-title, lead, portrait, caption]
  value-creation:
    description: "★価値創造モデル。インプット（6つの資本）→ ビジネスモデル → アウトカム（提供価値）を div+flex の3カラムで、間をインライン SVG の矢印でつなぐ。中央のビジネスモデル枠を brand で強調。"
    uses: [slide-title, vc-column, vc-arrow, key-message-bar]
  kpi-highlights:
    description: "価値創造のKPIハイライト4枚。大きな数値（kpi-number）＋ラベル＋前年比 caption。写真帯（空グラデ）を上に敷く構図も可。"
    uses: [slide-title, kpi-card, kpi-number]
  materiality:
    description: "ESG / マテリアリティ。清潔なカード（塗り面＋ハイ ライン罫線、色付き左縦ラインは使わない）で重要課題を E/S/G 別に整理。各カードに見出し＋本文＋関連 SDGs 番号チップ。"
    uses: [slide-title, esg-card, tag-chip, key-message-bar]
  chapter:
    description: "章扉。brand-red もしくは navy のフルブリード地に巨大な章番号（半透明白）＋章タイトル＋一言サマリ。次章への導入。"
    uses: [chapter-number, chapter-label, slide-title]
  closing:
    description: "締め。データ要約／免責（将来見通しに関する注意）＋フッター。写真の細い帯で締める。"
    uses: [slide-title, key-message-bar, source-footnote, photo-strip]

components:
  photo-fill:
    backgroundColor: "{colors.sky-tint}"
  kicker:
    typography: "{typography.kicker}"
    textColor: "{colors.brand}"
  chapter-label:
    typography: "{typography.chapter-label}"
    textColor: "{colors.brand}"
  cover-title:
    typography: "{typography.cover-title}"
    textColor: "{colors.on-dark}"
  slide-title:
    typography: "{typography.slide-title}"
    textColor: "{colors.ink}"
  lead:
    typography: "{typography.lead}"
    textColor: "{colors.ink}"
  key-message-bar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: 18px 26px
  kpi-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 32px
  kpi-number:
    typography: "{typography.kpi-number}"
    textColor: "{colors.brand}"
  kpi-label:
    typography: "{typography.kpi-label}"
    textColor: "{colors.muted}"
  vc-column:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 28px
  vc-business:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.on-brand}"
    rounded: "{rounded.lg}"
    padding: 28px
  esg-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 30px
  tag-chip:
    typography: "{typography.caption}"
    backgroundColor: "{colors.sky-tint}"
    textColor: "{colors.navy}"
    rounded: "{rounded.full}"
    padding: 5px 14px
  portrait:
    backgroundColor: "{colors.navy}"
    rounded: "{rounded.lg}"
  caption:
    typography: "{typography.caption}"
    textColor: "{colors.muted}"
  chapter-number:
    typography: "{typography.chapter-number}"
    textColor: "{colors.on-dark}"
  source-footnote:
    typography: "{typography.source}"
    textColor: "{colors.muted}"
  footer:
    typography: "{typography.footer}"
    textColor: "{colors.muted}"

components-note: "重要度は塗り面／バッジ／写真の主従で示す（色付き左縦ライン=border-left は使わない）。白文字は dark/brand 面の上でのみ使う。"
---

# Integrated Report (統合報告書 / エディトリアル・コーポレート)

## Overview

統合報告書（Integrated Report）は、財務情報と非財務情報（ESG・ガバナンス・人的資本）を**ひとつの価値創造ストーリー**として束ねる、上場企業のフラッグシップ媒体です。決算説明資料（Japan IR）が「業績の事実を取り違えなく速く伝える」ことに最適化するのに対し、統合報告書は**「私たちは何の資本を使い、どんな事業を通じて、社会にどんな価値を生むのか」**という長期の物語を、写真とエディトリアルな誌面設計で語ります。

この流派の中核は3つ。(1) **写真が主役** — フルブリードの空・地平線・乗り物のトーングラデを大きく敷き、その上に最小限のコピーを載せる。誌面が「企業の世界観」を最初に伝える。(2) **価値創造モデルの可視化** — 6つの資本（インプット）→ ビジネスモデル → 提供価値（アウトカム）を矢印でつなぐ図が必ず登場し、報告書全体の背骨になる。(3) **章立てのエディトリアル構造** — 表紙 → トップメッセージ → 価値創造 → KPI → ESG/マテリアリティ → 章扉 → 締め、という雑誌的な流れで、章ラベルに細い明朝を効かせて格を出す。

色は鮮やかなブランドレッド（信頼・情熱・ブランドの旗）と深いネイビー（誠実・夜空・支柱）の二軸。白いキャンバスと潤沢な余白がプレミアム感を、写真の青空トーンが「雄大さ・公共性」を担います。本定義では架空の航空・モビリティ企業「**SORAMICHI 空道 航空**」を題材に、実在企業の文言・ロゴ・写真を一切複製せずに再構築します。

**Key Characteristics:**
- 写真が主役。フルブリードの空/地平線/夜空のトーングラデ（`linear-gradient(#bcd8f5,#eef4fb)` / `linear-gradient(#16284b,#0c1530)`）に最小限のコピーを載せる。
- ブランドレッド `#c8102e` がアクセントの旗、ネイビー `#16284b` が支柱。白地＋潤沢な余白でプレミアムに。
- 価値創造モデル（インプット→事業→アウトカム）を div+flex ＋ インライン SVG の矢印で必ず提示する。
- KPIハイライトは大きな数値＋前年比。財務数値は等幅数字（tabular-nums）。
- ESG/マテリアリティは清潔なカードで（色付き左縦ライン=border-left は使わない）。
- 章ラベル・章タイトルに細い明朝（Noto Serif JP）アクセントを効かせ、雑誌的な格を出す。
- 章扉は brand-red か navy のフルブリード＋巨大な章番号（半透明白）。
- フッターは `セクション名 …… ©Company` ＋ ページ番号。白文字は dark/brand 面の上でのみ。

## Colors

- **Brand / Red** ({colors.brand} — #c8102e): ブランドの旗。kicker・章ラベル・KPI 数値・価値創造の中核枠・章扉。情熱と信頼。**1スライドの主アクセント**。
- **Brand-deep** ({colors.brand-deep} — #9c0c24): 赤面のグラデ下端・押さえの濃赤。
- **Navy** ({colors.navy} — #16284b): 支柱。ポートレート地・夜空写真の上端・タグチップ文字・章扉の代替地。
- **Navy-deep** ({colors.navy-deep} — #0c1530): 夜空グラデの下端・最も深い面。
- **Canvas** ({colors.canvas} — #ffffff): 本文地。誌面の余白を支える純白。
- **Ink** ({colors.ink} — #1a1a1a): 本文・スライドタイトル・リード文。ほぼ黒の濃墨。
- **Muted** ({colors.muted} — #6b6b6b): キャプション・脚注・前年比・補助テキスト。
- **Hairline** ({colors.hairline} — #e4e4e4): 罫線・カード境界・区切り線。
- **Sky** ({colors.sky} — #bcd8f5): 空写真グラデの上端（明るい青）。
- **Sky-tint** ({colors.sky-tint} — #eef4fb): 写真プレースホルダの淡端・タグチップの地。
- **Surface** ({colors.surface} — #f6f7f9): カード・キーメッセージ帯・価値創造カラムの地。
- **On-dark / On-brand** (#ffffff): dark/brand 面の上の白文字。

> コントラスト: ink/canvas ≈ 17:1（AAA）。on-dark 白／navy ≈ 11:1（AAA）。on-brand 白／brand `#c8102e` ≈ 5.0:1（AA）。muted/canvas ≈ 5.0:1（本文最小 4.5:1 を満たす）。tag-chip navy 文字／sky-tint 地 ≈ 9:1。白文字は **dark/brand 面の上でのみ** 使用する。

## Typography

和文ゴシック（**Noto Sans JP**、英数字は **Inter**）を基本に、章ラベル・章タイトルだけ細い明朝（**Noto Serif JP**）を差して「報告書の格」を出すのがこの流派の口調です。タイトルは 700〜800 の大きなエディトリアル・スケール、本文は 400・行間 1.7 以上でゆったり。KPI・財務数値には**等幅数字**（`font-feature-settings: 'tnum' 1, 'lnum' 1`）を効かせ、桁を揃えます。

| Token | Size | Weight | Use |
|---|---|---|---|
| cover-title | 96px | 800 | 表紙の大見出し（写真上・白 or ink） |
| chapter-number | 320px | 800 | 章扉の巨大番号（半透明白） |
| kpi-number | 88px | 800 | KPIハイライト数値（brand・tnum） |
| slide-title | 42px | 700 | スライド見出し（ink） |
| lead | 26px | 400 | トップメッセージのリード文 |
| chapter-label | 20px | 600 | 章ラベル（明朝・brand・トラッキング広め） |
| kicker | 18px | 700 | アイブロー英語ラベル（brand） |
| body | 19px | 400 | 本文 |
| caption | 15px | 500 | 写真キャプション・前年比・補助 |
| source / footer | 13–14px | 400–500 | 出典・免責・フッター |

**原則**: 本文は19px以上・行間1.7以上。タイトルは大きく余白を活かす。章ラベルと章タイトルにのみ明朝を使い、本文・データには使わない。KPI・財務・年度の数字は必ず tabular-nums。強調は太字または brand 色で行い、下線やマーカーは使わない。

> 和文代替フォント: Noto Sans JP 未解決時は Yu Gothic / Hiragino Kaku Gothic、Noto Serif JP 未解決時は Yu Mincho / Hiragino Mincho にフォールバックする前提でフォントスタックを組む。

## Layout & Grid

台紙 1920×1080。マージン **96px**（統合報告書らしい誌面の広い余白）、12カラム・ガター24px、8pxベースライン。写真スライド（表紙・章扉・トップメッセージ）は**フルブリード**でマージンを無視し、コピーだけが安全域に入ります。コンテンツスライドは上から「**kicker → スライドタイトル → キーメッセージ帯／本文（図・カード）→ 出典脚注／フッター・ページ番号**」の縦構成を基本とします。

情報密度は **medium**。IRより図解は軽く写真と余白に寄せ、Apple Keynote ほど削ぎ落とさず「読み物としての厚み」を残します。1スライド1コンセプト＝「その見開きで伝える価値創造のメッセージ1つ」を、写真・図・KPI のいずれかで裏付けます。

## Slide Layouts

- **cover（署名）**: フルブリードの空 or 夜空グラデ写真。下端に kicker（英）＋大きな日本語タイトル＋レポート年度。最小限の地平線/機体シルエット SVG。
- **top-message**: 左に大きなリード文（価値創造の宣言）、右に navy トーンのポートレート・プレースホルダ。署名・役職。
- **value-creation（背骨）**: インプット（6つの資本）→ ビジネスモデル → アウトカムの3カラムを矢印でつなぐ。中核を brand で強調。
- **kpi-highlights**: 大きな数値4枚＋前年比。上に空グラデの帯を敷く構図も可。
- **materiality（ESG）**: E/S/G の清潔なカード＋関連 SDGs 番号チップ。色付き左縦ラインは使わない。
- **chapter（章扉）**: brand-red or navy のフルブリード＋巨大な章番号（半透明白）＋章タイトル。
- **closing**: データ要約／免責＋写真の細い帯＋フッター。

## Elevation & Depth

影は**やわらかく最小限**（`0 10px 30px rgba(22,40,75,.08)` 程度）。階層は主に「白地 vs 淡い surface 面 vs 写真のフルブリード」の**トーンの差**でつくります。カードは「淡灰の面＋細い hairline 罫線」で、**色付きの左縦ライン（border-left アクセント）は使わない** — 重要度は面の塗り（brand / navy）かバッジ／写真の主従で示します。写真プレースホルダは linear-gradient で奥行きを出し、その上のコピーは安全域に置いて可読性を確保します。

## Shapes

角丸は小さめ〜中（4〜14px）で実務的かつ上品に。写真・章扉は角丸なしのフルブリード矩形、カード・KPI・ポートレートは中角丸（14px）、チップは full。価値創造モデルの矢印・地平線・機体シルエットは**インライン SVG**（`path` / `polygon` / `line`）で最小限・単色に。多色イラストや 3D 影付きグラフ、過剰なグラデは避け、写真と余白に語らせます。

## Components

- **photo-fill（写真プレースホルダ）**: フルブリードの `linear-gradient`。空＝`linear-gradient(#bcd8f5,#eef4fb)`、夜空/moody＝`linear-gradient(#16284b,#0c1530)`。上に SVG シルエットやコピーを重ねる。
- **kicker / chapter-label**: アイブロー。kicker は brand のゴシック（英）、chapter-label は brand の明朝（トラッキング広め）。
- **cover-title**: 表紙の大見出し。写真上に白（dark 写真）または ink（明るい空写真の安全域）。
- **key-message-bar**: surface 地・ink 文字・角丸8px。タイトル直下に**その章の結論を1文**で。
- **kpi-card / kpi-number**: 白カード＋細罫。kpi-number は brand・等幅。ラベル＋前年比 caption。
- **vc-column / vc-business**: 価値創造の3カラム。両端は surface、中核（ビジネスモデル）は brand 塗り＋白文字。
- **esg-card**: E/S/G の清潔なカード（surface＋細罫）。見出し＋本文＋ tag-chip。
- **tag-chip**: 関連 SDGs 番号など。sky-tint 地＋navy 文字の full ピル。
- **portrait**: navy トーングラデのポートレート・プレースホルダ＋人物シルエット SVG。
- **chapter-number**: 章扉の巨大番号。半透明白（`rgba(255,255,255,.16)`）。
- **source-footnote / footer**: 下端固定、muted。出典は「出典: …」、フッターは `セクション名 …… ©SORAMICHI` ＋ ページ番号。

## Motion

PPTX 書き出しではアニメーションは限定的です（[HTML_INPUT_SPEC](../HTML_INPUT_SPEC.md) §9.4：CSS animation/transition は live behavior として書き出されない）。本流派は静的でも成立する設計を旨とし、運用上のリズムは「**表紙（世界観）→ トップメッセージ（宣言）→ 価値創造（仕組み）→ KPI（成果）→ ESG（責任）→ 章扉（転換）→ 締め**」という誌面の章順で生みます。アニメは使うとしても登場順の強調程度に留め、現在の視覚状態だけで意味が通るようにします。

## Do's and Don'ts

- **Do**: 写真を主役にする。フルブリードの空/夜空グラデに最小限のコピーを載せる。
- **Do**: 価値創造モデル（インプット→事業→アウトカム）を矢印でつなぎ、報告書の背骨にする。
- **Do**: ブランドレッドをアクセントの旗に、ネイビーを支柱に、白＋余白でプレミアムに。
- **Do**: KPI・財務・年度は tabular-nums で桁を揃える。章ラベル/章タイトルに明朝を効かせる。
- **Do**: ESG/マテリアリティは清潔なカードで。出典・免責を常設する。
- **Don't**: 色付き左縦ライン（border-left）で重要度を示さない。塗り/バッジ/写真の主従で示す。
- **Don't**: 写真の上に明るい安全域以外で ink 文字を載せない（白文字は dark/brand 面のみ）。
- **Don't**: 装飾的な `<table>` を使わない。図・グリッドは div＋flex/grid と SVG で組む。
- **Don't**: 多色イラスト・3D影付き図・過剰なグラデ・`background-clip:text` を持ち込まない。

## Agent Prompt Guide

> **Quick palette**: brand-red `#c8102e` ／ navy `#16284b` ／ ink `#1a1a1a` ／ muted `#6b6b6b` ／ hairline `#e4e4e4` ／ sky `#bcd8f5` ／ sky-tint `#eef4fb` ／ surface `#f6f7f9`。空グラデ `linear-gradient(#bcd8f5,#eef4fb)`、夜空グラデ `linear-gradient(#16284b,#0c1530)`。Font: Noto Sans JP + Inter（章ラベルのみ Noto Serif JP）。KPI/財務は tabular-nums。マージン96px。角丸4〜14px。
>
> **Prompt**: 「統合報告書（Integrated Report）のエディトリアル・コーポレート・スタイルでスライドを作って。架空企業（例: SORAMICHI 空道 航空）の価値創造ストーリー。表紙はフルブリードの空グラデ写真（`linear-gradient(#bcd8f5,#eef4fb)`）に小さな英語kicker＋大きな日本語タイトル＋レポート年度、最小限の地平線/機体シルエットSVG。トップメッセージは左に大きなリード文＋右に navy(#16284b) のポートレート・プレースホルダ。価値創造モデルは『インプット(6つの資本)→ ビジネスモデル → アウトカム(提供価値)』を div+flex の3カラム＋インラインSVGの矢印で、中核を brand-red(#c8102e) 塗りで強調。KPIハイライトは大きな数値4枚＋前年比（数字は tabular-nums）。ESG/マテリアリティは清潔なカードで E/S/G に整理（色付き左縦ライン=border-left は使わない、SDGs番号は sky-tint のチップ）。章扉は brand-red か navy のフルブリードに巨大な章番号(半透明白)。フッターは『セクション名 …… ©社名』＋ページ番号。章ラベルにだけ明朝(Noto Serif JP)を効かせる。白文字は dark/brand面の上だけ。本文19px/行間1.7、マージン96pxで余白多め。」

## HTML→PPTX Notes

- 写真プレースホルダは**フルブリードの `linear-gradient`** で作る。グラデのベタ面はラスタ化されることがある（[HTML_INPUT_SPEC](../HTML_INPUT_SPEC.md) §8.4）。表紙・章扉のコピー（タイトル・章番号）は必ず**実テキストで別レイヤー**に置き、編集可能性を確保する。
- 価値創造モデルの矢印・地平線・機体/人物シルエットはすべて**インライン SVG**（`path` / `polygon` / `line`）で描く。SVG の presentation 属性（`fill` / `stroke`）には**リテラルな hex 値**を書く（`var()` は SVG 属性内では無効化されるため使わない）。
- KPI カード・ESG カード・価値創造カラム・タグチップ・キーメッセージ帯はネイティブ角丸矩形＋テキストになる。中核の brand 塗りカラム、surface のカードはベタ塗りで安定。
- 価値創造／財務の表組みは `<table>` を使わず div＋flex/grid で組む（各セルが個別のネイティブ図形・テキストボックスになる）。KPI・年度・前年比は `font-feature-settings:'tnum'` でブラウザ段階で等幅化してから書き出す。
- グラデは表紙・章扉・ポートレートの `linear-gradient(...)` のみ最小限に。`background-clip: text` は非対応のため使わない。
- Noto Sans JP / Noto Serif JP 未解決時は PPTX 側で MS ゴシック／MS 明朝系にフォールバック。和文字面が変わるので、タイトル・KPI ラベルは字数に余裕を持たせる。

## Iteration Guide

1. まず**表紙の写真（世界観）**と**価値創造モデル（背骨）**の2枚を決めてから、章順を組む（ストーリー駆動）。
2. 各コンテンツスライドの「キーメッセージ帯の結論文」を先に決め、それを写真／図／KPI で裏付ける。
3. 写真は空グラデ（明・公共性）か夜空グラデ（深・信頼）のどちらの世界観かを章ごとに選ぶ。
4. 色を足したくなったら、まず brand-red ＋ navy の二軸で表現できないか検討する（多色化しない）。
5. KPI・前年比は必ず数値で示し、桁は tabular-nums で揃える。出典・免責を省略しない。
6. 新しい図版は `layouts` に追加し、本文 Slide Layouts にも1行加える。色付き左縦ラインは増やさない。

## References / 参考にした流派・出典

- **参考にした流派**: 上場企業の統合報告書（Integrated Report）／航空・モビリティ・製造業のコーポレートレポート。IIRC/GRI の統合報告フレームワーク（価値創造プロセス・6つの資本・マテリアリティ）。
- **視覚的な署名**: フルブリードの写真（空/地平線/乗り物）＋鮮やかなブランドレッド・アクセント / 章立てのエディトリアル構造 / 価値創造モデル（インプット→事業→アウトカム）/ KPIハイライト / ESG・マテリアリティのカード / 章ラベルの明朝アクセント。
- **起点（Slideland 経由の実スライド・実在企業の公開デッキ）**: [JAL REPORT 2025（日本航空 統合報告書）](https://www.jal.com/ja/sustainability/report/pdf/index_2025a.pdf)（#Aviation #Red #VehiclePhoto）— 航空会社の統合報告書における「鮮やかな赤＋機体/空の写真＋価値創造ストーリー」という設計言語を研究し、**内容（文言・ロゴ・写真・数値）は一切複製せず**、架空企業 SORAMICHI 空道 航空のオリジナルのブランド・コピー・図解で再構築。

> 注: 本定義は特定の PowerPoint/PDF ファイルの複製ではなく、上記の流派・実デッキから**デザイン思考とエッセンスのみ**を抽出して再構築したもの。実在企業の商標・写真・固有のビジュアルアイデンティティの所有権は主張しない。比較ビューア（[`../_viewer/index.html`](../_viewer/index.html)）で「作ったスライド」と参照元の設計言語を見比べられる。横断タクソノミは[スライドランド](https://www.slideland.tech/)（style×docType×industry×color）に準拠。
