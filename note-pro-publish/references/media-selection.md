# Media Selection

This file is kept for backward compatibility. The normative media, diagram, screenshot, and eyecatch workflow now lives in:

`references/note-parent-prompt.md`

If this file and `note-parent-prompt.md` disagree, follow `note-parent-prompt.md`.

Use this guide when adding screenshots, generated diagrams, Zoom chat links, or external references to a lecture-derived note article.

## Media Role

Use media as part of the explanation, not as decoration.

- Add screenshots where the visible UI directly supports the nearby paragraph.
- Add generated diagrams when the concept is structural, such as a workflow, before/after, or contract/checklist model.
- Every article must include at least five HTML/CSS-generated explanatory diagrams. Create each diagram as HTML/CSS, render it to a raster image with Playwright or an equivalent browser screenshot workflow, upload it as a note body image, and embed the note-hosted image URL in the article.
- Screenshots are optional supporting evidence and do not count toward the five HTML diagram minimum.
- For diagrams, create clean raster images and upload them as body images. Keep text readable at note article width.
- Good default diagram set: problem map, workflow, before/after comparison, practical checklist, risk/failure map, and next-action roadmap. Use the five most relevant to the article.
- The first hands-on link should be introduced by the uploaded thumbnail image, then a natural Markdown link. Do not show the raw URL as a standalone text dump unless the user asks for raw URLs.

## Screenshot Candidate Loop

Transcript timestamps and screen-share frames can drift. Never assume the exact spoken timestamp is the best screenshot.

For each article section that needs a screenshot:

1. Pick the target moment from transcript/chapter context.
2. Generate candidates around that point:
   - normal range: `t-45s`, `t-20s`, `t`, `t+20s`, `t+45s`
   - if still mismatched: expand to `t-90s` and `t+90s`
3. Make a contact sheet or inspect thumbnails visually.
4. Choose the frame whose visible UI/text matches the paragraph.
5. If none match, skip the screenshot or use a better supporting asset such as a shared link preview, GitHub README, or official docs screenshot.

If a frame still feels mismatched after checking nearby candidates, do not force it into the article. Use a generated diagram, official repository screenshot, or researched reference instead.

For Mux-hosted PORSEO videos, candidate stills can be generated with:

```bash
curl -L --fail "https://image.mux.com/<PLAYBACK_ID>/thumbnail.jpg?time=<SECONDS>&width=1280&height=720&fit_mode=smartcrop" -o candidate.jpg
```

## Cropping Rules

- Prefer the shared screen over the speaker webcam.
- Crop out Zoom participant strips, face-forward webcam tiles, and unrelated black margins.
- If the screenshot is mainly a face or does not show the concept being explained, do not use it.
- Keep enough surrounding UI to make the image understandable. Do not crop so tightly that the reader cannot tell what tool or page is shown.
- Save local before/after filenames clearly, for example `chapter_1765_clean.jpg`.
- If a frame contains a person prominently in the foreground, choose another nearby frame or crop the person out unless the person's face is the subject.
- When the paragraph describes a specific screen, inspect the candidate visually. A timestamp match is not enough.

## Zoom Chat Links

Always inspect Zoom chat/messages when available.

Extract URLs, normalize trailing punctuation, and deduplicate. Prioritize:

1. Links shared by the lecturer during the relevant section.
2. Official GitHub repositories, docs, product pages, or release notes.
3. Links shared by participants that clarify the lecture.

Use shared links inside the article near the section they support. Prefer named Markdown links over visible raw URLs so the article reads naturally.

## External Research Fallback

If Zoom chat does not include enough context, research only what is needed to make the article useful and accurate.

- Prefer primary sources: official docs, GitHub repositories, release notes, product pages.
- Use web search for current external facts, because repository names, install commands, releases, and product behavior can change.
- Fact-check even when the transcript sounds confident. Verify install commands, repo names, CLI command names, plan/pricing claims, model/provider lists, and product limitations before presenting them as facts.
- If a verified source contradicts the lecture or hands-on transcript, follow the source and describe the hands-on path as a tested route, not as the canonical recommendation.
- Do not overfill the article with generic web explanation. Add research only when it clarifies a tool, install path, limitation, or next action from the lecture.
- Keep a short source list in the local draft notes or final response when external web sources were used.

## Article Fit Check

Before updating note:

- Each screenshot should support the paragraph immediately before or after it.
- The article should contain at least five uploaded HTML/CSS-generated diagrams, each placed near the section it explains.
- Generated diagrams should explain a process or model clearly, not act as decoration.
- The article should include lecture-specific material from transcript/chapter notes, not only generic explanation.
- The article should include Zoom shared links when available.
- If external sources are used, the text should clearly distinguish lecture content from researched supplementation.
- The wrong X/GitHub/product screenshot is worse than no screenshot; replace any mismatched asset before updating note.
