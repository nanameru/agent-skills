---
name: official-case-study-research
description: "Research company-published case studies and internal AI or tool rollout claims from primary sources, separating confirmed operations, measured outcomes, organization-wide adoption mechanisms, and undisclosed implementation details. Use when asked to analyze public enterprise examples, explain how a tool actually works in practice, determine how it spread internally, verify a claimed metric, or prepare an evidence-safe X, note, or technical article from official announcements."
---

# Official Case Study Research

Turn company announcements into an evidence-safe case-study packet. Preserve the boundary between what the company disclosed, what can be inferred, and what remains unknown.

## Workflow

### 1. Define the claim set

Write the questions before searching:

- What named use cases are publicly confirmed?
- How does each use case actually operate?
- What changed before and after adoption?
- Where does AI, deterministic code, and human approval appear?
- How did the company spread the practice internally?
- Which metrics are aggregate, estimated, or self-reported?
- What implementation details are not public?

Do not let an attractive metric replace the user's real question.

### 2. Search primary sources first

Prefer sources in this order:

1. Official company blog or newsroom
2. Official documentation and repositories
3. Official demos, talks, transcripts, and employee explanations
4. Regulatory filings or public reports
5. Independent reporting for corroboration only

For current claims, verify dates and use the newest applicable source. Search official social posts when they contain a demo or additional first-party explanation, but do not treat reposts as evidence.

### 3. Extract evidence units

Record one evidence unit per claim. For each unit capture:

- exact claim in neutral language
- source URL and publication date
- actor and team
- trigger or starting condition
- input or connected system
- transformation or decision
- output
- human approval point
- sharing or rollout mechanism
- metric, time window, and whether it is estimated
- public detail level: high, medium, or low
- undisclosed fields

Use `references/evidence-matrix.md` as the required schema.

### 4. Reconstruct only supported flows

Build a step-by-step operational flow only when the sources disclose the steps. If a source only names a use case, say so.

Never fill gaps with a typical CRM, ticketing, procurement, or HR workflow. Label reasonable interpretation as inference and keep it out of fact-only article sections.

### 5. Extract rollout as a separate system

Do not confuse product architecture with organizational adoption. Look for:

1. demand capture
2. manual pilot or concierge phase
3. repeated-pattern discovery
4. skill, context, or workflow codification
5. authentication and safe data access
6. self-service distribution
7. champions, embedded operators, training, or incentives
8. measurement and iteration

Report missing stages as undisclosed instead of assuming them.

### 6. Audit metrics and labels

Check these common failure modes:

- created apps are not necessarily approved production systems
- an aggregate time saving does not prove the saving of each example
- weekly active users are not daily active users
- a company estimate is not an independent audit
- a public demo is not automatically an internal production example
- a repository example is not automatically part of a reported total
- a current product architecture may differ from an earlier internal version

Preserve the original unit, time window, scope, and attribution.

### 7. Produce the research packet

Return sections in this order:

1. conclusion
2. confirmed case-study matrix
3. detailed operational flows for high-detail cases
4. organization-wide rollout sequence
5. publicly undisclosed details
6. safe claims for publication
7. claims not to publish
8. source list

For every named example, explicitly state its public detail level.

## Article Handoff

When updating an existing article:

- replace unsupported specifics with disclosed facts
- add the operational flow only to high-detail cases
- add the rollout mechanism as its own section
- update the research report and source map
- preserve the article's approved voice and visual system
- use official screenshots as evidence only when they materially prove a claim
- do not publish, post, or transfer without the user's authorization

If a dedicated article-production Skill is available, hand off the completed research packet rather than duplicating its drafting, image, or publishing rules.

## Stop Conditions

Stop and report the gap when:

- the only source is a repost, leak, or unattributed summary
- the metric has no time window or scope
- implementation details require guessing
- the requested claim conflicts with the primary source
- access to a referenced source is blocked and no authoritative substitute exists

Do not weaken the evidence standard to complete a requested narrative.
