---
version: alpha
name: Neo-Brutalist / Anti-Design (ネオブルータリズム)
description: 国際的なWeb/デザイン流派「ネオブルータリズム（アンチデザイン）」。太い黒の全周ボーダー、ぼかしゼロのハードオフセットシャドウ（例 box-shadow 10px 10px 0 #000）、誇張した生のグリッド、超特大の癖あるグロテスク見出し、高コントラストのフラットな原色（白/シグナルイエロー地・黒インク・電光ブルー/レッド/ライム）。角丸ゼロ、意図的なノイズと摩擦、自信に満ちた声。架空の開発者ツール/クリエイティブ・テックブランド FORGEKIT 用に再構築。

meta:
  archetype: neo-brutalist
  origin: 2010s〜2020s 国際Web発のネオブルータリズム/アンチデザイン（Gumroad刷新・Figmaコミュニティ等で拡散）。印刷のブルータリズム/スイス・パンク・ウェブ初期HTMLの素朴さの再解釈
  locale: bilingual
  density: low
  mood: [bold, raw, confident, playful, high-contrast, anti-corporate]
  tags:
    style: [bold, dynamic, pop]
    docType: [pitch, service, product-launch, recruit]
    industry: [saas, ai, dev-tool, creative-tech]
    color: [two-tone, primary, yellow, monochrome]

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
  canvas: "#ffffff"
  signal: "#ffe600"
  ink: "#000000"
  shadow: "#000000"
  blue: "#2b4bff"
  red: "#ff3b30"
  lime: "#b8ff3a"
  on-dark: "#ffffff"
  muted: "#3a3a3a"

typography:
  cover-title:
    fontFamily: "Inter, Arial, 'Noto Sans JP', sans-serif"
    fontSize: 188px
    fontWeight: 900
    lineHeight: 0.86
    letterSpacing: -0.04em
  kicker:
    fontFamily: "'Space Mono', ui-monospace, 'Noto Sans JP', monospace"
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0.12em
  statement:
    fontFamily: "Inter, Arial, 'Noto Sans JP', sans-serif"
    fontSize: 116px
    fontWeight: 900
    lineHeight: 0.96
    letterSpacing: -0.03em
  slide-heading:
    fontFamily: "Inter, Arial, 'Noto Sans JP', sans-serif"
    fontSize: 64px
    fontWeight: 900
    lineHeight: 1.0
    letterSpacing: -0.02em
  card-title:
    fontFamily: "Inter, Arial, 'Noto Sans JP', sans-serif"
    fontSize: 32px
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: -0.01em
  label:
    fontFamily: "'Space Mono', ui-monospace, 'Noto Sans JP', monospace"
    fontSize: 17px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0.1em
  lead:
    fontFamily: "Inter, Arial, 'Noto Sans JP', sans-serif"
    fontSize: 26px
    fontWeight: 500
    lineHeight: 1.5
  body:
    fontFamily: "Inter, Arial, 'Noto Sans JP', sans-serif"
    fontSize: 20px
    fontWeight: 500
    lineHeight: 1.55
  kpi-number:
    fontFamily: "Inter, Arial, 'Noto Sans JP', sans-serif"
    fontSize: 380px
    fontWeight: 900
    lineHeight: 0.8
    letterSpacing: -0.05em
  kpi-label:
    fontFamily: "'Space Mono', ui-monospace, 'Noto Sans JP', monospace"
    fontSize: 22px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: 0.06em
  step-number:
    fontFamily: "Inter, Arial, 'Noto Sans JP', sans-serif"
    fontSize: 56px
    fontWeight: 900
    lineHeight: 1.0
  footer:
    fontFamily: "'Space Mono', ui-monospace, 'Noto Sans JP', monospace"
    fontSize: 15px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 0.08em

rounded:
  none: 0px
  full: 9999px

spacing:
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 72px
  margin: 88px
  border: 4px
  drop: 10px

