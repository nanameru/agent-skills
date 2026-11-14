# T3 preview の receipt 契約 v1

この入口はハーネスが正式 T3 tools を呼び、応答を渡す。Node は T3 tool を呼ばない。receipt は**信頼済みハーネスの申告**であり第三者認証ではない。ハーネスは対象の新規専用 tab だけを逐次操作し、他の tab や同時操作を混ぜない。1 case / 1 run / 1 video。実行責任者は private 永続領域と秘密情報の扱いを管理する。receipt と run.log には tab ID、tool 結果、path 等が含まれるので公開しない。

```sh
test-board e2e --provider t3 prepare --case TC-001 --evidence-dir /private/evidence --data-kind fixture --issue 50 --environment 'OS / T3'
test-board e2e --provider t3 receipt --run /private/evidence/TC-001-UUID --input /private/receipt.json
test-board e2e --provider t3 finalize --run /private/evidence/TC-001-UUID
test-board e2e --provider t3 derive --run /private/evidence/TC-001-UUID --input /private/edit.json
```

prepare の JSON 出力の `runDir` と `runId` を使う。retry は新しい prepare に `--retry-of <prior-run-UUID>` を渡す。run は owner-only UUID ディレクトリで、既存ファイルを上書きしない。ハーネスは各 receipt を順次渡し、前の CLI の終了を待つ。ライブラリ `scripts/e2e-t3-lifecycle.mjs` は `prepare`, `receipt`, `finalize`, `derive` を export する。CLI と同じ引数・制約を守る。

## 順序と receipt

各 receipt は JSON 1 object。`at` は操作完了時の ISO 時刻で単調順、`ok` は tool の成功、`structuredContent` は返却値をそのまま渡す。失敗も `{kind,at,ok:false,error}` で journal に残し、停止・finalize を試みる。状況次第で不足した receipt は欠落のまま非成功になる。

1. `preview_status` を引数なしで呼び `kind:status` として記録。既存 tab 一覧を保持する。
2. `preview_open({reuseExistingTab:false,...})` を呼び、`kind:open`、実際の `arguments` と `structuredContent` を渡す。新規 tab ID が既存一覧にないことと ownership を検証する。
3. `preview_status({tabId})` → `kind:status,position:before,operationId:'start-1'`、`preview_recording_start({tabId})` → `kind:start,operationId:'start-1'`、再度 status → `position:after,operationId:'start-1'`。同じ tab と agent ownership を照合する。
4. 各操作は毎回 status(before) → 実際の preview tool → `kind:step` → status(after)。3件の `operationId` は同じ一意値。step には `stepId`, `tool`, `startedAt`, `outcome:passed|failed` と tool の `structuredContent` を付ける。assertion の結果もハーネスが outcome に記録し、失敗を成功に変えない。ステップ全体が操作を含まない場合も tool receipt を捏造しない。
5. テスト終了時は `kind:test` に `status:passed|failed|not-run`, `exitCode`（無ければ null）, `signal`（無ければ null）, `interruption`（無ければ null）, 任意の `failedStep` を記録。テスト状態は録画状態と独立。
6. 成否・扱える中断を問わず status(before) → `preview_recording_stop({tabId})` → status(after) の receipt を渡し、finalize。失敗した stop も渡す。finalize は stop の path のコピーを試み、失敗と欠落を記録する。CLI 0 は test と機械証跡が通った場合だけで、目視の合格を意味しない。

成功例の一部（`structuredContent` は実際の応答をそのまま渡す。下記は形の例）:

```json
{"kind":"status","at":"2026-11-14T01:00:00Z","ok":true,"structuredContent":{"available":true,"tabs":[]}}
{"kind":"open","at":"2026-11-14T01:00:01Z","ok":true,"arguments":{"reuseExistingTab":false},"structuredContent":{"available":true,"tabId":"tab-a","control":{"owner":"agent","ownedByCaller":true},"tabs":[{"tabId":"tab-a","owner":"agent","ownedByCaller":true}]}}
{"kind":"status","at":"2026-11-14T01:00:02Z","ok":true,"position":"before","operationId":"start-1","structuredContent":{"available":true,"tabId":"tab-a","control":{"owner":"agent","ownedByCaller":true},"tabs":[{"tabId":"tab-a","owner":"agent","ownedByCaller":true}]}}
{"kind":"start","at":"2026-11-14T01:00:03Z","ok":true,"operationId":"start-1","structuredContent":{"tabId":"tab-a","recording":true,"startedAt":"2026-11-14T01:00:03Z"}}
```

各成功操作の後の status、step、test、stop とその前後 status は必須。`start` / `stop` / `step` の操作 ID はそれぞれ固有にする。preview tool の失敗でも `ok:false` の receipt を渡す。ハーネスは例外・SIGINT・SIGTERM 時にも stop と finalize を試す。SIGKILL、電源断、OS crash、ハーネス自体の終了は救済を保証できず、後から録画済みにしない。中断で stop receipt が得られなければ未達。

## 原本と派生物

`result.json` は既存 `test-board-e2e-result-v1` 共通 fields を維持する。`recording.mp4` は stop が返した原本の排他的コピー。source hash、全 decode、実 decoded frame ごとの PTS を `source-frames.json` に保存して読戻す。warning は readback 内に残す。各 step の wall-clock と startedAt の差だけでは実 media PTS に同期できないため `seekable:false`、目視は `unverified`。

編集入力例: `{"segments":[{"start":0.2,"end":2.5,"speed":2}],"freezeSeconds":1,"outputFps":30}`。秒は source PTS、複数 segment の順序で結合し末尾を freeze。実 frame 2枚未満や範囲外は拒否する。ffmpeg 標準 filter で原本とは別の UUID MP4 を作り全 decode / PTS / hash を読戻す。`derived-UUID.json` は原本・派生の hash、編集内容、実 source frames、`plannedMapping`、`verifiedMapping` を区別する。trim 後の最初の実 frame の PTS を別途記録し、setpts はその frame を 0 に戻す。要求した開始時刻と最初の frame は一致するとは限らない。予定時間は要求範囲からの計算値で、frame duration・結合位置・fps 丸めは未確認。現在の実装は実際の frame 間の同一性を確認していないので `verifiedMapping` は空、`mappingStatus:unverified`。出力 fps は capture fps ではない。派生失敗は独立記録し test 結果を変更しない。viewer は verified でない mapping を確定 seek として扱わない。
