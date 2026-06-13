---
version: alpha
name: Editorial / Magazine (エディトリアル・マガジン)
description: 上質なブランドブック／統合報告書のスプレッドに代表される、温かくミニマルで手触りのあるエディトリアル様式。生成り色の地（warm off-white）に、セリフ体の大見出し・ドロップキャップ・プルクオート・多段組み本文・キャプション付き図版を、寛大な余白とヘアラインで構成する。アクセントはテラコッタ／ブラウン1色のみ。静かで誠実、雑誌のような読み物としての品格を持つ。

meta:
  archetype: editorial-magazine
  origin: ライフスタイル/工芸ブランドのブランドジャーナル・統合報告書スプレッド（雑誌組版／エディトリアルデザイン）
  locale: ja
  density: medium
  mood: [warm, calm, editorial, tactile, honest, refined]
  tags:
    style: [minimal, editorial, natural, warm, luxury]
    docType: [brand-book, integrated-report, magazine, company-intro, culture]
    industry: [lifestyle, craft, retail, food, hospitality]
    color: [brown, natural, off-white, two-tone]

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
  gutter: 32px
  margin: 120px
  baseline: 8px

colors:
  canvas: "#f6f3ee"
  ink: "#2b2724"
  ink-deep: "#1c1815"
  muted: "#8c847a"
  accent: "#9a6a3c"
  hairline: "#e2dcd2"
  surface: "#efeae1"
  on-accent: "#f6f3ee"

typography:
  masthead:
    fontFamily: "'Noto Serif JP', Georgia, 'Times New Roman', serif"
    fontSize: 132px
    fontWeight: 600
    lineHeight: 1.04
    letterSpacing: -0.015em
  headline:
    fontFamily: "'Noto Serif JP', Georgia, 'Times New Roman', serif"
    fontSize: 64px
    fontWeight: 600
    lineHeight: 1.18
    letterSpacing: -0.01em
  pull-quote:
    fontFamily: "'Noto Serif JP', Georgia, 'Times New Roman', serif"
    fontSize: 76px
    fontWeight: 500
    lineHeight: 1.32
    letterSpacing: -0.005em
  kicker:
    fontFamily: "'Noto Sans JP', Inter, sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.22em
  section-number:
    fontFamily: "Georgia, 'Times New Roman', serif"
    fontSize: 40px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0
  lead:
    fontFamily: "'Noto Serif JP', Georgia, serif"
    fontSize: 28px
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: 0
  body:
    fontFamily: "'Noto Sans JP', Inter, sans-serif"
    fontSize: 19px
    fontWeight: 400
    lineHeight: 1.95
    letterSpacing: 0
  drop-cap:
    fontFamily: "'Noto Serif JP', Georgia, serif"
    fontSize: 116px
    fontWeight: 600
    lineHeight: 0.82
    letterSpacing: 0
  caption:
    fontFamily: "'Noto Sans JP', Inter, sans-serif"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0.01em
  figure-number:
    fontFamily: "Georgia, 'Times New Roman', serif"
    fontSize: 64px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: -0.01em
  figure-label:
    fontFamily: "'Noto Sans JP', Inter, sans-serif"
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: 0.01em
  folio:
    fontFamily: "'Noto Sans JP', Inter, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0.14em

rounded:
  none: 0px
  sm: 2px
  md: 4px
  full: 9999px

spacing:
  xs: 8px
  sm: 16px
  md: 28px
  lg: 48px
  xl: 80px
  margin: 120px

