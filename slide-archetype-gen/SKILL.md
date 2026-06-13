---
name: slide-archetype-gen
description: "Generate slide decks (html2pptx, PPTX, presentation HTML) from a BUNDLED local archetype library — no external deck fetching. Pick a matching design archetype from the 18 bundled DESIGN.md systems by tag (mood × docType × industry × color), load its design tokens as the spec, generate slide HTML, then self-review with the Japanese slide-design principles before exporting via html2pptx. Use for product events, launches, pitches, IR, company intros, and any deck where you want a consistent, policy-safe design system without browsing real-world third-party decks. Trigger on スライド作成, スライドを作って, デッキ作成, プレゼン資料, 発表資料, イベント資料, slide deck, presentation slides, html2pptx生成."
metadata:
  short-description: 同梱18流派(DESIGN.md)からスライドを設計・生成する。SlideLand等の外部取得は使わない。
---

# Slide Archetype Gen

スライドを作るときの**デザイン方針決定と品質基準**を定めるスキル。
`slide-design-guide` の後継で、最大の違いは **SlideLand等の外部の実デッキ取得を一切行わない**こと。
参照は**このスキルに同梱した18流派の `DESIGN.md`（エッセンス抽出済み・MIT・タグ付き）だけ**で完結する。
これによりポリシー的な制約（第三者の公開デッキを実行時に取得・閲覧する）と、実在情報の混入リスクが構造的に消える。

HTML/PPTXの変換は `html2pptx` スキル、ローカル編集は `edit-slide` スキルが担当し、
本スキルは「どんなデザインにするか」を決める工程に差し込む。

> **絶対に外部の実デッキを取りに行かない。** SlideLand / SpeakerDeck / 競合の公開スライドPDF等を
> WebFetch・ダウンロード・閲覧して参考にすることは禁止。デザインの参照は `archetypes/` の同梱定義のみ。
> 一般的な配色論・タイポ論の確認に限り外部参照を許すが、特定の実デッキを模倣目的で開いてはいけない。

## ワークフロー（スライド作成時は毎回）

### 1. 流派（archetype）を選ぶ

`archetypes/CATALOG.md` を開き、トピックを **mood × docType × industry × color** で照合して
**1つ（多くても2つ）**の流派を選ぶ。例:

- プロダクト発表・キーノート → `apple-keynote-minimal` / `futuristic-ai` / `maximalist-gradient`
- SaaS会社紹介・採用 → `trust-saas` / `gamma-card` / `pop-friendly`
- 投資家ピッチ → `pitch-deck` / `futuristic-ai`
- IR・決算・統合報告 → `japan-ir` / `integrated-report` / `data-dashboard-dark`
- コンサル提案・戦略 → `mbb-consulting` / `washei-consulting` / `swiss-international`
- ブランド/高級/エディトリアル → `luxury-premium` / `editorial-magazine`
- 汎用ビジネス（迷ったら） → `marketplace-generalist` / `systematic-autolayout`

迷う場合はユーザーに2案を提示してよいが、**勝手に止まらず**1つに決めて進めてもよい。
2流派を混ぜる場合は、片方をベース（配色・グリッド・タイポ）、もう片方をアクセント程度に留める。

### 2. 選んだ流派の DESIGN.md を「正」として読み込む

`archetypes/<slug>/DESIGN.md` を文脈に取り込む。**YAMLフロントマターの design token が規範値**
（配色・タイポスケール・グリッド・余白・コンポーネント）。Markdown本文はその適用理由＝文脈。

- `archetypes/<slug>/sample.html` は**構造の参考**として読む（1920×1080固定の `.slide` 実装例）。
  - **複製禁止**: sample.html の文言・図版・レイアウトを丸ごとコピーしない。トークンと構造原理だけ移植する。
  - sample.html は `assets/` 画像を参照するが、画像は同梱していない（リンク切れは無視してよい）。
- トークンの色・フォント・サイズ・余白は**そのまま使う**。勝手に原色化・サイズ改変しない。

### 3. 日本式デザイン原則を下敷きにする

`DESIGN.md` のトークンに加え、生成時とセルフレビュー時の両方で以下を当てる。

