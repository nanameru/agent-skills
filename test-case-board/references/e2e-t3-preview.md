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

## 完全 receipt の事前検査（guard）

新しい空 run に対して下記を1プロセスで起動し、stdin/stdout の **NDJSON** を1行ずつ往復する。各応答は `{ok:true,result:...}` または `{ok:false,error:...}`。JSON と応答は private に扱う。既存 `receipt` は互換性のため残すが、guard を迂回する raw 経路に事前検査はない。既存 finalize / result v1 / 動画原本の処理は共通のまま。

```sh
node test-case-board/scripts/e2e-t3-cli.mjs guard --run "$RUN_DIR"
```

1. `{"action":"begin","kind":"initial"}` → 発行された `result.ticket` の `tool` と `arguments` をハーネスが正式 T3 tool に渡す。1呼出しずつ完了を待ち、実際に返った標準 `CallToolResult` 全体を `response` に入れる。受理入力の形は `{"action":"accept","envelope":{"ticket":<直前に発行されたticket全体>,"tool":"<実際に呼んだtool名>","callId":"<呼出しごとに一意>","responseId":"<応答envelopeごとに一意>","startedAt":"<実呼出し直前のISO時刻>","finishedAt":"<実呼出し完了直後のISO時刻>","response":<実際のCallToolResult>}}`。ticket の run・tool・arguments・boundary・operationId を変更しない。時刻は直列で単調、開始は終了以前。`response.isError` と `structuredContent` は標準応答の値を使う。
2. `{"action":"begin","kind":"open","arguments":{"reuseExistingTab":false,"url":"http://localhost:PORT/"}}` を同様に受理する。guard は新規 tab と所有権を照合する。`{"action":"begin","kind":"start"}` 以降は、受理応答に次の `ticket` がある間、必ずその呼出しと受理を繰り返す。各操作について fresh `preview_status` before → 指定 tool → fresh `preview_status` after の順に generator が operationId と boundary を付ける。
3. 例: `{"action":"begin","kind":"step","stepId":"click-fixture","tool":"preview_act","arguments":{"action":"click","locator":"aria-ref=REF"}}`。stepId は最初の status 呼出しより前に必須。tabId は guard が付与する。対応 tool は `preview_act` / `preview_evaluate` / `preview_snapshot` / `preview_screenshot`。step の **operation** 応答だけ、envelope に `"outcome":"passed"` または `"failed"` を加える。これはハーネスが実応答と assertion から一度だけ正規化する値であり、標準 T3 応答のフィールドではない。tool error は `failed` にする。未設定・不正なら次操作を出さず失敗記録を残す。generator が stepId / outcome / 実開始終了・元応答を同じ receipt に結び付ける。
4. 最終 after-status の後に `{"action":"test","result":{"at":"<実判定時刻>","status":"passed","exitCode":0,"signal":null,"interruption":null,"failedStep":null}}` を送る。失敗は `status:failed` と実際の exitCode / failedStep を渡す。扱える中断では実呼出しの終了または例外を待ってから `{"action":"abort","at":"<観測時刻>","error":{"name":"AbortError","message":"<実際の内容>"}}` を送り、失敗と中断を記録する。未完了の呼出しと stop を並列にしない。ハーネスは finally で `{"action":"begin","kind":"stop"}` とその ticket 群、続けて `{"action":"finalize"}` を実行する。finalize 応答の `result.ok` は既存 finalize の判定であり、CLI の transport の `ok` とは別。
5. 事前検査や受理が失敗したら次の step は出ない。すでに記録された失敗を消さず、stop と finalize は引き続き試す。stop 前の status 自体が失敗した場合は `{"action":"cleanup"}` で一度だけ stop の ticket を出し、その実応答と可能なら after-status を受理して finalize する。この救済は before 欠落として protocol failure のまま保存を試み、成功へ読み替えない。stop ticket 発行後に応答が失われた場合は重複 stop を自動発行しない。強制終了・EOF・マシン障害のあとに処理が走る保証はない。

発行された ticket、callId、responseId と実応答を既存 `run.log` の各 receipt に格納する。重複 callId または responseId、open と status の tool/ticket の食い違い、境界・operationId・時刻の欠落や逆転を拒否する。同一 JSON 内容の新しい status は拒否しない。guard は1 run/1プロセスで逐次動き、owner-only の `guard-owner` マーカーで2番目の guard を拒む。プロセス消失後は同じ guard を再開せず、既存 raw `finalize` で欠落を失敗として残す。raw 経路との同時使用や別の呼出しを混ぜない責任はハーネスにある。

