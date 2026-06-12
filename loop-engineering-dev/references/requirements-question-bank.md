# Requirements Question Bank

Use this when loop requirements are not stable. Ask in batches. Do not ask every question mechanically; ask the questions that change design, safety, verification, cost, or scope.

## Product Goal

- What user or business outcome should the loop improve?
- What should the loop never do?
- What is the smallest useful first loop?
- Is this for discovery, implementation, regression monitoring, CI fixing, E2E verification, release checks, or all of them?
- What is the expected human review cadence?

## Repository And Workflow

- Which repository is the source of truth?
- Which base branch should runs use?
- What branch prefix is allowed?
- Are Draft PRs required?
- Can the agent create GitHub Issues?
- Can the agent comment on Issues?
- Which GitHub Project board should be updated?
- Are there protected files or directories?

## Requirements And Acceptance

- What exact user workflows must pass?
- What are the acceptance criteria?
- Which behavior is in scope for the first iteration?
- Which behavior is explicitly out of scope?
- What existing bugs or regressions must be preserved as known issues?
- What level of design/product judgment is allowed without asking?

## Test Inventory

- Does `test-board.yaml` already exist?
- Which test types are required: unit, integration, E2E, security, performance, visual, manual?
- Should every Issue create test-board cases before implementation?
- Should bug fixes require failing regression tests first?
- Which dimensions matter: role, plan, browser, locale, workspace, device, region?
- What status policy should be used for todo/doing/done/blocked/skip?

## E2E

- Which journeys require E2E?
- Should Browser Use Cloud be used for all E2E or only selected cases?
- What is the concurrency limit?
- What is the session cost/time budget?
- Should recordings be downloaded and preserved?
- Which environments are allowed: local, preview, staging, production?
- What data may E2E tests create?

## Authentication And Email

- Which auth provider is used?
- Are OTP, magic link, password, OAuth, or SSO flows in scope?
- Should Testmail be used for fresh inboxes?
- Which roles must be tested: guest, free user, paid user, admin, workspace member?
- How are admin permissions granted: env allowlist, role claim, database role, organization role?
- Which secrets are required and where are they stored?

## Safety And Cost

- What is the maximum number of PRs per run?
- What is the maximum number of test failures before stopping?
- What is the token/time budget?
- What is the Browser Use Cloud concurrency and spend limit?
- What actions are forbidden: merge, deploy, billing changes, production data writes, schema migration?
- What should happen on missing secrets?

## Verification

- Which commands are mandatory before PR?
- Which failures are allowed as known baseline failures?
- Is a separate checker required?
- Should checker be a separate subagent, separate model, or second pass?
- What evidence must be attached: test logs, screenshots, video, coverage, Issue comments?

## Scheduling

- Should the loop run on a schedule, event trigger, or manual command?
- What frequency is safe?
- Should it run only during business hours?
- How is the loop disabled?
- Where is durable state stored?
- How are partial runs resumed?

## Reporting

- Where should knowledge logs go?
- What should be posted to GitHub Issues?
- What should be included in PR bodies?
- What should the final run report contain?
- Who reviews the Draft PRs?
