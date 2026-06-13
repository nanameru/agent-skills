---
name: slide-design-guide
description: "Slide design reference workflow: before authoring any slide deck (html2pptx, PPTX, presentation HTML), browse SlideLand (slideland.tech) for real-world reference decks matching the topic, extract design essence (palette/whitespace/typography/layout), and apply the bundled Japanese slide-design principles digest during generation AND self-review. Trigger on スライド作成, スライドを作って, デッキ作成, プレゼン資料, 発表資料, slide deck, presentation slides, html2pptx生成."
metadata:
  short-description: SlideLand参照＋日本式スライドデザイン原則でスライドを作る
---

# Slide Design Guide

スライドを作るときの**事前リサーチと品質基準**を定めるスキル。
HTML/PPTXの変換は `html2pptx` スキル、ローカル編集は `edit-slide` スキルが担当し、
本スキルは「どんなデザインにするか」を決める工程に差し込む。

## ワークフロー（スライド作成時は毎回）

### 1. SlideLandでデザイン参考を探す

[スライドランド](https://www.slideland.tech/) は実在企業の公開デッキ
（会社紹介・決算説明・統合報告書・サービス紹介など）を
`テイスト × 資料種別 × 業種 × 色` でタグ化したギャラリー。

- タグ検索URL: `https://www.slideland.tech/docs/<タイプ>/<値>`
  - 資料種別: `/docs/material/company-introduction` など
    （会社紹介資料 / 統合報告書 / 決算説明資料 / 事業計画 / サービス紹介資料 / 中期経営計画）
  - 色: `/docs/color/blue` など（ブルー/グリーン/レッド/イエロー/黒/ツートン）
  - テイスト: スタイリッシュ / ポップ / ミニマル / 爽やか / 信頼感 / 高級感 / 近未来 / ダイナミック / やさしい
  - カテゴリ一覧: `/docs/category-list`、ページネーションは末尾 `/2` `/3`
- 手順: トピックから資料種別×業種×トーンを決める → WebFetchで該当タグページを見る →
  起点デッキを1〜2件選ぶ → **実物スライドを必ず吸収**（下記）→
  **配色・余白・タイポ・レイアウト構造のエッセンスだけを言語化**して
  デザイン方針（コンセプト一文＋hexパレット＋タイポスケール）に落とす。

#### 実物吸収（タグ情報だけで済ませない。一覧ページ止まりはスキル違反）

1. タグページにWebFetchで実物URL（SpeakerDeck / PDF）を聞き出す。
2. `scripts/absorb_deck.sh <url> [outdir] [枚数]` で実物スライドをダウンロード
   （SpeakerDeckは `files.speakerdeck.com/presentations/<id>/slide_N.jpg` を抽出、
   PDFはそのまま保存。ブラウザ操作は不要）。
3. **Readツールで画像/PDFページを実際に見て**、デザインDNAを言語化する。観察観点:
   表紙の構成（分割/全面/余白量）、セクション見出しの流儀（チップ/帯/番号）、
   情報整理の型（カード/罫線リスト/表）、角丸・影・罫線の使い方、
   配色の面積配分、タイポのジャンプ率、ラベルのletter-spacing。
4. 抽出したDNAを自分のデッキに**構造として**移植する（文言・図版・ロゴの複製は禁止）。
- **禁止**: 実スライドの文言・図版・ロゴの複製。参考は構造とトーンのみ
  （slide-design-md コレクションと同じ運用ルール）。
- **実物吸収は既定でON（必須）**。省略してよいのは「ユーザーが明示的に画像取得不要と言った」
  ときだけで、その場合も**省略した旨を一言添える**（黙って一覧タグ止まりにしない）。
  省略時は本セクションの代わりにタグ分類＋下記モジュール（2.5）で方針を立てる。
- SlideLandに合う系統がない場合はその旨を一言添えて、
  `references/japanese-slide-principles.md` の流派ガイドから直接方針を立てる。

### 2. 日本式デザイン原則を適用する

生成時とセルフレビュー時の両方で `references/japanese-slide-principles.md`
（日本のスライドデザイン専門サイト10件からの抽出ダイジェスト）のチェックリストを当てる。
最低限の絶対ルール:

- 1スライド1メッセージ、タイトルは体言止めまたはアクションタイトル（結論を書く）
- 和文ゴシック（游ゴシック / ヒラギノ角ゴ / Noto Sans JP）、本文は18pt相当以上、行間1.4前後
- 配色は ベース70:メイン25:アクセント5、無彩色+3色以内、原色・高彩度を避ける
- レイアウト4原則（整列・近接・反復・対比）＋ピクセル整列＋余白を恐れない
- 箇条書き3階層以上は図解化を検討。コントラストはWCAG AA（4.5:1）以上
- 和風テイストの場合は日本の伝統色（NIPPON COLORS / 和色大辞典）＋明朝系見出し＋余白多め

### 2.5 「日本ぽさ」を底上げする3モジュール（毎回適用）

ただの原則だけでなく、以下の具体モジュールを**生成時の下敷き**にすると一気に上品になる。

1. **和文タイポgrammar → `references/japanese-typography.md`**
   コピペ基盤CSSを必ず下敷きに。要点は4つ:
   `font-feature-settings:"palt" 1`（詰め組）/ `line-break: strict`（禁則）/
   `text-wrap: balance`（見出しの1文字孤立を構造的に消す）/ 和欧混植フォントスタック。
   フォントは Noto Sans JP 一辺倒をやめ、本文＝游ゴシック/ヒラギノ角ゴ、和・高級の見出し＝明朝。
2. **和色パレット → `references/wairo-palette.md`**
   配色はランダムhexでなく**名前のある伝統色セット**から取る。テイスト別セットあり。
   ベースは純白より生成り `#FBFAF5`。ベース70:メイン25:アクセント5、アクセントは5%・1要素のみ。
3. **「間（ま）」の設計 → `references/japanese-slide-principles.md` のレイアウト節**
   死に余白と意図的な間を区別する（主役1つ＋端を揃えた大胆な空き）。詳細は原則ダイジェスト参照。

### 3. 作って終わりにしない

スクリーンショット → `references/japanese-slide-principles.md` のチェックリストで自己レビュー →
改善を最低1周回す（feedback_design_review_loop）。その後 html2pptx スキルの
エクスポート工程（標準台紙 16:9、テキスト分割対策）へ進む。

### 4. 実在情報の混入チェック（納品前・必須ゲート）

SlideLand等を参考にすると、参考元や第三者の**実在情報**が無意識に紛れ込む。
テンプレート/サンプルとして配るものは、固有名は**架空に統一**し、納品前に必ずスキャンする。

- **機械スキャン**: `grep -onE '<img|src=http|url\(http|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|https?://'` で
  外部画像・実URL・実メールを洗い出す（許可は Google Fonts と `w3.org/2000/svg` のみ）。
- **目視/サブエージェント監査**: 本文テキストを読み、以下を架空化・汎用化する。
  - 実在の**社名・サービス名・製品名・ブランド**（自作架空名が実在企業と衝突する場合も含む。
    例: 「Azure」=MS商標 → 改名）。
  - 実在の**人名・役員名・著者名**、実在ロゴのSVG複製。
  - 第三者の**登録商標・規格・イニシアチブ名**（例: ISO 27001 / RE100 / Slack / Instagram / TikTok /
    MSCI格付 / CET1 等）→ 汎用語に置換（「国際セキュリティ規格」「主要SNS」「主要ESG評価機関」等）。
  - 実在の**住所・郵便番号・電話番号**（実在の丁目/番地/〒は使わない）→ エリア表記か明示プレースホルダ
    （`000-0000` / `〒000-0000` / `（仮）`）。
  - 実在企業の**実数値・市場シェア・財務数字・キャッチコピーの逐語**。架空かつ妥当な数字に。
- **ドメイン/メール**は自作ブランド名に一致する明らかな架空のものだけ（`brand.jp` 等）。
- 修正後は**再レンダして崩れ（置換で文字数が変わりオーバーフロー）がないか**確認してから納品。
- 原則は「参考は構造とトーンのみ。文言・図版・ロゴ・固有データの複製は禁止」（セクション1と同じ）。

## リファレンス

- `references/japanese-slide-principles.md` — 日本式デザイン原則ダイジェスト＋セルフレビューチェックリスト
- `references/japanese-typography.md` — 和文タイポ基盤CSS（palt詰め組／禁則／text-wrap:balance／和欧混植）
- `references/wairo-palette.md` — テイスト別の伝統色パレット集（hex付き）
- `scripts/absorb_deck.sh` — 実物デッキ吸収（SpeakerDeck/PDF）

## 関連

- 変換・エクスポート: `html2pptx` スキル（`references/japanese-slide-design.md` も併読）
- 流派コレクション: `~/dom-to-pptx/slide-design-md/`（SlideLand起点のDESIGN.md集）
- 既存の固定ルール: border-left禁止 / SVG偽画像禁止 / 縦軸設計 / table禁止（メモリ参照）