標準応答に callId / responseId / 時刻が付くと仮定しない。ハーネスが実際の各呼出しの周囲で一意な識別子と時刻を与え、発行 ticket・実引数・戻り値をそのまま結び付ける信頼境界である。署名や第三者認証ではなく、古い応答に偽の新 ID を付ける、あるいは ticket と違う引数で呼ぶ不誠実なハーネスは検出できない。応答内容 hash の重複では鮮度を判定しない。新依存・独自 capture engine・別結果台帳を増やさず、既存の receipt / analyzer / finalize を使うための薄い選択である。guard の mock テストは実 T3 の成功・録画・目視を証明しない。

## 順序と receipt

各 receipt は JSON 1 object。`at` は操作完了時の ISO 時刻で単調順、`ok` は tool の成功、`structuredContent` は返却値をそのまま渡す。失敗も `{kind,at,ok:false,error}` で journal に残し、停止・finalize を試みる。状況次第で不足した receipt は欠落のまま非成功になる。

1. `preview_status` を引数なしで呼び `kind:status` として記録。既存 tab 一覧を保持する。`ok:true` かつ `available:false`, `tabId:null`, `tabs` 省略は tab 未作成の空集合として扱う。`ok:false` は失敗。
2. `preview_open({reuseExistingTab:false,...})` を呼び、`kind:open`、実際の `arguments` と `structuredContent` を渡す。新規 tab ID が既存一覧にないことと ownership を検証する。
3. `preview_status({tabId})` → `kind:status,position:before,operationId:'start-1'`、`preview_recording_start({tabId})` → `kind:start,operationId:'start-1'`、再度 status → `position:after,operationId:'start-1'`。同じ tab と agent ownership を照合する。
4. 各操作は毎回 status(before) → 実際の preview tool → `kind:step` → status(after)。3件の `operationId` は同じ非空文字列の一意値。前の status がない場合、また null・空・非文字列・重複 ID は順序違反となる。step には `stepId`, `tool`, `startedAt`, `outcome:passed|failed` と tool の `structuredContent` を付ける。assertion の結果もハーネスが outcome に記録し、失敗を成功に変えない。tool 自体が失敗した `ok:false` の step も ID・tool・開始終了時刻と failed を保存し、対応する事後 status を確認する。tool 失敗と順序・tab の違反は分けて記録する。ステップ全体が操作を含まない場合も tool receipt を捏造しない。
5. テスト終了時は `kind:test` に `status:passed|failed|not-run`, `exitCode`（無ければ null）, `signal`（無ければ null）, `interruption`（無ければ null）, 任意の `failedStep` を記録。最後の step の事後 status 完了後、stop の事前 status より前に記録する。早期・重複・stop 途中の申告や判定後の新たな step は契約違反だが、最初の申告は結果に残す。テスト状態は録画状態と独立。
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

`result.json` は既存 `test-board-e2e-result-v1` 共通 fields を維持する。`error` は string または null、`environment.agentBrowser` は null、`interruption` は `{reason,observedAt}` または null。文字列の中断申告は receipt の `at` を観測時刻にし、object は非空 reason と有効な observedAt を要する。複数の test receipt に中断がある場合、最初の有効な中断を結果に保持し、後続は run.log に残す。最初の test 後の abort も中断を保持するが、重複や順序違反は protocol error のままで成功にはならない。無効な中断は protocol error とし、有効な中断を上書きしない。原文は run.log に残る。`protocolErrors`・`toolFailures`・`testErrors` は追加情報で、原 test 状態を書き換えない。`recording.mp4` は stop が返した原本の排他的コピー。source hash、全 decode、実 decoded frame ごとの PTS を `source-frames.json` に保存して読戻す。warning は readback 内に残す。各 step の wall-clock と startedAt の差だけでは実 media PTS に同期できないため `seekable:false`、目視は `unverified`。

