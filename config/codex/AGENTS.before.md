# グローバル GitHub Issue駆動開発ワークフロー

Gitリポジトリでのコーディング、プロダクト開発、リファクタリング、バグ修正、アプリ開発では、ユーザーが「調査だけ」「短い回答だけ」「コード変更なし」と明示しない限り、このワークフローを適用する。

## 基本ルール

GitHubを唯一の作業記録として扱う。

```
要件 -> GitHub Issue -> ブランチ -> コミット -> Pull Request -> CI -> レビュー -> マージ -> リリース
```

チャット履歴だけをプロジェクト記録にしない。GitHubへの書き込み権限がある場合、判断、発見、実装メモ、検証結果はリンクされたGitHub Issueへ残す。ナレッジログは補助記録であり、コードや設定の変更履歴の代替ではない。実際にファイルを変更した場合は、関連Issue参照付きで必ずコミットし、remoteがある場合はpushする。書き込み権限がない場合は `.codex/issue-knowledge/` に同じ内容を残し、GitHubへ反映できなかったことをユーザーに伝える。

Issueタイトル、PRタイトル、GitHub Project項目、Draftタスク、ボードカードなど、ユーザーに見えるタスク名は必ず日本語にする。さらに、横断ボードでリポジトリを識別できるよう、タイトル先頭に `【repo名】` を付ける。例: `【koetype】音声入力の設定画面を追加する`。ブランチ名、ラベル、コマンド、コード識別子などの技術的な名前は必要に応じて英語のままでよい。

Issue本文、PR本文、Project Draft本文、ナレッジログも日本語で書く。技術用語、ファイルパス、コマンド、API名は英語のままでよい。

## 作業開始

1. 編集前に `git status --short`、`git remote -v`、現在のブランチを確認する。
2. 既存のGitHub Issueがあるか確認する。なければ実装前にIssueを作成またはドラフトする。
3. 依頼が曖昧な場合は、Goal Prepare形式で要件を整理する。
   - 目的を言い換える
   - 利用者、制約、対象外、リスク、依存関係を確認する
   - 完了条件と検証方法を定義する
   - 本当に必要な質問だけ、最大3つまで聞く
4. 要件が明確になったら、すぐGitHub Issueを作成またはドラフトする。Issueには次を含める。
   - 課題 / 目的
   - 対象範囲
   - 完了条件
   - 実装計画
   - テスト / CI計画
   - ナレッジログ
5. Issueタイトルは必ず `【repo名】日本語タイトル` にする。

## ブランチ、コミット、PR

1. ブランチ名は `issue-123-short-slug` のようにする。
2. コミットは意味のある小さな単位で行う。コミットメッセージには `Refs #123` または `Closes #123` を含める。
3. 無関係な未コミット変更をコミットに含めない。ユーザーの変更がある場合は触らずに残す。
4. 作業が一定以上ある場合は、早めにDraft PRを作成する。PR本文には `Closes #123`、変更概要、検証結果、リスクを書く。
5. PRタイトルは必ず `【repo名】日本語タイトル` にする。
6. remoteがある場合は、作成したコミットをpushする。PRがある場合はPRブランチへpushする。
7. 関連するテスト、lint、buildを実行するか、実行できなかった理由を明記するまで作業完了扱いにしない。

## ナレッジ蓄積

意味のある変更ごとに、Issueへ次を追記する。

- 何を判断したか、なぜそうしたか
- 触ったファイルやモジュール
- 発見した制約
- 実行したコマンドと結果
- CI失敗と修正内容
- フォローアップ

GitHubへ書けない場合は `.codex/issue-knowledge/issue-<number-or-draft>.md` に同じ内容を残す。

## 横断Projectボード

GitHub Projectが設定されている場合、すべてのIssueとPRを横断Projectへ追加する。ボード状態は次を基本にする。

- 未着手
- 進行中
- 完了

補助フィールドは次を使う。

- ワークフロー状態: 受信箱 / 着手可能 / 進行中 / レビュー中 / ブロック中 / 完了
- 優先度: P0 緊急 / P1 高 / P2 通常 / P3 低
- 種類: 機能 / バグ / 雑務 / ドキュメント / 調査 / セキュリティ
- 規模: XS 極小 / S 小 / M 中 / L 大
- 対象時期: 今週 / 今月 / 後で

Project番号やIDがない場合は、Issue/PRを横断ボードへ追加できなかったことと、必要な次のコマンドをユーザーへ伝える。

