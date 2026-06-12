#!/usr/bin/env bash
set -euo pipefail

echo "Restoring managed Skills..."
npx skills add nanameru/github-issue-driven-dev-skill --skill github-issue-driven-dev -g -y --copy
npx skills add nanameru/agent-skills --skill test-case-board -g -y --copy
npx skills add nanameru/agent-skills --skill loop-engineering-dev -g -y --copy
npx skills add nanameru/agent-skills --skill skills-repo-manager -g -y --copy
npx skills add nanameru/agent-skills --skill chaos-engineer -g -y --copy

mkdir -p "$HOME/.local/bin" "$HOME/.claude/skills"
ln -sfn "$HOME"/.agents/skills/test-case-board/bin/test-board "$HOME"/.local/bin/test-board
ln -sfn "$HOME"/.agents/skills/test-case-board "$HOME"/.claude/skills/test-case-board

echo "Done."
