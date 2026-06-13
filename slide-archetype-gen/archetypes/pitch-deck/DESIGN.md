---
version: alpha
name: Startup Pitch Deck (Sequoia / YC)
description: シリコンバレー型シードデッキの定石。固定された物語の背骨（Purpose→Problem→Solution→Market→Traction→Team→Ask）に沿って、1スライド＝1メッセージだけを置く。白い余白を大きく取り、巨大な太字の見出しとヒーロー数字で「会場の最後列からでも読める」密度に絞る。装飾は最小、図はSVG1点まで。自信・大胆・明快。

meta:
  archetype: pitch-deck
  origin: Sequoia Capital pitch deck template / Y Combinator seed-deck guidance（2010s〜のSVシードデッキ定石）
  locale: bilingual
  density: very-low
  mood: [confident, bold, clear, ambitious, direct]
  tags:
    style: [minimal, bold, clear]
    docType: [pitch, fundraising, business-plan]
    industry: [saas, ai, fintech, logistics]
    color: [two-tone, electric-blue, monochrome]

canvas:
  width: 1920px
  height: 1080px
  aspectRatio: "16:9"
  exportWidthIn: 13.333
  exportHeightIn: 7.5
  background: "{colors.canvas}"
  margin: 140px

grid:
  columns: 12
  gutter: 32px
  margin: 140px
  baseline: 8px

colors:
  accent: "#3b5bff"
  accent-deep: "#2440d6"
  canvas: "#ffffff"
  ink: "#14171f"
  muted: "#586072"
  positive: "#18a957"
  surface: "#f3f5ff"
  hairline: "#dfe3f2"
  on-accent: "#ffffff"

typography:
  kicker:
    fontFamily: "Inter, 'Noto Sans JP', sans-serif"
    fontSize: 22px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0.12em
  cover-title:
    fontFamily: "Inter, 'Noto Sans JP', sans-serif"
    fontSize: 128px
    fontWeight: 800
    lineHeight: 1.0
    letterSpacing: -0.03em
  statement:
    fontFamily: "Inter, 'Noto Sans JP', sans-serif"
    fontSize: 84px
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: -0.02em
  slide-heading:
    fontFamily: "Inter, 'Noto Sans JP', sans-serif"
    fontSize: 30px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: 0.0em
  hero-number:
    fontFamily: "Inter, 'Noto Sans JP', sans-serif"
    fontSize: 340px
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: -0.04em
  lead:
    fontFamily: "'Noto Sans JP', Inter, sans-serif"
    fontSize: 30px
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, 'Noto Sans JP', sans-serif"
    fontSize: 22px
    fontWeight: 600
    lineHeight: 1.3
  caption:
    fontFamily: "'Noto Sans JP', Inter, sans-serif"
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.5
  footer:
    fontFamily: "Inter, 'Noto Sans JP', sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1

rounded:
  none: 0px
  sm: 8px
  md: 14px
  lg: 20px
  full: 9999px

spacing:
  xs: 8px
  sm: 16px
  md: 24px
  lg: 48px
  xl: 96px
  margin: 140px

layouts:
  cover:
    description: "表紙。中央〜左にロゴ（マーク＋ワードマーク）と、1行のパーパス（何屋か）だけ。下に運営社名／ラウンド名。装飾は accent の細いルールのみ。"
    uses: [logo, kicker, lead]
  problem:
    description: "1スライド1課題。巨大なヒーロー数字（accent）を主役にし、その下に課題を1行。説明は足さない。"
    uses: [hero-number, statement, footer]
  solution:
    description: "解決を1文のステートメント（statement・ink）で言い切り、右下に小さなSVGダイアグラム1点を添える。"
    uses: [statement, diagram, footer]
  market:
    description: "TAM/SAM/SOM の同心円（インラインSVG）。各円に金額ラベル。狙う最内円（SOM）を accent で強調。"
    uses: [slide-heading, concentric-circles, footer]
  traction:
    description: "ホッケースティック型の折れ線（インラインSVG）。右肩上がりを1本だけ。直近値を accent ドット＋ラベルで。"
    uses: [slide-heading, line-chart, footer]
  team:
    description: "3〜4名をイニシャル・アバター（塗りチップ）で。写真は使わない。氏名＋一言の前職／役割のみ。"
    uses: [slide-heading, avatar-chip, footer]
  ask:
    description: "調達額をヒーロー数字（accent）で1つ。右に資金使途を3本の横バーで配分。"
    uses: [hero-number, fund-bars, footer]

