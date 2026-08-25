---
name: note-free-publish
description: Use when creating and publishing a Japanese note.com article for AI PLAY GUILD / PORSEO as a free public article with no membership plan, no paid separator, and no price. Uses the shared note article workflow for article writing, fact-checking, screenshots/diagrams, 1280:670 eyecatch generation, note draft creation, preview/editor verification, original publish, unpublished duplicate preview creation, and Discord delivery. Do not use for light-plan limited articles or Zoom-recording-sourced Pro articles; use note-light-publish or note-pro-publish instead.
---

# note-free-publish

AI PLAY GUILD / PORSEO の通常記事を、**無料公開**の note 記事として作成・公開する。

## Execution Profile

記事の企画・調査・執筆・QAは、毎回 `Terra` モデル、reasoning effort `medium` で実行する。ユーザーが明示的に別モデルまたは別 effort を指定した場合のみ、その指示を優先する。

## Use This For

- Zoom録画を参照しない通常の note 記事作成。
- 講義メモ、要約、技術トピック、X/Twitter調査、既存Markdown、LMSリンクなどを元にした記事化。
- 公開設定がプランなし・限定公開なし・価格なしの、誰でも読める記事。

Use `$note-light-publish` for light-plan limited articles with one-off 500 yen access.
Use `$note-pro-publish` for Zoom recording based Pro-plan articles.

## Required References

Before drafting or publishing, read:

- `/Users/kimurataiyou/.agents/skills/note-light-publish/references/note-parent-prompt.md`

## Access Model

Default and required access for this skill:

- Plan: none
- Plan key: none
- `limited=False`
- One-off price: none
- Paid separator: none. Do not add a paid separator, member-only teaser, or `ここから先はメンバー向け` heading. The article must stand alone and include the useful implementation details in the public body.
- Eyecatch badge: 原則なし。必要な場合のみ `無料公開`。

Do not silently publish as light plan or Pro. If the user asks for those, switch to the matching note skill.

## Workflow

1. Gather the source material and infer title, reader promise, target audience, references, and any media assets.
2. During research, use the `x-search` skill (`python3 ~/.agents/skills/x-search/scripts/x_search.py "<topic>"`) for the topic and keep selected post URLs, visible text, authors, dates, like counts, and external links in source notes.
3. Follow `/Users/kimurataiyou/.agents/skills/note-light-publish/references/note-parent-prompt.md` for drafting, fact-checking, local-knowledge selection, and the Miyata-style visual application workflow: storyboard images against article claims, use ten purposeful 16:9 body visuals as the long-form standard, place each immediately after the claim it explains, create a 1280:670 eyecatch with a headline on the left and a meaningful hero motif on the right, then verify every note-hosted image in preview. Also follow the parent prompt for note API handling, TOC QA, publishing, duplicate preview, and Discord delivery.
4. Create or update an editable note draft with `note-mcp`.
5. Upload the eyecatch and all body diagrams/images.
6. Confirm the article has no paid separator, no membership plan, and no price.
7. Verify the editor URL, preview HTML, public TOC/index behavior when `[TOC]` is used, images, and article rendering.
8. Stop before publishing unless the user has explicitly asked to publish/post the article.
9. When publishing is approved, publish the original article as a free public article, create an unpublished duplicate draft, get the duplicate preview URL, and deliver that duplicate preview to Discord using the shared publishing workflow.

For Discord delivery, use the shared `/Users/kimurataiyou/.agents/skills/note-light-publish/scripts/deliver_note_preview.py` with `--access-model free`. Run it without `--send` first. Only after a fresh article-specific approval, rerun it with `--approved --send`.

```bash
python3 /Users/kimurataiyou/.agents/skills/note-light-publish/scripts/deliver_note_preview.py \
  --title "<title>" \
  --preview-url "<unpublished duplicate preview URL>" \
  --public-url "<published article URL>" \
  --access-model free

# Only after fresh approval:
python3 /Users/kimurataiyou/.agents/skills/note-light-publish/scripts/deliver_note_preview.py \
  --title "<title>" \
  --preview-url "<unpublished duplicate preview URL>" \
  --public-url "<published article URL>" \
  --access-model free \
  --approved --send
```

## Confirmation Gate

Before publishing, report:

- title
- original article key
- editor URL
- preview URL
- eyecatch path or upload result
- access model: 無料公開（プランなし・価格なし）
- tags
- Discord delivery destination/status if requested or configured

Never publish without a fresh instruction such as `公開して`, `投稿して`, or `Discordに送って`.
