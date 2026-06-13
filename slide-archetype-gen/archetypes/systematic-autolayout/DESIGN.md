---
version: alpha
name: Systematic Auto-Layout (構造優先のスマートテンプレート)
description: Beautiful.ai に代表される「構造優先（structure-first）」のスマートテンプレート流派。完璧な整列・等間隔・反復をシステムが強制し、ロックされたブランドパレットを機械的に全面適用する。比較・タイムライン・大数値などの定型アーキタイプが自己整列する。装飾ではなく整列と反復が署名。落ち着いた、終始オンブランドな定例ビジネスレビュー向け。

meta:
  archetype: systematic-autolayout
  origin: Beautiful.ai のデザイン哲学（smart templates / structure-first auto-layout）。起点として Slideland の #信頼感/#クリア 系SaaS会社紹介傾向。
  locale: bilingual
  density: medium
  mood: [calm, systematic, consistent, on-brand, precise]
  tags:
    style: [trust, clear, minimal, systematic]
    docType: [business-review, company-intro, service, proposal]
    industry: [saas, ai, finance]
    color: [indigo, two-tone]

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
  brand: "#4a5bd4"
  support: "#18a9a0"
  canvas: "#ffffff"
  ink: "#1c2430"
  muted: "#5a6473"
  surface: "#f4f6fb"
  hairline: "#dfe3ee"
  on-brand: "#ffffff"

typography:
  display:
    fontFamily: "Inter, 'Noto Sans JP', sans-serif"
    fontSize: 64px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.02em
  slide-title:
    fontFamily: "Inter, 'Noto Sans JP', sans-serif"
    fontSize: 44px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.01em
  section-heading:
    fontFamily: "Inter, 'Noto Sans JP', sans-serif"
    fontSize: 26px
    fontWeight: 600
    lineHeight: 1.35
  lead:
    fontFamily: "Inter, 'Noto Sans JP', sans-serif"
    fontSize: 20px
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: "Inter, 'Noto Sans JP', sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  kicker:
    fontFamily: "Inter, 'Noto Sans JP', sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.12em
  kpi-number:
    fontFamily: "Inter, 'Noto Sans JP', sans-serif"
    fontSize: 160px
    fontWeight: 700
    lineHeight: 1.0
    letterSpacing: -0.03em
  kpi-label:
    fontFamily: "Inter, 'Noto Sans JP', sans-serif"
    fontSize: 20px
    fontWeight: 500
    lineHeight: 1.4
  caption:
    fontFamily: "Inter, 'Noto Sans JP', sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0.02em

rounded:
  none: 0px
  sm: 8px
  md: 12px
  lg: 16px
  full: 9999px

spacing:
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  margin: 120px

layouts:
  cover:
    description: "中央寄せのロゴ＋タイトル。ブランド地（indigo）または白地のいずれか。kicker→ロゴ→display title→日付を縦に等間隔で積む。全要素が中央軸に整列。"
    uses: [logo, display, kicker, caption]
  agenda:
    description: "番号付きの目次。各行は『2桁番号チップ＋タイトル＋ヘアライン』で構成され、行高・余白が完全に同一。等間隔で縦に反復。"
    uses: [slide-title, agenda-row, number-chip]
  big-number:
    description: "ひとつのKPIを中央に。kicker→巨大数値（brand）→ラベル→補足の1文を中央軸で積む。スマートアーキタイプ『big number』。"
    uses: [kicker, kpi-number, kpi-label, caption]
  smart-comparison:
    description: "2つの等幅カラム。各カラムは塗りのヘッダーバンド＋ヘアライン区切りの行。左右の行数・行高が必ず一致して自己整列。推奨側は brand 塗りヘッダー。"
    uses: [slide-title, compare-column, row, badge]
  timeline:
    description: "横方向のマイルストーン。インラインSVGの水平ラインと等間隔のドットを置き、各ノードに日付＋ラベルを上下交互ではなく同一ベースラインで揃える。"
    uses: [slide-title, timeline-svg, milestone]
  process:
    description: "等間隔のステップ。番号チップ＋見出し＋本文の同一サイズカードを横に反復。ステップ間に細い矢印やドットで連結。"
    uses: [slide-title, step-card, number-chip]
  closing:
    description: "表紙と対のブランド地。中央に短い締めメッセージ＋連絡先キャプション。表紙と同じ中央軸・同じ余白リズム。"
    uses: [display, kicker, caption]