components:
  logo:
    typography: "{typography.slide-heading}"
    textColor: "{colors.ink}"
  kicker:
    typography: "{typography.kicker}"
    textColor: "{colors.accent}"
  statement:
    typography: "{typography.statement}"
    textColor: "{colors.ink}"
  hero-number:
    typography: "{typography.hero-number}"
    textColor: "{colors.accent}"
  slide-heading:
    typography: "{typography.slide-heading}"
    textColor: "{colors.ink}"
  highlight:
    textColor: "{colors.accent}"
  avatar-chip:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.full}"
  fund-bar:
    backgroundColor: "{colors.accent}"
    rounded: "{rounded.full}"
  footer:
    typography: "{typography.footer}"
    textColor: "{colors.muted}"

components-note: "重要度は塗り/巨大サイズ/accent色で示す（色付き左縦ライン=border-left は使わない）。アイコンが要るときは単線のインラインSVGグリフのみ（絵文字は使わない）。"
---

# Startup Pitch Deck (Sequoia / YC)

## Overview

シリコンバレー型のシードデッキ（投資家向けの最初の数枚）に典型的な、**1スライド＝1メッセージ**へ極端に絞り込むスタイルです。Sequoia の pitch deck template と Y Combinator のシードデッキ指南に共通する「固定された物語の背骨」をそのまま骨格にします。順番は **Purpose → Problem → Solution → Market → Traction → Team → Ask**。各スライドは「巨大な一言＋それを支える視覚要素1点」だけで構成し、会場の最後列からでも読めるサイズに振り切ります。

署名的な要素は3つ。(1) **白いキャンバスに大量の余白**と、画面を支配する**ひとつの巨大要素**（ヒーロー数字 or ステートメント）。(2) **電光のような単一アクセント（#3b5bff）**だけを差し色にし、それ以外はインクとミュートのモノトーンで締める。(3) **ヒーロー数字**でProblem／Askを語る数値ドリブンな語り口。装飾図は1スライドにつきインラインSVG1点まで。投資家向けのピッチ、資金調達、事業計画の要約に最適です。

**Key Characteristics:**
- 物語の背骨は固定（Purpose→Problem→Solution→Market→Traction→Team→Ask）。1スライド1アイデア。
- 白地＋大量の余白。1画面に支配的な要素は必ずひとつ（ヒーロー数字 or 巨大ステートメント）。
- 差し色は electric accent（#3b5bff）の1色のみ。地の文はインク／ミュートのモノトーン。
- 文字は極太（700–800）の幾何学サンセリフ。最後列から読める巨大サイズ。
- 図はインラインSVGを1点まで（同心円のTAM/SAM/SOM、ホッケースティックの折れ線、資金使途バー）。
- チームは写真ではなく**イニシャルの塗りアバター**で（軽量・編集可能・人物写真の権利問題を回避）。
- フッターは控えめに `ページ番号 ｜ セクション ©Company`。
- 重要度は塗り/巨大サイズ/accent色で示す（border-left の色ラインは使わない）。

## Colors

