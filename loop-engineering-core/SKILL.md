---
name: loop-engineering-core
description: "Parent/global core skill for loop engineering shared by Codex, Claude Code, and child Skills. Use when a workflow needs autonomous or scheduled AI development loops, rigorous requirement clarification before execution, GitHub Issues, test-board.yaml, maker/checker separation, E2E evidence, durable state, or shared loop rules that multiple Skills should inherit. Trigger on 親スキル, loop-engineering-core, ループエンジニアリング共通, autonomous development core, requirements gate, scheduled agent loop."
---

# Loop Engineering Core

This is the parent Skill. Child Skills should read this first, then apply their domain-specific instructions.

Expected global path:

```text
~/.agents/skills/loop-engineering-core/SKILL.md
```

Claude compatibility path:

```text
~/.claude/skills/loop-engineering-core/SKILL.md
```

## Core Contract

Do not run an autonomous development loop from vague requirements.

Before execution, convert the user's request into:

- goal
- users
- scope
- non-goals
- acceptance criteria
- risks
- dependencies
- test cases
- stop conditions
- required secrets and environments
- verification gates

If any of these affect implementation or safety and are unknown, ask the user. It is acceptable to ask many questions, but ask them in batches and keep each batch tied to decisions.

## Loop Lifecycle

1. **Clarify**: ask questions until the work can be tested objectively.
2. **Plan**: create or reuse a GitHub Issue and define linked `test-board.yaml` cases.
3. **Select**: choose exactly one ready Issue or test case per implementation loop run.
4. **Isolate**: create a branch or worktree for the selected unit.
5. **Prove**: write or identify a real behavior test. For bugs, prefer a failing regression test first.
6. **Build**: implement the smallest change that satisfies the case.
7. **Gate**: run tests/lint/build/E2E/security checks as relevant.
8. **Check**: perform a separate checker pass for requirements, security, regression, and test integrity.
9. **Record**: update the Issue knowledge log, `test-board.yaml`, run manifests, and PR body.
10. **Stop**: open a Draft PR or produce a blocked report. Do not auto-merge.

## Roles

Keep roles separate, even if the same AI instance performs them in sequential passes:

- **Clarifier**: asks requirements questions.
- **Planner**: creates Issues and test-board cases.
- **Maker**: writes tests and implementation.
- **Checker**: challenges the diff, tests, security, and acceptance evidence.
- **Operator**: schedules, monitors, and disables loops.

Do not let the Maker move the goalpost by rewriting tests merely to pass.

## Durable State

Use durable artifacts instead of chat memory:

- GitHub Issue: work record and knowledge log.
- Git branch and commits: code history.
- Draft PR: human review stop point.
- `test-board.yaml`: test inventory, backlog, and regression map.
- `.loops/<name>.md`: loop run history when needed.
- `.e2e/live-runs.json`: browser run evidence when needed.

## Hard Stops

Stop immediately and report when:

- requirements are unclear enough to change implementation
- secrets or environments are missing
- auth, billing, production deploy, destructive migration, or permission changes are needed without explicit approval
- gates fail twice for the same cause
- checker rejects the diff
- cost/concurrency/time limits are reached
- no ready Issue/test case exists

Default autonomous limit: one Issue or one test-board case and at most one Draft PR per run.

## Requirement Gate

Use `references/requirements-gate.md` when requirements are not stable.

The Clarifier may ask dozens or hundreds of questions over multiple batches if needed. Prioritize:

1. product outcome
2. acceptance criteria
3. user roles and permissions
4. data and privacy boundaries
5. test strategy
6. cost and schedule limits
7. environments and secrets
8. human review and rollback

## Child Skill Rule

Child Skills should include a section like:

```markdown
## Parent Skill

Before acting, read `~/.agents/skills/loop-engineering-core/SKILL.md` if it exists.
If unavailable, continue with this Skill and report that the parent Skill was missing.
```

Then the child Skill should only contain domain-specific details.

## Scheduled Prompt Shape

Scheduled runs should call a Skill, not embed a long stale prompt:

```text
Use loop-engineering-dev.
Run one implementation-loop iteration.
Source of truth: GitHub Issues and test-board.yaml.
Follow loop-engineering-core hard stops.
Create at most one Draft PR.
Do not merge or deploy.
```

## Flow Summary

For the user-facing development flow, read `references/development-flow.md`.
