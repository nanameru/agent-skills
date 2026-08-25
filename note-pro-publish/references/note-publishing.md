# Note Publishing Workflow

This file is kept for backward compatibility. The normative note API, publishing, TOC QA, duplicate preview, and Discord workflow now lives in:

`references/note-parent-prompt.md`

If this file and `note-parent-prompt.md` disagree, follow `note-parent-prompt.md`.

Use this shared workflow for `note-free-publish`, `note-light-publish`, and `note-pro-publish`.

## MCP Server

Expected global MCP path:

```toml
[mcp_servers.note-mcp]
command = "uv"
args = ["run", "--directory", "<path-to-note-mcp>", "python", "-m", "note_mcp"]
```

If `note-mcp` tools are unavailable, prepare local Markdown and media assets, then stop before note writes and tell the user to restart Codex or check `codex mcp get note-mcp`.

## Core note-mcp Tools

Use these when available:

- `note_check_auth`, then `note_login` only if needed.
- `note_list_circle_plans` before plan-limited publishing.
- `note_create_draft` or `note_update_article`.
- `note_upload_eyecatch`.
- `note_get_preview_url` and optionally `note_get_preview_html`.
- `note_get_separator_candidates` and `note_set_paid_settings` for paid articles.
- `note_publish_article` only after explicit confirmation.

If there is no dedicated duplicate tool, create the duplicate by calling `note_create_draft` with the final article title, tags, body Markdown/body image URLs, paid separator heading, and member-only section. Upload the same eyecatch to the duplicate. Keep the duplicate unpublished.

## Access Models

Only the selected skill decides the default access model.

| Skill | Source | Plan | Plan key | limited | price | separator |
|---|---|---|---|---:|---:|---|
| `note-free-publish` | non-Zoom | none | none | false | none | none |
| `note-light-publish` | non-Zoom | lightプラン | `b2e068a96fa9` | true | 500 | required |
| `note-pro-publish` | Zoom recording | Proプラン | resolve live, fallback `cd8c363971ea` | true | 2000 | required |

For Pro, prefer resolving the live note circle plan by display name containing `Pro`. Use fallback `cd8c363971ea` only when the account/context is the known AI PLAY GUILD note account.

Do not carry a plan or price from one skill to another. If the user asks for a different access model, switch skills or ask for confirmation before publishing.

## Draft Creation And Editing

- Always keep the article key, for example `nc19f084da421`.
- Use the key-based editor URL: `https://editor.note.com/notes/<article_key>/edit/`.
- Do not rely on numeric editor URLs; they can show `0文字` even when the draft body exists.
- Preview URLs are read-only confirmation pages. You cannot publish from preview.
- After a body update, verify the body exists with `note_get_preview_html` when possible.
- If the editor URL has the correct title but body appears blank, check the article data through note-mcp before assuming the draft failed.

## Paid Separator

For `note-light-publish` and `note-pro-publish`, use a paid separator before detailed implementation material.

Default paid-line pattern:

```markdown
ここから先はメンバー向けです。<member-only promise>

## ここから先はメンバー向け: 実践テンプレートと運用手順
```

Every body update can regenerate element UUIDs. After every `note_update_article`, run separator candidate discovery again and apply paid settings to the current UUID.

For `note-free-publish`, do not add a paid separator, `limited=True`, circle plan keys, or price.

## Publish Sequence

Never publish without a fresh explicit user instruction such as `公開して` or `投稿して`.

When publishing is approved:

1. Finish final article update, visual preview QA, eyecatch upload, and paid settings when applicable.
2. Rediscover the current separator UUID after the last update for paid articles.
3. Publish the original article with the selected access model.
4. Build the public URL as `https://note.com/<username>/n/<article_key>`.
   - Use the authenticated note username when possible.
   - For the known AI PLAY GUILD account, use `meru2002`.
5. Verify the public URL returns HTTP 200 and contains the article title when possible.
6. Create an unpublished duplicate draft from the final article source/body.
7. Upload/copy the same eyecatch to the duplicate.
8. Get the duplicate draft preview URL.
9. Send the duplicate preview URL to Discord. Include the public URL as secondary context.

The duplicate preview is mandatory for all three skills after publication. Do not use the original public URL as the primary Discord preview link.

## Discord Duplicate Preview Delivery

Prefer `NOTE_PREVIEW_DISCORD_WEBHOOK_URL` from the shell environment or `<project>/.env.local`.

If no webhook is available, fall back to `DISCORD_BOT_TOKEN` and channel `1505176930046185632`. Do not invent another destination.

If the webhook belongs to a forum/media channel, include `thread_name`. Use the note title unless the user specifies another thread name.

Use `allowed_mentions: {"parse": []}` for all payloads and treat HTTP 204 as success.

Suggested payload:

```json
{
  "thread_name": "<title>",
  "content": "<title>\n\nプレビューURL: <duplicate_preview_url>\n公開URL: <public_url>\n状態: <access_label>",
  "allowed_mentions": { "parse": [] }
}
```

Access labels:

- Free: `無料公開 / 公開済み`
- Light: `ライトプラン限定 / 単発500円 / 公開済み`
- Pro: `Proプラン限定 / 単発2000円 / 公開済み`

Do not write full private preview URLs, preview access tokens, webhook URLs, note cookies, or bot tokens to handoff files, settings memos, git commits, or final responses unless the user explicitly asks to see a URL in chat.

## Verification Checklist

Before completion:

- Eyecatch upload has no error and is exactly 1280:670.
- Preview URL exists.
- Key-based editor URL loads the body and does not show `0文字`.
- Preview HTML has no obvious raw Markdown artifacts, broken image markers, or placeholders.
- Paid articles have the current separator UUID and intended plan/price settings.
- Free articles have no paid separator, no membership plan, and no price.
- Visual preview has been inspected after the last body update when possible.
- Duplicate draft exists after publication and remains unpublished.
- Discord delivery used the duplicate preview URL as the primary link.