layouts:
  cover:
    description: "★署名レイアウト。シグナルイエローまたは白地。超特大の黒グロテスク見出しを画面いっぱいに。脇に2〜3個のハードシャドウ付き原色ブロック（blue/red/lime）。上にモノラベルのロゴ、下にモノのメタ行。"
    uses: [logo, cover-title, kicker, color-block]
  statement:
    description: "1枚に1行の太い宣言。白地に黒の超特大見出し。1語だけ原色のフルブリードハイライトブロックで囲む。"
    uses: [statement, mark-block]
  feature-blocks:
    description: "3枚の全周ボーダーカード。各カードは10pxハードシャドウ＋モノのラベル＋card-title＋本文。カード地は白/イエロー/原色を割り当て、原色地のときだけ白文字。"
    uses: [card, label, body]
  big-number:
    description: "巨大な数値を全周ボーダーのブロック内に。kpi-number（極大）＋モノのkpi-label。脇に短い補足。"
    uses: [number-block, kpi-number, kpi-label, body]
  comparison:
    description: "2カラムの全周ボーダー。左=旧来/右=FORGEKIT。それぞれハードシャドウ。勝ち側にライム/ブルーの塗りバッジ。"
    uses: [card, label, body, badge]
  process:
    description: "番号付きの全周ボーダーステップ（縦/横）。各ステップは step-number＋見出し＋本文＋ハードシャドウ。"
    uses: [step, step-number, card-title, body]
  closing:
    description: "イエロー or 黒地。中央に短いCTA見出し＋チャンキーなハードシャドウのCTAボタン。下にモノのURL。"
    uses: [statement, cta, footer]

components:
  logo:
    typography: "{typography.label}"
    textColor: "{colors.ink}"
  cover-title:
    typography: "{typography.cover-title}"
    textColor: "{colors.ink}"
  slide-heading:
    typography: "{typography.slide-heading}"
    textColor: "{colors.ink}"
  kicker:
    typography: "{typography.kicker}"
    textColor: "{colors.ink}"
  label:
    typography: "{typography.label}"
    textColor: "{colors.ink}"
  color-block:
    border: "4px solid {colors.ink}"
    rounded: "{rounded.none}"
  card:
    backgroundColor: "{colors.canvas}"
    border: "4px solid {colors.ink}"
    rounded: "{rounded.none}"
    padding: 40px
  number-block:
    backgroundColor: "{colors.signal}"
    border: "4px solid {colors.ink}"
    rounded: "{rounded.none}"
  badge:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
    border: "3px solid {colors.ink}"
    rounded: "{rounded.none}"
    padding: 6px 16px
  cta:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.on-dark}"
    border: "4px solid {colors.ink}"
    rounded: "{rounded.none}"
    padding: 28px 56px
  footer:
    typography: "{typography.footer}"
    textColor: "{colors.ink}"

components-note: "重要度はベタ塗りのカラーブロック/塗りバッジ/太い全周ボーダー＋ハードシャドウで示す（色付きの細い左縦ライン=border-left は意味伝達に使わない）。"
---

# Neo-Brutalist / Anti-Design (ネオブルータリズム)

## Overview

ネオブルータリズム（アンチデザイン）は、2010年代後半から2020年代にかけて国際的なWeb/グラフィックで広まった流派です。整いすぎたコーポレートUIへの反動として、**生のHTMLの素朴さ・印刷ブルータリズム・スイスのグリッド・パンクのDIY感**を再解釈しました。洗練ではなく**自信と手触り**を選び、装飾を削るのではなく、構造そのもの（太いボーダー・色ブロック・影）を主役に押し出します。

署名的な要素は4つ。(1) **太い黒の全周ボーダー（3〜4px）と、ぼかしゼロのハードオフセットシャドウ**（例 `box-shadow: 10px 10px 0 #000`）。(2) **超特大の癖あるグロテスク見出し**（Inter/Arial 800〜900、画面を割るほど大きく）。(3) **高コントラストのフラットな原色**（白/シグナルイエロー地に、電光ブルー・レッド・ライム。グラデなし）。(4) **角丸ゼロ＋モノのラベル**による意図的な摩擦。プロダクトローンチ、開発者ツールの紹介、ピッチ、採用に向きます。架空ブランド **FORGEKIT**（開発者向けクリエイティブ・テック）で再構築しています。

