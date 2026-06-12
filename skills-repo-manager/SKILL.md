---
name: skills-repo-manager
description: "Use when creating, updating, backing up, publishing, restoring, or auditing agent Skills in a GitHub-backed canonical skills repository. Trigger on Skill管理, Skills管理, skills repo, Vercel Skills CLI, npx skills add/update, GitHubにSkillを保存, Skillをpush, restore-skills.sh, ~/.agents/skills backup, prevent skills from disappearing, or when a user wants the management of Skills itself to be handled by a Skill."
---

# Skills Repo Manager

## Parent Skill

When managing Skills for loop engineering, first read `~/.agents/skills/loop-engineering-core/SKILL.md` if it exists. If it is missing, continue with this Skill and report that the parent Skill was unavailable.

This Skill owns durability and repository management. The parent owns shared loop behavior that should be reused by Codex and Claude Code child Skills.

Use this skill to keep Skills durable. Treat GitHub as the source of truth and local agent skill directories as installed copies.

## Mental Model

- **Canonical source**: a GitHub repository such as `nanameru/agent-skills`.
- **Installed copy**: `~/.agents/skills/<name>`, `~/.claude/skills/<name>`, project `.agents/skills/<name>`, etc.
- **Installer**: `npx skills add ...`.
- **Publisher**: ordinary `git add`, `git commit`, `git push`.

The Skills CLI installs, lists, removes, and updates Skills. It does not replace Git for committing and pushing changes.

## Standard Workflow

1. Create or edit the Skill locally.
2. Sync the Skill into the canonical repository:

```bash
node skills-repo-manager/scripts/manage-skills.mjs sync --repo . --skills test-case-board loop-engineering-dev --apply
```

3. Audit the repo and installed copies:

```bash
node skills-repo-manager/scripts/manage-skills.mjs audit --repo .
```

4. Validate discoverability:

```bash
npx skills add . --list
```

5. Commit and push with normal Git:

```bash
git status --short
git add <skill-dirs> managed-skills.json restore-skills.sh
git commit -m "Skill管理と復元の仕組みを追加する Refs #1"
git push origin <branch>
```

6. Restore on any machine:

```bash
bash restore-skills.sh
```

## Repository Shape

Keep Skills as root-level directories unless a repo has already standardized on `skills/<name>`:

```text
agent-skills/
  test-case-board/
    SKILL.md
    scripts/
    references/
  loop-engineering-dev/
    SKILL.md
    references/
  skills-repo-manager/
    SKILL.md
    scripts/
  managed-skills.json
  restore-skills.sh
```

## Rules

- Never make `~/.agents/skills` the only copy of an important Skill.
- Never rely on chat history as the only backup.
- After editing a Skill in an installed location, sync it back to the canonical repo in the same work session.
- Prefer `--copy` for durable global installs so removing or changing a source checkout does not break the installed copy.
- Keep secrets out of Skills. Use environment variables and document names only.
- Do not commit generated `.skill` zip files unless there is a deliberate release reason.

## Bundled Script

`scripts/manage-skills.mjs` supports:

```bash
node skills-repo-manager/scripts/manage-skills.mjs audit --repo .
node skills-repo-manager/scripts/manage-skills.mjs sync --repo . --skills test-case-board --apply
node skills-repo-manager/scripts/manage-skills.mjs restore-script --repo . --apply
```

The script is conservative. `sync` is dry-run unless `--apply` is passed.

## Restore Script Policy

`restore-skills.sh` should include:

- external sources, such as `nanameru/github-issue-driven-dev-skill`
- this repo's Skills, such as `nanameru/agent-skills --skill test-case-board`
- post-install symlinks for command-line tools, such as `test-board`

When in doubt, update `managed-skills.json` and regenerate the restore script.
