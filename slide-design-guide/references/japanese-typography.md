# 和文タイポグラフィ・モジュール

「日本ぽさ・上品さ」の8割はタイポで決まる。欧文ツール由来のデフォルトのままだと
「素人の和文組版」に見える。スライド生成時は**この基盤CSSを必ず下敷きにする**。
（html2pptx は内部でヘッドレスChromeでレンダするため、ここのCSSはレンダ時に効く。
PPTXの編集テキストにkerningは完全には移らないが、見た目・サムネ・崩れ防止に効く）

## 0. コピペ基盤CSS（全デッキ共通の下敷き）

```css
/* ---- 和欧混植フォントスタック ---- */
/* ラテン/数字を先頭に書くと、英数はラテン、かな漢字は和文で自動混植される */
:root{
  --jp-gothic: "Inter","Helvetica Neue","Yu Gothic","YuGothic",
               "Hiragino Kaku Gothic ProN","Noto Sans JP",sans-serif;
  --jp-mincho: "Lora","Times New Roman","Yu Mincho","YuMincho",
               "Hiragino Mincho ProN","Noto Serif JP",serif;
}

/* ---- 本文の既定 ---- */
.jp, body{
  font-family: var(--jp-gothic);
  font-feature-settings: "palt" 1;   /* ★詰め組: 約物・かなの余白を自動で詰める＝品の正体 */
  line-break: strict;                /* ★禁則処理: 行頭に 、。」） / 行末に （「 を置かない */
  word-break: normal;
  text-wrap: pretty;                 /* 本文の孤立語(orphan)を回避 */
  line-height: 1.75;                 /* 和文は欧文より広め(1.5–1.8) */
  letter-spacing: 0.02em;
  font-weight: 400;
  color: #1C1C1C;
  -webkit-font-smoothing: antialiased;
}

/* ---- 見出し（明朝/ゴシックは系統で選ぶ） ---- */
.jp-title{
  font-feature-settings: "palt" 1;
  line-break: strict;
  text-wrap: balance;                /* ★複数行見出しの「う。」1文字孤立を構造的に消す */
  letter-spacing: 0.04em;            /* 和文見出しは軽い正トラッキングで上品 */
  line-height: 1.35;
  font-weight: 700;
}

/* 高級感・和テイストの見出しは明朝に */
.jp-title--mincho{ font-family: var(--jp-mincho); font-weight: 600; letter-spacing: 0.06em; }

/* ラベル/キャプション（級数が落ちる箇所） */
.jp-label{
  font-feature-settings: "palt" 1;
  letter-spacing: 0.14em;            /* 小さい和文・英字ラベルは字間を開けると読みやすい */
  font-size: 13px;                   /* 最小ライン。これ未満にしない */
  line-height: 1.5;
  color: #6B7785;
}
```

## 1. 絶対ルール（生成時もレビュー時も）

- **詰め組 `font-feature-settings:"palt" 1`** を本文・見出し・ラベル全部に。これが無いと
  句読点まわりがスカスカに見える。Noto Sans JP / 游ゴシック / ヒラギノはpalt対応。
- **禁則 `line-break: strict`**：`、。」）` が行頭に、`（「` が行末に来ない。Chromeで効く。
- **孤立行回避**：見出しは `text-wrap: balance`、本文は `text-wrap: pretty`。
  手で `<br>` を入れて凌ぐより、まずこれ。どうしても残るなら改行位置を `&#8203;`(ゼロ幅) で制御。
- **和欧混植**：`font-family` は **ラテン → 和文ゴシック** の順。数字・英単語だけ別途指定する手間が消える。
  数字を主役に見せたい指標は Inter / Archivo 等のラテンで `font-variant-numeric: tabular-nums`。
- **フォント使い分け**：本文＝游ゴシック/ヒラギノ角ゴ（Noto Sans JP一辺倒をやめる）。
  高級・和の見出し＝游明朝/ヒラギノ明朝/Noto Serif JP。明朝は見出し演出だけ、本文に明朝は使わない。
- **ジャンプ率**：タイトル:本文 = **1.6〜2.5倍**。指標数字はさらに大きく（×3〜4も可）。
- **行間**：和文本文 1.5〜1.8 / 見出し 1.3前後。**長い行は40字以内**で折る。
- **太字の多用禁止**：強調は「サイズ・ウェイト・色」のうち1〜2手段に統一。faux-bold(合成太字)禁止、
  実ウェイト（500/700/900）を読み込む。
- **letter-spacing**：和文見出し +0.04em / 小ラベル +0.10〜0.16em / 本文 +0.02em。数字には付けない。

## 2. Google Fonts 読み込み例

```html
<!-- 和: 明朝見出し＋ゴシック本文 -->
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@500;600;700&family=Noto+Sans+JP:wght@400;500;700&family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
```
※ ローカル環境で 游ゴシック/ヒラギノが使える場合はそれを優先（より日本的）。配布HTMLはGoogle Fontsで再現性を確保。

## 3. よくある事故 → 対処

| 事故 | 原因 | 対処 |
|---|---|---|
| 「踏み出しましょ／う。」1文字落ち | balance未指定で機械改行 | `text-wrap: balance` を見出しに |
| 句読点まわりがスカスカ | palt未指定 | `font-feature-settings:"palt" 1` |
| 行頭に 、。 が来る | 禁則未指定 | `line-break: strict` |
| 数字だけ和文フォントで野暮ったい | 混植してない | ラテンフォントを先頭に or 数字を `<span>` でラテン指定 |
| 見出しが詰まって安っぽい | 字間ゼロ | 見出し `letter-spacing: 0.04em` |
| 本文が窮屈 | 行間が欧文基準 | `line-height: 1.7`前後 |
