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
