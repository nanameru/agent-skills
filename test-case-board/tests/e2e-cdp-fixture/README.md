# Issue #54: AC-5 限定実証台本

この fixture は secret を使わない localhost ページと、標準 `agent-browser` 0.43.0 の録画中に、別の native CDP 接続から同じ実ページに信頼済みクリックを送れるかを調べる **1 試行**の台本。共通入口の adapter、製品テスト、E2E の合格結果ではない。準備と実行は別コマンド。作成担当は準備・実行とも実ブラウザーを起動していない。

## 調査した固定版と前提

- [0.43.0 の録画仕様](https://github.com/vercel-labs/agent-browser/blob/1cc19526f3641c8543d55aa6700e7c55b37ac356/docs/content/docs/recording.mdx#L31-L38) は、URL なしの `record start` が現在のページをそのまま記録し、新 context/tab は作らないと説明する。[同版の録画 source](https://github.com/vercel-labs/agent-browser/blob/1cc19526f3641c8543d55aa6700e7c55b37ac356/cli/src/native/recording.rs#L1334-L1385) は、ページ target を取得して録画専用の別 CDP session を同じ target に attach する。以前の実装での再作成を、現行版の実測として扱わない。台本は開始前後の target、context、context 集合を実測する。
- バージョン付き CLI の `skills get core --ref commands` は `get cdp-url`、`record start/stop` を定義する。[同版 source](https://github.com/vercel-labs/agent-browser/blob/1cc19526f3641c8543d55aa6700e7c55b37ac356/cli/src/native/actions.rs#L6482-L6488) はその戻り値を `cdpUrl` として返す。台本は自分が起動した session のこの正式取得値だけを使い、loopback の browser WebSocket 以外を拒否する。既存の端末/browser/profile、推測ポート、T3 の非公開 endpoint は使わない。
- 標準 recorder に `record start` / `record stop` を依頼する。`protocol.mjs` は CDP 入力・ID 観測用の通信のみで、独自 capture engine ではない。[CDP Target API](https://chromedevtools.github.io/devtools-protocol/tot/Target/) の `getTargets`、`getBrowserContexts`、`attachToTarget`、`getTargetInfo` を使う。実際の recorder 内部 target を外部から直接取得したわけではないので `captureTargetIdentity` は `unverified` のまま。動画とログの一致は別途目視する。
- 既存 `scripts/e2e-run.mjs` は CLI の active target が録画前後で同一であることを先に要求し、worker の CDP 接続を受け付けない。今回の再作成の有無を観測し、変化した場合も録画後の target へ接続する実験にはそのまま使えない。全 decode・実 PTS・hash 読戻しの考え方を参照し、共通 runner・dispatch は変更していない。#50 の T3 lifecycle/result/abort は流用していない。

## 初回失敗と再開条件

固定 `c06fe760521b6e9ae4125efa76acecc55c1b0887` の初回は prepare exit 0、run exit 1。録画前に CLI は 1 active tab を返したが CDP の page は 2 件で、単一 page の検査で停止した。worker・入力・録画は未実施。その実行の target 集合はログに保存されておらず、余分な page の正体は不明。[固定版の source](https://github.com/vercel-labs/agent-browser/blob/1cc19526f3641c8543d55aa6700e7c55b37ac356/cli/src/native/browser.rs#L175-L184) では CLI は内部 URL を追跡対象から除き、[追跡 page が空のとき](https://github.com/vercel-labs/agent-browser/blob/1cc19526f3641c8543d55aa6700e7c55b37ac356/cli/src/native/browser.rs#L878-L909) `about:blank` を作るため、件数が違う可能性がある。親の read-only 照合では初回 profile の session 履歴に `chrome://new-tab-page/` と fixture URL があり、Preferences は正常終了・startup URL 未指定だった。ただし履歴は当時の target 集合と直接対応しないため、今回の原因と断定できない。

[core commands](https://github.com/vercel-labs/agent-browser/blob/1cc19526f3641c8543d55aa6700e7c55b37ac356/skill-data/core/references/commands.md#L556-L560) は `--args` を公開し、[分割処理](https://github.com/vercel-labs/agent-browser/blob/1cc19526f3641c8543d55aa6700e7c55b37ac356/cli/src/flags.rs#L25-L55)と [Chrome 引数の追加・起動](https://github.com/vercel-labs/agent-browser/blob/1cc19526f3641c8543d55aa6700e7c55b37ac356/cli/src/native/cdp/chrome.rs#L570-L580)は `about:blank` を起動引数として渡せることを示す。[Chromium の headless 説明](https://chromium.googlesource.com/chromium/src/+/79a727c99ca83beccd458cb1d18b6f27fda3d720/headless/README.md)にも起動時 URL の例があり、初期 new-tab を避ける候補としては妥当。ただし全 CDP page が常に 1 件になる保証や、今回の余分な page が消える根拠は示していない。[管理役の限定再開指示](https://github.com/nanameru/agent-skills/issues/54#issuecomment-6882634893)に従い、専用 profile の起動引数に `--args about:blank` を加える。CLI tab・CDP 全 target・context の応答は、単一 page の検査前に private `run.jsonl` へ保存して sync する。生応答は公開しない。単一 page と所有の検査は維持し、同じ不一致が再発したら同原因 2 回として停止する。

## 次の実行係へ

1. 親から渡された commit SHA を固定し、checkout が clean であることを確認する。Node 22+、指定 Chrome executable、`npx`、`ffmpeg` の libvpx、`ffprobe`、既存 owner-only private evidence root が必要。`--prepare` は `npx --yes agent-browser@0.43.0 --version` を実行し、npm cache に固定版がなければ取得・キャッシュする場合がある。グローバル install や設定変更は行わず、サーバー・ブラウザー・録画も起動しない。`--run` も同じ事前確認を行う。

   ```sh
   COMMIT='<親が採用したこの台本の完全な commit SHA>'
   CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
   node test-case-board/tests/e2e-cdp-fixture/run.mjs --prepare --chrome "$CHROME" --commit "$COMMIT"
   ```

2. 準備 exit 0 のときだけ、同じ SHA、同じ Chrome で次のコマンドを **1 回** 実行する。これは実ブラウザー・実操作・録画を開始する。台本は専用 profile/session で単一 localhost fixture を読み込む（準備）。標準録画開始前には入力テストを行わない。録画開始後に endpoint を再取得し、別 CDP 接続で現在の target を照合、別 worker の再接続で `Input.dispatchMouseEvent` を送り、`event.isTrusted` による表示を assert する（操作）。クリック後の状態を映すため、assert 成立後に限り 1 秒待つ。

   ```sh
   node test-case-board/tests/e2e-cdp-fixture/run.mjs --run --chrome "$CHROME" --commit "$COMMIT"
   ```

3. コマンドの exit と出力の private `result.json` を確認する。開始前後の `sameTargetAtStart`・context 比較と、操作後の `workerTargetIdentity`・worker exit/signal を分けて記録する。開始時に target/context が変化したまま自動検査が通った場合は exit 2、`inconclusive-start-identity-changed` とし、両立不可と断定せず追加評価を要する。exit 0 も自動検査の結果であり、両立実証の合格を意味しない。`test.status` は入力テストの完了結果で、後処理中の中断は別の `interruption` と非 0 exit で表す。結果確定後に観測した signal は stderr に区別して出し非 0 とする。録画 start/stop、全 decode、実 decoded-frame の PTS、録画とログの SHA-256 読戻しを同じ試行に残す。生動画・ログ・profile は既存 private root 直下の新しい `issue54-<UUID>` だけに保存し、削除・上書きしない。操作時の x/y は private log の step に記録する。
4. 標準 CLI の [record コマンド](https://github.com/vercel-labs/agent-browser/blob/1cc19526f3641c8543d55aa6700e7c55b37ac356/cli/src/commands.rs#L1868-L1894) に status はない。start/stop 応答は操作中ずっと有効だった証拠ではなく、`activeDuringOperation` と recorder 内部の `captureTargetIdentity` は `unverified` のまま。PTS は動画側の時刻であり、ログの wall clock や操作区間との対応は取得していない（`ptsToWallClockMapping` と `operationCoverage` は `unverified`）。別途元動画を目視し、fixture・対象クリック・結果表示が映った範囲を確認する。例えば `ffprobe -v error -select_streams v:0 -show_frames -show_entries frame=pts_time -of flat <private-video>` で全実 PTS を列挙できる。全 decode や hash の成功だけで目視済み・同一映像と判定しない。生ログ、元動画、実際に目視した範囲を区別し、公開記録に private 絶対 path や endpoint を載せない。

いずれかの準備、単一 target/context の確認、標準録画、再接続、native 入力、assert、終了、保存、読戻しが失敗したら、その部分を未達として停止する。両立不可なら adapter 実装へ進まない。同じ原因の失敗が 2 回に達したら再試行しない。1 回目の失敗を削除・上書きせず、再試行が明示されたときも新 UUID の別試行とする。プロセスの強制終了などで `finally` が動かなければ、可能な限り残存データを保全し、欠落を報告する。標準録画の開始や停止が不確実でも台本は停止を試みるが、成功と推測しない。

## 後工程の製品比較基準（親からの read-only 照合）

`nanameru/taiyo-design` PR25 固定 `7908b31a0ed98e2eda4d767290553264ec758f77` の `tests/selection-zoom-e2e.mjs`:

- L130–156: `realDrag` は各 path 点 16 ms、`touchStart` → 60 ms → `touchEnd`/`touchCancel`、`withTouch` の `finally` は 150 ms。
- L471–477: Space `keyDown` → `realClick`（60 ms 保持）→ `keyUp`、`settle(A, 600)`。
- L487–492: 往復 pan は far (+80, +30)、6 点往路 + 6 点復路、`settle` 600 ms。
- L585–588: Ctrl+wheel `deltaY: -100`, `modifiers: 2`、`settle` 500 ms、倍率 `exp(0.25)` の誤差 1%。

これらの入力・assert・待機・速度を後工程で元ソースと再照合する。今回の fixture は touch や製品の動作を検証しない。`dispatchEvent` は native touch の代替にしない。上記の詳細行は親の read-only 照合による提供で、この作成担当による再読は取得エラーで停止している。PR23 固定 `f150d0ce4ae794258ed50d6ac1347644e552e799` も製品実装の参照対象であり、製品 repo の変更や製品 E2E は行わない。
