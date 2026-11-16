# Strategic Compact bundle

Issue #60: Codex の `event_msg` / `token_usage_record` から直近の入力トークン数を読み取る。キャッシュ済み入力は `input_tokens` に含まれるため再加算しない。Claude の入力・キャッシュ読み取り・キャッシュ作成の合計は維持する。

提案通知のツール回数と通知済みバケットはユーザーのホーム直下の `.strategic-compact` に保存する。従来の共有一時ディレクトリの状態は引き継がないため、移行直後は通知の回数とバケットの記録が初期化される。

回帰テストは、両 Codex 形式の取得、キャッシュと出力・累計の非加算、無効値を飛ばす後方走査、Claude の既存動作および隔離した CLI hook の通知を確認する。

```sh
node --test strategic-compact/tests/transcript-context.test.js strategic-compact/tests/suggest-compact.test.js
```

実行結果・対象commit・未検証事項は Issue #60 と `test-board.yaml` を参照。CLI通知の成功は、実セッションでの通知受信や実際のコンテキスト圧縮完了を示さない。

既存 installed への反映は、対象ファイルと runtime 依存ファイルを `provenance.json` の元 SHA-256 と照合し、一致した場合に限る。限定対象は `scripts/hooks/suggest-compact.js`、`scripts/lib/transcript-context.js`、`provenance.json`。Skill の説明も反映する場合は `SKILL.md` の元 SHA-256 も照合し、その1枚を加える。runtime 依存ファイルは変更せず、元ハッシュを保持する。不一致があれば上書きせず差分を確認する。設定、閾値、自動圧縮、他 Skill は変更しない。

この bundle は管理台帳で `install: false` とし、既定の一括 restore には含めない。

## T3 queue bridge (Issue #62)

The optional `scripts/hooks/queue-compact.js` runs at `Stop`, `PreCompact`, and `PostCompact`; it never changes or replaces the existing suggestion hook or Wiki hooks. Register each handler by **appending** the corresponding groups from `registration/claude.json` to Claude settings and `registration/codex.json` to Codex hooks. These are merge fragments, not complete settings files. The explicit `claude`/`codex` argument identifies the registration; the handler also validates the provider's documented event fields. Codex requires `turn_id`. A hook trust prompt or unsupported installed event is a stop condition; do not bypass trust. The existing hook enablement and settings must be inspected before any install.

At a main-session Stop, the bridge requires an absolute `T3CODE_CLI_PATH`, `T3CODE_THREAD_ID`, a readable transcript, and the existing context-token threshold and interval. It uses the existing window/threshold calculations unchanged. It does not schedule on the separate tool-count reminder. It calls the official CLI as `thread send <current-id> /compact --json`, without attachments or `--wait`. The CLI uses queue mode. A receipt must include matching thread ID, run ID, message ID, supported run status and queue delivery; only then is it **accepted**, not completed. It uses `thread show <current-id> --messages 1 --json` only for current thread and run state; message content is neither persisted nor logged.

State is private per hashed T3 thread under `~/.local/state/strategic-compact/`. An atomic directory lock serializes handlers and an atomic state replacement records an `unknown` claim *before* invoking send. A timeout, crash, malformed receipt, nonzero exit, or unobservable run remains latched; there is no automatic retry. Failed/cancelled/interrupted runs remain latched too. A stale lock, malformed state, unreadable CLI, or a native event that collides with a handler fails closed. The latter creates a persistent `.unsafe` marker. Do not remove state, locks, or markers automatically: an operator must first establish the actual queue and compaction outcome, then resolve them outside this workflow under applicable permissions.

Native `PreCompact`/`PostCompact` observation is stored separately from the request. A manual PreCompact and PostCompact only mark **compaction** completed for the request when both match the claiming harness and session, and each observes the receipt's run as the active run of the same T3 thread. This is not a claim that the whole T3 run succeeded. A nonmatching native event never completes the request. Native in-progress state, five minutes after observed native completion, and the request's own active run suppress new requests. After observed request compaction, a later distinct active/latest run, expiration of cooldown, and a higher token bucket for the same harness/session are required to allow another request. A distinct session has its own buckets, but a session change alone never releases an unresolved request. Older usage records can delay subsequent requests; unknown or missed events remain latched. The queue cannot cancel an external compaction that occurs after reservation.

The implementation is source only until regression and independent review pass. For the separately authorized installed phase: compare the live hook tree and `SKILL.md` with PR #61 and this diff; back up and hash the exact affected files; add the new hook under the existing hook tree and the approved Skill documentation hunk; append only the three fragment groups for each harness while preserving all existing handlers. Include PR #61's separately approved `transcript-context.js` dependency only if not already present and its provenance is verified. Validate JSON and hook trust without triggering a hook or sending a message. The manifest remains `install: false`; do not use a full restore. Stop on unexpected differences, running conflicts, or unsupported events. Live validation is separate, requires an explicitly approved target chat, and must record and privately save/read back every E2E attempt; receipt alone is not compact completion.

Sources: [Codex hooks](https://developers.openai.com/codex/hooks), [Claude Code hooks](https://code.claude.com/docs/en/hooks); the installed T3 CLI's `threadSendCommand`, `threadShowCommand`, and `readLatestMessages` define the queue and read paths. The current source review does not verify a live provider or hook invocation.
