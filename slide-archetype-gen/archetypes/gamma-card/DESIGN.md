---
version: alpha
name: Gamma-style Card / Web-native (カードUIのWebネイティブ生成)
description: Gamma に代表される「1スライド＝1枚のクリーンな角丸カード」というWebドキュメント発想のスタイル。ページ地は淡いグレー(#eef1f6)、コンテンツは大きく角丸の白カード(#ffffff)に載り、たっぷりの余白とゆったりした行間(1.6+)で組む。ソフトモダンなテーマ駆動のパレット、控えめなグラデ(#6a7bff→#9b6bff)はピルや細いトップアクセントバーなど小面積に限定。埋め込みメディア/コールアウトブロック、柔らかいKPIタイル、ソフトチップ入りのアイコン行。親しみやすく、空気のあるWeb文書の質感。

meta:
  archetype: gamma-card
  origin: Gamma のカードベース/Webネイティブなスライド生成思想（テーマ駆動・1カード1スライド・縦積みブロック）
  locale: bilingual
  density: low
  mood: [soft, modern, friendly, airy, web-native, approachable]
  tags:
    style: [soft, modern, minimal, friendly]
    docType: [company-intro, service, knowledge-base, product, pitch]
    industry: [saas, ai, edtech, productivity]
    color: [pastel, gradient, soft-violet, light]

canvas:
  width: 1920px
  height: 1080px
  aspectRatio: "16:9"
  exportWidthIn: 13.333
  exportHeightIn: 7.5
  background: "{colors.page}"
  margin: 80px

grid:
  columns: 12
  gutter: 24px
  margin: 80px
  baseline: 8px

colors:
  accent-a: "#6a7bff"
  accent-b: "#9b6bff"
  page: "#eef1f6"
  card: "#ffffff"
  ink: "#1b2030"
  muted: "#5b6475"
  tint-violet: "#f1f3ff"
  tint-mint: "#eefcf6"
  tint-violet-deep: "#e6e9ff"
  mint-ink: "#127a55"
  hairline: "#e7eaf2"
  on-accent: "#ffffff"

typography:
  eyebrow:
    fontFamily: "Inter, 'Noto Sans JP', sans-serif"
    fontSize: 17px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0.06em
  cover-title:
    fontFamily: "Inter, 'Noto Sans JP', sans-serif"
    fontSize: 104px
    fontWeight: 800
    lineHeight: 1.04
    letterSpacing: -0.025em
  slide-title:
    fontFamily: "Inter, 'Noto Sans JP', sans-serif"
    fontSize: 46px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: -0.01em
  section-number:
    fontFamily: "Inter, 'Noto Sans JP', sans-serif"
    fontSize: 22px
    fontWeight: 700
    lineHeight: 1.2
  lead:
    fontFamily: "'Noto Sans JP', Inter, sans-serif"
    fontSize: 26px
    fontWeight: 400
    lineHeight: 1.65
  body:
    fontFamily: "'Noto Sans JP', Inter, sans-serif"
    fontSize: 20px
    fontWeight: 400
    lineHeight: 1.7
  callout:
    fontFamily: "'Noto Sans JP', Inter, sans-serif"
    fontSize: 28px
    fontWeight: 500
    lineHeight: 1.55
  kpi-number:
    fontFamily: "Inter, 'Noto Sans JP', sans-serif"
    fontSize: 76px
    fontWeight: 800
    lineHeight: 1.0
    letterSpacing: -0.02em
  kpi-label:
    fontFamily: "'Noto Sans JP', Inter, sans-serif"
    fontSize: 19px
    fontWeight: 500
    lineHeight: 1.45
  feature-title:
    fontFamily: "Inter, 'Noto Sans JP', sans-serif"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.35
  caption:
    fontFamily: "'Noto Sans JP', Inter, sans-serif"
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.4

rounded:
  none: 0px
  sm: 12px
  md: 18px
  lg: 24px
  card: 28px
  full: 9999px

spacing:
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  card-pad: 88px
  margin: 80px

layouts:
  cover:
    description: "表紙カード。白カードの上端に細いグラデのアクセントバー。アイブロー・ピル → 超大見出し → サブタイトル を縦積み。下端に小さなロゴ/日付。"
    uses: [accent-bar, eyebrow-pill, cover-title, lead]
  contents:
    description: "目次/セクションカード。左にセクション番号と見出し、右に番号付きアジェンダ行（ソフトチップの番号＋テキスト）。"
    uses: [slide-title, agenda-row]
  two-column:
    description: "2カラムカード。左にテキスト（見出し＋リード＋本文）、右に淡くtintしたメディア/図版ブロック（角丸・インラインSVG）。"
    uses: [slide-title, body, media-block]
  callout:
    description: "コールアウトカード。中央にtintした角丸ボックスを置き、キーインサイトを大きめの文で。引用符グリフをソフトチップで。"
    uses: [slide-title, callout-box]
  stat:
    description: "統計カード。2〜3枚のソフトKPIタイル（淡tint地・大数値・ラベル）を横並び。"
    uses: [slide-title, kpi-tile]
  feature:
    description: "機能/特徴カード。アイコン行アイテムを縦積み（ソフトチップ内のインラインSVGグリフ＋タイトル＋説明）。"
    uses: [slide-title, feature-row]
  closing:
    description: "締めカード。中央寄せで短いメッセージ＋グラデのCTAピル。下に連絡/URL。"
    uses: [slide-title, lead, cta-pill]

components:
  accent-bar:
    backgroundColor: "{colors.accent-a}"
    rounded: "{rounded.full}"
  eyebrow-pill:
    typography: "{typography.eyebrow}"
    backgroundColor: "{colors.tint-violet}"
    textColor: "{colors.accent-b}"
    rounded: "{rounded.full}"
    padding: 10px 22px
  cover-title:
    typography: "{typography.cover-title}"
    textColor: "{colors.ink}"
  slide-title:
    typography: "{typography.slide-title}"
    textColor: "{colors.ink}"
  lead:
    typography: "{typography.lead}"
    textColor: "{colors.muted}"
  body:
    typography: "{typography.body}"
    textColor: "{colors.ink}"
  highlight:
    textColor: "{colors.accent-b}"
  media-block:
    backgroundColor: "{colors.tint-violet}"
    rounded: "{rounded.lg}"
    padding: 48px
  callout-box:
    backgroundColor: "{colors.tint-mint}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 56px
  kpi-tile:
    backgroundColor: "{colors.tint-violet}"
    rounded: "{rounded.lg}"
    padding: 44px
  soft-chip:
    backgroundColor: "{colors.tint-violet}"
    textColor: "{colors.accent-b}"
    rounded: "{rounded.md}"
    padding: 14px
  feature-title:
    typography: "{typography.feature-title}"
    textColor: "{colors.ink}"
  cta-pill:
    backgroundColor: "{colors.accent-a}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.full}"
    padding: 20px 44px
  caption:
    typography: "{typography.caption}"
    textColor: "{colors.muted}"

components-note: "重要度は塗りtintチップ/バッジ/アイコンで示す（色付き左縦ライン=border-left は使わない）。アイコンはインラインSVGの線画グリフをソフトチップに入れる（絵文字は使わない）。"
---

# Gamma-style Card / Web-native (カードUIのWebネイティブ生成)

## Overview

Gamma に代表される、**「1スライド＝1枚のクリーンな角丸カード」というWebドキュメント発想**のスタイルです。スライドを「紙の一枚絵」ではなく「Webの1セクション」として捉え、淡いグレーのページ地の上に、大きく角丸の白カードを浮かべます。カード内はたっぷりの余白とゆったりした行間で、縦に積んだ柔らかいブロック（テキスト・メディア・コールアウト・KPIタイル・アイコン行）で構成します。

署名的な要素は3つ。(1) **ページ地(#eef1f6)に浮く大角丸の白カード**（半径28px・柔らかい影・広いパディング）、(2) **ソフトモダンなパレット**（インクは濃く読みやすく、グラデ #6a7bff→#9b6bff は小面積に限定）、(3) **淡tintのコールアウト/メディアブロックとソフトチップ入りのアイコン行**。会社紹介・サービス説明・ナレッジツール・プロダクト紹介に向きます。

**Key Characteristics:**
- ページ地は淡グレー(#eef1f6)、コンテンツは大角丸(28px)の白カードに載る（柔らかい影・広いパディング）。
- グラデ(#6a7bff→#9b6bff)はピル・細いトップアクセントバーなど**小面積だけ**に使う。
- 見出しはインク(#1b2030)で太め、本文はゆったり行間(1.6+)、補助は muted(#5b6475)。
- コールアウト/メディアは**淡tint面**(#f1f3ff lavender / #eefcf6 mint)の角丸ブロックで。
- アイコンは**インラインSVGの線画グリフ**をソフトチップに入れる（絵文字は使わない）。
- 重要度は塗りtintチップ/バッジ/アイコンで示す（border-left の色ラインは使わない）。
- 角丸はすべて大きめ。全体に空気があり、親しみやすいWeb文書の質感。

## Colors

- **Accent-A** ({colors.accent-a} — #6a7bff): グラデの一端、CTAピル、トップアクセントバーの主色。
- **Accent-B / Violet** ({colors.accent-b} — #9b6bff): グラデのもう一端、ピル文字・インラインハイライトの第2色。
- **Page** ({colors.page} — #eef1f6): カードが浮く淡グレーのページ地。
- **Card** ({colors.card} — #ffffff): コンテンツが載る白カード地。
- **Ink** ({colors.ink} — #1b2030): 見出し・本文の濃いインク。
- **Muted** ({colors.muted} — #5b6475): リード・補助・キャプション。
- **Tint Violet / Violet-deep** (#f1f3ff / #e6e9ff): メディア/KPI/チップの淡 lavender 地。
- **Tint Mint** ({colors.tint-mint} — #eefcf6): コールアウトの淡ミント地。
- **Mint-ink** ({colors.mint-ink} — #127a55): ミント面上のラベル/数値（mint地で AA 確保）。
- **Hairline** ({colors.hairline} — #e7eaf2): カード内の細い境界。

> コントラスト: ink/card #1b2030 on #ffffff ≈ 14.9:1（AAA）。muted #5b6475 on #ffffff ≈ 6.0:1、on #f1f3ff ≈ 5.5:1（AA本文OK）。accent-b #9b6bff on #f1f3ff ≈ 3.4:1 → **ピル/ラベルなど大きめ・太字テキストのみ**に使い、本文には使わない。mint-ink #127a55 on #eefcf6 ≈ 4.7:1（AA）。

## Typography

クリーンなWebサンセリフ（英＝Inter、和文＝Noto Sans JP）。見出しは 700〜800、本文は 400 で**ゆったりした行間(1.6+)**。Webドキュメントらしく、詰めすぎず、空気を持たせるのが要点。

| Token | Size | Weight | LineHeight | Use |
|---|---|---|---|---|
| cover-title | 104px | 800 | 1.04 | 表紙の超大見出し |
| kpi-number | 76px | 800 | 1.0 | 統計の大数値 |
| slide-title | 46px | 700 | 1.25 | スライド見出し |
| callout | 28px | 500 | 1.55 | コールアウトのキー文 |
| lead | 26px | 400 | 1.65 | リード文 |
| feature-title | 24px | 700 | 1.35 | 機能アイテムの見出し |
| body | 20px | 400 | 1.7 | 本文 |
| eyebrow | 17px | 700 | 1.2 | アイブロー/ラベル |
| caption | 16px | 500 | 1.4 | キャプション/出典 |

**原則**: 行間は広め(1.6+)。強調は**インラインの violet 太字**（下線やマーカーではなく色で）。和文フォント未解決時は Arial フォールバック前提でウェイトを選ぶ。

## Layout & Grid

台紙 1920×1080。**ページ地(#eef1f6)に外マージン約56px、その内側に大角丸(28px)の白カード**を1枚置き、カード内パディングは約88px。12カラム・ガター24px。カード内は「アイブロー/見出し → リード → ブロック（メディア/コールアウト/KPI/アイコン行）」を縦に積む。情報密度は **low**（空気が主役）。角丸はすべて大きめ(18〜28px、ピルは full)。

## Slide Layouts

- **cover（表紙）**: 白カード上端に細いグラデのアクセントバー。アイブローピル → 超大見出し → サブタイトル。下端にロゴ/日付。
- **contents（目次/セクション）**: 左にセクション番号＋見出し、右に番号付きアジェンダ行（ソフトチップの番号＋テキスト）。
- **two-column**: 左テキスト＋右に淡tintのメディア/図版ブロック（角丸・インラインSVG）。
- **callout**: 中央に淡ミントの角丸ボックス＋大きめのキーインサイト文。引用グリフをソフトチップで。
- **stat**: 2〜3枚のソフトKPIタイル（淡tint地・大数値・ラベル）。
- **feature**: アイコン行アイテムを縦積み（ソフトチップ内SVGグリフ＋タイトル＋説明）。
- **closing**: 中央寄せの短いメッセージ＋グラデのCTAピル＋URL。

## Elevation & Depth

階層は**白カードの柔らかい影**(`0 30px 70px rgba(27,32,48,.10)` 程度)で表現。カード内のブロックは淡tint地＋大角丸で、影はごく弱く（または無し）。立体表現は最小限にし、面の色（白／lavender／mint）と余白で階層を出す。ハードな罫線より tint 面の差で区切る。

## Shapes

すべて大きめの角丸（ブロック18〜24px、カード28px、ピルは full）。図形言語は角丸矩形・ピル・ソフトチップ。アイコンは**単色ライン（accent-a）のインラインSVG**、`stroke-linecap: round`・`stroke-linejoin: round` で柔らかく。写真/図版を置く場合も角丸でクリップ。

## Components

- **accent-bar**: カード上端の細いグラデ(accent-a→accent-b)ライン。署名要素。
- **eyebrow-pill**: 淡 lavender 地に violet 文字の角丸ピル（アイブロー）。
- **cover-title / slide-title**: インク・太字。Webドキュメントらしい見出し。
- **lead**: muted のリード文、ゆったり行間。
- **highlight**: 本文中キーワードの violet 太字。
- **media-block**: 右カラムの淡 lavender 角丸ブロック（インラインSVG図版）。
- **callout-box**: 淡ミントの角丸ボックス＋大きめキー文＋引用グリフのソフトチップ。
- **kpi-tile**: 淡tint地の角丸タイル（大数値＋ラベル）。mint地のときラベルは mint-ink。
- **soft-chip**: アイコン/番号を入れる淡tintの角丸チップ。
- **feature-row**: ソフトチップ(SVGグリフ)＋タイトル＋説明の横並びアイテム。
- **cta-pill**: グラデ/accent-a 塗りの角丸CTAピル（白文字）。
- **caption**: 出典/補足、muted。

## Motion

PPTX ではアニメは限定的（[HTML_INPUT_SPEC](../HTML_INPUT_SPEC.md) §9.4：CSSアニメ/トランジション/ホバーは書き出されない）。構成上のリズムは「カードが順に立ち上がる」想定に留め、静的状態だけで成立させる。スライド送りは穏やかなフェード程度を推奨（HTMLには持たせない）。

## Do's and Don'ts

- **Do**: 1スライド＝1枚の白カード。ページ地に浮かせ、広い余白とゆったり行間で組む。
- **Do**: グラデはピル/トップアクセントバーなど**小面積**に限定し、地は白＋淡tintで保つ。
- **Do**: コールアウト/メディアは淡tint(lavender/mint)の角丸ブロックで。アイコンはソフトチップ内のインラインSVG。
- **Do**: 本文の強調は violet のインライン太字で。
- **Don't**: カード全面や大面積をグラデで塗らない（小面積アクセントに留める）。
- **Don't**: 絵文字を機能アイコンに使わない（インラインSVG線画グリフを使う）。
- **Don't**: border-left の色ラインで重要度を示さない（塗りtintチップ/バッジで）。
- **Don't**: 角を尖らせない・行間を詰めない（Webネイティブの空気感を壊さない）。
- **Don't**: violet を本文サイズの細字テキストに使わない（コントラスト不足。ピル/ラベル/太字のみ）。

## Agent Prompt Guide

> **Quick palette**: accent-a `#6a7bff` ／ violet `#9b6bff` ／ page `#eef1f6` ／ card `#ffffff` ／ ink `#1b2030` ／ muted `#5b6475` ／ tint lavender `#f1f3ff` ／ tint mint `#eefcf6`。Font: Inter + Noto Sans JP（見出し700〜800、本文400・行間1.6+）。角丸：カード28px・ブロック18〜24px・ピル full。
>
> **Prompt**: 「GammaのカードUI/Webネイティブ生成スタイルで作って。ページ地は淡グレー(#eef1f6)、各スライドは大角丸(28px)の白カード1枚に載せ、柔らかい影と広い余白(約88px)・ゆったり行間(1.6+)で組む。グラデ(#6a7bff→#9b6bff)はアイブローピルとカード上端の細いアクセントバーなど小面積だけに使う。見出しはインク(#1b2030)で太字、本文は muted(#5b6475)で読みやすく、強調は violet(#9b6bff)のインライン太字。コールアウトは淡ミント(#eefcf6)、メディア/KPIタイルは淡lavender(#f1f3ff)の角丸ブロックで。アイコンはソフトチップ内のインラインSVG線画グリフ（絵文字は使わない）。レイアウトは『表紙／目次／2カラム＋メディア／コールアウト／KPIタイル／アイコン行の機能／CTA締め』。border-leftの色ラインは使わず、重要度は塗りtintチップ/バッジで示す。」

## HTML→PPTX Notes

- 白カード・角丸ブロック・ピル・KPIタイル・アイコンチップはネイティブ図形/テキストになる。
- **トップアクセントバーやCTAの小面積グラデは標準 `linear-gradient(...)`** で。`background-clip: text` は使わない（グラデ文字は不可）。
- カードの柔らかい影(box-shadow)は概ね保持されるが、強いぼかしはラスタ化し得る（[HTML_INPUT_SPEC](../HTML_INPUT_SPEC.md) §8.4）。影は控えめに。
- アイコン/図版はインラインSVGで、`fill`/`stroke` は**リテラルHEX**指定（`var()` はSVG属性内で無効化されるため使わない）。
- メディア/図解は `<table>` を使わず div＋flex/grid と SVG で組む。
- 淡tint地に muted 文字を載せる箇所はコントラストを再確認（violet は本文に使わない）。

## Iteration Guide

1. まず「ページ地に浮く白カード＋余白＋行間」の基本フレームを固める。
2. グラデの使用箇所をピル/アクセントバー/CTAの小面積に限定する（増やさない）。
3. tint 面の役割を決める（lavender=メディア/KPI、mint=コールアウト）。
4. アイコンはインラインSVGの線画グリフで統一し、ソフトチップに入れる。
5. 色を足したくなったら、まず lavender/mint の tint 面で表現できないか検討する。

## References / 参考にした流派・出典

- **参考にした流派**: Gamma のカードベース/Webネイティブなスライド生成思想（テーマ駆動・1カード1スライド・縦積みブロック・たっぷりの余白）。([https://gamma.app](https://gamma.app))
- **視覚的な署名**: ページ地に浮く大角丸の白カード / 小面積のソフトグラデ（ピル・トップアクセントバー）/ 淡tintのコールアウト・メディアブロック / ソフトチップ入りのインラインSVGアイコン行 / ゆったりした行間。
- **起点（Slideland 経由の傾向研究）**: Slideland の会社紹介/サービス紹介に見られる**クリーンなカードUI**傾向（白カード・大角丸・淡tint面・余白の取り方）を研究し、**内容は複製せず**オリジナルのブランド・コピー・図解で再構築。
- **法的フレーミング**: 本定義は公開情報から抽出した「流派の解釈（inspired interpretation）」であり、Gamma 社・Slideland いずれの公式アセットでもありません。ロゴ・固有の文言・図版は複製していません（配色・余白・タイポ・カードレイアウトのエッセンスのみ抽出）。