layouts:
  cover:
    description: "★署名レイアウト。生成り地の全面に、上にトラッキングしたkicker（小キャップ）とヘアライン、中央〜下にセリフ体の巨大マストヘッド。右上または下にIssue番号・発行日のコロフォン。フルブリードのトーナルグラデ図版領域を半分に組むことも可。"
    uses: [kicker, masthead, hairline, colophon]
  contents:
    description: "目次。セリフ体の見出し＋番号付きリスト（Georgia数字＋和文タイトル＋ヘアライン＋ページ番号）。右に小さな扉言葉（marginalia）。"
    uses: [headline, contents-row, hairline, folio]
  feature-opener:
    description: "特集の扉＋本文導入。左に大きなセリフ見出し＋ドロップキャップ始まりの2段組み本文、右にキャプション付きの図版領域（トーナルグラデ or フラットSVG）。"
    uses: [kicker, headline, drop-cap, body-column, figure, caption]
  pull-quote:
    description: "中央寄せの巨大セリフ引用。冒頭にテラコッタの引用マーク（“）、下に署名（— 名前／肩書）。余白を大きく取り静けさを出す。"
    uses: [pull-quote, accent-mark, attribution]
  gallery:
    description: "3-up のキャプション付き図版カード。各カードはトーナルグラデ or フラットSVGの図版＋小見出し＋キャプション。ヘアラインで仕切る。"
    uses: [headline, figure, caption]
  figures:
    description: "データ／図表のスプレッド。div+flexで組む抑制された数値群（figure-number＋label＋ヘアライン）。色は最小限、テラコッタは1点強調のみ。"
    uses: [headline, figure-number, figure-label, hairline]
  colophon:
    description: "締め（奥付風サインオフ）。短いセリフのメッセージ＋発行情報（発行者・号・日付・連絡先）をヘアラインで区切って静かに置く。"
    uses: [headline, colophon, hairline]

components:
  kicker:
    typography: "{typography.kicker}"
    textColor: "{colors.accent}"
  masthead:
    typography: "{typography.masthead}"
    textColor: "{colors.ink-deep}"
  headline:
    typography: "{typography.headline}"
    textColor: "{colors.ink}"
  pull-quote:
    typography: "{typography.pull-quote}"
    textColor: "{colors.ink-deep}"
  drop-cap:
    typography: "{typography.drop-cap}"
    textColor: "{colors.accent}"
  body:
    typography: "{typography.body}"
    textColor: "{colors.ink}"
  lead:
    typography: "{typography.lead}"
    textColor: "{colors.ink}"
  caption:
    typography: "{typography.caption}"
    textColor: "{colors.muted}"
  figure:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.none}"
  hairline:
    backgroundColor: "{colors.hairline}"
  accent-mark:
    textColor: "{colors.accent}"
  folio:
    typography: "{typography.folio}"
    textColor: "{colors.muted}"

components-note: "重要度は塗りチップ・テラコッタ1色の差し色・ヘアラインで示す（色付き左縦ライン=border-left は使わない）。装飾は引き算で。"
---

# Editorial / Magazine (エディトリアル・マガジン)

## Overview

上質なブランドブックや統合報告書のスプレッド、あるいはライフスタイル/工芸ブランドが出す「ブランドジャーナル」に典型的な、**温かくミニマルで手触りのある**エディトリアル様式です。情報を「資料」ではなく「読み物」として扱い、生成り色（warm off-white）の地に、セリフ体の見出しと多段組みの本文、キャプション付きの図版、ページ番号と章名のフッターを、雑誌の組版そのままに配置します。

署名的な要素は4つ。(1) **生成り地＋セリフ体マストヘッド**による静かな表紙、(2) **小キャップでトラッキングしたkicker＋セリフ大見出し＋ドロップキャップ**で始まる本文、(3) **テラコッタ／ブラウン1色だけ**を差し色に使う禁欲的な配色、(4) **ヘアラインとキャプション**でリズムを刻む図版・データ面。会社/ブランド紹介、カルチャーブック、統合報告書、サービスの世界観提示に最適です。

**Key Characteristics:**
- 地は生成り色 `#f6f3ee`、文字は温かみのあるチャコール `#2b2724`。原色は使わない。
- 見出し・引用・マストヘッドは**セリフ体**（Noto Serif JP / Georgia）。ラベルとキャプションだけサンセリフ。
- 差し色は**テラコッタ `#9a6a3c` の1色のみ**。kicker・引用マーク・図版の1点強調に限定。
- 雑誌グリッド＝寛大なマージン（120px）、多段組み本文、プルクオート、キャプション付き図版、マージナリア。
- ドロップキャップ・小キャップkicker・Georgiaの章番号でエディトリアルな階層を作る。
- フッターは `号・章名 …… ページ番号（folio）`。罫線は細いヘアラインのみ。
- 重要度は border-left の色ラインではなく、塗りチップ／テラコッタの差し色／ヘアラインで示す。

