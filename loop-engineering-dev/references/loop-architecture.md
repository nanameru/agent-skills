# Loop Architecture

## Recommended Loops

### 1. Requirement Clarification Loop

Purpose: turn vague requests into Issues and test-board cases.

Inputs: user brief, repo context, product docs.

Output: GitHub Issue draft, acceptance criteria, linked test-board cases.

Stop when: unresolved questions affect scope or verification.

### 2. Discovery Loop

Purpose: find missing tests, flaky areas, CI failures, analytics-backed bugs, or security gaps.

Inputs: CI, open Issues, test-board coverage, logs, analytics.

Output: new or updated Issues and `test-board.yaml` cases.

Stop when: it creates or updates a bounded batch.

### 3. Implementation Loop

Purpose: resolve one ready Issue or one `todo` test case.

Steps:

1. Read Issue and linked cases.
2. Create branch.
3. Write failing behavior test if feasible.
4. Implement.
5. Run gates.
6. Run checker.
7. Open Draft PR.
8. Update Issue knowledge log and test-board status.

Stop when: one Draft PR is created, blocked, or gates fail twice.

### 4. Regression Monitor Loop

Purpose: decide which tests to run after code changes.

Input: changed files.

Commands:

```bash
test-board impact --board test-board.yaml --files <changed-files>
```

Output: required tests and risk Issues.

### 5. E2E Evidence Loop

Purpose: run browser journeys and preserve proof.

Inputs: `type: e2e` cases with `e2e:` metadata.

Provider: Browser Use Cloud when cloud browser evidence is required.

Output: logs, screenshots, live URLs, recordings, manifest.

## Scheduling Guidance

Use schedules for routine sweeps and event triggers for sporadic work.

Good schedule candidates:

- daily test coverage discovery
- nightly E2E smoke
- morning CI triage
- low-frequency backlog burn-down

Poor schedule candidates:

- rare feature work
- high-cost E2E without a queue
- vague product work without clarified requirements

## Hard Stops

Every loop needs hard stops:

- max one Draft PR per run
- max two gate-fix attempts
- no auto-merge
- no production deploy
- no billing/auth/secret changes without explicit approval
- no destructive migrations
- stop on unclear requirements
- stop on missing secrets
- stop on cost/concurrency limit

## State

Use durable files:

- `test-board.yaml`: test inventory and work queue
- `.loops/<name>.md`: run history and blocked reasons
- `.e2e/live-runs.json`: E2E live/recording manifest

Do not use chat history as the only state.
