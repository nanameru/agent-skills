#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
skill_dir="$repo_root/x-article-draft"

required_files=(
  "$skill_dir/SKILL.md"
  "$skill_dir/agents/openai.yaml"
  "$skill_dir/references/article-package-and-qa.md"
  "$skill_dir/references/editorial-visual-workflow.md"
  "$skill_dir/references/tech-news-hero-cover.md"
)

for required_file in "${required_files[@]}"; do
  test -f "$required_file"
done

if rg -n -i '宮田|miyata|木村|kimura|太陽|taiyo|AI PLAY|aiplayguild|arc-hac|/Users/|taiyo-gyomu' "$skill_dir"; then
  echo "customer-specific content found" >&2
  exit 1
fi

rg -q 'author_name' "$skill_dir/SKILL.md"
rg -q 'approved_cta_url' "$skill_dir/SKILL.md"
rg -q 'exact 5:2' "$skill_dir/references/editorial-visual-workflow.md"
rg -q 'confirm.*unpublished' "$skill_dir/SKILL.md"
rg -q '\$x-article-draft' "$skill_dir/agents/openai.yaml"

echo "x-article-draft generalization QA passed"
