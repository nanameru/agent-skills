# Issue #54: AC-5 限定実証台本

この fixture は secret を使わない localhost ページと、標準 `agent-browser` 0.43.0 の録画中に、別の native CDP 接続から同じ実ページに信頼済みクリックを送れるかを調べる **1 試行**の台本。共通入口の adapter、製品テスト、E2E の合格結果ではない。準備と実行は別コマンド。作成担当は準備・実行とも実ブラウザーを起動していない。

## 調査した固定版と前提

- [0.43.0 の録画仕様](https://github.com/vercel-labs/agent-browser/blob/1cc19526f3641c8543d55aa6700e7c55b37ac356/docs/content/docs/recording.mdx#L31-L38) は、URL なしの `record start` が現在のページをそのまま記録し、新 context/tab は作らないと説明する。[同版の録画 source](https://github.com/vercel-labs/agent-browser/blob/1cc19526f3641c8543d55aa6700e7c55b37ac356/cli/src/native/recording.rs#L1334-L1385) は、ページ target を取得して録画専用の別 CDP session を同じ target に attach する。以前の実装での再作成を、現行版の実測として扱わない。台本は開始前後の target、context、context 集合を実測する。
- バージョン付き CLI の `skills get core --ref commands` は `get cdp-url`、`record start/stop` を定義する。[同版 source](https://github.com/vercel-labs/agent-browser/blob/1cc19526f3641c8543d55aa6700e7c55b37ac356/cli/src/native/actions.rs#L6482-L6488) はその戻り値を `cdpUrl` として返す。台本は自分が起動した session のこの正式取得値だけを使い、loopback の browser WebSocket 以外を拒否する。既存の端末/browser/profile、推測ポート、T3 の非公開 endpoint は使わない。
- 標準 recorder に `record start` / `record stop` を依頼する。`protocol.mjs` は CDP 入力・ID 観測用の通信のみで、独自 capture engine ではない。[CDP Target API](https://chromedevtools.github.io/devtools-protocol/tot/Target/) の `getTargets`、`getBrowserContexts`、`attachToTarget`、`getTargetInfo` を使う。実際の recorder 内部 target を外部から直接取得したわけではないので `captureTargetIdentity` は `unverified` のまま。動画とログの一致は別途目視する。
- 既存 `scripts/e2e-run.mjs` は CLI の active target が録画前後で同一であることを先に要求し、worker の CDP 接続を受け付けない。今回の再作成の有無を観測し、変化した場合も録画後の target へ接続する実験にはそのまま使えない。全 decode・実 PTS・hash 読戻しの考え方を参照し、共通 runner・dispatch は変更していない。#50 の T3 lifecycle/result/abort は流用していない。

## 次の実行係へ

1. 親から渡された commit SHA を固定し、checkout が clean であることを確認する。Node 22+、指定 Chrome executable、`npx`、`ffmpeg` の libvpx、`ffprobe`、既存 owner-only private evidence root が必要。何もインストール・設定変更しない。`--prepare` は依存確認だけで、サーバー・ブラウザー・録画を起動しない。

   ```sh
   COMMIT='<親が採用したこの台本の完全な commit SHA>'
   CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
   node test-case-board/tests/e2e-cdp-fixture/run.mjs --prepare --chrome "$CHROME" --commit "$COMMIT"
   ```

2. 準備 exit 0 のときだけ、同じ SHA、同じ Chrome で次のコマンドを **1 回** 実行する。これは実ブラウザー・実操作・録画を開始する。台本は専用 profile/session で単一 localhost fixture を読み込む（準備）。標準録画開始前には入力テストを行わない。録画開始後に endpoint を再取得し、別 CDP 接続で現在の target を照合、別 worker の再接続で `Input.dispatchMouseEvent` を送り、`event.isTrusted` による表示を assert する（操作）。クリック後の状態を映すため、assert 成立後に限り 1 秒待つ。

   ```sh
   node test-case-board/tests/e2e-cdp-fixture/run.mjs --run --chrome "$CHROME" --commit "$COMMIT"
   ```

3. コマンドの exit と出力の private `result.json` を確認する。開始前後・操作前後の target/context hash と時刻、worker の exit/signal、録画 start/stop、全 decode、実 decoded-frame の PTS、録画とログの SHA-256 読戻しを同じ試行に残す。生動画・ログ・profile は既存 private root 直下の新しい `issue54-<UUID>` だけに保存し、削除・上書きしない。操作時の x/y は private log の step に記録する。`visualInspection: unverified` は自動で変更されない。
4. 保存された元動画を別途見て、fixture・対象クリック・結果表示が記録されているか、ログの時刻や PTS と照合する。例えば `ffprobe -v error -select_streams v:0 -show_frames -show_entries frame=pts_time -of flat <private-video>` で全実 PTS を列挙できる。全 decode や hash の成功だけで目視済み・同一映像と判定しない。生ログ、元動画、実際に目視した範囲を区別し、公開記録に private 絶対 path や endpoint を載せない。

いずれかの準備、単一 target/context の確認、標準録画、再接続、native 入力、assert、終了、保存、読戻しが失敗したら、その部分を未達として停止する。両立不可なら adapter 実装へ進まない。同じ原因の失敗が 2 回に達したら再試行しない。1 回目の失敗を削除・上書きせず、再試行が明示されたときも新 UUID の別試行とする。プロセスの強制終了などで `finally` が動かなければ、可能な限り残存データを保全し、欠落を報告する。標準録画の開始や停止が不確実でも台本は停止を試みるが、成功と推測しない。

## 後工程の製品比較基準（親からの read-only 照合）

`nanameru/taiyo-design` PR25 固定 `7908b31a0ed98e2eda4d767290553264ec758f77` の `tests/selection-zoom-e2e.mjs`:

- L130–156: `realDrag` は各 path 点 16 ms、`touchStart` → 60 ms → `touchEnd`/`touchCancel`、`withTouch` の `finally` は 150 ms。
- L471–477: Space `keyDown` → `realClick`（60 ms 保持）→ `keyUp`、`settle(A, 600)`。
- L487–492: 往復 pan は far (+80, +30)、6 点往路 + 6 点復路、`settle` 600 ms。
- L585–588: Ctrl+wheel `deltaY: -100`, `modifiers: 2`、`settle` 500 ms、倍率 `exp(0.25)` の誤差 1%。

これらの入力・assert・待機・速度を後工程で元ソースと再照合する。今回の fixture は touch や製品の動作を検証しない。`dispatchEvent` は native touch の代替にしない。上記の詳細行は親の read-only 照合による提供で、この作成担当による再読は取得エラーで停止している。PR23 固定 `f150d0ce4ae794258ed50d6ac1347644e552e799` も製品実装の参照対象であり、製品 repo の変更や製品 E2E は行わない。
