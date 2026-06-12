# Requirements Gate

Ask questions until execution can be tested objectively. Ask in batches. Do not ask trivia; ask what changes design, safety, cost, verification, or scope.

## Batch 1: Goal And Scope

- What outcome should this loop produce?
- Who is the user or reviewer?
- What is in scope for the first version?
- What is explicitly out of scope?
- What should the loop never do?
- What is the smallest useful successful run?

## Batch 2: Acceptance Criteria

- What observable behavior proves success?
- What logs, screenshots, videos, test results, or metrics are required?
- Which edge cases must pass?
- Which existing failures are known and should not block?
- What is the required definition of done?

## Batch 3: GitHub And Review

- Which repository and base branch?
- Should the loop create Issues or only consume existing Issues?
- Which Issue title/body language and prefix rules?
- Should it create Draft PRs only?
- Who reviews PRs?
- Which Project board/status fields should be updated?

## Batch 4: Tests

- Does `test-board.yaml` exist?
- Should every Issue have linked test cases before implementation?
- Which test types are mandatory: unit, integration, E2E, security, visual, manual?
- Should bug fixes require a failing regression test before the fix?
- Which dimensions matter: role, plan, locale, browser, device, workspace?

## Batch 5: E2E And Auth

- Which user journeys require E2E?
- Should Browser Use Cloud be used?
- What concurrency and spend limits apply?
- Should recordings be downloaded and preserved?
- Which auth provider is used?
- Should Testmail or another email testing provider be used?
- Which roles must be tested?

## Batch 6: Safety

- Are production writes allowed?
- Are billing/auth/schema changes allowed?
- Which files or directories are forbidden?
- Which secrets are needed and where are they available?
- What should happen if secrets are missing?
- What is the rollback/disable plan?

## Batch 7: Scheduling

- Should the loop run manually, on a schedule, or on events?
- How often?
- During which hours?
- What is the max runtime per run?
- What is the max PR count per run?
- Where should durable state be stored?
