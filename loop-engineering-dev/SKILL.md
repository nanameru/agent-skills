---
name: loop-engineering-dev
description: "Use when designing or running autonomous AI development loops that combine GitHub Issue-driven development, test-board.yaml test inventories, scheduled Codex/Claude runs, maker/checker separation, Draft PRs, E2E evidence, and regression impact analysis. Trigger on ループエンジニアリング, loop engineering, 自走開発, schedule/scheduled coding agent, AIが独立して実行, Issueとテストを合体, test-board plus GitHub Issues, unattended development loop."
metadata:
  short-description: GitHub Issue + test-board による自走開発ループ設計
---

# Loop Engineering Dev

Use this child skill to design a development loop, not a one-off prompt.

## Parent Skill

Before acting, read `~/.agents/skills/loop-engineering-core/SKILL.md` if it exists. If it is missing, continue with this Skill and report that the parent Skill was unavailable.

The parent owns shared rules: requirement gate, durable state, maker/checker separation, hard stops, and scheduled prompt shape. This child owns the GitHub Issue + test-board development-loop specialization.

## Non-Negotiable Rule

Follow the parent requirement gate. If the question set becomes large, use both the parent `references/requirements-gate.md` and this Skill's `references/requirements-question-bank.md`.

## Maker/Checker and Verification Record

The Maker is Herdr/Codex; Devin is the independent Checker and must not approve its own work. The Checker verdict is `合格`, `不合格`, or `未検証あり`; merge and deploy decisions belong to a human. The GitHub Issue comment is the source of truth for Checker results, and the PR gets one summary comment (edit it for updates).

## Specialized Building Blocks

1. **Work source**: GitHub Issues, CI failures, analytics signals, bug reports, or explicit backlog.
2. **State file**: `test-board.yaml` and optionally `.loops/<loop-name>.md`.
3. **Execution environment**: local worktree, Codex schedule, Claude routine, or CI runner.
4. **Objective gates**: tests, lint, build, E2E, security checks, and test-board impact analysis.
5. **Human stop point**: Draft PR. Never auto-merge or deploy production changes without explicit approval.

## Setup Flow

1. Requirement definition gate:
   - Restate the product goal.
   - Define users, workflows, non-goals, risk, security boundaries, data sources, cost limits, and failure policy.
   - Ask unresolved questions before proceeding.
   - Convert answers into acceptance criteria.
2. Issue and test planning:
   - Create or reuse a GitHub Issue with Japanese title/body when the repo workflow requires it.
   - Create linked `test-board.yaml` cases at the same time.
   - Include unit/integration/E2E/security/regression cases as appropriate.
3. Loop design:
   - Choose one loop type: discovery, implementation, regression monitor, CI fixer, E2E runner, or release verifier.
   - Set one-run scope: normally one Issue or one test-board case.
   - Define hard stops: max PRs per run, max attempts, max cost, max session duration, forbidden files/areas.
4. Implementation run:
   - Pick one ready Issue/case.
   - Create or switch to an issue-numbered branch.
   - Write failing behavior test first when feasible.
   - Implement minimally.
   - Run gates and checker.
   - Open/update Draft PR and record findings in the Issue/test-board.
5. Scheduling:
   - Schedule only after a manual dry run succeeds.
   - Prefer event-driven triggers for sporadic work and low-frequency schedules for backlog sweeps.
   - A scheduled prompt should call a skill or loop file, not embed a giant stale instruction wall.

See `references/loop-architecture.md` for loop patterns and guardrails.

## Combined GitHub + Test Workflow

Use `github-issue-driven-dev` for Issues/branches/PRs and `test-case-board` for test inventory.

Minimum per Issue:

- Purpose and scope.
- Acceptance criteria.
- Linked test-board cases.
- Test/CI plan.
- Knowledge log.

Minimum per test-board case:

- Stable `TC-xxx` ID.
- `issues: [n]`.
- `source`.
- `status`.
- `type`.
- Real `test_file` once implemented.

## E2E And Auth

Use Devin's local Chrome + Playwright as the default runner and capture a recording, screenshots, and a sanitized network log. Use a macOS Devin session for iOS/macOS apps. Browser Use Cloud is optional when parallelism is needed.

For user-facing features that depend on network access or downloads, include condition cases for a slow connection (e.g. 3 Mbps with an empty cache), a blocked/offline external service, and cancel/resume.

For Browser Use Cloud E2E, load:

```text
~/.agents/skills/test-case-board/references/e2e-browseruse-cloud.md
```

For the default local E2E runner, load:

```text
~/.agents/skills/test-case-board/references/e2e-devin-local.md
```

For Testmail login/auth tests, load:

```text
~/.agents/skills/test-case-board/references/login-testmail.md
```

Auth tests should include fresh-user login, existing-user login, invalid/expired OTP, authorization denial, admin allowlist/role approval, logout, and session expiry where relevant.
Represent relevant rows with `auth_state`: `anonymous`, `fresh_user`, `existing_user`, `method:<name>`, `expired`, `invalid`, `logout`, `denied`, `role:<name>`, `plan:<name>`, or `isolation:A_vs_B`. Test means are `synthetic-local` (local-only test login, disabled in production and never using production secrets), `testmail`, and `real-provider` (requires human approval). A row passed only with `synthetic-local` must be recorded as `real auth unverified`.

## Security Gate

For each PR, run Gitleaks on PR commits, `<pm> audit` for all dependencies and with `--prod`, OSV Scanner, Semgrep on changed files, and a manual review of added lines matching `dangerouslySetInnerHTML`, `innerHTML`, `eval(`, `new Function`, `postMessage`, `addEventListener("message"`, `importScripts`, `http://` or `https://` literals, `localStorage`, `sessionStorage`, and `document.cookie`.

Compare findings with the PR base: only new findings are findings for that PR; record pre-existing findings in a separate inventory Issue. For newly introduced High+ dependency findings, record the dependency path and whether the package ships in the bundle or runtime.

## Test Levels and E2E

Unit (`単体`), integration (`結合`), system (`総合（システム）`), and acceptance (`受入`) are test levels; E2E is a technique used within system/acceptance testing. Passing E2E alone does not mean performance, security, or acceptance is complete.

## Loop Prompt Shape

Scheduled runs should be small and explicit:

```text
Use loop-engineering-dev.
Run one implementation-loop iteration for repo <owner/repo>.
Source of truth: test-board.yaml and GitHub Issues.
Pick exactly one ready todo case or ready Issue.
Create at most one Draft PR.
Do not merge or deploy.
Stop and report if requirements are unclear, gates fail twice, secrets are missing, or cost/concurrency limits are reached.
```

## Completion Definition

A loop setup is complete only when:

- Requirement questions are answered or explicitly deferred.
- Issues and test-board cases exist.
- One manual dry run has produced either a Draft PR or a clear blocked report.
- Gates and evidence are recorded.
- Schedule/automation has conservative limits and can be disabled.
