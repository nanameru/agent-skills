#!/usr/bin/env bash
# Usage: deliver.sh <out.mp4> <basename-without-ext>
# Copies the render to ~/Downloads under a NEW name, closes stale QuickTime
# windows (an open file must never be overwritten in place) and plays it.
set -euo pipefail
src="$1"; name="$2"; dst="$HOME/Downloads/${name}.mp4"
if [ -e "$dst" ]; then dst="$HOME/Downloads/${name}_$(date +%H%M%S).mp4"; fi
ffprobe -v error -show_entries format=duration:stream=nb_frames -of default=nw=1 "$src"
cp "$src" "$dst"
osascript -e 'tell application "QuickTime Player" to close every document' >/dev/null 2>&1 || true
open -a "QuickTime Player" "$dst"
sleep 2
osascript -e 'tell application "QuickTime Player" to activate' -e 'tell application "QuickTime Player" to play document 1' >/dev/null 2>&1 || true
echo "$dst"
