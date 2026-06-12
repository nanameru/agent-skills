---
name: loop-engineering-dev
description: "Use when designing or running autonomous AI development loops that combine GitHub Issue-driven development, test-board.yaml test inventories, scheduled Codex/Claude runs, maker/checker separation, Draft PRs, E2E evidence, and regression impact analysis. Trigger on ループエンジニアリング, loop engineering, 自走開発, schedule/scheduled coding agent, AIが独立して実行, Issueとテストを合体, test-board plus GitHub Issues, unattended development loop."
metadata:
  short-description: GitHub Issue + test-board による自走開発ループ設計
---

# Loop Engineering Dev

Use this skill to design a development loop, not a one-off prompt. The loop must find work, clarify requirements, create Issues and tests, run one bounded unit of work, verify it, preserve state, and stop at a human review point.

## Non-Negotiable Rule

Do not start autonomous implementation until requirements are stable enough to write objective acceptance criteria and test cases.

If requirements are unclear, ask the user questions first. It is acceptable to ask many questions, but batch them by topic and only ask questions that affect scope, risk, cost, data, security, acceptance criteria, or verification.

When the question set becomes large, use `references/requirements-question-bank.md` as a checklist and work through it in batches.

## Required Building Blocks

1. **Work source**: GitHub Issues, CI failures, analytics signals, bug reports, or explicit backlog.
2. **State file**: `test-board.yaml` and optionally `.loops/<loop-name>.md`.
3. **Execution environment**: local worktree, Codex schedule, Claude routine, or CI runner.
4. **Maker/checker split**: writer and verifier must be separate roles or passes.
5. **Objective gates**: tests, lint, build, E2E, security checks, and test-board impact analysis.
6. **Human stop point**: Draft PR. Never auto-merge or deploy production changes without explicit approval.

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

For Browser Use Cloud E2E, load:

```text
~/.agents/skills/test-case-board/references/e2e-browseruse-cloud.md
```

For Testmail login/auth tests, load:

```text
~/.agents/skills/test-case-board/references/login-testmail.md
```

Auth tests should include fresh-user login, existing-user login, invalid/expired OTP, authorization denial, admin allowlist/role approval, logout, and session expiry where relevant.

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
