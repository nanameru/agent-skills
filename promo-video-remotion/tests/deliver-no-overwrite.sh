#!/usr/bin/env bash
# Usage: bash deliver-no-overwrite.sh [path-to-deliver.sh]
set -euo pipefail

if [ "$#" -gt 1 ]; then
  echo "Usage: bash deliver-no-overwrite.sh [path-to-deliver.sh]" >&2
  exit 2
fi

PATH=/usr/bin:/bin:/usr/sbin:/sbin
export PATH
unset BASH_ENV ENV
test_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)
script=${1:-"$test_dir/../scripts/deliver.sh"}

umask 077
tmp_parent=$(cd /tmp && pwd -P)
tmpdir=$(/usr/bin/mktemp -d "$tmp_parent/deliver-no-overwrite.XXXXXX")
trap '/bin/rm -rf -- "$tmpdir"' EXIT
HOME="$tmpdir/home"
TMPDIR="$tmpdir/tmp"
export HOME TMPDIR
downloads="$HOME/Downloads"
fixtures="$tmpdir/fixtures"
bin="$tmpdir/bin"
/bin/mkdir -p "$downloads" "$fixtures" "$bin" "$TMPDIR"

# Keep the test offline and avoid launching a player or requiring a video.
for command in ffprobe open osascript sleep; do
  printf '#!/bin/sh\nexit 0\n' > "$bin/$command"
  /bin/chmod +x "$bin/$command"
done
printf '#!/bin/sh\nprintf "123456\\n"\n' > "$bin/date"
/bin/chmod +x "$bin/date"
PATH="$bin:$PATH"
export PATH

printf 'existing original\n' > "$fixtures/original"
printf 'existing timestamped\n' > "$fixtures/timestamped"
printf 'first synthetic source\n' > "$fixtures/first.mp4"
printf 'second synthetic source\n' > "$fixtures/second.mp4"
/bin/cp "$fixtures/original" "$downloads/demo.mp4"
/bin/cp "$fixtures/timestamped" "$downloads/demo_123456.mp4"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

assert_existing_unchanged() {
  /usr/bin/cmp -s "$fixtures/original" "$downloads/demo.mp4" || fail 'demo.mp4 changed'
  /usr/bin/cmp -s "$fixtures/timestamped" "$downloads/demo_123456.mp4" || fail 'demo_123456.mp4 changed'
}

assert_delivery() {
  local dst=$1 source=$2 parent
  case "$dst" in
    "$downloads"/*) ;;
    *) fail 'stdout was not a path inside the private Downloads directory' ;;
  esac
  parent=$(cd "$(dirname "$dst")" 2>/dev/null && pwd -P) || fail 'delivery directory does not exist'
  case "$parent/" in
    "$downloads/"*) ;;
    *) fail 'delivery resolved outside the private Downloads directory' ;;
  esac
  [ ! -L "$dst" ] && [ -f "$dst" ] || fail 'delivery is not a regular file'
  /usr/bin/cmp -s "$source" "$dst" || fail 'delivery content differs from source'
}

first=$(/usr/bin/env -i HOME="$HOME" TMPDIR="$TMPDIR" PATH="$PATH" /bin/bash "$script" "$fixtures/first.mp4" demo)
assert_existing_unchanged
assert_delivery "$first" "$fixtures/first.mp4"

second=$(/usr/bin/env -i HOME="$HOME" TMPDIR="$TMPDIR" PATH="$PATH" /bin/bash "$script" "$fixtures/second.mp4" demo)
assert_existing_unchanged
assert_delivery "$second" "$fixtures/second.mp4"
[ "$first" != "$second" ] || fail 'deliveries used the same path'
/usr/bin/cmp -s "$fixtures/first.mp4" "$first" || fail 'first delivery changed after the second'

echo 'PASS: existing files and earlier deliveries were preserved'
