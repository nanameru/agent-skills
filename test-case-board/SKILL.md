---
name: test-case-board
description: "Use when managing a YAML test-case inventory for a project: create test cases with GitHub Issues, track tests in test-board.yaml, decide what tests to run after changes, analyze regression impact, plan E2E tests, run Browser Use Cloud E2E, and test login/email authentication with Testmail-style disposable inboxes. Trigger on test-board, test-case-board, test-board.yaml, テストケース台帳, テストケース一覧, デグレ, 影響範囲, E2E, Browser Use Cloud, Testmail, ログイン認証テスト."
metadata:
  short-description: YAMLテストケース台帳とデグレ影響管理
---

# Test Case Board

## Parent Skill

When this Skill is used as part of autonomous or scheduled development, first read `~/.agents/skills/loop-engineering-core/SKILL.md` if it exists. If it is missing, continue with this Skill and report that the parent Skill was unavailable.

The parent owns shared loop rules. This Skill owns YAML test inventory, regression impact, E2E metadata, and the `test-board` CLI.

Use this skill to keep test intent outside transient chat. The source of truth is `test-board.yaml` in the repository root. Boards, dashboards, GitHub comments, and run reports are views or mirrors; edit the YAML first.

## Core Workflow

1. Locate or create `test-board.yaml`.
2. Inspect current state:

```bash
test-board once --board test-board.yaml
```

3. When creating or refining a GitHub Issue, create matching test cases at the same time:

```bash
test-board plan-issue --board test-board.yaml --issue 123 --source src/foo.ts --feature "機能名" --scenario "主要シナリオ"
```

Preview first. Use `--apply` only after the user agrees or the repository workflow explicitly permits shared YAML edits.

4. When fixing a feature, write or identify the behavior test before implementation when feasible. Mark cases `todo -> doing -> done` only after the real test is green.
5. Before finalizing a change, run impact checks:

```bash
test-board impact --board test-board.yaml --files src/foo.ts src/bar.ts
test-board issue --board test-board.yaml --issue 123
```

6. If the user wants a visual board:

```bash
test-board serve --board test-board.yaml --root .
```

## Coverage Gap Filling Loop

Run this whenever the board may have drifted from reality, and periodically as a loop iteration:

```bash
test-board gaps --board test-board.yaml --root .
```

It reports four kinds of gaps:

1. **Open cases without a real test on disk** — `todo`/`doing` cases whose `test_file` is empty or points to a file that does not exist. These are planned-but-unwritten.
2. **Lying board** — `done` cases whose `test_file` does not exist on disk. Worst kind: the board claims coverage that is not there. Typical cause: the test was written on a branch that never merged to the default branch. Restore the test or set the case back to `todo` with a note saying where the work actually lives.
3. **Empty layers** — zero cases of a `type` (e.g. `integration` or `regression` missing entirely).
4. **Cases without linked issues** — weak traceability.

Fill gaps with this loop (proven in dom-to-pptx-ai#490):

1. Batch the gaps into **one GitHub Issue** with acceptance criteria (`test suite green`, `todo -> done with real test_file`, `layer populated`).
2. Work in a worktree cut from the default branch — the main checkout may be on a stale branch.
3. Write the real tests until green, then update the board in the same commit: `status: done`, real `test_file`, `issues: [N]`, and a `notes:` line saying what is covered and how to run it.
4. Reclassify `type` to match what the test actually is (keep the ID). A wrapper tested through its real dependency without mocks is `integration`, not `unit`.
5. One Draft PR; never auto-merge.

Classification and test-writing rules learned the hard way:

- `type` is the **layer** (`unit` / `integration` / `e2e` / `security` / `edge`); use `regression` for cases born from a bug fix so a degrade-only view can be filtered.
- Prefer **mock-free integration**: if the implementation has a real in-process fallback (in-memory rate limiter, local store), drive the public wrapper through it instead of mocking the boundary.
- Network-dependent contract tests (e.g. a live Google Fonts fetch) belong behind an env gate — `describe.runIf(process.env.RUN_LIVE_X === '1')` — green locally once, auto-skipped in CI. Record that in `notes:`.
- Under vitest + jsdom, cross-realm `instanceof Uint8Array` can be false — use `ArrayBuffer.isView()` in test helpers.
- When a function only touches `request.headers.get()` and `request.body`, a small fake object beats a real `Request` (undici normalizes away the malformed inputs you are trying to test).

## YAML Shape

Use stable case IDs. Never renumber existing IDs.

```yaml
version: 1
project:
  name: "repo-name"
  test_command: "npm run test"
  repo: "owner/name"

source_roots: [src, app, lib, components, convex, scripts]

cases:
  - id: TC-001
    title: "ログイン時にOTPメールを受信して認証できる"
    feature: "auth login"
    scenario: "email otp"
    status: todo
    priority: high
    type: e2e
    source: [app/login/page.tsx, app/api/auth]
    test_file: ""
    issues: [123]
```

Recommended `status`: `todo`, `doing`, `done`, `blocked`, `skip`.

Recommended `type`: `unit`, `integration`, `e2e`, `security`, `regression`, `manual`.

## Issue-Driven Use

When GitHub Issue-driven development is active:

- Every implementation Issue should have at least one linked test case in `issues: [<number>]`.
- The Issue body or comments should list linked test cases using `test-board sync-github --issue <n>` when available.
- A bug fix should add a regression test case that fails before the fix unless the existing test already proves the bug.
- A feature Issue should include display, frontend behavior, backend behavior, and security/auth cases as applicable.
- The PR body should mention which test-board cases were added, changed, or completed.

## E2E With Browser Use Cloud

For Browser Use Cloud E2E and video evidence, read `references/e2e-browseruse-cloud.md`.

Minimum fields for E2E cases:

```yaml
  - id: TC-120
    title: "サインアップからダッシュボード到達まで"
    type: e2e
    status: todo
    source: [app/signup, app/dashboard]
    e2e:
      url: "https://example.com/signup"
      auth: "testmail"
      steps:
        - waitFor: "Email"
        - type: { selector: "input[type=email]", valueFrom: "testmail.email" }
        - click: "button[type=submit]"
        - waitForTestmail: { subjectIncludes: "code" }
        - typeTestmailOtp: { selector: "input[name=code]" }
        - click: "button[type=submit]"
        - assertUrlIncludes: "/dashboard"
```

## Login/Auth With Testmail

For one-off email addresses and OTP/magic-link login tests, read `references/login-testmail.md`.

Use a fresh tag per run unless the test deliberately needs a fixed identity:

```text
<TESTMAIL_NAMESPACE>.<random-tag>@inbox.testmail.app
```

## CLI

This restored skill includes a lightweight CLI:

```bash
test-board once --board test-board.yaml
test-board impact --board test-board.yaml --files src/a.ts src/b.ts
test-board issue --board test-board.yaml --issue 123
test-board coverage --board test-board.yaml
test-board gaps --board test-board.yaml [--root .]
test-board plan-issue --board test-board.yaml --issue 123 --source src/a.ts --feature "feature" --scenario "scenario" [--apply]
test-board sync-github --board test-board.yaml --issue 123 [--apply]
test-board serve --board test-board.yaml --root . --port 41800
```

The CLI is intentionally conservative. It does not replace real test runners; it helps decide what to run and keeps the inventory consistent.
