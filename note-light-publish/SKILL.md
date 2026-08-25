---
name: note-light-publish
description: Use when creating and publishing a Japanese note.com article for AI PLAY GUILD / PORSEO as a light-plan limited article with one-off 500 yen access. Uses the shared note article workflow for article writing, fact-checking, screenshots/diagrams, 1280:670 eyecatch generation, note draft creation, paid separator setup, preview/editor verification, original publish, unpublished duplicate preview creation, and Discord delivery. Do not use for free public articles or Zoom-recording-sourced Pro articles; use note-free-publish or note-pro-publish instead.
---

# note-light-publish

AI PLAY GUILD / PORSEO の通常記事を、**ライトプラン限定 + 単発500円** の note 記事として作成・公開する。

## Execution Profile

記事の企画・調査・執筆・QAは、毎回 `Terra` モデル、reasoning effort `medium` で実行する。ユーザーが明示的に別モデルまたは別 effort を指定した場合のみ、その指示を優先する。

## Use This For

- Zoom録画を参照しない通常の note 記事作成。
- 講義メモ、要約、技術トピック、X/Twitter調査、既存Markdown、LMSリンクなどを元にした記事化。
- 公開設定が `AI Play Guild / lightプラン` 限定で、非会員向けに単発500円を付ける記事。

Use `$note-free-publish` for free public articles.
Use `$note-pro-publish` for Zoom recording based Pro-plan articles.

## Required References

Before drafting or publishing, read:

- `references/note-parent-prompt.md`

## Access Model

Default and required access for this skill:

- Plan: `AI Play Guild / lightプラン`
- Plan key: `b2e068a96fa9`
- `limited=True`
- One-off price: `500`
- Paid separator: required. Put setup details, commands, prompts, checklists, failure modes, and operational cautions after the separator.
- Eyecatch badge: use `ライトプラン限定 / 単発500円` when a plan badge is appropriate.

Do not silently publish as free, Pro, or no-price light plan. If the user asks for those, switch to the matching note skill.

## Workflow

1. Gather the source material and infer title, reader promise, target audience, references, and any media assets.
2. During research, use the `x-search` skill (`python3 ~/.agents/skills/x-search/scripts/x_search.py "<topic>"`) for the topic and keep selected post URLs, visible text, authors, dates, like counts, and external links in source notes.
3. Follow `note-parent-prompt.md` for drafting, fact-checking, local-knowledge selection, and the Miyata-style visual application workflow: storyboard images against article claims, use ten purposeful 16:9 body visuals as the long-form standard, place each immediately after the claim it explains, create a 1280:670 eyecatch with a headline on the left and a meaningful hero motif on the right, then verify every note-hosted image in preview. Also follow the parent prompt for note API handling, TOC QA, publishing, duplicate preview, and Discord delivery.
4. Create or update an editable note draft with `note-mcp`.
5. Upload the eyecatch and all body diagrams/images.
6. Add the paid separator and apply light-plan + 500 yen settings.
7. Verify the editor URL, preview HTML, paid separator UUID, public TOC/index behavior when `[TOC]` is used, images, and article rendering.
8. Stop before publishing unless the user has explicitly asked to publish/post the article.
9. When publishing is approved, publish the original article with light-plan + 500 yen settings, create an unpublished duplicate draft, get the duplicate preview URL, and deliver that duplicate preview to Discord using the shared publishing workflow.

For Discord delivery, use `scripts/deliver_note_preview.py`. It is dry-run by default and requires both `--approved` and `--send` for an external write. Run dry-run first, then run the approved command only when the current user turn explicitly authorizes publishing/delivery. Never place the preview URL in a report, Issue, commit, or final response; pass it only to the approved continuation command.

```bash
python3 scripts/deliver_note_preview.py \
  --title "<title>" \
  --preview-url "<unpublished duplicate preview URL>" \
  --public-url "<published article URL>"

# Only after fresh approval:
python3 scripts/deliver_note_preview.py \
  --title "<title>" \
  --preview-url "<unpublished duplicate preview URL>" \
  --public-url "<published article URL>" \
  --approved --send
```

## Confirmation Gate

Before publishing, report:

- title
- original article key
- editor URL
- preview URL
- eyecatch path or upload result
- plan name/key
- one-off price `500`
- separator UUID and heading
- tags
- Discord delivery destination/status if requested or configured

Never publish without a fresh instruction such as `公開して`, `投稿して`, or `Discordに送って`.
