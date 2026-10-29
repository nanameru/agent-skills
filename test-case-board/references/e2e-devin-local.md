# Devin Local E2E

Use Devin's local Chrome + Playwright as the default E2E runner. For iOS/macOS apps, use a macOS Devin session and the real app or Simulator. Browser Use Cloud is optional when parallelism or managed browser capability is needed.

## Evidence

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
