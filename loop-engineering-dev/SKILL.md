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

Keep the Maker and independent Checker separate; a Checker must not approve its own work. Record the Checker verdict as `合格`, `不合格`, or `未検証あり` in the Issue, with a concise PR summary. For T3 work, implementation, unit tests, build, and PR updates remain in T3; hand required independent verification to Devin Bot. When E2E is needed, hand it to Devin Bot without waiting for a separate instruction each time and do not start it in T3. Determine whether E2E is needed from the change and acceptance criteria; do not require it for every PR. Hand over the PR URL, full head SHA, verification conditions, and unverified items. For the T3 handoff, Lite execution, recording language, and environment contract, follow `test-case-board/SKILL.md` under “Browser E2E entry point”. Recording, private evidence storage, and readback remain required for every E2E run. Follow the current common instructions for model selection and merge/deploy authorization.

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

## Per-Issue Goal Loop

Use the parent Issue Goal Loop for implementation work. One Issue is the durable container for the goal, acceptance criteria, iteration history, and final outcome; do not create a new Issue for every iteration.

At the start of each iteration:

1. Re-read the Issue and linked `test-board.yaml` cases.
2. Identify the smallest unmet acceptance criterion or failing gate.
3. Choose the workflow needed for that condition: discovery, design, implementation, CI repair, regression, E2E, security, or checker review.
4. Execute and verify that bounded unit.
5. Update the same Issue and test cases, then re-evaluate all completion conditions.

If the Issue is complete, create or update its single Draft PR and stop for human review. If a parent hard stop is reached, leave the Issue open and produce a blocked report with an exact resume point. Split a new Issue only when the discovered work changes scope or delivers independent value.

## Combined GitHub + Test Workflow

Use `github-issue-driven-dev` for Issues/branches/PRs and `test-case-board` for test inventory.

Minimum per Issue:

- Loop goal, purpose, scope, and non-goals.
- Acceptance criteria and observable completion evidence.
- Linked test-board cases.
- Verification and test/CI plan.
- Exit conditions and hard stops.
- Iteration knowledge log containing the current unmet condition and next action.

Minimum per test-board case:

- Stable `TC-xxx` ID.
- `issues: [n]`.
- `source`.
- `status`.
- `type`.
- Real `test_file` once implemented.

## E2E And Auth

すべてのE2E実行の録画・失敗時の保全・保存後の読戻しは `test-case-board/references/e2e-recording.md` に従う。定期実行や再試行も対象で、成功時だけの削除・最新結果への上書きで過去の証跡を失わない。

For user-facing features that depend on network access or downloads, plan slow-network, blocked/offline external-service, and cancel/resume cases when applicable. For the Devin local Chrome + Playwright workflow, see `test-case-board/references/e2e-devin-local.md`; environment and browser selection follow the current common instructions and task authorization. Browser Use Cloud is optional.

For Browser Use Cloud E2E, load:

```text
~/.agents/skills/test-case-board/references/e2e-browseruse-cloud.md
```

For Testmail login/auth tests, load:

```text
~/.agents/skills/test-case-board/references/login-testmail.md
```

Auth tests should include fresh-user login, existing-user login, invalid/expired OTP, authorization denial, admin allowlist/role approval, logout, and session expiry where relevant.

Represent applicable authentication rows and test means using `test-case-board/SKILL.md`; a result using only synthetic local authentication does not verify real authentication.

## Security Verification

When applicable and authorized, compare the PR with its base using Gitleaks, dependency audit (all dependencies and production dependencies), OSV Scanner, Semgrep on changed files, and manual inspection of risky additions such as HTML injection, dynamic execution, message handlers, external URLs, and browser storage. Record pre-existing findings separately and identify dependency paths and runtime exposure for newly introduced high-severity findings. Unavailable or unauthorized checks remain unverified. When Devin security investigation or scanning is requested, the common instructions require the formal Devin Security 2.0 code scan and its separate approval conditions; these checks do not replace it.

## Test Levels and E2E

Unit (`単体`), integration (`結合`), system (`総合`), and acceptance (`受入`) are test levels; E2E is a technique used within system or acceptance testing. Passing E2E alone does not establish performance, security, or acceptance.

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