編集入力例: `{"segments":[{"start":0.2,"end":2.5,"speed":2}],"freezeSeconds":1,"outputFps":30}`。秒は ffprobe が読んだ source PTS。encode と filter の再実行は `-copyts` により入力 PTS 軸を保持し、trim 後に setpts で開始を揃える。source の frame hash は同じ入力軸で取得し、decoded output との照合は ordinal を使う。各 segment の trim・速度変更後に output fps へ変換し、要求範囲を速度で割った長さで再度 trim してから結合し、末尾を freeze する。さらに全体を予定時間で trim することで VFR の長い末尾 packet が持ち越されることを抑える。実 frame 2枚未満や範囲外は拒否する。ffmpeg 標準 filter と libx264 lossless (`-qp 0`, yuv420p) で原本とは別の UUID MP4 を作り、全 decode / PTS / hash を読戻す。libx264 が使えない場合、派生生成は失敗として記録する。

`derived-UUID.json` は原本・派生の hash、編集内容、実 source frames、`plannedMapping`、`verifiedMapping` を区別する。trim 後の最初の実 frame の PTS を別途記録し、setpts はその frame を 0 に戻す。要求した開始時刻と最初の frame は一致するとは限らない。予定時間は要求範囲からの計算値。`timeline` に予定 segment / freeze 境界、実出力の最初・最後の PTS、duration と frame 数、許容誤差・durationCheck を記録する。fps 丸めの許容幅は (segment 数 + 2) / output fps 秒で、範囲外なら派生生成を失敗とする。duration の機械確認は個別 segment や freeze 境界の確認ではなく、`verifiedBoundaries` は空のまま。

source の pixel format と color range を ffprobe で取得し、`colorNormalization` に元の値と採用した範囲を残す。source と filter の両方を `scale=in_range=pc|tv:out_range=tv,format=yuv420p` で同一条件に正規化し、lossless 派生は tv range を指定し、H.264 bitstream filter `h264_metadata=video_full_range_flag=0` で VUI の limited range flag も明示する（[FFmpeg 公式仕様](https://ffmpeg.org/ffmpeg-bitstream-filters.html#h264_005fmetadata)）。primaries・transfer・matrix は推測して設定しない。出力が実際に tv と読戻せない場合は失敗とする。`yuvj` は full-range と扱い、metadata が矛盾すれば拒否する。range 不明の場合は tv を仮定して生成を試みるが、source との対応は未検証とする。検証では正規化後の source、filter 出力、tv-range 派生 decode の `framemd5` を比較する。filter と派生 decode は全 frame の順番・hash が一致し、filter PTS と実 derived decoded PTS の差が 1マイクロ秒以内の場合のみ照合を続ける。source 全体と filter 出力のそれぞれで画像 hash が一意な frame のみ、`sourceFrame/sourcePts`, `filterFrame/filterPts`, `derivedFrame/derivedPts`, `pixelMd5` として `verifiedMapping` に入れる。重複画像、freeze の複製、未対応 frame は未確認。これは指定 range に正規化した後の画素一致の確認であり、原本の生画素との完全一致を意味しない。また、操作や assertion の意味、区間全体、freeze の全フレームを確認したものではない。`mappingStatus:partially-verified` は記録された個々の frame にのみ適用する。照合不能時も派生生成と区別して `verificationError` を残す。派生失敗は test 結果を変えない。出力 fps は capture fps ではない。

### 目視確認と seek gate

ハーネスまたは担当者が原本を実際に見た後、同じ run の step と PTS 範囲を inspect に渡せる。例の識別子・文は架空で、公開時は実 path・動画・個人情報・生ログを載せない。

```json
{"stepId":"submit","verdict":"confirmed","observer":"reviewer","inspectedAt":"2026-11-14T01:05:00Z","sourceStartPts":1.2,"sourceEndPts":2.4,"note":"操作と結果を原本で確認"}
```

`inspection-UUID.json` (`test-board-t3-inspection-v1`) は run/case、原本 hash、step ID、元の step status、申告された観察、範囲内の実 frame、範囲検査結果を持つ。範囲外・実 frame がない範囲・存在しない／重複 step は拒否。範囲チェックは観察の真偽を証明せず、目視確認は信頼済みハーネスまたは担当者の申告。原 `result.json` は不変で、失敗を成功に変えない。

viewer が source seek を許すのは、同じ run と source hash の inspection sidecar があり `rangeCheck:passed`、`seekable:true`、対象 step が一致する場合の当該範囲のみ。derived では更に同じ source/derived hash の `verifiedMapping` にある個々の frame のみ対応済みとする。重複 frame、間の補間、予定 mapping は確定 seek の根拠にしない。ISO 時刻と recording startedAt の差だけでは seek 不可。これらの sidecar は private な証跡であり公開 API ではない。