タスクを横断ボードへ追加または参照した後は、ユーザーがすぐ確認できるように必ずボードViewリンクを表示する。

`https://github.com/users/nanameru/projects/3/views/3`

## セキュリティとCI

再現可能な品質ゲートにはGitHub Actionsを優先する。各リポジトリでは、ユーザーが依頼した場合または作業上必要な場合に、repoローカルのCI追加を提案または実装する。最低限のゲートは次。

- install / build / test
- 利用可能なら lint / typecheck
- 対応可能なら依存関係チェックまたはsecret scan
- マージ前のPRチェック

secretをコミットしない。CI失敗を無視する場合は、理由をIssueまたはPRへ記録する。

## ローカル補助コマンド

必要に応じて `/Users/kimurataiyou/.codex/bin/codex-gh-workflow` を使う。

```bash
codex-gh-workflow status
codex-gh-workflow board-url
codex-gh-workflow draft-issue --title "【repo名】日本語タイトル" --body-file issue.md
codex-gh-workflow start --issue 123 --slug short-title
codex-gh-workflow install-hooks
codex-gh-workflow install-repo-templates
```

## Codexライブ進捗

GitリポジトリでIssue作業を行う場合、Codex自身がAI Companyへ実進捗を記録する。進捗の正本は時間経過や推測ではなく、完了した実ステップ数とする。

進捗記録コマンド:

```bash
node /Users/kimurataiyou/ai-test-center/scripts/ai-progress.mjs <eventType> \
  --run <run-id> --project <repo-name> --repository <owner/repo> --issue <number> \
  --task <task-id> --task-title <title> --phase <phase> \
  --step <step-id> --step-title <current-step> \
  --completed <completed-steps> --total <total-steps> --next <next-action>
```

必ず記録する境界:

1. Issue着手時: `start`
2. 工程変更または意味のあるステップ完了時: `progress`
3. 人間の回答が必要な時: `waiting-human`
4. 外部要因で進めない時: `blocked`
5. 処理失敗時: `failed`
6. 完了条件と検証を満たした時: `completed`

15分以上同じ工程が続く場合だけ `heartbeat` を使う。キーストロークやファイル1行単位では送らない。`completed / total` は実際の計画項目に合わせ、時間経過で増やさない。プロンプト全文、環境変数、認証情報、顧客情報は記録しない。マージ、デプロイ、公開、送信、削除、決済、契約、権限変更は進捗記録によって自動承認されたものと扱わない。詳細契約は `/Users/kimurataiyou/ai-test-center/docs/codex-progress-protocol.md` を参照する。

## テストケース管理 (test-board)

テストケースの一覧・依存・網羅・Issue紐付け・デグレ影響は `test-board` CLI で扱う（Claude/Codex 共通、エージェント非依存）。正本は各リポジトリ直下の `test-board.yaml`（プレーンYAML・差分レビュー可）。ボード/グラフは読むだけで、編集はYAML。

Issue を作る/更新したら、対応するテストを `test-board.yaml` に紐付ける（`issues: [<番号>]`）。機能を直したら影響分だけ再実行し、デグレ注意のIssueも確認する。

```bash
test-board once      --board test-board.yaml                    # 進捗サマリ
test-board impact    --board test-board.yaml --files a.js b.js  # 変更→回すべきテスト＋デグレ注意Issue(複数可)
test-board issue     --board test-board.yaml --issue 42         # Issue→再実行すべきテスト
test-board coverage  --board test-board.yaml                    # 権限×ブラウザ等の網羅の穴
test-board plan-issue --board test-board.yaml --issue 42 \
  --source src/foo.ts --feature "機能名" --scenario シナリオ [--apply]   # 既存テスト紐付け+不足テスト雛形を起票
test-board sync-github --board test-board.yaml --issue 42 [--apply]      # Issue本文へTC一覧を書き戻し
test-board serve     --board test-board.yaml                    # 管理画面 http://127.0.0.1:41800/
```

`test-board.yaml` が無いリポジトリでは、Issue起票時に `plan-issue` で雛形から作り始める。`--apply` や `sync-github --apply` は共有状態（YAML/GitHub）を書き換えるので、実行前にユーザーへ一言添える。詳細は `~/.claude/skills/test-case-board/SKILL.md`。

## iOS / Xcode の検証は Devin の macOS セッションで行う（最優先）

