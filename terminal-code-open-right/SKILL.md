---
name: terminal-code-open-right
description: Open Terminal Code (tode) beside the current Herdr chat when asked to show code, folders, files, or VS Code. This is the user's default editor.
---

# Terminal Code

ユーザーの標準エディターはTerminal Code（tode）。以前の使用禁止はユーザーの明示指示で解除済み。
「VS Codeを開いて」「コードを右に表示して」「フォルダを開いて」は次を使う。

```sh
terminal-browser code
# 対象を明示された場合
terminal-browser code /absolute/path
```

terminal-browserスキルの会話解決ラッパーを通し、会話中のチャットの右に表示する。
同会話のウィンドウだけを再利用する。生のtodeに古いHerdr環境変数を渡さない。
対象の指定がなければ `terminal-browser code` を実行し、このCodexチャットに設定されたリポジトリ（cwd）を開く。
ツールの実行場所・直前のフォルダ・実装用worktreeを既定の表示先にしない。ユーザーが明示したパスは優先する。
URLやHTMLのプレビューは `terminal-browser open <URL> --split right` を使う。
ブラウザ版の公式VS Code serve-webを明示された場合は `terminal-browser vscode /absolute/path`。

表示倍率は起動・リサイズ後もnative main-scriptで継続補正する。
ブラウザの倍率を一度リセットするだけでは再発するため、補正の導入を維持する。
通常のWebプレビューや別originには適用しない。文字の大きさはエディターのfontSizeで調整する。