- **Accent** ({colors.accent} — #3b5bff): 唯一の差し色。ヒーロー数字・キッカー・強調・SOM円・直近値ドット。白上で 5.09:1（本文サイズでも AA）。
- **Accent-deep** ({colors.accent-deep} — #2440d6): グラデの濃端・押下色など補助的な濃いアクセント。
- **Canvas** ({colors.canvas} — #ffffff): すべての地色。余白そのものが主役。
- **Ink** ({colors.ink} — #14171f): 見出し・ステートメント・本文。白上で 17.9:1（AAA）。
- **Muted** ({colors.muted} — #586072): キャプション・フッター・補助ラベル。白上で 6.30:1（AA）。
- **Positive** ({colors.positive} — #18a957): 成長・好転を示す第2アクセント（**大きい文字／図形のみ**）。白上で 3.06:1（large/graphical の 3:1 基準を満たす。小さい本文には使わない）。
- **Surface** ({colors.surface} — #f3f5ff): ごく淡いチップ／同心円の最外帯など、面の差を出す控えめな地。
- **Hairline** ({colors.hairline} — #dfe3f2): 罫線・軸線・境界。

> コントラスト指針: ink/canvas ≈ 17.9:1（AAA）。muted/canvas ≈ 6.30:1（AA）。accent/canvas ≈ 5.09:1（本文 AA）。positive は ≥24px 太字または図形のみ（3.06:1）に限定。

## Typography

見出し・数字は**幾何学サンセリフを極太（700–800）**で（英語＝Inter、和文＝Noto Sans JP）。本文リードは Noto Sans JP 400。とにかく大きく、最後列から読めることを最優先します。1スライドに置く書体サイズは原則2種まで（巨大要素＋補助1行）。

| Token | Size | Weight | LineHeight | Use |
|---|---|---|---|---|
| hero-number | 340px | 800 | 0.9 | Problem/Ask のヒーロー数字 |
| cover-title | 128px | 800 | 1.0 | 表紙ロゴワードマーク級 |
| statement | 84px | 800 | 1.08 | Solution の言い切り／Problem の一文 |
| slide-heading | 30px | 700 | 1.25 | 各スライドの小見出し（Market/Traction/Team） |
| lead | 30px | 400 | 1.5 | 表紙パーパス・補足リード |
| label | 22px | 600 | 1.3 | 図中ラベル・氏名 |
| kicker | 22px | 700 | 1.2 | アイブロー（letter-spacing 0.12em、大文字） |
| caption | 18px | 400 | 1.5 | 出典・脚注 |
| footer | 16px | 600 | 1 | フッター |

**原則**: 1スライドに支配的サイズはひとつ。強調はインラインの **accent 太字** で（下線・マーカーは使わない）。和文の見出しに句読点を足しすぎず、短く言い切る。

## Layout & Grid

台紙 1920×1080、マージン **140px**（trust-saas より広い＝余白を主役にする）、12カラム・ガター32px、ベースライン8px。各スライドは「左上ロゴ → 巨大要素（中央寄せ or 左寄せ）→ 補助1行 → フッター」。情報密度は **very-low**：1画面の主張は1つ、箇条書きは原則3点まで。角丸は中（14–20px、チップ/バーは full）。

## Slide Layouts

- **cover（表紙）**: ロゴ＋1行のパーパス（何屋か）だけ。accent の細いルールのみ装飾。
- **problem**: 巨大ヒーロー数字（accent）＋課題1行。説明を足さない。
- **solution**: 解決を1文の statement（ink）で言い切り、右下にSVGダイアグラム1点。
- **market**: TAM/SAM/SOM の同心円SVG。最内円（SOM）を accent で強調。
- **traction**: ホッケースティックの折れ線SVG1本。直近値を accent ドット＋ラベル。
- **team**: 3〜4名のイニシャル塗りアバター＋氏名＋一言。写真は使わない。
- **ask**: 調達額のヒーロー数字（accent）＋資金使途3本バー。

## Elevation & Depth

基本は**フラット**。影はほぼ使わず、階層は「サイズの落差」と「余白」で作る（最大要素：補助テキスト＝桁違いのサイズ比）。面の差が要るときだけ surface（#f3f5ff）の極淡い塗りか hairline の罫線で示す。立体的なグラデ／ガラス表現はこの流派では使わない（Trust SaaS との明確な差別化点）。

## Shapes

中程度の角丸（14–20px、チップ・バーは full）。図形言語は同心円・1本の折れ線・横バー・円形アバターチップ。アイコンが要る場合のみ単線のインラインSVGグリフ。写真は原則使わず、人物は塗りアバターで代替。

## Components

- **logo**: マーク（accent 塗りの角丸）＋ワードマーク（ink・700）。
- **kicker**: accent・大文字・トラッキング広め（0.12em）。
- **statement**: ink・800・超大。Solution/Problem の言い切り。
- **hero-number**: accent・800・340px級。単位は小さく添える。
- **highlight**: 本文中キーワードの accent 太字。
- **avatar-chip**: accent 塗りの円にイニシャル白文字（写真の代替）。
- **fund-bar**: accent 塗りの full 角丸横バー。長さで配分を示す。
- **footer**: `n ｜ セクション` 左、`©Company` 右、muted。

## Motion

PPTX 書き出しではアニメーションは限定的（[HTML_INPUT_SPEC](../HTML_INPUT_SPEC.md) §9.4：CSSアニメ/トランジションは静止状態のみ書き出し）。この流派では**構成のリズム**で語る：数字スライド→ステートメント→図、と「大きい一言」を連打して勢いを作る。スライド内アニメには依存しない。

## Do's and Don'ts

- **Do**: 1スライド1アイデア。固定の背骨（Purpose→Problem→Solution→Market→Traction→Team→Ask）を守る。
- **Do**: ヒーロー数字・巨大ステートメントで「最後列から読める」サイズに振り切る。
- **Do**: 差し色は accent 1色のみ。地はインク／ミュートのモノトーンで締める。
- **Do**: 図はインラインSVG1点まで（同心円・折れ線・バー）。チームは塗りアバターで。
- **Don't**: 1スライドに2つ以上の主役を置かない（密度を上げない）。
- **Don't**: 多色を散らさない（accent 以外の差し色は positive を大きい要素のみに限定）。
- **Don't**: 立体グラデ/ガラス/ドロップシャドウを盛らない（フラットを保つ）。
- **Don't**: border-left の色ラインや絵文字アイコンで重要度を示さない。
- **Don't**: 実在企業の文言・ロゴ・図版を流用しない（オリジナルの架空スタートアップで構成）。

## Agent Prompt Guide

> **Quick palette**: accent `#3b5bff` ／ ink `#14171f` ／ muted `#586072` ／ positive `#18a957`（大要素のみ）／ surface `#f3f5ff` ／ canvas `#ffffff`。Font: Inter + Noto Sans JP（見出し700–800）。余白たっぷり、フラット。
>
> **Prompt**: 「シリコンバレー型のシードピッチデッキ（Sequoia/YC流）で作って。物語の背骨は Purpose→Problem→Solution→Market→Traction→Team→Ask で固定。1スライド＝1アイデアだけにし、白地に大量の余白を取る。差し色は electric blue(#3b5bff)の1色のみで、地の文はインク(#14171f)とミュート(#586072)のモノトーン。Problem と Ask は巨大なヒーロー数字(340px級・accent)で語り、Solution は1文の巨大ステートメント(84px・ink・言い切り)。Market は TAM/SAM/SOM の同心円(インラインSVG、最内円SOMをaccentで強調)、Traction はホッケースティックの折れ線(インラインSVG1本、直近値をaccentドット)、Team は写真ではなくイニシャルの塗りアバター3〜4名。Ask は調達額のヒーロー数字＋資金使途3本の横バー。立体グラデやガラスは使わずフラットに。フッターは『ページ｜セクション ©社名』。架空のスタートアップ名・コピー・数字でオリジナルに構成し、実在企業の文言は使わない。」

## HTML→PPTX Notes

- ヒーロー数字・ステートメント・小見出し・フッターはネイティブのテキストボックスになる（実テキストで置く）。
- 同心円(TAM/SAM/SOM)・折れ線(Traction)・資金使途バー・アバターチップは**インラインSVGまたは div+flex** で組む。SVG属性の色は**リテラルHEX**で書く（`var()` はSVG属性内で無効。[HTML_INPUT_SPEC](../HTML_INPUT_SPEC.md) §8.3）。
- 強調は `<b>`/`<span>` の color で（`background-clip:text` は使わない）。グラデは標準 `linear-gradient(...)` のみ。
- 図解は `<table>` を使わず div+flex/grid と SVG で組む。色付き左縦ライン(border-left)は使わない。
- 写真を使わないので CORS/画像欠けの事故が起きにくい（アバターは塗り＋テキスト）。フォント未解決時は Arial フォールバック前提で Inter を選定。

## Iteration Guide

1. まず背骨の7枚（Purpose/Problem/Solution/Market/Traction/Team/Ask）を1枚1メッセージで埋める。
2. 各スライドの「主役の巨大要素」を1つだけ決める（数字 or ステートメント or 図）。
3. 差し色を accent 1色に固定し、足したくなったら巨大サイズか余白で代替できないか検討する。
4. 図はSVG1点までに絞り、軸ラベル・出典の caption を muted で添える。
5. 文言を削れないか毎回見直す（very-low density を維持）。

## References / 参考にした流派・出典

- **起点（テンプレート流派）**: Sequoia Capital pitch deck template（[slideshare](https://www.slideshare.net/slideshow/sequoia-capital-pitchdecktemplate/46231251)）— 固定された物語の背骨（Purpose/Problem/Solution/Market/Traction/Team/Ask 等）を骨格として参照。
- **起点（指南）**: Y Combinator のシードデッキ・ガイダンス（1スライド1アイデア／巨大な文字／低密度／投資家が数十秒で読める構成）。
- **分類傾向**: Slideland の「事業計画（business plan）」カテゴリのスライド傾向（数字ドリブン・余白多め・差し色1色）も参照。
- **視覚的な署名**: 白地＋大量の余白 / 単一 electric accent / ヒーロー数字 / 巨大ステートメント / TAM-SAM-SOM 同心円 / ホッケースティック折れ線 / イニシャル塗りアバター。

> 注: 上記テンプレート／ガイダンスは**構成（物語の背骨）の流派**として参照しています。実在企業・実在デッキの文言・ロゴ・図版は複製していません。サンプルの社名「Cargora」・コピー・数字はすべて架空のオリジナルです。
