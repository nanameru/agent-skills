# Browser Use Cloud E2E

Use this reference when a test-board case needs browser E2E, cloud execution, recording, or parallel runs.

## Current Official Baseline

Browser Use Cloud quickstart currently documents:

- Python package: `browser-use-sdk`
- API key env: `BROWSER_USE_API_KEY`
- Python client import: `from browser_use_sdk.v3 import AsyncBrowserUse`
- `AsyncBrowserUse().run("<task>")` for agent-style tasks
- Browser mode supports raw browser sessions with CDP; agent mode supports task/model/proxy/profile/recording options.

Check current docs before adding provider-specific code:

- https://docs.browser-use.com/cloud/quickstart

## Test Design

Prefer deterministic E2E cases over broad natural-language tasks:

```yaml
e2e:
  provider: browser-use-cloud
  url: "https://example.com"
  recording: true
  steps:
    - waitFor: "Sign in"
    - click: "text=Sign in"
    - assertText: "Dashboard"
```

Use Browser Use Cloud for:

- CI-like E2E runs that need managed browsers.
- Video/live evidence for test-board dashboards.
- Tests that are flaky locally because of browser environment differences.
- Auth, onboarding, billing sandbox, and key user journeys.

Do not use it for:

- Unit/integration tests that can run cheaply in-process.
- Tests that require production secrets unavailable to the run.
- High-volume loops without concurrency/cost limits.

## Run Artifacts

For every cloud E2E run, record:

- case ID
- issue number if present
- start/end time
- provider/session ID
- live URL if available
- recording URL or downloaded recording path
- logs and assertion result

Recommended manifest:

```json
{
  "runs": [
    {
      "caseId": "TC-120",
      "status": "passed",
      "provider": "browser-use-cloud",
      "startedAt": "2026-06-12T00:00:00.000Z",
      "endedAt": "2026-06-12T00:01:00.000Z",
      "liveUrl": "",
      "recordingUrl": "",
      "recordingPath": ".e2e/recordings/TC-120.mp4"
    }
  ]
}
```

Keep `.e2e/` out of Git unless the repository explicitly stores small fixtures.

## Loop Guardrails

- Cap concurrency. Browser sessions cost money and may hit provider limits.
- Prefer one Issue or one test case per autonomous loop run.
- Do not auto-merge based only on E2E success. Create Draft PRs and preserve evidence.
- When recordings are presigned/expiring, download immediately and store local evidence paths in the manifest.
