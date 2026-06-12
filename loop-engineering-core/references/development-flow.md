# Development Flow

This is the intended user-visible flow for loop-driven development.

## 1. Intake

The agent receives a broad request such as:

> Build a loop that keeps improving auth reliability.

The agent does not start coding. It applies the Requirements Gate.

Output:

- clarified goal
- unresolved questions
- proposed first loop type
- proposed acceptance criteria
- proposed test strategy

## 2. Requirement Definition

The agent asks question batches until the work is objective enough.

Example batches:

- product scope
- users and permissions
- GitHub workflow
- test-board cases
- E2E/auth setup
- cost/schedule limits
- forbidden actions

Output:

- final requirement summary
- scope/non-goals
- acceptance criteria
- risks
- verification plan

## 3. Issue And Test Case Creation

The agent creates or updates a GitHub Issue.

At the same time it creates linked `test-board.yaml` cases:

```yaml
issues: [123]
```

Output:

- Issue URL
- linked test case IDs
- test/CI/E2E plan

## 4. Manual Dry Run

Before scheduling, the loop runs once manually.

The run picks exactly one ready Issue or case.

It creates:

- branch
- commit(s)
- test evidence
- Draft PR or blocked report
- Issue knowledge log

## 5. Schedule Or Event Trigger

Only after a successful dry run:

- low-frequency schedule for backlog sweeps
- event trigger for sporadic work
- nightly schedule for E2E/regression

The scheduled prompt calls the child Skill and references the parent hard stops.

## 6. Autonomous Iteration

Each run:

1. reads durable state
2. selects one ready unit
3. implements
4. verifies
5. opens Draft PR
6. stops

It never merges or deploys by default.

## 7. Human Review

The user reviews Draft PRs and evidence.

The agent can address review comments in a new bounded loop run.

## 8. Continuous Improvement

When the loop struggles:

- update the parent Skill if the rule is general
- update child Skills if the behavior is domain-specific
- update `test-board.yaml` if coverage is missing
- update schedule limits if cost or noise is too high