この Mac はディスク容量が少ないため、`xcodebuild`・iOS シミュレータの起動・スクリーンショット撮影を**ローカルで実行しない**。
ローカルでは Swift のコードを書くだけにし、ビルド・テスト・画面確認はすべて Devin に任せる。

- セッション作成: `~/.claude/skills/devin-handoff/scripts/devin-handoff.sh create --platform macos --task "..."`（API の `platform: "macos"`）
- Linux で立ってしまったら、そのセッションに「macOS の子セッション（Xcode + iOS Simulator）を起動して同じ手順を実行して」と返信する
- 結果（ビルド / テスト件数 / スクリーンショット / 指摘）は GitHub Issue に日本語でコメントさせ、修正して push したら再度 Devin に再検証を依頼する

<!-- BEGIN codex-chat-wrapup -->
## Codexチャットの終了時整理

挨拶・お礼・短い相づちだけでタスクの状態や次の行動が変わらない場合は、スキル読込・整理用ツール・整理の定型追記を省き、通常の返信だけを1回返す。「続けて」「実装して」や承認待ちへの回答など、短くても作業・判断・状態変化を求める依頼はこの省略対象にしない。

Codexでユーザーと直接対話するメインエージェントは、実作業・判断・タスク状態の変化があったターンの最終回答前に、必要な整理ツールが利用できる場合だけ `~/.codex/skills/codex-chat-wrapup/SKILL.md` を読み、その手順で現在チャットのタイトルとサイドバーの振り分けを更新する。タイトルは `プロジェクト名 - 次にすること` とし、GitHub Issue/PRには既存の `【repo名】` 規則を引き続き使う。

現在チャットを信頼できるIDで特定できる場合だけ操作する。サブエージェントからの実行、他チャットへの変更や送信、アプリDBの直接編集は行わない。司令塔・ピン留め・定期実行履歴の専用配置は保持する。必要な整理ツールが揃わない場合、整理目的の追加ツール実行や未反映の定型追記はせず、本来の依頼を完了させる。明示的に整理を依頼された場合だけ未対応を短く伝える。
<!-- END codex-chat-wrapup -->

<!-- BEGIN reacquirable-cache-cleanup -->
## 再取得可能キャッシュの自動整理（本人の継続許可・2026-10-21）

容量不足で作業が止まる場合、再取得可能なパッケージダウンロードキャッシュ（npm/pnpm/Homebrew等）と、現在実行中でなく再生成できる一時ビルド出力は、その都度の承認を求めず必要分だけ整理し、容量確認後に元の作業を続ける。対象と削除前後の空き容量を報告する。可能なら管理ツールのclean/pruneを使い、実行中の処理が使っているキャッシュは避ける。uvは利用中なら整理しない。

コード、未コミット変更、元資料、成果物、Downloads/Documents/Desktop、認証情報、アプリデータ、ブラウザプロファイル、Google/Chrome/Google Drive関連キャッシュ、X/Twitter関連キャッシュ、Trash内容はこの許可に含めない。曖昧なディレクトリや再取得できることを確認できないものは削除しない。広いパスへの一括削除はせず、必要な対象を特定する。

この本人の継続許可は、上記範囲についてスキル内の再確認要件より優先する。範囲外の削除・権限変更・契約/決済等の承認には拡張しない。
<!-- END reacquirable-cache-cleanup -->

<!-- BEGIN chrome-tab-group-browser -->
## ChromeのWeb操作はPlaywright Extensionのタブグループを使う

Chrome上のWeb操作では、OS全体のComputer Useで既存Chromeを前面操作しない。
Playwright Extensionと `npx -y @playwright/cli@latest attach --extension=chrome` を使い、
`-s=<task-name>` ごとに専用のタブグループを作って、そのグループ内だけを操作する。

- 接続後のCDP操作で、ユーザーの前面アプリ（Ghostty等）を奪わないことを確認する
- 初回接続時だけ拡張機能がChromeを前面化することがある。操作前に一言添え、接続後は元の前面アプリへ戻す
- 拡張機能のService Workerが無効・応答なしの場合は、`chrome://extensions` のPlaywright Extensionをオフ→オンして再読み込みする
- `PLAYWRIGHT_MCP_EXTENSION_TOKEN` などの認証情報は、回答・ログ・Issueへ表示しない
- タブグループを使えない場合だけ、headlessのagent-browser／Playwrightを代替にし、Computer Useへ戻さない
<!-- END chrome-tab-group-browser -->
