#!/usr/bin/env bash
# scan_real_info.sh — 納品前の実在情報スキャン（軽量版）
# 外部画像・実URL・実メールを洗い出す。許可は Google Fonts と w3.org/2000/svg のみ。
# 使い方: scripts/scan_real_info.sh <file.html> [<file2.html> ...]
set -euo pipefail

if [ "$#" -eq 0 ]; then
  echo "usage: $0 <file.html> [<file.html> ...]" >&2
  exit 2
fi

status=0
for f in "$@"; do
  if [ ! -f "$f" ]; then
    echo "skip (not found): $f" >&2
    continue
  fi
  echo "=== $f ==="
  # 外部URL / 外部画像 / メールアドレスを抽出し、許可ドメインを除外
  hits=$(grep -onE '<img|src=https?://|url\(https?://|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|https?://[^"'"'"' )]+' "$f" \
    | grep -viE 'fonts\.(googleapis|gstatic)\.com|www\.w3\.org/2000/svg' || true)
  if [ -n "$hits" ]; then
    echo "$hits"
    echo "  ^ 要確認: 外部画像/実URL/実メールの可能性。許可は Google Fonts と w3.org/2000/svg のみ。" >&2
    status=1
  else
    echo "  OK: 外部画像/実URL/実メールの混入なし（許可ドメイン除く）"
  fi
done

exit $status