## Colors

- **Canvas** ({colors.canvas} — #f6f3ee): 全面の地。温かい生成り色（warm off-white）。
- **Ink** ({colors.ink} — #2b2724): 本文・見出しの基本色（warm charcoal）。
- **Ink-deep** ({colors.ink-deep} — #1c1815): マストヘッド・引用など最強調の濃いインク。
- **Muted** ({colors.muted} — #8c847a): キャプション・補助・フッター（muted warm grey）。
- **Accent / Terracotta** ({colors.accent} — #9a6a3c): 唯一の差し色。kicker・引用マーク・図版の1点強調・章番号。
- **Hairline** ({colors.hairline} — #e2dcd2): 罫線・仕切り・図版枠の細線。
- **Surface** ({colors.surface} — #efeae1): 図版プレースホルダ／淡い面の地（地よりわずかに沈める）。
- **On-accent** ({colors.on-accent} — #f6f3ee): テラコッタ塗りの上に載せる文字色（生成り）。

> コントラスト: ink/canvas ≈ 11:1（AAA）。muted/canvas ≈ 4.6:1（本文補助でAA）。accent/canvas ≈ 4.7:1（テラコッタ文字も本文サイズでAA）。本文はすべて 4.5:1 以上を満たす。

## Typography

見出し・引用・マストヘッドは**セリフ体**（和文＝Noto Serif JP、欧文/数字＝Georgia）で、ゆったりと寛大に。ラベル（kicker）とキャプションだけ**サンセリフ**（Noto Sans JP / Inter）にして、編集者の声と図版の注釈を区別します。本文はサンセリフ・行間広め（1.95）で長文を読ませます。章番号や図番号は Georgia のオールドスタイル数字の佇まいを借ります。

| Token | Size | Weight | Use |
|---|---|---|---|
| masthead | 132px | 600 | 表紙の巨大セリフ題字 |
| pull-quote | 76px | 500 | 中央寄せの大引用 |
| headline | 64px | 600 | 各面のセリフ大見出し |
| section-number | 40px | 500 | 目次・章の番号（Georgia） |
| lead | 28px | 400 | セリフのリード文 |
| drop-cap | 116px | 600 | 段落冒頭のドロップキャップ（テラコッタ） |
| body | 19px | 400 | 多段組み本文（サンセリフ・行間1.95） |
| caption | 15px | 400 | 図版キャプション（サンセリフ・muted） |
| kicker | 18px | 600 | 小キャップ・トラッキング0.22em（テラコッタ） |
| folio | 14px | 500 | フッターのページ番号・章名 |

**原則**: 見出しはセリフ・寛大・低コントラストの色（ink）。強調は**色を散らさず**、テラコッタ1色とウェイト・サイズの差でつける。kicker は必ず `text-transform: uppercase` ＋広いトラッキングで「小キャップ」に。本文は1段あたり全角28〜34文字を目安に2段組みで組む。

**和文代替フォント**: Noto Serif JP が未解決のときは Georgia → 游明朝 → ヒラギノ明朝の順でフォールバックする想定。PPTX 側でセリフが Arial に落ちると様式が崩れるため、見出しは実テキストで保持しつつ、フォント未解決時も「明朝系が出る」フォントスタックを優先する。

## Layout & Grid

台紙 1920×1080、マージン **120px**（寛大）、12カラム・ガター32px。本文面は「左上 kicker → セリフ見出し → 2段組み本文／図版 → フッター（章名・folio）」。情報密度は **medium**（IRより軽く、余白で呼吸させる）。罫線は 1px のヘアライン `#e2dcd2` のみ。角丸はほぼ使わず（none〜sm）、紙面の直線的な品格を保つ。フルブリードの図版領域は左右いずれか半分に置き、テキスト段と対比させる。

## Slide Layouts

- **cover（署名）**: 生成り全面＋小キャップkicker＋ヘアライン＋セリフ巨大マストヘッド＋コロフォン（号・日付）。
- **contents**: セリフ見出し＋番号付きリスト（Georgia数字＋和文タイトル＋ヘアライン＋folio）。右に扉言葉。
- **feature-opener**: 左にセリフ大見出し＋ドロップキャップ始まりの2段組み本文、右にキャプション付き図版。
- **pull-quote**: 中央の巨大セリフ引用＋テラコッタの引用マーク＋署名。大きな余白。
- **gallery**: 3-up のキャプション付き図版カード。ヘアラインで仕切る。
- **figures**: データ／図表スプレッド。div+flex の抑制された数値群、テラコッタは1点強調のみ。
- **colophon**: 奥付風サインオフ。短いセリフ＋発行情報をヘアラインで区切る。

## Elevation & Depth

**フラット（紙の平面）が原則**。影（box-shadow）は使わず、階層は「ヘアラインの罫線」「地とわずかに沈めた surface 面のトーン差」「余白の大小」で表現する。図版領域は影で浮かせず、ヘアライン枠 or 地より一段沈んだトーンで「紙に刷られた図版」のように扱う。立体・グロー・ガラスは様式に反するため使わない。

## Shapes

角丸はほぼ使わない（直角〜2px）。図形言語は**矩形・直線・ヘアライン・薄い円**。図版プレースホルダは矩形の中にフラットなSVGイラスト（葉・器・木目・等高線など）やトーナルな `linear-gradient` を置く。引用マーク（“）やフィギュア番号など、文字そのものをグラフィック要素として使うのがこの様式の手触り。アイコンは細い単線（ink or accent）。

## Components

- **kicker**: サンセリフ・小キャップ・トラッキング0.22em・テラコッタ。各面の左上に。
- **masthead**: セリフ・600・超大。表紙のみ。ink-deep。
- **headline**: セリフ・600・各面の大見出し。ink。
- **drop-cap**: 段落冒頭1文字をセリフ大・テラコッタで。本文に float させる。
- **body**: サンセリフ・行間1.95・2段組み。
- **pull-quote / accent-mark**: 中央の大引用＋テラコッタの引用マーク（文字“）。
- **figure / caption**: 矩形図版（surface or トーナルグラデ＋SVG）＋サンセリフ caption（muted）。図版の上か下に「Fig. n」ラベル。
- **hairline**: 1px `#e2dcd2`。仕切り・目次の罫・フッター上の区切り。
- **folio**: フッター左に章名、右にページ番号。muted・トラッキング広め。

## Motion

PPTX ではアニメーションは限定的（[HTML_INPUT_SPEC](../HTML_INPUT_SPEC.md) §9.4）。この様式は**静けさ**が本質なので、動きは設けない。リズムは「ページをめくる」連続性＝面ごとに余白量・図版位置を変えて緩急をつける構成上のリズムで作る。

## Do's and Don'ts

- **Do**: 地は生成り、文字は warm charcoal。差し色はテラコッタ**1色だけ**に絞る。
- **Do**: 見出し・引用はセリフで寛大に。kicker とキャプションだけサンセリフ。
- **Do**: ドロップキャップ・小キャップkicker・Georgia数字でエディトリアルな階層を作る。
- **Do**: 余白を恐れない。マージン120px、図版とテキストを対比させる。
- **Do**: フッターに章名・folio を常設。罫線はヘアラインのみ。
- **Don't**: 原色・多色のグラデ・ネオンを使わない（温かいトーンに統一）。
- **Don't**: 影・ガラス・グローで立体化しない（紙の平面を保つ）。
- **Don't**: 全部をサンセリフにしない（セリフが消えると様式が崩れる）。
- **Don't**: border-left の色ラインで重要度を示さない（テラコッタの差し色／チップ／ヘアラインで）。

## Agent Prompt Guide

> **Quick palette**: canvas `#f6f3ee` ／ ink `#2b2724` ／ ink-deep `#1c1815` ／ muted `#8c847a` ／ accent(terracotta) `#9a6a3c` ／ hairline `#e2dcd2` ／ surface `#efeae1`。Font: 見出し/引用=Noto Serif JP・Georgia（セリフ）、ラベル/本文=Noto Sans JP・Inter。マージン120px・角丸なし・影なし。
>
> **Prompt**: 「温かくミニマルなエディトリアル/マガジン様式（上質なブランドブック／統合報告書のスプレッド）で作って。地は生成り色(#f6f3ee)、文字は warm charcoal(#2b2724)、差し色はテラコッタ(#9a6a3c)1色だけ。表紙は生成り全面に、上に小キャップでトラッキングした英字kicker＋細いヘアライン、中央〜下にセリフ体の巨大マストヘッド、隅に『号・発行日』のコロフォン。本文面は左上に小キャップkicker(テラコッタ)→セリフ大見出し→ドロップキャップ(テラコッタ)始まりの2段組み本文、右にキャプション付きの図版領域(トーナルな linear-gradient か フラットなSVGイラスト＋『Fig. n』ラベル)。プルクオート面は中央に巨大セリフ引用＋テラコッタの引用マーク＋署名。データ面は div+flex で抑制された数値群(Georgiaの大数字＋サンセリフのラベル＋ヘアライン)、テラコッタは1点強調のみ。フッターは『章名 …… ページ番号』。罫線はヘアラインのみ、角丸・影は使わない。セリフとサンセリフを必ず使い分ける。」

## HTML→PPTX Notes

- セリフ見出し・本文・キャプション・ヘアライン・数値はネイティブのテキスト／図形になる。**見出しは必ず実テキスト**で置き、編集可能性を確保する。
- 図版領域のトーナルグラデは標準 `linear-gradient(...)` を使う。複雑なマスク／blend／clip は避ける（[HTML_INPUT_SPEC](../HTML_INPUT_SPEC.md) §9.3）。フラットなイラストは**インラインSVG**で（ベクター保持されやすい）。
- ドロップキャップは `float` した `<span>` の大文字で表現する（`background-clip:text` は使わない）。
- 図表・目次は `<table>` を使わず **div＋flex/grid** で組む（装飾的な表はネイティブ表が崩れやすいため）。
- セリフフォントが PPTX 側で Arial に落ちると様式が壊れる。フォントスタックに Georgia / 明朝系を必ず含め、フォント未解決時も明朝が出るようにする。
- 影は使わない方針なのでラスタ化要因が少なく、編集可能なネイティブ要素として書き出されやすい。

## Iteration Guide

1. まず表紙の「静けさ」（生成り地＋セリフ巨大マストヘッド＋小キャップkicker）を決める。
2. 見出しの口調（セリフ・寛大・ink）と差し色（テラコッタ1色）を固定する。
3. 本文面は feature-opener（ドロップキャップ＋2段組み＋図版）の型に当てはめる。
4. 色を足したくなったら、まずテラコッタの濃淡・トーン差・ヘアラインで表現できないか検討する。
5. セリフ／サンセリフの使い分けが崩れていないか（見出し=セリフ、ラベル/キャプション=サンセリフ）を毎面チェックする。

## References / 参考にした流派・出典

- **参考にした流派**: ライフスタイル/工芸ブランドのブランドジャーナル・統合報告書スプレッド（雑誌組版／エディトリアルデザイン）。温かいトーン、セリフ体の組版、寛大な余白、キャプション付き図版。
- **視覚的な署名**: 生成り地＋セリフ巨大マストヘッド ／ 小キャップkicker＋ドロップキャップ ／ テラコッタ1色の差し色 ／ プルクオート ／ ヘアラインとキャプションで刻むリズム。
- **起点（Slideland 経由の実資料）**: [無印良品 MUJI REPORT 2025（株式会社良品計画）](https://www.ryohin-keikaku.jp/pdf/sustainability/muji-sustainability/report/MUJI_REPORT_2025_J.pdf)（#Fashion #Brown #Natural）。温かいニュートラルカラー・余白の取り方・読み物としての組版という**設計言語のみ**を研究し、**内容・写真・ロゴは一切複製せず**、架空のブランド「KINOWA 木輪」のオリジナルのコピー・図版で再構築。

> 注: 実資料の文言・ロゴ・写真・図版は複製していません。配色・余白・タイポ・組版のエッセンス（デザイン言語）のみ抽出しています。
