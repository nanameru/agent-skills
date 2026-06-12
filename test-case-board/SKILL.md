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
test-board plan-issue --board test-board.yaml --issue 123 --source src/a.ts --feature "feature" --scenario "scenario" [--apply]
test-board sync-github --board test-board.yaml --issue 123 [--apply]
test-board serve --board test-board.yaml --root . --port 41800
```

The CLI is intentionally conservative. It does not replace real test runners; it helps decide what to run and keeps the inventory consistent.
