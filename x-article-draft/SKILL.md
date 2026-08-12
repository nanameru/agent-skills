---
name: x-article-draft
description: "Create, revise, visualize, package, or troubleshoot evidence-based Japanese X Article drafts for any author or client. Use for long-form X articles that need primary-source research, an author-specific voice and CTA, a 5:2 cover, explanatory diagrams, source mapping, DraftJS content_state, media upload, or a draft-only publishing handoff."
---

# X Article Draft

Create a reusable Japanese X Article package without mixing authors, brands, or calls to action. Stop at a reviewable draft unless the user separately authorizes publication.

## Safety boundary

- Treat draft creation, media upload, and API calls as external writes. Perform them only when the user asks for an X draft or transfer.
- Never publish unless the user explicitly approves publication and identifies the exact draft.
- Never store or print OAuth tokens, client secrets, bearer tokens, cookies, or local credential files.
- Do not invent first-person experience, endorsements, results, affiliations, or customer claims for the author.
- Preserve private client material locally. Do not package it for sharing unless the user authorizes that exact content.

## Required inputs

Establish these before drafting. Use a project client playbook when one exists; otherwise ask only for missing decisions that materially affect the output.

```yaml
topic: ""
reader: ""
author_name: ""
author_account: ""
author_voice: ""
author_experience_allowed: []
author_experience_forbidden: []
approved_cta_text: ""
approved_cta_url: ""
primary_sources: []
output_mode: "local-package | x-draft"
```

Never reuse an earlier author's voice, community, service, website, or CTA. If an author profile is missing, keep the ending informational and mark the CTA as unresolved.

## Core workflow

1. Confirm the exact author, reader, output mode, and publish boundary.
2. Define one editorial promise: what the reader will understand or decide after reading.
3. Research primary sources. Separate confirmed facts, attributed company claims, reasonable inference, and unknown details.
4. Build a claim ledger containing the claim, source URL, date, scope, attribution, and article location.
5. Draft the article so the opening promise is fully paid off by evidence and concrete examples.
6. Apply the confirmed author's voice and approved CTA only after the factual draft is stable.
7. If visuals are requested, read `references/editorial-visual-workflow.md` completely before generating them.
8. If a technical-news hero cover is appropriate, also read `references/tech-news-hero-cover.md` completely.
9. Create the article package and run the QA checklist in `references/article-package-and-qa.md`.
10. If X transfer is requested, verify the current official X Articles API and formatting behavior before building the payload.
11. Create or register a draft, verify the returned state is unpublished, and report the latest draft identifier.

When current claims, API behavior, prices, product capabilities, people, or dates matter, browse current primary sources. Prefer official documentation, official repositories, research papers, regulatory material, and first-party announcements.

## Editorial structure

Choose a structure that serves the topic instead of forcing every article into a tutorial.

### Explanation or news analysis

1. Title that states the question, tension, or change.
2. Short lead containing the editorial promise.
3. Verified event or claim.
4. How it works or what changed.
5. Concrete examples and constraints.
6. What is not public or remains uncertain.
7. Practical implication for the target reader.
8. Summary and approved author CTA.

### Tutorial or implementation guide

1. Short outcome-based title.
2. What the reader will build or learn.
3. Official repository, documentation, or required console link near the top.
4. Prerequisites and safety notes.
5. Numbered implementation steps with screenshots where useful.
6. Common errors and fixes.
7. Verification steps.
8. Summary and approved author CTA.

Avoid unsupported superlatives, false urgency, and headlines that the body does not prove. Preserve the unit, time window, scope, and attribution of every metric.

## Author and CTA isolation

Maintain a separate author profile for each account or client. Before finalizing, verify:

- every first-person sentence is supported by approved author experience;
- every service, community, and link belongs to that author;
- no client-specific positioning leaked from another project;
- facts from sources remain distinguishable from the author's interpretation;
- the CTA is omitted or labeled unresolved when approval is missing.

## X Articles transfer

Use official X documentation for the current endpoint and supported block types. Do not assume an old schema is still current.

For DraftJS-style payloads:

- include `text`, `type`, `inline_style_ranges`, `entity_ranges`, and `data` on every block;
- use supported heading, list, quote, unstyled, and atomic block types only;
- represent images with atomic image entities and the identifier required by the current API;
- encode multiline commands as code-styled text, not quotations;
- render unsupported tables as accessible images and keep the structured table data beside the article;
- calculate every range offset and length from the final Unicode string;
- create a new draft for revisions unless an official update endpoint is verified;
- confirm the resulting draft is unpublished.

If authenticated X tools are unavailable, still produce a complete local package and a clear transfer guide. Do not ask the user to expose secrets in chat.

## Outputs

Create only the files relevant to the request, normally:

```text
ARTICLE.md
SOURCE_MAP.md
CLAIM_LEDGER.md
AUTHOR_PROFILE.md
VISUAL_PLAN.md
QA.md
assets/00-cover-5x2.png
assets/01-<topic>.png
...
x-article-transfer.json   # only when requested
```

Return:

- title and author/account;
- local package path;
- latest draft identifier when one was created;
- what was researched, written, or changed;
- whether the result is local-only, draft-only, or published;
- unresolved author claims, CTA approval, security follow-up, or human review points.

