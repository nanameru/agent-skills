# Article Structure

This file is kept for backward compatibility. The normative article writing prompt and structure now lives in:

`references/note-parent-prompt.md`

If this file and `note-parent-prompt.md` disagree, follow `note-parent-prompt.md`.

Use this structure for AI PLAY GUILD / PORSEO note articles. It applies to free, light-plan, and Pro-plan articles. Adapt headings to the topic, but preserve the reader journey.

## Title Patterns

Prefer a concrete benefit plus the topic.

- `Goal駆動AI開発の始め方: GoalcraftとGoalBuddy実践ノート`
- `AIに長期開発を任せるための設計図`
- `Claude Codeをチーム開発で使うための実践チェックリスト`
- Avoid titles that sound like a class memo, such as `講義復習: ...`, unless the user explicitly wants that tone.
- Prefer standalone technical article titles, for example `AIに長い開発タスクを任せるためのGoal駆動入門`.

## Body Template

```markdown
<Reader problem and why it matters now.>

<One-sentence core insight.>

<Optional context link. If there is an LMS/hands-on link, introduce it naturally with the uploaded thumbnail image first. If there is no link, do not invent one.>

## 何が問題だったのか

<The pain before the method. Keep this grounded in the source, not generic.>

## 中心になる考え方

<Explain the central model in 3-5 short paragraphs.>

## 実践手順

1. <Step one>
2. <Step two>
3. <Step three>

## 実務で効くポイント

- **Point name**: <practical explanation>
- **Point name**: <practical explanation>
- **Point name**: <practical explanation>

<For paid light/pro articles only: add the paid teaser and separator here.>

ここから先はメンバー向けです。<member-only promise: templates, commands, setup details, failure modes, or implementation steps>.

## ここから先はメンバー向け: 実践テンプレートと運用手順

<Give 2-4 concrete tasks the reader can do after reading/watching.>

## つまずきやすいところ

<Name likely failure modes and how to avoid them.>

## 次に見るべき観点

<Connect this article to the next learning path or next experiment.>
```

For free public articles, remove the member-only teaser and separator and include the useful implementation details in the public body.

## Voice

- Use calm, direct Japanese.
- Write as a natural technical explainer, not a transcript summary, sales page, or lecture recap.
- Make the reader feel the article gives operational depth: templates, decisions, and next actions.
- Avoid exaggerated claims. Ground every claim in the source or verified references.
- Do not write phrases like `講義でも言ったように`, `今回の講義`, `講義中に共有された`, or `今日は...扱いました`.
- When using an external, LMS, or hands-on link, avoid dumping raw URLs. Use a natural Markdown link.
- For the first hands-on link, place the thumbnail image immediately before the link.

## Free Versus Paid Body

For `note-free-publish`:

- No paid separator.
- No member-only teaser.
- No `ここから先はメンバー向け`.
- The article should stand alone and provide the complete useful explanation.

For `note-light-publish` and `note-pro-publish`, put these before the separator:

- What the topic covers.
- Why it matters now.
- One useful insight.
- Thumbnail + hands-on/source link when relevant.
- A short fact-check note with named primary sources when relevant.
- A teaser of what the member section contains.

Put these after the separator:

- Detailed checklist.
- Specific prompts.
- Failure modes.
- Implementation notes.
- Member exercises.
- Commands, repositories, and templates.
- Tool setup and operational cautions.

Do not put a complete reproducible sequence before the separator in paid articles. The free preview should help readers decide whether the article is worth reading; it should not replace the paid section.

When source material is a hands-on or lecture, avoid treating it as authoritative by itself. Verify current technical facts against official docs, GitHub repositories, release notes, or product pages. If the source path and official path differ, write the distinction clearly, for example: `公式の推奨インストールはAだが、この記事では検証用にBのルートも扱う`.

## Goalcraft Lecture Example

For a lecture or source about Codex / Claude Code Goal command, Goalcraft, and GoalBuddy, use this angle:

- Core promise: AI coding becomes more useful when the goal, evidence loop, and progress board are designed together.
- Reader outcome: they can turn a vague ambition into an executable long-running objective.
- Member exercise: write one goal, define verification evidence, then track progress on a board.
- Important warning: a goal is not a wish; it needs done criteria, stop conditions, and evidence.

Avoid saying `Goalcraft was shared in the lecture`. Instead, link naturally: `リポジトリは [Goalcraft](https://github.com/grp06/goalcraft) です。`

For GoalBuddy, link naturally: `公式リポジトリは [GoalBuddy](https://github.com/tolibear/goalbuddy) です。`
