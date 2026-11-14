# Devin Local E2E

For the existing Devin local workflow, use Chrome + Playwright. For iOS/macOS apps, use a macOS Devin session and the real app or Simulator. Browser Use Cloud is optional when parallelism or managed browser capability is needed. This Playwright workflow is not supported by the common agent-browser entry point until its recording session contract and adapter have been demonstrated.

## Evidence

Follow [E2E recording and preservation](e2e-recording.md) for every run, including failures, interruptions, and retries. Finalize and read back recordings before cleanup; preserve evidence outside any worktree scheduled for deletion. Test outcome and recording/preservation status are separate.

Keep evidence under `.e2e/<case-id>/<run-id>/`:

```text
recording.webm
screenshots/
results.json
network.jsonl
```

Record the run's revision, start/end time, provider, result, and assertion details in `results.json`. Sanitize `network.jsonl`; never include authorization headers, cookies, bearer tokens, or other credentials.

## Required Condition Cases

For user-facing features that depend on network access or downloads, cover:

- Slow network (e.g. 3 Mbps) with an empty cache.
- An external service blocked or offline.
- Cancel and resume behavior.
