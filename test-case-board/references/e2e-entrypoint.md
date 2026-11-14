# 共通ブラウザ E2E 入口（v1）

`test-board.yaml` はケース ID・目的・期待値・Issue の正本。実行ごとに台帳を書き換えない。既存の計画ケースは保持する。実行結果と元動画は指定された private な永続領域へ置く。新しいテスト管理サービス・DB・自作 UI は使わない。

## 実行前提と入口

Node.js 22 以上、明示指定した正式 `agent-browser` **0.43.0**、対応 Chrome、`ffmpeg`（libvpx）と `ffprobe`、Git、空き容量、オーナーのみアクセス可能な既存 private 永続ディレクトリが必要。保存先は checkout 外、共有一時領域・公開ディレクトリ外とする。利用者がマウントと保存期間を管理する。環境確認は版・実行権限・encoder・空き 64 MiB 以上を確認するが、空き容量の将来保証ではない。最低限を下回ったらテストを始めない。実行には既存テストを下記の契約へ接続する adapter が必要。任意の shell コマンド、既存の別セッション、Playwright/CDP 等をそのまま包む入口ではない。

```sh
test-board e2e --case TC-001 --runner ./path/to/adapter.mjs \
  --browser /path/to/agent-browser --evidence-dir /path/to/private-evidence \
  --data-kind fixture --issue 46 --environment 'OS / browser version / harness' --timeout-ms 120000
```

保存先や実行引数、step、コマンド、stdout/stderr、git の未追跡ファイル名は private 結果に記録され得る。秘密情報や実顧客データを使わない fixture を優先し、証跡の取り扱いに注意する。CLI は許可されていないアップロードや YAML 更新をしない。`--issue` と `--environment` は任意。終了コード 0 はテストと機械確認の双方が通った意味で、動画の目視確認完了を意味しない。失敗でも `result.json` 内に元の worker exit code/signal と録画・保存・読戻し状態を分ける。証跡出力自体が不能なら stderr と非ゼロを返し、保存済みとしない。

## runner 契約 `test-board-agent-browser-v1`

ES module として `contractVersion` と `run` を export する。`run` はこの入口が渡す API を通してのみ対象ブラウザを操作し、各操作と assertion を名前付き `step` で囲む。外部のブラウザ実行・直接 CDP 接続・別セッション・module import 時の画面操作は契約外。runner は信頼できるコードであることが前提で、Node のセキュリティ sandbox ではない。既存 runner が他の方法で直接ブラウザを起動する場合は対応 adapter に変更し、その動作を独立に検証するまで未対応として扱う。元の assertion、exit、待機・速度を弱めない。

```js
export const contractVersion = 'test-board-agent-browser-v1';
export async function run({ caseId, step, command }) {
  await step('open', async () => {
    await command('open', 'http://127.0.0.1:3000/');
  });
  await step('assert-ready', async () => {
    const value = await command('get', 'text', '#status');
    if (value.text !== 'READY') throw new Error('expected READY');
  });
}
```

`command(...strings)` は `agent-browser --session <private session> --json` の `data` を返し、非成功時は throw する。許可コマンドは `open`, `click`, `dblclick`, `fill`, `type`, `press`, `hover`, `focus`, `select`, `check`, `uncheck`, `scroll`, `wait`, `get`, `is`, `eval`, `snapshot`, `screenshot`, `errors`, `console`, `find`。録画の開始・停止、tab 切替、close、session/CDP/profile の切替は runner に渡さない。step は逐次実行し、各 command を await する。ステップの throw は test failure、worker の実終了コードも別途保持する。意図して失敗した command を捕捉する場合も、その事実はログに残る。全体でコマンド未実行・契約違反・version 不一致を成功にしない。

各コマンドの引数も固定されたサブセットに限定する。未知の option、global option、短縮 option は拒否する。`wait` は selector または時間、`--url`・`--load`・`--fn`・`--text`、selector の後の `--state visible|hidden|attached|detached`、`--load` の `--timeout` を受け付ける。`--download` は非対応。`snapshot` は `--interactive`・`--urls`・`--compact`・`--delta`・`--full`・`--depth`・`--selector` を受け付ける。`find` は help にある locator/action と `--name`・`--exact` のみ。その他の引数の形は実装の `runnerCommand` が正本で、`-` で始まる値は対応外。`screenshot` は `command('screenshot', 'name.png')` または `command('screenshot', '--full', 'name.png')` のみで、ファイル名は試行ディレクトリ直下の未使用名に限定する。無名 screenshot、別 path、selector 指定は非対応。

これは信頼済み adapter と CLI 引数の契約であり、runner の JavaScript や `eval` を sandbox 化しない。runner が直接ファイルや別プロセスを操作した場合は契約違反で、これらの制限により外部処理を阻止できるとは主張しない。並行 command、未 await の操作と step の重複は契約違反として拒否する。

本入口は新しい session、空 config、専用 socket/namespace で標準 `record start` と `record stop` を使う。録画前後と各操作前後に単一 active target の hash を照合し、step・時刻・操作引数をログに記録する。これは CLI から見た対象の連続性であり、capture 内部の session ID や capture 方式を確認したという意味ではない。実際の動画を見て、ログの時刻・step・assertion と対応する対象画面と操作が映っていることを別途確認する。目視判定は自動で合格にしない。