**Key Characteristics:**
- すべての面に**太い黒の全周ボーダー（4px solid #000）＋ハードオフセットシャドウ（10px 10px 0 #000、ぼかし0）**。
- 角丸は**ゼロ**（`border-radius: 0`）。エッジは尖らせる。
- 見出しは**超特大・900・タイト字間**。1スライドに1つの巨大要素。
- 地色は**白 or シグナルイエロー(#ffe600)**。アクセントは**電光ブルー/レッド/ライム**のフラット塗り（グラデ・影のぼかしは使わない）。
- ラベル・メタ・フッターは**モノ（Space Mono）＋大きめ字間**で機能的に。
- 文字色のルール：**白文字は濃い/彩度の高い面（黒・blue・red）にのみ**。イエロー/ライム/白の面には**必ず黒文字**。
- 重要度はベタ塗りブロック/塗りバッジ/太ボーダー＋影で示す（細い左縦ラインは使わない）。

## Colors

- **Canvas** ({colors.canvas} — #ffffff): 標準の地。クリーンな白。
- **Signal** ({colors.signal} — #ffe600): もう一つの地。表紙/締めの掴み。**必ず黒文字**。
- **Ink / Shadow** ({colors.ink} — #000000): 文字・全周ボーダー・ハードシャドウ。純黒で妥協しない。
- **Blue** ({colors.blue} — #2b4bff): 第1アクセント。CTA・主役ブロック。**白文字可**（白/blue ≈ 6.3:1）。
- **Red** ({colors.red} — #ff3b30): 第2アクセント。警告/旧来側の強調。**白文字可**。
- **Lime** ({colors.lime} — #b8ff3a): 第3アクセント。勝ち側バッジ・チップ。**黒文字のみ**。
- **On-dark** ({colors.on-dark} — #ffffff): 濃い面の上の文字。
- **Muted** ({colors.muted} — #3a3a3a): 白地の補助テキスト（白地で ≈ 11:1）。

> コントラスト指針: ink/白・ink/イエロー・ink/ライムはいずれも本文4.5:1を大きく超える（≈ 15〜19:1）。**lime/イエロー地は白文字にしない**（コントラスト不足）。白文字は黒・blue・red の面に限定。

## Typography

見出しは**重いグロテスク（Inter/Arial 800〜900）**を**超特大・タイト字間**で。ラベル/メタは**モノ（Space Mono）**で機能的なテクスチャを作ります。和文は Noto Sans JP の太ウェイトで代替（Inter/Arial 未解決時も Arial フォールバック前提）。

| Token | Size | Weight | Use |
|---|---|---|---|
| cover-title | 188px | 900 | 表紙の超特大見出し |
| kpi-number | 380px | 900 | 巨大数値 |
| statement | 116px | 900 | 1行宣言 |
| slide-heading | 64px | 900 | 各面の見出し |
| card-title | 32px | 800 | カード見出し |
| lead | 26px | 500 | リード文 |
| body | 20px | 500 | 本文 |
| kicker / label | 17–20px | 700 | モノのラベル（字間広め） |
| footer | 15px | 700 | モノのフッター |

**原則**: 見出しは黒・900・極大で**1スライド1主役**。強調は色（フラット塗りブロック/バッジ）で行い、下線やイタリックには頼らない。和文フォントは `'Noto Sans JP'` を必ずスタックに含める。

## Layout & Grid

台紙 1920×1080、マージン 88px、12カラム・ガター24px。グリッドは**生で誇張**し、要素を整列させつつ大胆に余白を割る。各面のスキャフォールドは「モノのロゴ/ラベル → 巨大見出し or ブロック → モノのフッター」。情報密度は **low**（1スライドに巨大要素1つ＋少量の支え）。**角丸ゼロ**。すべてのカード/ブロックは**全周ボーダー＋ハードシャドウ**で“積み木”のように置く。

## Slide Layouts

- **cover（署名）**: イエロー/白地＋超特大の黒見出し＋脇に原色のハードシャドウブロック2〜3個。
- **statement**: 白地に1行の宣言、1語だけ原色のフルブリード塗りで囲む。
- **feature-blocks**: 3枚の全周ボーダーカード（各10pxハードシャドウ＋モノラベル＋本文）。
- **big-number**: 全周ボーダーのブロックに巨大数値＋モノラベル。
- **comparison**: 2カラム全周ボーダー（旧来 vs FORGEKIT）、勝ち側に塗りバッジ。
- **process**: 番号付き全周ボーダーステップ（各ハードシャドウ）。
- **closing**: イエロー/黒地＋チャンキーなハードシャドウCTAボタン。

## Elevation & Depth

奥行きは**ハードオフセットシャドウ（ぼかし0）**のみで作る：`box-shadow: 10px 10px 0 #000`。グラデ影・ソフトシャドウ・グロウは**使わない**。重なりは「ブロックを物理的にずらして黒影を見せる」ことで表現する。全周ボーダー（4px solid #000）が各要素の輪郭を強く定義し、面の前後関係を明示する。フラットだが影で“積層感”を出すのがこの流派の奥行き観。

## Shapes

**角丸ゼロ**（`border-radius: 0`）。図形言語は**矩形・直線・太いボーダー・塗りブロック**。pill/バッジも角を立てる（角丸にしない）。アイコンは**インラインSVGのライングリフ（線2.5〜4px、丸ゼロ）**で、絵文字は使わない。写真を使う場合も**太い黒ボーダー＋ハードシャドウ**で囲み、トリミングは矩形。

## Components

- **cover-title**: 黒・900・超特大。画面を割るスケール。
- **slide-heading**: 黒・900・各面の主役見出し。
- **kicker / label**: モノ・字間広め。ロゴ/メタ/カードラベルに。
- **color-block**: 原色フラット塗り＋4px黒ボーダー＋ハードシャドウ（角丸0）。
- **card**: 白/イエロー/原色地＋4px黒ボーダー＋10pxハードシャドウ。原色地のときだけ白文字。
- **number-block**: イエロー or 白地のボーダーブロックに巨大数値。
- **badge**: ライム/ブルー塗り＋3px黒ボーダーの矩形チップ（勝ち側/ステータス）。
- **cta**: blue 塗り＋白文字＋4px黒ボーダー＋ハードシャドウのチャンキーボタン。
- **footer**: モノ・`ページ / セクション` 左、`FORGEKIT` 右。

## Motion

PPTX ではアニメは限定的（[HTML_INPUT_SPEC](../HTML_INPUT_SPEC.md) §9.4：CSSアニメ/トランジション/ホバーは書き出されない）。構成上のリズムは**ブロックの“ずらし”と影の方向の一貫性**で作る（全カードを同方向にオフセット）。動きを足すなら PPTX 側で「アピア/ワイプ」など最小限に留める。

## Do's and Don'ts

- **Do**: すべての面/カードに**太い黒全周ボーダー＋ハードオフセットシャドウ（ぼかし0）**を付ける。
- **Do**: 見出しは**超特大・900**で1スライド1主役。色はフラットな原色で。
- **Do**: 地は白 or シグナルイエロー。アクセントは blue/red/lime をベタ塗りで。
- **Do**: ラベル/メタ/フッターはモノ（Space Mono）で機能的に。
- **Don't**: 角丸・ソフトシャドウ・グラデ・グロウを使わない（“整い”はこの流派を殺す）。
- **Don't**: **lime/イエロー/白の面に白文字**を置かない（コントラスト不足）。白文字は黒/blue/red 限定。
- **Don't**: 原色を多数同時に散らさない（1面につきアクセントは1〜2色）。
- **Don't**: 絵文字を機能アイコンに使わない（インラインSVGのライングリフで）。
- **Don't**: 色付きの細い左縦ライン（border-left）で重要度を示さない（塗りブロック/バッジ/全周ボーダーで）。

## Agent Prompt Guide

> **Quick palette**: 地 `#ffffff` / シグナルイエロー `#ffe600` ／ インク・影 `#000000` ／ ブルー `#2b4bff` ／ レッド `#ff3b30` ／ ライム `#b8ff3a`。Font: Inter/Arial 900（見出し）＋ Space Mono（ラベル）。角丸0、ボーダー4px solid #000、影 `10px 10px 0 #000`。
>
> **Prompt**: 「ネオブルータリズム/アンチデザインで作って。地は白かシグナルイエロー(#ffe600)、文字は純黒(#000)。すべてのカード・ブロックに太い黒の全周ボーダー(4px solid #000)と、ぼかしゼロのハードオフセットシャドウ(box-shadow: 10px 10px 0 #000)を付ける。角丸は0。見出しは超特大のグロテスク(Inter/Arial 900、画面を割るほど大きく)、ラベルとフッターはモノ(Space Mono、字間広め)。アクセントは電光ブルー(#2b4bff)・レッド(#ff3b30)・ライム(#b8ff3a)のフラット塗り(グラデ・グロウ禁止)。白文字は黒/ブルー/レッドの面だけ、イエロー/ライム/白の面は必ず黒文字。表紙=超特大見出し＋脇に原色のハードシャドウブロック、statement=1行宣言で1語だけ原色塗り、feature=3枚のボーダーカード、big-number=巨大数値ブロック、comparison=旧来vs自社の2カラム＋ライムの勝ちバッジ、process=番号付きボーダーステップ、closing=チャンキーなCTAボタン。重要度は塗り/バッジ/太ボーダーで(色付き左縦ライン禁止)。」

## HTML→PPTX Notes

- カード・ブロック・テキスト・バッジ・CTA は**矩形（角丸0）＝ネイティブ図形/テキスト**になりやすく、編集可能性が高い。
- **ハードオフセットシャドウ（`box-shadow: 10px 10px 0 #000`）はネイティブの図形シャドウとして出るか、ラスタ化される**（[HTML_INPUT_SPEC](../HTML_INPUT_SPEC.md) §8.4）。**ぼかし0・単色・オフセットのみ**に保ち、複数影の重ねや半透明を避けると再現が安定する。代替として、影を「同寸の黒い矩形を背面にオフセット配置」した別レイヤーで作ると確実にネイティブ図形になる（本サンプルは `box-shadow` を使用）。
- 太いボーダーは `border: 4px solid #000` の**単純な実線**にする（点線/二重/画像ボーダーは避ける）。
- アイコンは**インラインSVG（線グリフ、属性はリテラルHEX、SVG内で `var()` を使わない）**。
- `background-clip: text`・blend・mask は使わない（§9.3）。図解・チップは div+flex と SVG で組み、`<table>` は使わない。

## Iteration Guide

1. まず地色（白 or イエロー）と「全周ボーダー＋ハードシャドウ」の物理パラメータ（4px/10px）を固定する。
2. 表紙の“掴み”（超特大見出し＋原色ブロック）を決める。
3. アクセントは blue/red/lime から1面1〜2色に絞り、白文字を置ける面を黒/blue/red に限定する。
4. 影の方向（右下10px等）を全スライドで統一し、ブロックの“ずらし”でリズムを作る。
5. 色を足したくなったら、まず既存の原色のフラット塗りブロックで表現できないか検討する。

## References / 参考にした流派・出典

- **参考にした流派**: ネオブルータリズム（Neo-Brutalism）/ アンチデザイン。これは**国際的なWeb/グラフィックの流派**であり、日本の Slideland（スライド分類）には直接該当するカテゴリが乏しい。最も近いのは **#dynamic / #bold（ダイナミック・大胆）系**で、本定義はそこに分類している。
- **視覚的な署名**: 太い黒の全周ボーダー / ぼかしゼロのハードオフセットシャドウ / 角丸ゼロ / 超特大グロテスク見出し / 高コントラストのフラット原色 / モノのラベル。
- **トレンド出典**: [Brutalism in Graphic Design — Zeka Design](https://www.zekagraphic.com/brutalism-in-graphic-design/)（ブルータリズム/ネオブルータリズムの設計原理と歴史）。源流として印刷のブルータリズム、スイス・タイポグラフィの反転、初期Webの素朴なHTML表現を参照。
- **ブランドは架空**: FORGEKIT は本コレクションのために作った**架空の開発者ツール/クリエイティブ・テックブランド**。実在ブランドの文言・ロゴ・ビジュアルは複製していない。配色・余白・タイポ・レイアウトのエッセンス（流派の解釈）のみを抽出。

> 注: 本定義は公開情報から抽出した「流派の解釈（inspired interpretation）」であり、特定企業の公式アセットではありません（MIT、[SPEC §8](../SPEC.md)）。
</content>
</invoke>
