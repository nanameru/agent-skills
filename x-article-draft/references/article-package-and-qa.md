# Article package and QA

## Claim ledger

For every material claim, record:

| Claim | Classification | Source | Date | Scope and unit | Attribution | Article location |
|---|---|---|---|---|---|---|
|  | confirmed / attributed / inference / unknown |  |  |  |  |  |

Do not convert an attributed company estimate into an independently verified fact. Do not infer the implementation of every example from one detailed example.

## Author profile

Keep the author contract beside the article:

```yaml
author_name: ""
account: ""
audience: ""
voice_traits: []
approved_first_person_experience: []
forbidden_or_unverified_claims: []
approved_cta_text: ""
approved_cta_url: ""
approval_status: "unconfirmed | confirmed"
```

## Package layout

```text
ARTICLE.md
SOURCE_MAP.md
CLAIM_LEDGER.md
AUTHOR_PROFILE.md
VISUAL_PLAN.md
QA.md
assets/
  00-cover-5x2.png
  01-<topic>.png
  ...
x-article-transfer.json
```

Omit files that are not needed. If a ZIP is requested, add a short plain-text insertion guide and verify the archive with `unzip -t`.

## QA checklist

### Evidence

- [ ] The central thesis is supported by primary evidence or labeled inference.
- [ ] Roles, dates, quotes, numbers, units, time windows, and attribution are verified.
- [ ] Unknown implementation details remain unknown.
- [ ] Every material source appears in `SOURCE_MAP.md` or the claim ledger.

### Author isolation

- [ ] The author and target account are explicit.
- [ ] First-person claims are approved and supported.
- [ ] CTA text and URL belong to this author.
- [ ] No voice, community, service, or client data leaked from another account.

### Editorial quality

- [ ] The opening promise is paid off in the body.
- [ ] The title and cover do not overstate the conclusion.
- [ ] Examples are concrete and relevant to the reader.
- [ ] Limitations and uncertainty are visible.
- [ ] The final action is singular and appropriate.

### Visuals

- [ ] Cover uses an exact 5:2 ratio and remains readable on mobile.
- [ ] Every inline visual explains one distinct relationship.
- [ ] Official asset sources and usage are recorded.
- [ ] Japanese, numbers, arrows, and product names are correct.
- [ ] No fake logos or decorative filler images are present.

### Transfer and safety

- [ ] Payload ranges and entities match the final Unicode text.
- [ ] Unsupported tables are represented safely.
- [ ] Uploaded media uses the current documented category and identifier.
- [ ] The latest draft identifier is recorded.
- [ ] The draft is confirmed unpublished.
- [ ] No credential or private source material is stored in the package.

