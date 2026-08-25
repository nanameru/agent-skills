---
name: note-pro-publish
description: Use when creating and publishing a Japanese note.com article for AI PLAY GUILD / PORSEO from a Zoom recording or Zoom-derived material as a Pro-plan limited article with one-off 2000 yen access. Uses the shared note article workflow for article writing, fact-checking, recording screenshots/diagrams, 1280:670 eyecatch generation, note draft creation, paid separator setup, preview/editor verification, original publish, unpublished duplicate preview creation, and Discord delivery. Do not use for free public articles or non-Zoom light-plan articles; use note-free-publish or note-light-publish instead.
---

# note-pro-publish

AI PLAY GUILD / PORSEO の Zoom録画・Zoom由来素材を、**Proプラン限定 + 単発2000円** の note 記事として作成・公開する。

## Execution Profile

記事の企画・調査・執筆・QAは、毎回 `Terra` モデル、reasoning effort `medium` で実行する。ユーザーが明示的に別モデルまたは別 effort を指定した場合のみ、その指示を優先する。

## Use This For

- Zoom録画、VTT文字起こし、Zoomチャット、録画スクリーンショットなど Zoom由来の素材を主ソースにした記事化。
- `zoom-lecture-publish` スキルからのハンドオフ（`note-drafts/handoffs/*.json` バンドル）を受けた記事作成。
- 公開設定が `Proプラン` 限定で、非会員向けに単発2000円を付ける記事。

Use `$note-free-publish` for free public articles.
Use `$note-light-publish` for non-Zoom light-plan articles with one-off 500 yen access.

## Required References

Before drafting or publishing, read:

- `/Users/kimurataiyou/.agents/skills/note-light-publish/references/note-parent-prompt.md`
- `references/zoom-source.md`

## Access Model

Default and required access for this skill:

- Plan: `Proプラン`
- Plan key: resolve live with `note_list_circle_plans` by display name containing `Pro`. Use fallback `cd8c363971ea` only when the account/context is the known AI PLAY GUILD note account.
- `limited=True`
- One-off price: `2000`
- Paid separator: required. Put setup details, commands, prompts, checklists, failure modes, and operational cautions after the separator.
- Eyecatch badge: use `Proプラン限定 / 単発2000円` when a plan badge is appropriate.

Do not silently publish as free or light plan. If the user asks for those, switch to the matching note skill. Do not carry the fallback plan key to other accounts or contexts.

## Workflow

1. Gather the Zoom-derived source material: recording video/audio, VTT transcript, Zoom chat, summary, shared links, screenshots, and any handoff bundle from `zoom-lecture-publish`. Follow `references/zoom-source.md` for how to treat each.
2. X検索は必須ではない。ユーザーが明示した場合、Zoomチャット内でXに言及がある場合、または現在の社会的反応が記事に必要な場合だけ `x-search` skill (`python3 ~/.agents/skills/x-search/scripts/x_search.py "<topic>"`) を使い、採用基準は親プロンプトに従う。
3. Follow `/Users/kimurataiyou/.agents/skills/note-light-publish/references/note-parent-prompt.md` for drafting, fact-checking, local-knowledge selection, and the Miyata-style visual application workflow: storyboard images against article claims, use ten purposeful 16:9 body visuals as the long-form standard, place each immediately after the claim it explains, create a 1280:670 eyecatch with a headline on the left and a meaningful hero motif on the right, then verify every note-hosted image in preview. Also follow the parent prompt for note API handling, TOC QA, publishing, duplicate preview, and Discord delivery.
4. Create or update an editable note draft with `note-mcp`.
5. Upload the eyecatch and all body diagrams/images/recording screenshots.
6. Add the paid separator and apply Pro-plan + 2000 yen settings, resolving the plan key live first.
7. Verify the editor URL, preview HTML, paid separator UUID, public TOC/index behavior when `[TOC]` is used, images, and article rendering.
8. Stop before publishing unless the user has explicitly asked to publish/post the article.
9. When publishing is approved, publish the original article with Pro-plan + 2000 yen settings, create an unpublished duplicate draft, get the duplicate preview URL, and deliver that duplicate preview to Discord using the shared publishing workflow.

For Discord delivery, use the shared `/Users/kimurataiyou/.agents/skills/note-light-publish/scripts/deliver_note_preview.py` with `--access-model pro`. Run it without `--send` first. Only after a fresh article-specific approval, rerun it with `--approved --send`.

```bash
python3 /Users/kimurataiyou/.agents/skills/note-light-publish/scripts/deliver_note_preview.py \
  --title "<title>" \
  --preview-url "<unpublished duplicate preview URL>" \
  --public-url "<published article URL>" \
  --access-model pro

# Only after fresh approval:
python3 /Users/kimurataiyou/.agents/skills/note-light-publish/scripts/deliver_note_preview.py \
  --title "<title>" \
  --preview-url "<unpublished duplicate preview URL>" \
  --public-url "<published article URL>" \
  --access-model pro \
  --approved --send
```

## Confirmation Gate

Before publishing, report:

- title
- original article key
- editor URL
- preview URL
- eyecatch path or upload result
- plan name/key and how the key was resolved (live or fallback)
- one-off price `2000`
- separator UUID and heading
- tags
- Discord delivery destination/status if requested or configured

Never publish without a fresh instruction such as `公開して`, `投稿して`, or `Discordに送って`.
