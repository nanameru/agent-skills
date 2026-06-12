# Testmail Login/Auth Tests

Use this reference when an E2E case needs a fresh email inbox, OTP, magic link, signup, invitation, or password reset flow.

## Current Official Baseline

Testmail.app documents:

- JSON API endpoint: `https://api.testmail.app/api/json`
- Env-style credentials: API key and namespace
- Inbox address format for tagged tests:
  `<namespace>.<tag>@inbox.testmail.app`
- `livequery=true` for waiting/polling-style test queries.

Check current docs before adding provider-specific code:

- https://testmail.app/docs

## Environment

Use environment variables, never committed secrets:

```bash
TESTMAIL_API_KEY=...
TESTMAIL_NAMESPACE=...
```

Optional:

```bash
TESTMAIL_TAG_PREFIX=e2e
TESTMAIL_TIMEOUT_MS=120000
```

## Address Strategy

Default to a fresh tag per run:

```text
${TESTMAIL_NAMESPACE}.${TESTMAIL_TAG_PREFIX}-${timestamp}-${random}@inbox.testmail.app
```

Use a fixed tag only when the test intentionally needs the same account repeatedly:

```yaml
e2e:
  auth: testmail
  testmail:
    fixedTag: "admin-smoke"
```

## OTP/Magic Link Flow

Typical case:

1. Generate a fresh address.
2. Start login/signup in the browser.
3. Submit the generated email address.
4. Poll Testmail for a message to that tag after the test start timestamp.
5. Extract OTP or magic link from text/html.
6. Continue the browser flow.
7. Assert landing page, session, and authorization state.

Use explicit selectors and assertions. Avoid relying only on final screenshot appearance.

## Test Cases To Capture

For auth systems, add cases for:

- New user signup with fresh Testmail inbox.
- Existing user login with fixed Testmail inbox.
- Expired OTP or magic link rejected.
- Wrong OTP rejected.
- Non-admin user denied admin routes.
- Admin allowlist or role claim grants admin routes.
- Logout clears session.
- Session refresh or token expiration behavior.

## Flake Control

- Keep signup/email tests low concurrency. Email providers and auth services often rate-limit or delay OTP delivery.
- Record start timestamp before submitting the form and filter messages by tag and timestamp.
- Fail with useful diagnostics: requested address, subject filters, message count, timeout, and current URL.