socket は各 private 試行内の `sockets` に置く。CLI の作業ディレクトリをそこにし、`AGENT_BROWSER_SOCKET_DIR=.` で相対指定する。固定版 0.43.0 の [socket path と daemon 起動処理](https://github.com/vercel-labs/agent-browser/blob/v0.43.0/cli/src/connection.rs) と [session ファイル名](https://github.com/vercel-labs/agent-browser/blob/v0.43.0/cli/src/session_files.rs) に基づき、独立 UUID の namespace と session を含む path は 101 bytes、上限は 103 bytes として起動前に検査する。動画や結果の保存先は同じ private 試行内に維持する。

## 証跡と制約

各実行は上書きしない UUID ディレクトリ。例外・INT・TERM・timeout では worker を停止し、録画停止・保存と読戻しを試みる。SIGKILL・電源断・OS crash などの救済不能な中断や保存自体の失敗は保証できない。retry は別実行として前の証跡を保持する。自動 retry はしない。

中断時、送信済み CLI 操作は既存の制限時間内で終了を待ってから録画停止を要求する。CLI の終了だけでは daemon 側の操作終了を保証できず、daemon や対象が応答しない場合は停止・読戻しを失敗として残す。中断されたテストは成功にしない。

元 `recording.webm` の SHA-256 を読戻し、ffmpeg で全 decode、ffprobe で実 decoded frame の index と PTS を列挙し、最初と最後を記録する。duration の比率による seek はしない。空・破損・PTS 不足・読戻し中の hash 変化は失敗。decode 成功は映像内容の正しさを保証しない。映像の対象と失敗箇所が見えるかの目視は `visualInspection: unverified` のまま別担当が確認する。動画、JSON、ログは成功・失敗を問わず削除しない。明示的に指定された private 保存先は利用者側で永続性・共有範囲を確認する。

機械読戻しは 1 frame でも PTS と decode が成立すれば通るため、操作区間の十分な記録を証明しない。一般的な `fill`・`type` の secret マスクは実装しておらず、private ログに引数が残る。dirty 識別は開始時の snapshot であり、実行中のファイル変更を検出しない。各制約は目視・実行環境の管理で別途確認する。

内容の照合時は `ffprobe -v error -select_streams v:0 -show_frames -show_entries frame=pts_time -of flat recording.webm` で実 frame と PTS を列挙し、step の時刻と対応する箇所を元動画から確認する。目視結果は元の機械結果を書き換えず、同じ private 試行に別途記録する。

`result.json` は case、Issue、commit、dirty diff と未追跡の hash、開始・終了時刻と timezone、環境、テスト状態と元 exit/signal、失敗 step、録画開始/停止・target 連続性・保存・decode と hash・視認未確認を記録する。dirty の hash は識別用で、差分や未追跡ファイルの完全な復元データではない。再現が必要な場合は秘密を除いた patch と未追跡ファイルを別途 private に保全する。`run.log` には step と操作時刻、CLI 実行結果の成否および runner stdout/stderr がある。ネットワーク通信・console の取得は runner が明示した場合のみで、未取得を取得済みとはしない。ログや動画が秘密情報を含む可能性を考慮し、公開の Issue に絶対 path や生ログを書かない。

## 既存 OSS と配布

[Issue #46 の比較](https://github.com/nanameru/agent-skills/issues/46#issuecomment-6867545661)を採用し、ケースの計画台帳は Git の YAML、実行情報は private 証跡へ分ける。Allure の[公式結果形式](https://allurereport.org/docs/how-it-works-test-result-file/)へ小さな adapter を置き、同一試行の `*-result.json` と動画・ログの hard link を出力する。Allure では録画・保存・読戻し・ログ等の機械証跡が未達なら `broken` とし、元テスト結果と各証跡の状態を `statusDetails` に分ける。目視確認は引き続き別途必要。正本の `result.json` を書き戻してから Allure ファイルを書くため、正本中の `artifacts.allure.status: prepared` は生成準備を表し、Allure ファイル保存済みの証明ではない。Allure は任意 JSON をそのまま読むものではない。Allure 画面表示・履歴・reporter の実動作は未検証。結果形式変換に Allure package を同梱・実行しない。比較対象として [Allure 3 v3.33.0](https://github.com/allure-framework/allure3/releases/tag/v3.33.0) は Apache-2.0、2026-11-14 時点で非 archive・更新あり。実導入時は package と推移依存の license・保守状況・脆弱性をその固定版で改めて確認する。[agent-browser v0.43.0](https://github.com/vercel-labs/agent-browser/releases/tag/v0.43.0) は Apache-2.0、同日時点で非 archive・更新あり。GitHub advisory の npm `agent-browser@0.43.0` 検索は 0 件だったが、全脆弱性がないことの証明ではない。Allure の別サービス、TestOps、Kiwi/ReportPortal の常設 DB や一括移行は導入しない。

正本はこの repo の `test-case-board/`、導入先は `~/.agents/skills/test-case-board`、Claude 側は既存 symlink。既存 `managed-skills.json` の通常 restore は source の最新を取得するため、同一版が必要な別マシンでは次のように**レビュー済みの full commit SHA**を指定して、空の導入先に展開する。既存の導入先がある場合は上書きせず、その内容と切替方法を先に確認する。作業時の自動 restore はしない。

```sh
# A reviewed commit from a verified clone of nanameru/agent-skills.
set -o pipefail
commit=<reviewed-full-commit-sha>
test ! -e "$HOME/.agents/skills/test-case-board" || { echo 'destination exists; stop' >&2; exit 1; }
mkdir -p "$HOME/.agents/skills"
git archive "$commit" test-case-board | tar -x -C "$HOME/.agents/skills"
# Existing compatibility symlinks must resolve to the canonical installed path.
```

`git rev-parse "$commit^{commit}"` と正本側の file hash を展開後の hash と照合し、既存 symlink と `test-board --help` を確認する。これは手順であり、この Issue の実行環境で restore を行ったという記録ではない。
