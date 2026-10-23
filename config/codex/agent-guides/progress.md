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

