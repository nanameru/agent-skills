# Issue #54: native CDP fixture and four-run driver

This secret-free localhost fixture exercises the common native-CDP entrypoint. It is not the earlier AC-5 proof, a product E2E, a visual inspection, or evidence until a separately authorized operator runs it. The runner does not launch a browser, create a target, discover an endpoint, or capture video: it receives the already owned page and sequential CDP API from the common worker. The entrypoint owns the browser, profile, target, endpoint, standard recorder, and result-v1.

## Source comparison

The product files were read only. The fixture is not a replacement for their assertions, and the product repository has not been changed.

- [PR25 `selection-zoom-e2e.mjs` at `7908b31`](https://github.com/nanameru/taiyo-design/blob/7908b31a0ed98e2eda4d767290553264ec758f77/tests/selection-zoom-e2e.mjs#L111-L175): click sends move/press, holds 60 ms, then releases; drag waits 16 ms at each path point; touch emulation uses five points and is disabled in `finally` after 150 ms; start is followed after 60 ms by end or cancel. Space has `key: ' '`, `code: 'Space'`, `windowsVirtualKeyCode: 32`, and no `nativeVirtualKeyCode`.
- [PR25 settle and liveness](https://github.com/nanameru/taiyo-design/blob/7908b31a0ed98e2eda4d767290553264ec758f77/tests/selection-zoom-e2e.mjs#L181-L217): initial wait, four matching samples 60 ms apart, a 5 s limit, a visible page, live animation frame, and one page. The fixture samples its own x/y/zoom instead of the product's view and card rectangle.
- [Space and roundtrip](https://github.com/nanameru/taiyo-design/blob/7908b31a0ed98e2eda4d767290553264ec758f77/tests/selection-zoom-e2e.mjs#L471-L503): Space down/click/up and the six-point outbound plus six-point return path to (+80, +30) both settle with 600 ms initial wait. Cancellation retains the trusted touch `pointercancel` observation and the unchanged fixture view.
- [Ctrl+wheel](https://github.com/nanameru/taiyo-design/blob/7908b31a0ed98e2eda4d767290553264ec758f77/tests/selection-zoom-e2e.mjs#L575-L588): `deltaX: 0`, `deltaY: -100`, `modifiers: 2`, initial settle 500 ms, zoom `min(4, previous * exp(0.25))` within 1%.
- [PR25 CDP helper](https://github.com/nanameru/taiyo-design/blob/7908b31a0ed98e2eda4d767290553264ec758f77/tests/cdp.mjs) and [PR23 CDP helper at `f150d0c`](https://github.com/nanameru/taiyo-design/blob/f150d0ce4ae794258ed50d6ac1347644e552e799/tests/cdp.mjs) describe `send(method, params, sessionId, timeoutMs)` and page evaluation. Their own Chrome/target creation is intentionally not copied into this runner.

The page records `isTrusted`, touch start/end/cancel, touch `pointercancel`, Space key order and state during the trusted click, mouse buttons and all 12 intermediate pan points, and Ctrl+wheel/zoom. At the far pan point the assertion also checks the view displacement observed during that trusted DOM event, before checking the return. Assertions read actual DOM observations via the supplied page API; no DOM `dispatchEvent` is used as native input. The fixture's unchanged-view tolerance is stricter than the product's 1.5 px and relative 1e-4 thresholds. The one-second display pause follows all native-input assertions and does not alter their timing. View/card selection assertions remain product tests and have not been executed here.

## Operator command after integration

First integrate and review the common implementation and this commit; fix the final SHA and use a clean checkout. The following command is for the separately assigned execution role only. It starts real browser processes and standard recordings:

```sh
node test-case-board/tests/e2e-native-cdp-fixture/driver.mjs \
  --commit '<final-full-commit-sha>' \
  --browser '<absolute-agent-browser-0.43.0-executable>' \
  --chrome '<absolute-approved-chrome-executable>'
```

It requires the existing owner-only `~/.local/share/agent-skills/e2e-evidence` root, Node, ffmpeg and ffprobe. It snapshots existing Issue 54 result/video/log hashes before starting, then creates one new `issue54-<UUID>` directory with process umask 077. It checks those old hashes after every run and in `finally`, and adds each completed run's evidence to the checks before the next run. An unexpected failure stops immediately; no automatic recheck or rerun occurs. In particular, a repeat of the initial single-page mismatch is the second occurrence and stops the sequence. Record-before-input and all ownership checks remain in the common entrypoint.

The four sequential attempts each get a new common-entrypoint run UUID. Expected entrypoint exit/signal and actual worker exit/signal are:

| Attempt | Entrypoint | Worker | Required result |
| --- | --- | --- | --- |
| success | 0 / null | 0 / null | native steps passed |
| intentional assertion | 1 / null | 1 / null | `intentional-assertion-failure`; fixture assertion message |
| SIGTERM | 1 / null | null / SIGTERM | `pending-interruption`; `interruption.reason = SIGTERM` |
| retry | 0 / null | 0 / null | a new successful run after the failed run |

The interrupt request comes from the worker's localhost `/pending` request inside the named step, only after record start released the worker and the native assertions finished. The server sends one SIGTERM to the entrypoint, not the worker, with no CDP call in flight. All four results must contain exactly 26 successful native Input operations (4 touch, 2 key, 20 mouse); the private log records attempts, and is checked against `test.nativeCdpOperations` and the expected Input attempts. Each run must have standard record start/stop, private save, full decode, real first/last frame PTS, hash readback, worker exit/signal and result-v1 checks. In `78567ca`, the abort prevents the after-worker continuity observation, so the interrupted result must retain `targetContinuity: not-verified`; the private log must contain the prior named-step observation. These checks do not establish continuous recorder activity, its internal capture target, wall-clock-to-PTS mapping, or visual inspection; `visualInspection` stays `unverified` and actual frames must be reviewed separately.

If a step, ownership gate, operation count, interruption, recording, hash or readback check fails, retain the private originals and stop. Only safe relative references and state values are printed. Browser/profile/target exclusivity and the strict one-page gate must not be relaxed to pass the fixture.

## Offline guard scope and integration limits

`node --test test-case-board/tests/e2e-native-cdp.test.mjs` is an offline test to be run by the execution role after integration. It imports the common `checkEndpoint`/`pageIdentity`, and forks the actual common worker against a fake IPC peer to check sequential calls, unsupported contract, parallel/in-flight unawaited calls, step boundaries, session mismatch, and actual worker signal. It also checks fixture result validation with synthetic objects. These are contract tests, never E2E or recording evidence.

The standalone `7f8eba04e22f06b4fe73860a865cd1aa4d750849` base lacks the new core module; the tests require the integrated core interface shown in `f50a65a6e2338108a917ef4cb5fdd7b3a04c1956` plus the result counters in `78567ca35068c9b25e05977551923e2cbd14ed00`. The runner assumes the documented `run({caseId, step, cdp, page})` contract and needs final integration review. The worker's tracked thenable can detect an outstanding/unconsumed call but cannot reliably distinguish true `await` from `.then`, `.catch`, or `.finally` consumption after settlement; all real fixture calls are awaited serially. Core identity is sampled at step boundaries, not proof that no transient tab existed between samples. A caught CDP error still fails the common run, and an in-flight CDP send may delay stop until its timeout.

After the core exports `sendNativeOperation` and `nativeInputSatisfied` are integrated, `node --test test-case-board/tests/e2e-native-cdp-count.test.mjs` exercises those actual helpers with a fake CDP peer: attempt and successful Input counts, pending and failed responses, argument forwarding, the native zero-Input gate, and the non-native default. The `Runtime.evaluate` expressions are forwarded to the fake peer and are not executed in a DOM. This test has not been run by the fixture author. It does not itself verify that the common entrypoint is wired to the helpers or exercise a browser, recording, or final result lifecycle; those require separate integration verification.

`node --test test-case-board/tests/e2e-native-cdp-step.test.mjs` checks the actual `finishNativeStep` with fake ownership observations and forks the actual worker with a fake IPC peer that rejects a passed step-end once. It checks failure details, step identity, and duplicate step-end handling; the fixture author has not run it. It does not perform a browser ownership observation or produce E2E or recording evidence.
