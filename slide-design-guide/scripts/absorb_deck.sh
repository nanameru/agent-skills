#!/bin/bash
# SlideLand起点デッキの実物スライドを吸収用にダウンロードする。
#   ./absorb_deck.sh <speakerdeck-url-or-pdf-url> [出力dir] [枚数]
# SpeakerDeck: ページHTMLから files.speakerdeck.com のスライド画像URLを抽出し、
# 先頭+等間隔サンプルをjpgで保存。PDF: そのまま保存（ReadツールはPDFページを直接読める）。
# 保存後、エージェントはReadツールで各画像を実際に見てデザインDNAを言語化すること。
set -euo pipefail

URL="${1:?usage: absorb_deck.sh <url> [outdir] [count]}"
OUT="${2:-/tmp/deck-absorb}"
COUNT="${3:-6}"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
mkdir -p "$OUT"

if [[ "$URL" == *.pdf* ]]; then
  curl -sL -o "$OUT/deck.pdf" "$URL"
  echo "PDF saved: $OUT/deck.pdf (Read tool can open pages directly, e.g. pages 1-6)"
  exit 0
fi

if [[ "$URL" == *speakerdeck.com* ]]; then
  HTML=$(curl -sL -A "$UA" "$URL")
  if echo "$HTML" | grep -q "challenge-platform"; then
    sleep 3
    HTML=$(curl -sL -A "$UA" "$URL")
  fi
  BASE=$(echo "$HTML" | grep -o 'https://files\.speakerdeck\.com/presentations/[a-f0-9]*/slide_0\.jpg?[0-9]*' | head -1)
  if [[ -z "$BASE" ]]; then
    echo "ERROR: slide image URL not found (Cloudflare challenge?). Fallback: WebFetch the page and extract files.speakerdeck.com/presentations/<id>/slide_N.jpg manually." >&2
    exit 1
  fi
  PREFIX="${BASE%slide_0.jpg*}"
  QUERY="${BASE##*slide_0.jpg}"
  # 総枚数はページ内の slide_N 参照のユニーク数から推定（取れなければ20と仮定）
  TOTAL=$(echo "$HTML" | grep -o 'slide_[0-9]*\.jpg' | sort -u | wc -l | tr -d ' ')
  [[ "$TOTAL" -lt 1 ]] && TOTAL=20
  STEP=$(( TOTAL / COUNT )); [[ $STEP -lt 1 ]] && STEP=1
  i=0; saved=0
  while [[ $saved -lt $COUNT && $i -lt $TOTAL ]]; do
    if curl -sf -o "$OUT/slide_$i.jpg" "${PREFIX}slide_${i}.jpg${QUERY}"; then
      echo "saved: $OUT/slide_$i.jpg"
      saved=$((saved+1))
    fi
    i=$((i+STEP))
  done
  echo "done: $saved slides in $OUT (view them with the Read tool)"
  exit 0
fi

echo "ERROR: unsupported URL (speakerdeck.com or .pdf only): $URL" >&2
exit 1
