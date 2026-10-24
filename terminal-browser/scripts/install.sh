#!/bin/bash
set -euo pipefail
skill_root="$(cd "$(dirname "$0")/.." && pwd)"
stamp="$(date +%Y%m%d-%H%M%S)-$$"
backup_dir="$HOME/.local/state/terminal-browser-chat/backups/$stamp"
mkdir -p "$backup_dir/staged" "$HOME/.local/bin"
# Stage first so reinstalling from the installed Skill can safely replace its directory.
cp -R "$skill_root/." "$backup_dir/staged/"
for root in "$HOME/.codex/skills" "$HOME/.agents/skills"; do
  mkdir -p "$root"
  if [[ -e "$root/terminal-browser" || -L "$root/terminal-browser" ]]; then
    mv "$root/terminal-browser" "$backup_dir/$(basename "$(dirname "$root")")-terminal-browser"
  fi
  mkdir -p "$root/terminal-browser"
  cp -R "$backup_dir/staged/." "$root/terminal-browser/"
done
if [[ -e "$HOME/.local/bin/terminal-browser" ]]; then
  cp -P "$HOME/.local/bin/terminal-browser" "$backup_dir/terminal-browser"
fi
cat > "$HOME/.local/bin/terminal-browser" <<'WRAPPER'
#!/bin/sh
exec /usr/bin/python3 "$HOME/.agents/skills/terminal-browser/scripts/chat_browser.py" "$@"
WRAPPER
chmod +x "$HOME/.local/bin/terminal-browser"
echo "Installed conversation-scoped terminal-browser; backup: $backup_dir"