components:
  logo:
    typography: "{typography.kicker}"
    textColor: "{colors.ink}"
  display:
    typography: "{typography.display}"
    textColor: "{colors.ink}"
  slide-title:
    typography: "{typography.slide-title}"
    textColor: "{colors.ink}"
  kicker:
    typography: "{typography.kicker}"
    textColor: "{colors.brand}"
  number-chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.brand}"
    rounded: "{rounded.md}"
    padding: 8px 16px
  badge:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.on-brand}"
    rounded: "{rounded.full}"
    padding: 6px 16px
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: 40px
  compare-header:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: 24px
  compare-header-strong:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.on-brand}"
    rounded: "{rounded.md}"
    padding: 24px
  hairline:
    borderColor: "{colors.hairline}"
  kpi-number:
    typography: "{typography.kpi-number}"
    textColor: "{colors.brand}"
  caption:
    typography: "{typography.caption}"
    textColor: "{colors.muted}"

components-note: "重要度は塗り（brand chip / brand header / badge）で示す。色付き左縦ライン（border-left）は使わない。supportのtealは線・ドット・小面積アクセント専用（白地テキストには使わない）。"
---

# Systematic Auto-Layout (構造優先のスマートテンプレート)

## Overview

Beautiful.ai が広めた **「構造優先（structure-first）」** の流派です。ユーザーは中身（構造）だけを与え、システムが**間隔・整列・反復を機械的に強制**する。色はロックされたブランドパレットが全スライドへ一律適用され、比較・タイムライン・大数値といった**スマートアーキタイプ**が自己整列します。結果として、誰が作っても崩れない「終始オンブランド」な定例ビジネスレビューになります。

この流派の署名は、派手な装飾ではなく **完璧な整列（alignment）と反復（repetition）** そのものです。等しいマージン、等しいギャップ、全スライドで再利用される厳格なタイプスケール。落ち着き（calm）と一貫性（consistency）が最大の価値であり、各要素は必ずグリッドにスナップします。

ここでは架空企業 **「Northgrid（ノースグリッド）」** の四半期ビジネスレビューを題材に再構築します（社名・コピーはすべてオリジナル）。

**Key Characteristics:**
- ロックされたパレット：canvas 白／ink／**brand=indigo 1色**＋**support=teal 1色**のみ。多色を散らさない。
- 厳格なタイプスケール（44/26/20/16）を全スライドで再利用。即興のサイズを作らない。
- 8px の間隔リズムと等しいマージン（120px セーフエリア）。全要素がグリッドにスナップ。
- 等サイズのカード・等間隔の行・左右対称の比較カラム。
- スマートアーキタイプ：comparison（2等幅）／timeline（水平）／big-number（中央1数値）／process（等間隔ステップ）。
- 階層は**サイズと太さ**だけで作る（色やラインで叫ばない）。
- 重要度は塗り（brand chip／brand header／badge）で示す。border-left の色ラインは使わない。

## Colors

