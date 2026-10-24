---
name: terminal-browser
description: Open websites and official VS Code beside the current Herdr conversation, with conversation-scoped servers and browser reuse.
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

## 公式VS Code

フォルダ・ファイルを開く依頼は次を使う。

```sh
bash ~/.codex/skills/terminal-browser/scripts/open-vscode-right.sh /absolute/path
# 同じ処理
terminal-browser vscode /absolute/path
```

公式Visual Studio Codeの `serve-web` をlocalhostで起動する。
会話ごとにlaunchctl label・port・server-data・logを分離し、再実行時はその会話のサーバーとペインを再利用する。
対象フォルダはURLのfolderパラメーターで明示する。他会話や旧共通サーバーを停止しない。
Terminal Code、tode、デスクトップVS Codeは使わない。
Issue worktreeがある場合はそのフォルダを開く。

## 導入・検証

```sh
bash terminal-browser/scripts/install.sh
/usr/bin/python3 -m unittest discover -s terminal-browser/tests -v
```

導入時は既存のCLIとスキルのsymlink/ディレクトリをバックアップしてから置換する。
上流CLIの更新後もラッパーとスキルを維持するため、必要ならinstall.shを再実行する。