1. **原則ダイジェスト → `references/japanese-slide-principles.md`**
   1スライド1メッセージ／結論を書くタイトル／配色70:25:5／レイアウト4原則＋ピクセル整列／
   箇条書き3階層以上は図解化／コントラストWCAG AA(4.5:1)。
2. **和文タイポgrammar → `references/japanese-typography.md`**
   `font-feature-settings:"palt" 1`（詰め組）/ `line-break: strict`（禁則）/
   `text-wrap: balance`（見出しの1文字孤立を消す）/ 和欧混植フォントスタック。
   本文＝游ゴシック/ヒラギノ角ゴ、和・高級の見出し＝明朝。Noto Sans JP一辺倒にしない。
3. **和色パレット → `references/wairo-palette.md`**（流派が和風・伝統色寄りのときに併用）
   名前のある伝統色セットから取る。ベースは生成り `#FBFAF5`、アクセントは5%・1要素のみ。

> 流派のトークンと原則が衝突したら、**流派トークン優先**（その流派の個性が崩れるため）。
> ただし WCAG AAコントラストと固定ルール（下記）は流派より優先する。

### 4. 固定ルール（このリポジトリの不変ルール・必ず守る）

- キャンバスは **1920×1080固定**。縦軸を設計し（flex中央寄せ/space-between）下の死に余白を作らない。
- カード/通知の**色付き左縦ライン（border-left）装飾は使わない**。重要度は塗りチップ/バッジ/アイコンで。
- 写真/イラスト/風景/マスコットを**SVG作画で再現するのは禁止**。実画像（`<img>`/CC0/data URL）を使う。
  SVG可は機能要素（チャート/アイコン/区切り/ロゴ/幾何装飾）のみ。
- **`<table>` 不使用**。`div`+flex/grid で組む。
- アイコンは**実SVG**（thesvg / iconify MCP等）。emojiを機能アイコンに使わない。
- 画像生成が必要な箇所は `.imgph` プレースホルダのまま残す（別セッションで生成する運用）。

### 5. 作って終わりにしない（セルフレビュー1周）

スクリーンショット → `references/japanese-slide-principles.md` のチェックリストで自己レビュー →
改善を**最低1周**回す（DoD: 致命ゼロ＋WCAG基本）。その後 `html2pptx` のエクスポート工程
（標準台紙、`width:13.333 / height:7.5` の数値指定、テキスト分割対策）へ進む。

### 6. 実在情報チェック（納品前ゲート・軽量版）

本スキルは外部の実デッキを取り込まないため `slide-design-guide` ほど重い混入は起きにくいが、
テンプレート/サンプルとして配るものは固有名を**架空に統一**する。

- **機械スキャン**: `scripts/scan_real_info.sh <file.html>` で外部画像・実URL・実メールを洗い出す
  （許可は Google Fonts と `w3.org/2000/svg` のみ）。
- **目視**: 実在の社名・サービス名・人名・登録商標・実数値・住所/電話を架空化・汎用化する。
- ドメイン/メールは自作架空ブランドに一致するものだけ（`brand.jp` 等）。修正後は再レンダして崩れを確認。

## リファレンス

- `archetypes/CATALOG.md` — 18流派のタグ索引（選定用）
- `archetypes/<slug>/DESIGN.md` — 流派ごとのデザイントークン（規範値）＋運用ガイド
- `archetypes/<slug>/sample.html` — 流派ごとの実装例（構造参考のみ・複製禁止）
- `references/japanese-slide-principles.md` — 日本式デザイン原則＋セルフレビューチェックリスト
- `references/japanese-typography.md` — 和文タイポ基盤CSS
- `references/wairo-palette.md` — テイスト別の伝統色パレット集
- `scripts/scan_real_info.sh` — 実在情報の機械スキャン

## 関連

- 変換・エクスポート: `html2pptx` スキル
- ローカル編集: `edit-slide` スキル
- 流派ライブラリの正本（全99流派・更新元）: `~/dom-to-pptx/slide-design-md/`
- 旧スキル（外部取得あり）: `slide-design-guide` — ポリシー制約があるため本スキルで代替する
