#!/bin/sh
set -eu
if [ "$#" -ne 1 ]; then
  echo 'usage: open-vscode-right.sh /absolute/path' >&2
  exit 2
fi
exec /usr/bin/python3 "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)/chat_browser.py" vscode "$1"
