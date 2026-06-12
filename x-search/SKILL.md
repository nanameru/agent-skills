---
name: x-search
description: "Search X (Twitter) posts, profiles, and threads via xAI's x_search API using a bundled Python CLI. Use when the user asks to search X/Twitter, check current discussion or reactions on X, find posts by specific handles, or research what is being said on X about a topic. Trigger on X検索, Xで検索, Twitter検索, x-search, X posts, ポスト検索, バズ調査, reactions on X."
metadata:
  short-description: xAI x_search APIによるX(Twitter)検索CLI
---

# X Search

Search X (Twitter) through xAI's built-in `x_search` Responses API tool, using
the bundled standalone CLI. Extracted from Hermes Agent's
`tools/x_search_tool.py` — same validation, retry, and degraded-result
contract, but stdlib-only and runnable without the Hermes runtime.

## How to run

```bash
python3 scripts/x_search.py "your query"
```

(Resolve `scripts/` relative to this skill folder.)

Options:

```bash
python3 scripts/x_search.py "claude code reactions" \
  --handles user1,user2        # only these handles (max 10)
  --exclude spammer1           # exclude handles (mutually exclusive with --handles)
  --from 2026-06-01 --to 2026-06-12   # YYYY-MM-DD window
  --images                     # analyze attached images
  --videos                     # analyze attached videos
  --model grok-4.20-reasoning  # override model (or X_SEARCH_MODEL env)
```

Output is a single JSON object on stdout; exit code 0 on success.

## Credentials

Resolved in this order (no flags needed):

1. Hermes Agent checkout (`HERMES_AGENT_DIR` env, default `~/hermes-agent`) —
   reuses Hermes's SuperGrok OAuth with automatic token refresh.
2. `XAI_API_KEY` in the process environment (`XAI_BASE_URL` optional).
3. `XAI_API_KEY` in `~/.hermes/.env`.

If none are available the tool fails fast with instructions; report that to
the user instead of retrying.

## Reading the result

- `answer`: synthesized answer text.
- `citations` / `inline_citations`: source X post URLs. **Always check these.**
- `degraded: true` means a narrowing filter (handles/dates) was active but xAI
  returned **zero citations** — the answer came from model knowledge, not the
  X index. Treat it as unsourced: broaden the filters and retry, or say so.

## Rules for agents

- When reporting found posts to the user, include the verbatim post text,
  author handle, date, and URL for every post — never summary-only.
- Date validation (malformed, inverted, future `from`) and the
  handles-conflict check fail before any billable API call; fix the
  arguments rather than retrying as-is.
- Each call is a billable xAI API request. Batch what you need into one good
  query instead of many small probes.
