# Issue #46: entrypoint fixture and regressions

These are **planned, unverified tests**. The commands below must be run by the designated execution role on a fixed commit. None of the files in this directory launch a browser when imported by the test worker; the explicit driver launches the entrypoint only when invoked. The board tracks plans; per-attempt outcomes are kept privately, not written as `pass` into `test-board.yaml`.

## Two separate layers

- `e2e-fixture/driver.mjs` runs the **real** localhost page through `bin/test-board e2e` and the `test-board-agent-browser-v1` runner. No credential, remote page, direct browser launch, or separate browser session is used by the runner. READY, an actual button click, and CLICKED are named steps. The page sends `/clicked`; the server records timestamped events and the runner captures the browser console in the entrypoint log. Correlate these with step timestamps and the original video. `/pending` is sent within `pending-interruption` only after the entrypoint releases the worker following recording start; the driver then sends the requested signal to the entrypoint process. Timeout instead leaves the operation pending for the entrypoint deadline. No wait or slowdown is added to make a recording pass.
- `e2e-regression.test.mjs` is a **fake-CLI boundary regression**, not browser E2E. The fake produces synthetic video with local ffmpeg, deliberately empty/corrupt bytes, or a fake stop error, in new directories only. It never reads or modifies an earlier video. A fake `--version` may be held until its own safety deadline to exercise preflight signal/timeout handling. Its marker is observed before sending a signal. The regression keeps its synthetic output and logs privately for diagnosis; it never calls a real browser.

The reference at `nanameru/dom-to-pptx-ai` commit `3567375f7232b878c584d0d73339d5378f3321ac` uses the CLI JSON `data.result` for `eval`. This runner uses the same shape; `agent-browser` 0.43.0 `get --help` and `wait --help` show commands but do not themselves establish the `get text` JSON data shape. The fixture deliberately does not infer that shape. The fixed reference's successful 0.43.0 recording does not establish abnormal paths or CI behavior here.

## Environment

Use Node 22+, the designated official agent-browser 0.43.0 binary, Chrome, ffmpeg with libvpx, ffprobe and Git. The real entrypoint checks its own prerequisites. `TB_EVIDENCE_DIR` and `TB_FAKE_TEST_DIR` must each name an **existing**, owner-only (0700), private directory outside the checkout. Set them to authorized persistent locations; do not put credentials, customer information, session IDs, or machine-specific paths in Git. No command removes previous evidence. The fake suite creates a new UUID subdirectory under `TB_FAKE_TEST_DIR`; the real driver creates a new UUID suite under `TB_EVIDENCE_DIR`, with another distinct entrypoint UUID for each attempt. Preserve failed and interrupted attempts too.

Set these for the execution environment, using paths supplied privately by the operator:

```sh
export TB_EVIDENCE_DIR='<existing private evidence directory>'
export TB_FAKE_TEST_DIR='<existing private fake-test directory>'
export TB_BROWSER='<absolute path to official agent-browser 0.43.0>'
export AGENT_BROWSER_EXECUTABLE_PATH='<absolute path to Chrome>'
export PATH="$HOME/.local/bin:$PATH"
export TB_E2E_ENVIRONMENT='OS / browser version / harness'
```

`TB_TIMEOUT_MS` optionally overrides the entrypoint timeout; default is 120000 ms, or 45000 ms for the deliberately pending timeout scenario. Use a deadline long enough for real setup to reach the pending step. An early timeout is a failure, not a valid timeout test. There is no automatic retry.

## Direct fake regressions

```sh
node --test test-case-board/tests/e2e-regression.test.mjs
```

To select only the fake dispatched-operation/SIGINT ordering regression:

```sh
node --test --test-name-pattern='fake: SIGINT waits for dispatched operation before record stop' test-case-board/tests/e2e-regression.test.mjs
```

This mock-only case waits for the fake operation to start and the worker to receive SIGTERM before releasing the fake response. It checks that the response completes before `record stop`, and separately checks the interruption result and synthetic video readback. Its deadline only bounds the fake; no real browser is started.

Expected exit after the relevant product fixes: **0**. The pre-existing implementation at `37dc272fd9da89ce318b3c6f9b36d1578469bddf` is expected to fail the new preflight-interruption, unsupported-global-flag and Allure evidence-status checks; this is a static expectation and has not been run. The suite also checks empty/corrupt media rejection, unsupported runner contract and session argument, version and private-mode refusal, failing test with successfully read-back synthetic media, passing test with a fake recording-stop failure, and retry isolation. It compares the failed attempt's original result, synthetic video and log hashes before and after the retry. `visualInspection` is never asserted as passed. The mock-generated video is not an original recording of a real browser.

Preflight `SIGINT`, `SIGTERM`, and timeout each wait for the fake version command to create its readiness marker. The fake holds that command; the test asserts a retained `result.json` with the original interruption and `not-run` test status. The underlying preflight subprocess has its own deadline, so these checks can take tens of seconds without a fixed wait to pass.

## Real recorded fixture

```sh
node test-case-board/tests/e2e-fixture/driver.mjs --scenario success
node test-case-board/tests/e2e-fixture/driver.mjs --scenario assertion
node test-case-board/tests/e2e-fixture/driver.mjs --scenario sigint
node test-case-board/tests/e2e-fixture/driver.mjs --scenario sigterm
node test-case-board/tests/e2e-fixture/driver.mjs --scenario timeout
node test-case-board/tests/e2e-fixture/driver.mjs --scenario retry
# Or one invocation for all of the above, with two separate retry attempts:
node test-case-board/tests/e2e-fixture/driver.mjs --scenario all
```

The **driver** exits 0 only when each selected attempt has its expected outcome and required mechanical recording checks. Its underlying `test-board e2e` invocation must exit 0 for `success` and 1 for assertion, handled signals and timeout. `retry` expects 1 followed by 0 for the same case; both attempt UUIDs, videos and logs must differ, and the first result/video/log/driver bytes are hashed again after the second. For assertion, the original worker exit 1, failed step and assertion message remain failures even when recording succeeds. For interrupt/timeout, the driver verifies the pending event, the entrypoint error, original worker signal, failed step, stop and readback. Each attempt has its own private driver record; if a check fails, do not discard it or silently retry.

For each `result.json`, inspect `run.log`, `server-events.jsonl`, and `driver.json` with the timestamps/step names, check the actual source revision and environment, and perform a **separate human visual inspection** of the original `recording.webm`: confirm the right page, click, result, and any failure are visible. Decode, frame timestamps and checksum verification are mechanical checks only. Record any visual findings separately in the same private suite without changing the original video/result/log. Server events and console output are fixture data, not a network capture.

The driver maps success/assertion, interruptions, and retry to `TC-046-E2E`, `TC-046-INTERRUPT`, and `TC-046-RETRY` respectively; the two retry attempts use the same case ID. The suite must be performed independently in each available Codex/Claude harness to address AC-04; one harness does not establish the other. SIGKILL, power loss, OS crash, CI, browser/version variations and visual review remain unverified unless separately performed and recorded. The fixture does not verify distribution, OSS comparisons, PRs or installed skills (AC-05/06).
