---
name: figma-design-source
description: 既存アプリではUI、routes、components、tokensを棚卸しし、新規アプリではユーザーへ1問ずつヒアリングして全体・ページ別の参考画像を集めたうえで、FigmaをUIデザインシステムの正本としてVariables、components、patternsとコード実装を同期・検証する。UI作成・変更、Figma、デザインシステム、コンポーネントライブラリ、デザイントークン、Code Connect、UIの一貫性やデザインドリフトを扱うときに使う。
---

# Figma Design Source

Figmaを見た目とデザイントークンの正本、対象リポジトリを実装とテストの正本として扱う。Skill自体へ案件固有の色、component ID、file keyを埋め込まない。

## 最初にモードを判定する

UI作業の前に、次のいずれかへ分類する。

| モード | 条件 | 最初の行動 |
|---|---|---|
| `existing-app` | 対象リポジトリに画面、routes、UI components、stylesのいずれかがある | 既存資産を棚卸しする |
| `new-app` | 新規プロダクトで、実装済みUIまたは合意済みデザインがない | ユーザーヒアリングを始める |
| `hybrid` | 既存アプリへ新しい画面群・別ブランド領域を追加する | 既存棚卸し後、新規部分だけヒアリングする |

判定できなければ「既存UIを整える案件か、新規UIを作る案件か」を1問だけ聞く。モードを決めずにFigmaやコードを変更しない。

## `existing-app`: 既存デザインを棚卸しする

ユーザーへ既に答えがある質問を繰り返す前に、リポジトリと実際の画面から事実を集める。

1. framework、app entrypoint、routes、page一覧を特定する
2. components、UI library、Storybook、CSS、theme、token、font、iconを探す
3. Button、Input、Card、Modal、Navigationなどの重複実装とvariantsを数える
4. 色、spacing、radius、typography、shadow、breakpointのraw値と命名済みtokenを抽出する
5. 主要画面をローカルで表示し、desktop / mobileと主要statesをscreenshotで確認する
6. Figma file、Code Connect、component mapping、状態ファイルの有無を確認する
7. 既存仕様、重複、ドリフト、不足、共通化候補を一覧にする

棚卸し結果には最低限、次を含める。

| 項目 | 内容 |
|---|---|
| Pages | route、目的、主要component、認証・権限 |
| Components | 実装場所、variants、states、利用ページ、重複候補 |
| Foundations | colors、type、spacing、radius、shadow、breakpoints |
| Figma mapping | file / node / component IDとコードcomponent |
| Drift | Figmaのみ、コードのみ、不一致、未確認 |
| Recommendation | 維持、統合、rename、廃止候補、要ヒアリング |

既存の見た目を勝手に全面刷新しない。棚卸し後に、維持する個性、直す問題、共通化範囲をユーザーへ確認する。

## `new-app`: 1問ずつデザインヒアリングする

新規アプリでは、いきなりcomponentや画面を生成しない。質問を一度に大量表示せず、1問ずつ聞き、回答を短く要約して次へ進む。既に回答済みの内容は聞き直さない。

### Phase 1: 全体イメージ

次の順で不足項目だけを確認する。

1. 誰が、何を達成するアプリか
2. Web / mobile / desktopと優先端末
3. 与えたい印象を3〜5語で表すと何か
4. 避けたい見た目、競合、既存ブランド制約は何か
5. アプリ全体の参考画像、screenshot、Figma URL、Web URLを1〜3件もらえるか

参考画像は会話へ添付してもらうか、ローカル絶対パス、Figma URL、Web URLで受け取る。画像がない場合は無理に要求し続けず、「画像検索で候補を探す」「3方向のmoodboard案を作る」「言葉だけで続ける」から選んでもらう。

### Phase 2: ページ一覧

必要なページをユーザーと整理する。各ページについて、未確定・仮説・確定を区別する。認証、初回導線、主要業務、設定、empty / errorを忘れない。

### Phase 3: ページごとのヒアリング

一度に1ページだけ扱い、次を順に聞く。

1. ページ名と、このページで利用者が達成すること
2. 最重要の操作またはCTA
3. 表示する情報、入力、データ、権限
4. loading、empty、error、success、disabledなど必要なstates
5. desktop / mobileで変えること
6. このページの参考画像、screenshot、Figma frame、Web URLをもらえるか
7. 参考画像の「どこが好きか」「どこは真似したくないか」

ページ画像がない場合は、そのページだけ候補案を提示し、方向性を確認してから次へ進む。画像の雰囲気だけをコピーせず、プロダクト目的、情報量、操作、アクセシビリティへ翻訳する。

### Phase 4: 実装前確認

全体と各ページについて、次を1つの短い確認資料へまとめる。

- 利用者と目的
- デザイン原則と避けること
- 参考画像source map
- page map
- ページ別の目的、CTA、states、responsive
- foundations候補
- components候補と共通化理由
- 未確定事項と仮定

ユーザーの確認を得てからFigma foundations、components、screensを作る。「おまかせ」「既定で進めて」と明示された項目だけ、仮定を記録して進める。

## ヒアリング記録

ユーザーが保存を望む場合、対象リポジトリへ次のように残す。既存のプロジェクト規約があればそちらを優先する。

```text
docs/design-intake/
  brief.md
  page-map.md
  pages/<page-slug>.md
  source-map.md
```

画像そのものを無断複製せず、添付ファイルのローカルパス、Figma node、出典URL、所有・利用条件をsource mapへ記録する。顧客の非公開画像や個人情報を外部サービスへ送らない。

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
