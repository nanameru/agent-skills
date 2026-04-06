# Security Chaos Engineering — Detailed Checklist

## Table of Contents
1. [Authentication Chaos](#authentication-chaos)
2. [Authorization Chaos](#authorization-chaos)
3. [Session Chaos](#session-chaos)
4. [Database Chaos](#database-chaos)
5. [API Chaos](#api-chaos)
6. [Data Integrity Chaos](#data-integrity-chaos)
7. [Infrastructure Chaos](#infrastructure-chaos)
8. [Framework-Specific Patterns](#framework-specific-patterns)

---

## Authentication Chaos

### Bypass Scenarios
- [ ] Remove or nullify auth headers — does the request still succeed?
- [ ] Send expired JWT — is it rejected?
- [ ] Send JWT signed with `none` algorithm — is it accepted?
- [ ] Send JWT with modified `sub`/`user_id` claim — does it grant access to another user?
- [ ] Omit CSRF token on state-changing requests — does the server reject it?
- [ ] Use OAuth callback with manipulated `state` parameter

### Password & Credential Chaos
- [ ] Submit login with SQL injection payloads in username/password
- [ ] Check for timing attacks on login (constant-time comparison?)
- [ ] Verify password reset tokens are single-use and time-limited
- [ ] Check if failed login attempts are rate-limited
- [ ] Look for hardcoded credentials, API keys, or secrets in source

### Patterns to Grep
```
grep -r "password" --include="*.{env,yml,yaml,json,toml}"
grep -r "secret\|api_key\|token" --include="*.{env,yml,yaml,json,toml}"
grep -r "algorithm.*none\|verify.*false\|verify.*False"
grep -r "bcrypt\|argon2\|scrypt\|pbkdf2" # should exist for password hashing
```

---

## Authorization Chaos

### IDOR (Insecure Direct Object Reference)
- [ ] Replace resource IDs in URLs/params with other users' IDs
- [ ] Check if ownership validation exists on every CRUD operation
- [ ] Look for patterns like `Model.find(params[:id])` without scoping to current user

### Privilege Escalation
- [ ] Can a regular user set `role=admin` in request body?
- [ ] Are admin-only endpoints protected by role checks, not just auth?
- [ ] Check for mass assignment vulnerabilities (unprotected attributes)

### Patterns to Grep
```
grep -r "params\[:role\]\|params\['role'\]\|body\.role\|req\.body\.role"
grep -r "\.find(\|\.findById(\|\.get(" # check for unscoped queries
grep -r "isAdmin\|is_admin\|role.*==\|hasPermission\|authorize"
```

---

## Session Chaos

### Session Fixation & Hijacking
- [ ] Is the session ID regenerated after login?
- [ ] Are session cookies marked `HttpOnly`, `Secure`, `SameSite`?
- [ ] Is session data stored server-side (not in client-readable cookies)?
- [ ] Under load, can session store return wrong user's data? (shared key collision)

### Concurrent Request Chaos
- [ ] Send simultaneous requests — does session state remain consistent?
- [ ] If session store (Redis) goes down, does the app fail open (grants access) or fail closed?
- [ ] Check session timeout and invalidation on logout

### Patterns to Grep
```
grep -r "session\|cookie\|Set-Cookie\|httpOnly\|secure\|sameSite"
grep -r "redis\|memcached\|session.store\|sessionStore"
grep -r "logout\|sign_out\|signOut\|destroy.*session"
```

---

## Database Chaos

### Transaction & Consistency Chaos
- [ ] Are multi-step operations wrapped in transactions?
- [ ] If a write fails mid-operation, is the partial state rolled back?
- [ ] Race condition: two concurrent requests modifying the same resource
- [ ] Does `UPDATE ... WHERE balance >= amount` pattern exist, or is it check-then-update?

### Query Injection
- [ ] Are raw SQL queries parameterized?
- [ ] In ORMs, are there any `.where("string interpolation")` patterns?
- [ ] Check for NoSQL injection in MongoDB queries (`$gt`, `$ne` in user input)

### Patterns to Grep
```
grep -r "\.execute(\|\.raw(\|\.query(" # raw SQL
grep -r "BEGIN\|COMMIT\|ROLLBACK\|transaction\|atomic"
grep -r "\$where\|\$gt\|\$ne\|\$regex" # NoSQL injection
grep -rn "\.where(\".*#{" # string interpolation in queries (Ruby)
grep -rn "f\".*SELECT\|f\".*INSERT\|f\".*UPDATE" # f-string SQL (Python)
```

---

## API Chaos

### Rate Limiting & Cost
- [ ] List all public endpoints — which ones lack rate limiting?
- [ ] Can unauthenticated users trigger expensive operations (file processing, external API calls)?
- [ ] Are there endpoints that fan out to paid services (AI APIs, SMS, email)?
- [ ] Is there a global rate limit per IP/user?

### Input Validation
- [ ] Send oversized payloads — is there a body size limit?
- [ ] Send unexpected types (string where int expected) — does it crash or handle gracefully?
- [ ] Send deeply nested JSON — is there a depth limit?
- [ ] Check for SSRF: can user-supplied URLs cause the server to fetch internal resources?

### Patterns to Grep
```
grep -r "rateLimit\|rate_limit\|throttle\|RateLimiter"
grep -r "fetch(\|axios\|requests\.get\|urllib\|http\.get" # SSRF candidates
grep -r "maxBodySize\|limit.*mb\|bodyParser\|express\.json"
```

---

## Data Integrity Chaos

### Data Leak Scenarios
- [ ] Do error responses include stack traces or internal details in production?
- [ ] Are sensitive fields (password, SSN, token) excluded from API responses?
- [ ] Do logs contain PII, tokens, or credentials?
- [ ] Is there a global serializer/presenter that strips sensitive fields?

### Data Loss Scenarios
- [ ] What happens on cascade delete — is important data orphaned or lost?
- [ ] Is billing/payment data soft-deleted or hard-deleted?
- [ ] Are there backup/audit trails for critical data mutations?
- [ ] Can admin actions (bulk delete, data migration) silently destroy user data?

### Patterns to Grep
```
grep -r "console\.log\|logger\.\|log\.\|print(" # check what gets logged
grep -r "stack\|traceback\|stackTrace" # error exposure
grep -r "dependent.*destroy\|cascade\|onDelete"
grep -r "\.destroy\|\.delete\|DELETE FROM" # deletion patterns
```

---

## Infrastructure Chaos

### Secrets & Configuration
- [ ] Are `.env` files in `.gitignore`?
- [ ] Are there secrets in source code or config files committed to git?
- [ ] Is debug mode disabled in production config?
- [ ] Are default ports/credentials changed?

### Headers & Transport
- [ ] Is HTTPS enforced (HSTS header)?
- [ ] Is CORS configured to a specific origin (not `*`)?
- [ ] Is CSP (Content-Security-Policy) set?
- [ ] Are security headers present (X-Frame-Options, X-Content-Type-Options)?

### Patterns to Grep
```
grep -r "DEBUG.*=.*True\|debug.*=.*true\|NODE_ENV.*development"
grep -r "Access-Control-Allow-Origin.*\*"
grep -r "helmet\|HSTS\|Content-Security-Policy\|X-Frame-Options"
grep -r "\.env" .gitignore # should exist
```

---

## Framework-Specific Patterns

### Rails
- Check `strong_parameters` — all controllers should use `permit`
- Check `before_action :authenticate` coverage
- Look for `skip_before_action :verify_authenticity_token`
- Check `config/initializers/` for insecure defaults
- Verify `protect_from_forgery` is not disabled

### Express / Node.js
- Check for `helmet` middleware usage
- Verify `express-rate-limit` or similar is configured
- Look for `eval()` or `Function()` with user input
- Check `cors()` configuration
- Verify `express-validator` or similar input validation

### Django
- Check `ALLOWED_HOSTS` is not `['*']`
- Verify `CSRF_COOKIE_SECURE` and `SESSION_COOKIE_SECURE`
- Look for `@csrf_exempt` decorators
- Check `DEBUG = True` in settings
- Verify `django-ratelimit` or similar exists

### Laravel
- Check `$fillable` / `$guarded` on all models (mass assignment)
- Verify middleware on routes (`auth`, `throttle`)
- Look for `DB::raw()` with unescaped input
- Check `.env` is in `.gitignore`
- Verify CORS configuration in `config/cors.php`

### Next.js / React
- Check for dangerouslySetInnerHTML with user input (XSS)
- Verify API routes have authentication checks
- Look for exposed environment variables (`NEXT_PUBLIC_` prefix)
- Check for SSRF in server-side data fetching
