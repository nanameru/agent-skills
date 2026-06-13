#!/usr/bin/env bash
set -euo pipefail

echo "Restoring managed Skills..."
npx skills add nanameru/github-issue-driven-dev-skill --skill github-issue-driven-dev -g -y --copy
npx skills add nanameru/agent-skills --skill loop-engineering-core -g -y --copy
npx skills add nanameru/agent-skills --skill test-case-board -g -y --copy
npx skills add nanameru/agent-skills --skill loop-engineering-dev -g -y --copy
npx skills add nanameru/agent-skills --skill skills-repo-manager -g -y --copy
npx skills add nanameru/agent-skills --skill chaos-engineer -g -y --copy
npx skills add nanameru/agent-skills --skill x-search -g -y --copy
npx skills add nanameru/agent-skills --skill slide-design-guide -g -y --copy
npx skills add nanameru/slide-archetype-gen-skill --skill slide-archetype-gen -g -y --copy

mkdir -p "$HOME/.local/bin" "$HOME/.claude/skills" "$HOME/.codex/skills"
ln -sfn "$HOME"/.agents/skills/github-issue-driven-dev "$HOME"/.claude/skills/github-issue-driven-dev
ln -sfn "$HOME"/.agents/skills/loop-engineering-core "$HOME"/.claude/skills/loop-engineering-core
ln -sfn "$HOME"/.agents/skills/loop-engineering-dev "$HOME"/.claude/skills/loop-engineering-dev
ln -sfn "$HOME"/.agents/skills/test-case-board/bin/test-board "$HOME"/.local/bin/test-board
ln -sfn "$HOME"/.agents/skills/test-case-board "$HOME"/.claude/skills/test-case-board
ln -sfn "$HOME"/.agents/skills/skills-repo-manager "$HOME"/.claude/skills/skills-repo-manager
ln -sfn "$HOME"/.agents/skills/x-search "$HOME"/.claude/skills/x-search
ln -sfn "$HOME"/.agents/skills/slide-design-guide "$HOME"/.claude/skills/slide-design-guide
ln -sfn "$HOME"/.agents/skills/slide-design-guide "$HOME"/.codex/skills/slide-design-guide
ln -sfn "$HOME"/.agents/skills/slide-archetype-gen "$HOME"/.claude/skills/slide-archetype-gen
ln -sfn "$HOME"/.agents/skills/slide-archetype-gen "$HOME"/.codex/skills/slide-archetype-gen

echo "Done."
