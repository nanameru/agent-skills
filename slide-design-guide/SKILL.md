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
  起点デッキを1〜2件選ぶ → **配色・余白・タイポ・レイアウト構造のエッセンスだけを言語化**して
  デザイン方針（コンセプト一文＋hexパレット＋タイポスケール）に落とす。
- **禁止**: 実スライドの文言・図版・ロゴの複製。参考は構造とトーンのみ
  （slide-design-md コレクションと同じ運用ルール）。
- SlideLandに合う系統がない場合はその旨を一言添えて、
  `references/japanese-slide-principles.md` の流派ガイドから直接方針を立てる。

### 2. 日本式デザイン原則を適用する

生成時とセルフレビュー時の両方で `references/japanese-slide-principles.md`
（日本のスライドデザイン専門サイト10件からの抽出ダイジェスト）のチェックリストを当てる。
最低限の絶対ルール:

- 1スライド1メッセージ、タイトルは体言止めまたはアクションタイトル（結論を書く）
- 和文ゴシック（Noto Sans JP / ヒラギノ角ゴ / 游ゴシック）、本文は18pt相当以上、行間1.4前後
- 配色は ベース70:メイン25:アクセント5、無彩色+3色以内、原色・高彩度を避ける
- レイアウト4原則（整列・近接・反復・対比）＋ピクセル整列＋余白を恐れない
- 箇条書き3階層以上は図解化を検討。コントラストはWCAG AA（4.5:1）以上
- 和風テイストの場合は日本の伝統色（NIPPON COLORS / 和色大辞典）＋明朝系見出し＋余白多め

### 3. 作って終わりにしない

スクリーンショット → `references/japanese-slide-principles.md` のチェックリストで自己レビュー →
改善を最低1周回す（feedback_design_review_loop）。その後 html2pptx スキルの
エクスポート工程（標準台紙 16:9、テキスト分割対策）へ進む。

## 関連

- 変換・エクスポート: `html2pptx` スキル（`references/japanese-slide-design.md` も併読）
- 流派コレクション: `~/dom-to-pptx/slide-design-md/`（SlideLand起点のDESIGN.md集）
- 既存の固定ルール: border-left禁止 / SVG偽画像禁止 / 縦軸設計 / table禁止（メモリ参照）
