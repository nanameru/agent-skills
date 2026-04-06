---
name: chaos-engineer
description: >
  Security-focused chaos engineering analysis that reads actual source code to identify
  vulnerabilities and failure-mode weaknesses. Use when the user asks to: (1) analyze a
  repository for security weaknesses, (2) run chaos engineering analysis, (3) find
  authentication/authorization flaws, (4) detect data leak risks, (5) identify failure
  scenarios like DB outages, session hijacking, or billing data loss, or (6) audit API
  rate limiting and cost exposure. Triggers on phrases like "chaos-engineer", "弱点を分析",
  "セキュリティ分析", "障害シナリオ", "脆弱性チェック".
---

# Chaos Engineer — Security Failure Analysis

Analyze a repository's actual source code to discover security vulnerabilities by
simulating chaos engineering failure scenarios. Produce a severity-classified Markdown
report with remediation cost estimates.

## Analysis Workflow

1. **Discover architecture** — identify frameworks, languages, entry points, and dependencies
2. **Map attack surface** — locate authentication, authorization, session management, data persistence, API endpoints, and payment/billing logic
3. **Simulate failure scenarios** — for each attack surface, reason about what breaks under chaos conditions (see Failure Scenarios below)
4. **Classify and report** — output structured Markdown report

## Failure Scenarios to Simulate

For each area found in the codebase, simulate these chaos conditions and check whether the code handles them safely:

### Authentication & Authorization
- What happens if the auth middleware is bypassed or returns null?
- Can a user access or modify another user's data by manipulating IDs?
- Are JWT tokens validated for expiry, signature, and audience?
- Is there privilege escalation via role manipulation?

### Session Management
- Can a session token be reused after logout?
- Under concurrent requests, can one user receive another user's session?
- What happens if the session store (Redis/DB) goes down mid-request?

### Database Failures
- If a DB write fails mid-transaction, do validation checks (quotas, limits, uniqueness) still hold?
- Are there race conditions in read-then-write patterns?
- Can partial failures leave data in an inconsistent state?

### Data Integrity & Leakage
- Can sensitive data (PII, credentials, tokens) leak via logs, error messages, or API responses?
- Is billing/payment data protected against silent deletion or corruption?
- Are soft-delete or cascade-delete operations safe from unintended data loss?

### API & Rate Limiting
- Are there endpoints with no rate limiting that could cause cost explosion?
- Can unauthenticated users hit expensive operations?
- Is input validation present on all external-facing endpoints?

### Infrastructure & Configuration
- Are secrets hardcoded or committed to the repository?
- Are default credentials or debug modes left enabled?
- Are CORS, CSP, and HSTS headers properly configured?

For detailed analysis checklists, read [references/security_checklist.md](references/security_checklist.md).

## Report Template

ALWAYS output the report using this structure:

```markdown
# 🔥 Chaos Engineer — Security Analysis Report

**Repository:** [repo name]
**Analyzed:** [date]
**Scope:** [directories/files analyzed]

## Executive Summary
[2-3 sentences: total issues found, most critical finding, overall risk level]

## Critical Findings

### 🔴 Severity: HIGH
| # | Vulnerability | Location | Chaos Scenario | Impact | Remediation Cost |
|---|--------------|----------|----------------|--------|-----------------|
| 1 | [title] | `file:line` | [what failure exposes this] | [concrete impact] | [S/M/L] |

#### Details
**[H-1] [Title]**
- **File:** `path/to/file.ext:line`
- **Scenario:** [chaos condition that exposes this]
- **Current behavior:** [what the code does now]
- **Expected behavior:** [what it should do]
- **Proof:** [relevant code snippet]
- **Fix:** [specific remediation steps]
- **Cost:** [Small/Medium/Large] — [time estimate rationale]

### 🟠 Severity: MEDIUM
[Same table and detail format]

### 🟡 Severity: LOW
[Same table and detail format]

## Statistics
- **Total issues:** [N]
- **High:** [n] | **Medium:** [n] | **Low:** [n]
- **Estimated total remediation:** [summary]

## Recommended Priority
1. [Most urgent fix with rationale]
2. [Second priority]
3. [Third priority]
```

## Remediation Cost Guide

- **Small (S):** <1 hour — config change, add a header, fix a condition
- **Medium (M):** 1-4 hours — add middleware, implement validation, fix race condition
- **Large (L):** 4+ hours — redesign auth flow, add transaction management, implement rate limiting infrastructure

## Important Guidelines

- Read actual source code. Never speculate without evidence from the codebase.
- Include file paths and line numbers for every finding.
- Show relevant code snippets as proof.
- Focus on real, exploitable issues — not theoretical or stylistic concerns.
- If the codebase is large, prioritize: auth → session → DB → API → config.
- Adapt the failure scenarios to the specific tech stack (e.g., Rails has different patterns than Express).
