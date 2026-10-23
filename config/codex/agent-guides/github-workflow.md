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

