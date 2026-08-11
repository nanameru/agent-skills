# Evidence Matrix

Use this template for every public case-study research task.

## Case matrix

| Field | Required content |
|---|---|
| Case label | Neutral name used in the report |
| Official wording | What the primary source actually says |
| Actor | Person, role, team, or department |
| Before | Manual process or prior system, if disclosed |
| Trigger | Event, schedule, request, or user action |
| Input | Data or connected system explicitly named |
| Processing | Deterministic code, model inference, or human judgment |
| Output | Report, draft, application, decision, or action |
| Human control | Review, approval, ownership, or escalation point |
| Sharing | App, blueprint, link, champion, training, or other mechanism |
| Result | Metric with unit, scope, time window, and attribution |
| Public detail | High, medium, or low |
| Undisclosed | Data fields, logic, integration, UI, or approval details not published |
| Sources | Direct URLs and publication dates |

## Public detail rubric

- **High**: the source describes before, input, processing, output, and human control well enough to reconstruct the flow.
- **Medium**: the source describes the use and result but omits one or more operational components.
- **Low**: the source only names the use case or includes it in an aggregate result.

Do not promote a low-detail example into a detailed workflow.

## Rollout matrix

| Stage | Evidence to find | If absent |
|---|---|---|
| Demand capture | Intake channel for real employee problems | Mark undisclosed |
| Manual pilot | Human-assisted delivery before automation | Mark undisclosed |
| Pattern discovery | Repeated requests or jobs-to-be-done | Mark undisclosed |
| Codification | Skills, context, templates, or workflows | Mark undisclosed |
| Safe access | Identity, permission, audit, and approval | Mark undisclosed |
| Self-service | Browser, app, template, or internal platform | Mark undisclosed |
| Distribution | Champions, embedded staff, training, or incentives | Mark undisclosed |
| Measurement | Adoption, output, time, quality, or cost metric | Preserve attribution |

## Claim ledger

For each publishable sentence, record:

```text
Claim:
Source:
Source date:
Evidence type: direct / aggregate / estimate / inference
Scope and time window:
Safe wording:
Do not say:
```

## Final QA

- Every number has a source, scope, and time window.
- Aggregate results are not assigned to individual cases.
- Demo examples are separated from internal production examples.
- Self-reported estimates are attributed to the company.
- Unknown system names, data fields, and logic remain unknown.
- The rollout mechanism is separated from the technical architecture.
- Sources appear next to the claims they support.
