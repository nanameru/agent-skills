# T3 preview の receipt 契約 v1

この入口はハーネスが正式 T3 tools を呼び、応答を渡す。Node は T3 tool を呼ばない。receipt は**信頼済みハーネスの申告**であり第三者認証ではない。ハーネスは対象の新規専用 tab だけを逐次操作し、他の tab や同時操作を混ぜない。1 case / 1 run / 1 video。実行責任者は private 永続領域と秘密情報の扱いを管理する。receipt と run.log には tab ID、tool 結果、path 等が含まれるので公開しない。

```sh
test-board e2e --provider t3 prepare --case TC-001 --evidence-dir /private/evidence --data-kind fixture --issue 50 --environment 'OS / T3'
test-board e2e --provider t3 receipt --run /private/evidence/TC-001-UUID --input /private/receipt.json
test-board e2e --provider t3 finalize --run /private/evidence/TC-001-UUID
test-board e2e --provider t3 derive --run /private/evidence/TC-001-UUID --input /private/edit.json
test-board e2e --provider t3 inspect --run /private/evidence/TC-001-UUID --input /private/observation.json
```

prepare の JSON 出力の `runDir` と `runId` を使う。retry は新しい prepare に `--retry-of <prior-run-UUID>` を渡す。run は owner-only UUID ディレクトリで、既存ファイルを上書きしない。ハーネスは各 receipt を順次渡し、前の CLI の終了を待つ。ライブラリ `scripts/e2e-t3-lifecycle.mjs` は `prepare`, `receipt`, `finalize`, `derive`, `inspect` を export する。CLI と同じ引数・制約を守る。

## 順序と receipt

各 receipt は JSON 1 object。`at` は操作完了時の ISO 時刻で単調順、`ok` は tool の成功、`structuredContent` は返却値をそのまま渡す。失敗も `{kind,at,ok:false,error}` で journal に残し、停止・finalize を試みる。状況次第で不足した receipt は欠落のまま非成功になる。

1. `preview_status` を引数なしで呼び `kind:status` として記録。既存 tab 一覧を保持する。`ok:true` かつ `available:false`, `tabId:null`, `tabs` 省略は tab 未作成の空集合として扱う。`ok:false` は失敗。
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

編集入力例: `{"segments":[{"start":0.2,"end":2.5,"speed":2}],"freezeSeconds":1,"outputFps":30}`。秒は source PTS、複数 segment の順序で結合し末尾を freeze。実 frame 2枚未満や範囲外は拒否する。ffmpeg 標準 filter と libx264 lossless (`-qp 0`, yuv420p) で原本とは別の UUID MP4 を作り、全 decode / PTS / hash を読戻す。libx264 が使えない場合、派生生成は失敗として記録する。

`derived-UUID.json` は原本・派生の hash、編集内容、実 source frames、`plannedMapping`、`verifiedMapping` を区別する。trim 後の最初の実 frame の PTS を別途記録し、setpts はその frame を 0 に戻す。要求した開始時刻と最初の frame は一致するとは限らない。予定時間は要求範囲からの計算値で、frame duration・結合位置・fps 丸めは未確認。

検証では同じ yuv420p の source、filter 出力、lossless 派生 decode の `framemd5` を比較する。filter と派生 decode は全 frame の順番・hash が一致し、filter PTS と実 derived decoded PTS の差が 1マイクロ秒以内の場合のみ照合を続ける。source 全体と filter 出力のそれぞれで画像 hash が一意な frame のみ、`sourceFrame/sourcePts`, `filterFrame/filterPts`, `derivedFrame/derivedPts`, `pixelMd5` として `verifiedMapping` に入れる。重複画像、freeze の複製、未対応 frame は未確認。これは画素一致の確認であり、操作や assertion の意味、区間全体、freeze の全フレームを確認したものではない。`mappingStatus:partially-verified` は記録された個々の frame にのみ適用する。照合不能時も派生生成と区別して `verificationError` を残す。派生失敗は test 結果を変えない。出力 fps は capture fps ではない。

### 目視確認と seek gate

ハーネスまたは担当者が原本を実際に見た後、同じ run の step と PTS 範囲を inspect に渡せる。例の識別子・文は架空で、公開時は実 path・動画・個人情報・生ログを載せない。

```json
{"stepId":"submit","verdict":"confirmed","observer":"reviewer","inspectedAt":"2026-11-14T01:05:00Z","sourceStartPts":1.2,"sourceEndPts":2.4,"note":"操作と結果を原本で確認"}
```

`inspection-UUID.json` (`test-board-t3-inspection-v1`) は run/case、原本 hash、step ID、元の step status、申告された観察、範囲内の実 frame、範囲検査結果を持つ。範囲外・実 frame がない範囲・存在しない／重複 step は拒否。範囲チェックは観察の真偽を証明せず、目視確認は信頼済みハーネスまたは担当者の申告。原 `result.json` は不変で、失敗を成功に変えない。

viewer が source seek を許すのは、同じ run と source hash の inspection sidecar があり `rangeCheck:passed`、`seekable:true`、対象 step が一致する場合の当該範囲のみ。derived では更に同じ source/derived hash の `verifiedMapping` にある個々の frame のみ対応済みとする。重複 frame、間の補間、予定 mapping は確定 seek の根拠にしない。ISO 時刻と recording startedAt の差だけでは seek 不可。これらの sidecar は private な証跡であり公開 API ではない。