- **Brand / Indigo** ({colors.brand} — #4a5bd4): 唯一の主役色。見出しアクセント・KPI数値・比較の推奨ヘッダー・番号チップの文字。白上 5.62:1（AA）。
- **Support / Teal** ({colors.support} — #18a9a0): 補助の1色。**線・タイムラインのドット・小面積の塗りアクセント専用**。白地テキスト（2.91:1）には使わない。
- **Canvas** ({colors.canvas} — #ffffff): 全コンテンツ面の地。
- **Ink** ({colors.ink} — #1c2430): 見出し・本文の基本色。白上 15.62:1（AAA）。
- **Muted** ({colors.muted} — #5a6473): キャプション・補助テキスト・脚注。白上 5.99:1／surface 上 5.54:1（ともにAA）。
- **Surface** ({colors.surface} — #f4f6fb): カード・チップ・比較通常ヘッダーの地（淡い indigo-tint）。
- **Hairline** ({colors.hairline} — #dfe3ee): 罫線・行区切り・境界。

> コントラスト検証: ink/canvas ≈ 15.6:1（AAA）。muted/canvas ≈ 6.0:1（AA）。brand/canvas ≈ 5.6:1（AA）。on-brand white/brand ≈ 5.6:1（AA）。teal は装飾専用（テキスト不可）。

## Typography

フォントは **Inter ＋ Noto Sans JP の1ペアのみ**。見出しは 700、サブ見出しは 600、本文は 400。スケールは **44 / 26 / 20 / 16**（＋ display 64・KPI 160・kicker/caption の補助）を全スライドで厳守し、即興サイズを作りません。階層は色ではなく**サイズと太さ**で表現します。

| Token | Size | Weight | LineHeight | Use |
|---|---|---|---|---|
| display | 64px | 700 | 1.1 | 表紙・締めの大見出し |
| kpi-number | 160px | 700 | 1.0 | big-number の単一KPI |
| slide-title | 44px | 700 | 1.2 | 各スライドの見出し |
| section-heading | 26px | 600 | 1.35 | カード/カラムの小見出し |
| lead | 20px | 400 | 1.6 | リード文・KPIラベル |
| body | 16px | 400 | 1.6 | 本文 |
| kicker | 16px | 600 | 1.2 | アイブロー（大文字・トラッキング） |
| caption | 14px | 500 | 1.4 | 脚注・フッター・日付 |

**原則**: kicker は大文字＋トラッキング 0.12em。見出しは句点を付けない（淡々と短く）。和文未解決時は PPTX 側で Arial フォールバックになる前提でウェイト差を確保。

## Layout & Grid

台紙 1920×1080、**セーフエリア 120px**（全スライド共通）、12カラム・ガター24px、ベースライン 8px。コンテンツは「kicker →（任意）slide-title → 本体 → フッター（ページ番号／セクション）」の順で、**スライド間で余白量・整列・行高を一切変えない**のがこの流派の核心です。情報密度は **medium**。すべての要素が 8px グリッドにスナップし、等しいギャップで反復します。

## Slide Layouts

- **cover**: ブランド地 or 白地に、kicker→ロゴ→display title→日付を中央軸で等間隔に積む。
- **agenda**: 番号チップ＋タイトル＋ヘアラインの行を、同一行高で等間隔反復。
- **big-number**: 単一KPI（160px・brand）を中央に。kicker→数値→ラベル→補足。
- **smart-comparison**: 2等幅カラム。塗りヘッダーバンド＋ヘアライン行。左右の行数を必ず一致させる。
- **timeline**: 水平ラインと等間隔ドット（インラインSVG）。各マイルストーンを同一ベースラインで整列。
- **process**: 等サイズの番号付きステップカードを横に反復。間をドット/矢印で連結。
- **closing**: 表紙と対のブランド地。中央に締めメッセージ＋連絡先。

## Elevation & Depth

ほぼフラット。影は**極めて控えめ**（`0 8px 24px rgba(28,36,48,.06)` 程度）か、影なしで**surface の塗り分け**と**ヘアライン**だけで階層を作るのが基本です。立体感より「整列の正確さ」で秩序を見せます。グローやガラス質は使いません。

## Shapes

角丸は中庸（8〜16px、チップ/バッジは full）。図形言語は角丸矩形・ピル・水平ライン・ドット。すべて同じ角丸半径ファミリで統一し、カードは必ず**等サイズ**。写真は使う場合も同一アスペクト・同一角丸で揃える。

## Components

- **logo**: kicker スケールの社名ロゴタイプ（ink）。
- **display**: 表紙/締めの大見出し（白地は ink、ブランド地は white）。
- **slide-title**: 各スライド見出し（44px・700・ink・句点なし）。
- **kicker**: brand 色の大文字アイブロー（トラッキング 0.12em）。
- **number-chip**: surface 地＋brand 文字の角丸番号チップ（agenda/process）。
- **badge**: brand 塗りのピル（「推奨」等のラベル）。
- **card / step-card**: surface 地・大角丸・等サイズ。
- **compare-header / -strong**: 比較カラムの塗りヘッダー（通常=surface、推奨=brand）。
- **hairline**: 行・カラムの区切り罫線。
- **kpi-number**: 中央の単一大数値（brand）。
- **caption**: muted の脚注・フッター・日付。

## Motion

PPTX 上のアニメは限定的（[HTML_INPUT_SPEC](../HTML_INPUT_SPEC.md) §9.4：CSS アニメ/トランジションは現在の視覚状態のみ書き出し）。この流派は元来モーションに依存せず、**静的な整列と反復**でリズムを作るため、書き出し後もデザイン意図が損なわれません。必要なら PowerPoint 側で全スライド共通の控えめなフェードのみ付与します。

## Do's and Don'ts

- **Do**: パレットを brand 1色＋support 1色に固定し、全スライドへ一律適用する。
- **Do**: タイプスケール（44/26/20/16）と 8px リズムを全スライドで厳守する。
- **Do**: カードは等サイズ、比較は左右等幅・同行数、マージンは全スライド同一に。
- **Do**: 重要度は brand 塗りのチップ/ヘッダー/バッジで示す。
- **Do**: support の teal は線・ドット・小面積アクセントだけに使う。
- **Don't**: 即興のフォントサイズ・色・余白を1枚だけ作らない（一貫性が崩れる）。
- **Don't**: border-left の色ラインで重要度を示さない（塗りで示す）。
- **Don't**: teal を白地のテキスト色に使わない（2.91:1・AA未満）。
- **Don't**: 絵文字アイコンを使わない（インラインSVGのラインアイコンで）。
- **Don't**: グロー/ガラス/多色グラデで“盛らない”（calm を保つ）。

## Agent Prompt Guide

> **Quick palette**: brand=indigo `#4a5bd4` ／ support=teal `#18a9a0`（線/ドット専用）／ ink `#1c2430` ／ muted `#5a6473` ／ surface `#f4f6fb` ／ canvas `#ffffff`。Font: Inter + Noto Sans JP。Scale: 44/26/20/16（display 64・KPI 160）。Margin 120px・8px rhythm。
>
> **Prompt**: 「Beautiful.ai 風の“構造優先スマートテンプレート”で作って。ロックしたパレット（indigo #4a5bd4 を主役1色、teal #18a9a0 を線/ドットの補助1色、ink #1c2430、muted #5a6473、surface #f4f6fb、白地）を全スライドへ一律適用。タイプは Inter+Noto Sans JP の1ペアで、スケールは 44/26/20/16 を厳守（即興サイズ禁止）。セーフエリア120px・8pxリズムで全要素をグリッドにスナップし、マージン・行高・ギャップを全スライドで同一にする。スマートアーキタイプを使う：cover(中央軸ロゴ＋タイトル)／agenda(番号チップ＋ヘアラインの等間隔行)／big-number(中央に単一KPIをindigoで)／smart-comparison(2等幅カラム＋塗りヘッダーバンド＋ヘアライン行、推奨側はindigo塗り)／timeline(水平ライン＋等間隔ドットのインラインSVG)／process(等サイズの番号付きステップ)／closing(表紙と対のindigo地)。重要度は塗りチップ/ヘッダー/バッジで示し、border-leftの色ラインは使わない。アイコンはインラインSVGのライングリフ、絵文字は禁止。装飾より整列と反復が署名。」

## HTML→PPTX Notes

- 角丸矩形・チップ・バッジ・比較ヘッダー・本文はネイティブ図形/テキストになる（[HTML_INPUT_SPEC](../HTML_INPUT_SPEC.md) §8.1）。
- タイムラインの水平ライン・ドットは**インラインSVGで literal hex** を指定（`var()` は SVG 属性内で無効化されるため使わない）。
- 影は控えめに留める（強い blur はラスタ化されやすい §8.4）。この流派はほぼフラットなので影に依存しない設計が有利。
- 図解・比較は `<table>` を使わず div＋flex/grid で組む（装飾的な表はネイティブ表化を避ける方針）。
- `background-clip: text` は非対応のため使わない。グラデは標準 `linear-gradient` のみ、本流派では原則ベタ塗り。

## Iteration Guide

1. まずパレット（brand 1色＋support 1色）とタイプスケールを**ロック**する。以後ここは触らない。
2. cover の中央軸・余白リズム（120px / 8px）を決め、それを全スライドの基準にする。
3. 必要なスマートアーキタイプ（comparison / timeline / big-number / process）だけを選び、各々の「等間隔・等幅・同行数」ルールを守る。
4. 色を足したくなったら、まず brand の濃淡や surface・hairline で表現できないか検討する（多色化しない）。
5. 1枚だけ例外を作りたくなったら、スケール/マージンを変えるのではなく**アーキタイプを差し替える**。

## References / 参考にした流派・出典

- **参考にした流派**: Beautiful.ai のデザイン哲学 — smart templates / structure-first auto-layout（システムが間隔・整列・反復を強制し、ロックしたブランドで一貫性を担保する思想）。[Best presentation software（Beautiful.ai blog）](https://www.beautiful.ai/blog/best-presentation-software)。
- **起点（Slideland 経由の傾向）**: #信頼感 / #クリア 系の SaaS 会社紹介スライドに見られる、ロックされた2色・整然としたカードUI・等間隔レイアウトの設計言語を研究。
- **視覚的な署名**: 完璧な整列と反復 / ロックした indigo＋teal の2色 / 等サイズカード・等幅比較 / 番号チップとヘアライン行 / 水平タイムライン。
- 内容（社名 Northgrid・コピー・図解）はすべてオリジナルで、特定企業のスライド文言・ロゴ・図版は複製していません。配色・余白・タイポ・レイアウトのエッセンスのみ抽出しています。

> 注: 実スライドの文言・ロゴ・図版は複製していません。比較ビューア（[`../_viewer/index.html`](../_viewer/index.html)）で確認できます。
