#!/usr/bin/env bash
# Usage: contact-sheet.sh <video.mp4> <frame,frame,...> [out.png]
# Tiles the given frames (4 per row) so click moments can be eyeballed.
set -euo pipefail
video="$1"; frames="$2"; out="${3:-${video%.mp4}-sheet.png}"
sel=$(echo "$frames" | tr ',' '\n' | sed 's/.*/eq(n\\,&)/' | paste -sd+ -)
n=$(echo "$frames" | tr ',' '\n' | wc -l | tr -d ' ')
cols=4; rows=$(( (n + cols - 1) / cols ))
ffmpeg -v error -y -i "$video" -vf "select='$sel',scale=800:-1,tile=${cols}x${rows}" -frames:v 1 "$out"
echo "$out"
