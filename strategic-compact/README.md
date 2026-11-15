# Strategic Compact bundle

Issue #60: Codex の `event_msg` / `token_usage_record` から直近の入力トークン数を読み取る。キャッシュ済み入力は `input_tokens` に含まれるため再加算しない。Claude の入力・キャッシュ読み取り・キャッシュ作成の合計は維持する。

回帰テストは、両 Codex 形式の取得、キャッシュと出力・累計の非加算、無効値を飛ばす後方走査、Claude の既存動作および隔離した CLI hook の通知を確認する。

```sh
node --test strategic-compact/tests/transcript-context.test.js strategic-compact/tests/suggest-compact.test.js
```

実行結果・対象commit・未検証事項は Issue #60 と `test-board.yaml` を参照。CLI通知の成功は、実セッションでの通知受信や実際のコンテキスト圧縮完了を示さない。

既存 installed への反映は、対象ファイルと runtime 依存ファイルを `provenance.json` の元 SHA-256 と照合し、一致した場合に限る。限定対象は `scripts/lib/transcript-context.js` と `provenance.json`。Skill の説明も反映する場合は `SKILL.md` の元 SHA-256 も照合し、その1枚を加える。runtime 依存ファイルは変更せず、元ハッシュを保持する。不一致があれば上書きせず差分を確認する。設定、閾値、自動圧縮、他 Skill は変更しない。

この bundle は管理台帳で `install: false` とし、既定の一括 restore には含めない。
