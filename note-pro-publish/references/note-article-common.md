# Shared Note Article Workflow

This file is kept for backward compatibility. The normative parent prompt is:

`references/note-parent-prompt.md`

If this file and `note-parent-prompt.md` disagree, follow `note-parent-prompt.md`.

Use this common workflow for `note-free-publish`, `note-light-publish`, and `note-pro-publish`. The writing, fact-checking, media, thumbnail, note draft, preview QA, duplicate preview, and Discord delivery behavior should stay the same across all three skills. Only two things differ:

- Whether the source is a Zoom recording.
- The note access model and price.

## Source Intake

Gather or infer:

- Article title, date/context, target reader, and the reader promise.
- Source material: transcript, VTT, Zoom chat, summary markdown, existing notes, links, X/Twitter posts, screenshots, or LMS links.
- Core takeaway and 5-7 supporting points.
- Media candidates: thumbnail/eyecatch path, screenshots, diagrams, shared links, and references.

For `note-free-publish` and `note-light-publish`, always use the `x-search` skill (`python3 ~/.agents/skills/x-search/scripts/x_search.py "<topic>"`) during the research phase when the user asks to write an article, including prompts like `この記事を書いて`. Search X for current discussion, examples, objections, use cases, and source posts related to the article topic. Keep source notes with post URL, visible post text, author/handle, date, like count, and external links. Use the selected X material as one input to the article, but distinguish X discussion from verified facts.

For X/Twitter-based topics in any skill, also use the `x-search` skill before drafting when available. Do not make X-based claims without source URLs.

For `note-pro-publish`, Zoom recording assets are the primary source. X search is optional and should be used only when the user asks for X/current discussion, the Zoom chat points to X, or the article needs current social context.

For current technical facts, verify with primary sources before writing: official docs, GitHub repositories, release notes, product pages, or pricing pages. Use web search when facts may have changed.

## Article Voice

- Write in Japanese for AI PLAY GUILD / PORSEO readers.
- Produce a natural technical explainer, not a transcript dump, lecture recap, or sales page.
- Avoid source-referential phrases like `講義でも言ったように`, `今回の講義`, `講義中に共有された`, or `今日は扱いました`.
- Use `この記事`, `ハンズオン`, or direct explanation instead.
- Use note-friendly Markdown.
- Avoid inline backticks in prose; use Japanese quotes or bold text for tool names and commands. Fenced code blocks are OK when genuinely useful.
- Use tags without `#`. Recommended defaults: `AI`, `AI開発`, `Codex`, `ClaudeCode`, `AI_PLAY_GUILD`.

## Body Structure

Read `article-structure.md` when drafting. Preserve this reader journey:

1. Reader problem and why it matters now.
2. One core insight.
3. Context or source link when relevant.
4. What was hard or confusing before this approach.
5. Central model.
6. Practical steps.
7. Operational points.
8. Paid/member section only for light/pro articles.
9. Failure modes and next actions.

For paid/member articles, keep the free preview useful but incomplete. Put commands, reusable prompts, setup sequences, detailed checklists, failure modes, and operational cautions after the paid separator.

For free public articles, do not add paywall language. Give the complete useful article.

## Media And References

Read `media-selection.md` before adding screenshots, Zoom chat links, or external references.

- Media must explain the nearby paragraph, not decorate the article.
- Prefer screen-share frames and UI screenshots over face-forward frames.
- Crop out Zoom participant strips, webcam faces, unrelated black margins, and unreadable UI.
- If a screenshot does not match the paragraph, replace it or use a diagram.
- Every article must include at least five HTML/CSS-generated explanatory diagrams. Render each diagram to a raster image, upload it to note as a body image, and embed the note-hosted URL near the relevant section.
- Use generated diagrams for workflows, timelines, before/after models, risk flows, checklists, architecture maps, decision trees, and comparison tables. Screenshots may be added too, but they do not count toward the five HTML diagram minimum.
- If the source does not naturally suggest five visuals, create a useful set such as: problem map, workflow, before/after, checklist, risk/failure map, and next-action roadmap.
- Upload body images to note and embed note-hosted URLs in the final body.
- Extract and deduplicate URLs from Zoom chat/messages when available. Prefer official or lecturer-shared links.

## Eyecatch / Thumbnail

Every article must have a note eyecatch:

- Required size: exactly 1280:670.
- Prefer a strong raster visual generated with Image 2 / `imagegen` when the source thumbnail is weak, text-heavy, or mismatched.
- Use HTML/CSS overlay only for sharp Japanese title text, badges, and note-specific labels.
- Make it readable in the note feed: high contrast, one dominant idea, clear subject/background separation, and short title text.
- Avoid generic pale backgrounds, tiny UI screenshots, rough Japanese text, and overly busy layouts.

Badge rules:

- Free: no badge by default, or `無料公開` if the user wants a clear public label.
- Light: `ライトプラン限定 / 単発500円`.
- Pro: `Proプラン限定` or `Proプラン限定 / 単発2000円` when the price is shown.

If the article embeds a hands-on thumbnail near the top, use the same final badged eyecatch image when appropriate.

## Draft And QA

Use `note-mcp` for note operations. Do not imitate a publish result when MCP tools are unavailable.

Before showing completion:

- Create/update the editable draft.
- Upload eyecatch.
- Upload body images or diagrams.
- Apply paid settings for light/pro articles.
- Fetch preview URL and editor URL.
- Inspect preview HTML when possible.
- Visually inspect the preview after major body updates when possible, especially numbered lists, images, paid separator area, raw Markdown, detached Japanese fragments, and awkward line breaks.

## Post-Publish Duplicate Preview

After publishing any article from any of the three skills:

1. Keep the original as the published article.
2. Create a second unpublished duplicate draft from the final article body.
3. Copy title, tags, eyecatch, body image URLs, paid separator heading, and member-only content when present.
4. Never publish the duplicate.
5. Use the duplicate preview URL as the primary preview/review link.
6. Send the duplicate preview URL to Discord when delivery is requested or configured as part of the run.

This avoids relying on the original article preview, which can become unavailable or incomplete after updates.
