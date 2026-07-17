---
name: figma-design-source
description: FigmaをUIデザインシステムの正本として扱い、案件ごとのFigmaファイル、Variables、tokens、components、patternsとコード実装を同期・検証する。UI作成・変更、Figma、デザインシステム、コンポーネントライブラリ、デザイントークン、色・余白・角丸・文字、Code Connect、UIの一貫性やデザインドリフトを扱うときに使う。
---

# Figma Design Source

Figmaを見た目とデザイントークンの正本、対象リポジトリを実装とテストの正本として扱う。Skill自体へ案件固有の色、component ID、file keyを埋め込まない。

## 最初に確認するもの

1. 対象リポジトリと対象プロダクトを特定する
2. リポジトリ内でFigma状態ファイルを次の順で探す
   - `.figma/design-system/state.json`
   - `.html2pptx/figma-design-system/state.json`
   - `design-system/figma-state.json`
   - `figma.config.json`
3. 状態ファイルからFigma URL / file key、進行中phase、tokens、components、未完了工程を読む
4. 状態ファイルがなければFigma URLまたはfile keyをユーザーへ確認する
5. 複数候補がある場合は推測せず、対象を確認する

案件固有の状態ファイルとFigmaファイルは対象リポジトリに残す。グローバルSkillへコピーしない。

## Figma連携ゲート

Figmaを読み書きするときは、インストール済みFigmaプラグインを使う。

1. `figma-use` を読み、Figma接続と対象ファイルへのアクセスを確認する
2. Variables、styles、components、libraryを作成・変更するときは `figma-generate-library` も読む
3. Figma componentsとコードを接続するときは `figma-code-connect` も読む
4. 取得したmetadataまたはscreenshotで対象nodeを確認してから変更する
5. 変更後にmetadataまたはscreenshotを再取得して検証する

接続・権限・対象ファイルを確認できない場合は停止する。Figmaを更新していないのに「更新済み」と報告しない。

## 正本の分担

| 対象 | 正本 |
|---|---|
| デザイン原則、色、文字、余白、角丸、影、状態 | Figma Variables / styles |
| canonical UI componentsとvariants | Figma component library |
| componentの実装、型、振る舞い | 対象リポジトリ |
| Figma nodeとコードcomponentの対応 | 対象リポジトリのmappingファイルまたはCode Connect |
| テスト、回帰、アクセシビリティ証跡 | 対象リポジトリ |
| file key、Variable ID、進行状況 | 案件固有のFigma状態ファイル |

Figmaとコードが競合した場合は、勝手に片方を上書きしない。差分、影響範囲、推奨する正本を提示し、既に決定ルールがなければ確認する。

## 推奨するFigma構成

- `00 Cover`: 目的、owner、version、更新日、対象プロダクト
- `01 Foundations`: colors、typography、spacing、radius、shadow、border、breakpoints
- `02 Components`: canonical componentsとvariants
- `03 Patterns`: form、navigation、dashboard、empty、error、authなどの組み合わせ
- `04 Screens`: canonical componentsだけで作った代表画面
- `99 Changelog`: 判断、破壊的変更、migration

既存ファイルに別の構成がある場合は、それを優先する。

## Foundations

最低限、次を名前付きtokenとして管理する。

- primitive colorとsemantic color
- typography scaleとtext styles
- spacing scale
- radius scale
- shadow / elevation
- border width / color
- focus ring
- icon size
- interaction states

raw値を画面ごとに増やさない。`color.text.muted`、`space.3`、`radius.button` のような意味のある名前を使う。

## Components

各componentに必要なもの:

- default variant
- 必要なsizeとintent variants
- default、hover、active、focus、disabled、loading、error states
- Auto Layout
- tokenへ接続されたfill、stroke、radius、gap、padding、text style
- 使用条件、禁止例、アクセシビリティ注記

最初はButton、Input、Select、Checkbox、Radio、Badge、Card、Modal、Toast、Navigationから始める。実案件で使われないcomponentを大量に先行作成しない。

## コードへ反映する手順

1. 対象Figma componentとtokenを読む
2. 既存コードcomponent、CSS variables、Tailwind theme、token JSONを探す
3. 既存componentを再利用し、重複実装を作らない
4. Figma tokenをプロジェクト既存のtheme方式へ対応付ける
5. component ID / property / variantとコードpropsの対応を記録する
6. interaction、responsive、dark mode、accessibilityを実装する
7. unit / visual / E2E / accessibilityから必要なテストを追加する
8. screenshotまたは既存visual regressionでFigmaとの差を確認する

一画面だけの例外が必要な場合は、system-wide変更かlocal variantかを分け、例外理由を案件Issueへ残す。

## 会社共通へ昇格する条件

案件固有componentをすぐ共通化しない。次を満たしたものだけ会社共通候補にする。

- 2つ以上のプロダクトで同じ意味と振る舞いを持つ
- propsとstatesが安定している
- accessibilityとresponsiveを検証済み
- breaking changeのownerとmigration方針がある
- Figmaとコードの両方に正本がある

## AIによるUIドリフト防止

- Figmaにないhex color、spacing、radiusを無断追加しない
- Button、Input、Cardなどを画面ごとに再実装しない
- hover、focus、disabledをコードだけ変更しない
- desktopだけ確認して完了にしない
- screenshotの見た目だけでtoken名やcomponent構造を推測しない
- Figma変更、コード変更、両方の変更を明確に区別して報告する

## 完了報告

- 確認・更新したFigma file / page / component
- 参照・変更したtokensとvariants
- 変更したコードcomponentとmapping
- 実行したUI、visual、accessibility、回帰テスト
- Figmaとコードの残存差分
- 人間確認が必要な判断と、外部共有・公開が未実行であること
