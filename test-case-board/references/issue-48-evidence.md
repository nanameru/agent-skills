# Issue #48: ケース定義と過去の証跡

`test-board.yaml` は定義であり実行結果の台帳ではない。各ケースの `title` / `scenario` は実テスト名、`expected` はそのassertionの範囲、`command` は実行方法、`evidence` はこの文書を示す。全ケースは `todo` のまま維持し、過去の合格を現在のcommitの合格として書き戻さない。CLI 4件は一時YAMLを作って別プロセスのCLIを呼ぶintegration、24件はfake CLIと合成メディアを使うregressionであり実ブラウザーE2Eではない。`TC-046-FAKE` は個別 `TC-048-F01`〜`F24` の集約定義。`gaps` はファイルや証跡値の存在を検出するだけで、証跡の内容、真正性、テスト層の合格を認証しない。

## 参照の扱い

以下のprivate相対パスはIssue #46の承認済みprivate evidence rootを基準とする。ファイルの中身はGitにコピーせず、そのまま読む。公開可能な全体の根拠と限界は [Issue #46 管理役の受入結果](https://github.com/nanameru/agent-skills/issues/46#issuecomment-6869826324)、過去の失敗は [失敗と再試行履歴](https://github.com/nanameru/agent-skills/issues/46#issuecomment-6869389054)。

固定 `2332bfde86de1531b57664249ca14e8bd3a9f78a` clean、2026-11-14 UTC、macOS 27.2 arm64、Node 24.22.2、ffmpeg/ffprobe 9.0.2。CLI 4件は01:45:47〜01:45:48 UTC exit 0、fake 24件は01:45:51〜01:47:31 UTC exit 0。元metaの小数秒表記は不正なため、正確な時刻は各metaのepoch値を使う。コマンド、結果、環境、hash原本:

- `539ecdd2-b2c8-41c6-bd52-6e5870052c78/01-test-board-unit-tests.meta` と `539ecdd2-b2c8-41c6-bd52-6e5870052c78/01-test-board-unit-tests.stdout`
- `539ecdd2-b2c8-41c6-bd52-6e5870052c78/02-e2e-regression-tests.meta` と `539ecdd2-b2c8-41c6-bd52-6e5870052c78/02-e2e-regression-tests.stdout`
- `539ecdd2-b2c8-41c6-bd52-6e5870052c78/environment.txt`、`manifest.json`、`checksums.txt`（後者も同じディレクトリ内）

## 実fixtureの過去7試行

以下は `9186047b9b099062d8e6a255dc37fc0911179dd3` clean の2026-11-14 UTC、macOS 27.2 arm64 / Node 24.22.2 / Chrome 157.0.8103.80 / agent-browser 0.43.0 / ffmpeg 9.0.2のlocalhost実行。driverは各コマンドexit 0、表のexitは入口の元結果。driver実行方法と環境の詳細・checksumは `exec-swe2flash-16f66b22-4937-4476-bd47-961b2251b90c/commands.md`、同ディレクトリの `environment.md`、`manifest.sha256` を参照する。表の各パスは元 `result.json` で、同じディレクトリに元動画とログがある。

| ケース・試行 | UTC開始〜終了 | 入口exit・元結果 | private相対パス |
| --- | --- | --- | --- |
| TC-046-E2E success | 01:15:14.903〜01:15:17.632 | 0 passed | `fixture-46-314e0eb8-12f2-4410-8d17-840708a2a9f9/runs/TC-046-E2E-fc8626eb-287f-47fa-ab4d-705c73a4b3f0/result.json` |
| TC-046-E2E assertion | 01:15:23.370〜01:15:26.329 | 1 意図的assertion失敗 | `fixture-46-4601da57-b3b9-4ac6-9588-03d715f639a0/runs/TC-046-E2E-1a873b37-d18f-498b-acd6-67d3a0c4070e/result.json` |
| TC-046-INTERRUPT SIGINT | 01:15:32.238〜01:16:04.308 | 1 中断 | `fixture-46-cee6cc9b-d211-47f3-8988-4f489d2b17ad/runs/TC-046-INTERRUPT-fc28a0b6-31d3-4a17-bbec-33ad659f4969/result.json` |
| TC-046-INTERRUPT SIGTERM | 01:16:07.959〜01:16:41.431 | 1 中断 | `fixture-46-9f942788-6c92-48d3-8fff-f643851be195/runs/TC-046-INTERRUPT-f7ba9353-28f5-4494-ba12-5dbd6c318e07/result.json` |
| TC-046-INTERRUPT timeout | 01:16:45.559〜01:17:18.423 | 1 timeout | `fixture-46-bc03eb30-5dae-42a1-85d1-b951ad767507/runs/TC-046-INTERRUPT-c1893f65-a82b-4d91-86f3-bd08b9852443/result.json` |
| TC-046-RETRY 初回 | 01:17:23.444〜01:17:26.230 | 1 意図的assertion失敗 | `fixture-46-a6b6f55c-ae3c-4873-b8ae-134ec4ba4762/runs/TC-046-RETRY-ac24b6c1-6dcb-40dc-a527-3a1fb9535d11/result.json` |
| TC-046-RETRY 再試行 | 01:17:26.287〜01:17:28.084 | 0 passed | `fixture-46-a6b6f55c-ae3c-4873-b8ae-134ec4ba4762/runs/TC-046-RETRY-706ee503-2265-443d-b36e-5fe9c17ed286/result.json` |

全7回は録画保存と機械読戻しを記録し、中断3回のtargetContinuityは未検証。部分目視は `sol-readback-37e1a894-3558-44e5-a179-ce63d17bfd5a/readback.md`。短い4動画は各9フレーム、長い3動画は各23/909フレームを目視し、元resultのvisualInspectionやcaptureTargetIdentityはunverifiedのまま。CodexとClaudeのsuccess各1回も同readbackから辿れるが全異常系を意味しない。

旧SHAと固定SHAの `git diff --raw 9186047b9b099062d8e6a255dc37fc0911179dd3 2332bfde86de1531b57664249ca14e8bd3a9f78a -- test-case-board/scripts/e2e-run.mjs test-case-board/scripts/e2e-worker.mjs test-case-board/tests/e2e-fixture test-case-board/tests/e2e-regression.test.mjs test-case-board/tests/fakes` は空。engine、worker、fixture、回帰テスト、fakeの各blobが同一である根拠であり、旧実行を新SHAで再実行したことにはならない。

## 境界と不足

- CLIの4 assertionは `gaps` 出力に対象行があるかないかと終了コードのみを確認する。証跡の内容や層を検証しない。unitとして独立した純粋関数テストは現状なく、機能を跨ぐCLIテストをunitと改称しない。parserの引用符やinline list等の独立した入力境界は追加テスト候補だが、PR #32の未mergeの19件やparser変更は含めない。
- 安全対策としてF13は別sessionのopen/引数がfake CLIに到達しないこと、F15は非private directoryが拒否され空のままであること、F17〜18は指定した2つのglobal flagがfake CLIに渡らないことをassertする。対象はそれぞれの入力例とfake境界に限る。全flag、symlinkや競合、実ブラウザー、他OS、権限構成、秘密の流出、全repoの脆弱性の検証ではない。実際に必要な追加候補は未許可flagの別形式とprivate directoryのsymlink・権限変化の拒否を観測する直接回帰。安全な検証環境と仕様の確認が必要。
- 他OS・CI・他ブラウザー、SIGKILL/電源断、全フレーム目視、実capture対象の同一性、Allure画面、両ハーネスの異常系は未検証。認証や課金の実フローはこのlocalhost fixtureの対象外で、合格とは扱わない。
