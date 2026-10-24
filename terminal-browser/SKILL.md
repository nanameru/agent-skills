---
name: terminal-browser
description: Open websites beside the current Herdr chat; use Terminal Code (tode) by default for code and folders, or official VS Code serve-web when explicitly requested.
---

# Terminal Browser

ターミナルブラウザは、必ず会話中のチャットの右側へ表示する。
`terminal-browser` は `scripts/chat_browser.py` の安全ラッパーを使用する。
Herdr環境変数だけでは別会話を指す場合があるため、上流CLIを直接呼ばない。

```sh
terminal-browser context
terminal-browser open https://example.com --split right
terminal-browser open /absolute/path/preview.html --split right
terminal-browser ls --json
terminal-browser action --browser <key> --tab <id> -- snapshot
```

URL指定なしは `terminal-browser open --split right`。
同会話の既存ブラウザは再利用し、同会話の右側から移動していたら停止する。
右以外へのsplit、未対応オプション、全ブラウザを止めるshutdownは安全のため拒否する。
`action` と `ls` は現在の会話のターミナル環境で上流CLIへ渡す。
複数ブラウザがある場合は、起動結果のbrowser keyと `ls` のtab IDを明示する。

## 会話の特定

1. `CODEX_THREAD_ID` とHerdrのlive `agent_session` を照合し、会話名・cwdも一致することを確認する。
2. 未登録ならローカルCodex DBの一意な会話名・cwdと、Herdrの会話名・cwdを照合する。
3. 重複、別会話ID、未登録、表示先移動などの不整合があれば、別ペインへ推測で開かず停止する。
4. UIのfocused paneやdaemonから継承した古いペインIDへフォールバックしない。

## エディターの標準

ユーザーの標準エディターはTerminal Code（tode）。以前の禁止設定は解除済み。
「VS Codeを開いて」「コード・ファイル・フォルダを表示して」は次を使う。

```sh
terminal-browser code /absolute/path
# 互換エントリーもTerminal Codeを開く
bash ~/.codex/skills/terminal-browser/scripts/open-vscode-right.sh /absolute/path
```

会話別のブラウザとIPCを記録し、その会話のウィンドウだけを再利用する。
実行元ペインを特定できない場合やIPCの所有が不明な場合は停止する。
Terminal Code内部の設定・拡張はtodeの共通profileを使う。会話ごとのウィンドウとフォルダを分離する。
Issue worktreeがあればそのフォルダを開く。
Terminal Codeの倍率はnative main-scriptで継続補正し、起動・リサイズ後もターミナル画素とCSS画素を1:1に保つ。
文字自体の大きさを変える場合はエディターのfontSizeを調整する。ブラウザの倍率だけを一度リセットする方法へ戻さない。

ブラウザ版の公式VS Code serve-webを明示された場合だけ、次を使う。

```sh
terminal-browser vscode /absolute/path
```

公式VS Codeは会話ごとにサーバー・port・状態を分離する。

## 導入・検証

```sh
bash terminal-browser/scripts/install.sh
/usr/bin/python3 -m unittest discover -s terminal-browser/tests -v
node --test terminal-browser/tests/test_tode_zoom.cjs
```

導入時は既存のCLIとスキルのsymlink/ディレクトリをバックアップしてから置換する。
上流CLIの更新後もラッパーとスキルを維持するため、必要ならinstall.shを再実行する。
