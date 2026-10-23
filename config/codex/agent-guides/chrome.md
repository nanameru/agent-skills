## ChromeのWeb操作はPlaywright Extensionのタブグループを使う

Chrome上のWeb操作では、OS全体のComputer Useで既存Chromeを前面操作しない。
Playwright Extensionと `npx -y @playwright/cli@latest attach --extension=chrome` を使い、
`-s=<task-name>` ごとに専用のタブグループを作って、そのグループ内だけを操作する。

- 接続後のCDP操作で、ユーザーの前面アプリ（Ghostty等）を奪わないことを確認する
- 初回接続時だけ拡張機能がChromeを前面化することがある。操作前に一言添え、接続後は元の前面アプリへ戻す
- 拡張機能のService Workerが無効・応答なしの場合は、`chrome://extensions` のPlaywright Extensionをオフ→オンして再読み込みする
- `PLAYWRIGHT_MCP_EXTENSION_TOKEN` などの認証情報は、回答・ログ・Issueへ表示しない
- タブグループを使えない場合だけ、headlessのagent-browser／Playwrightを代替にし、Computer Useへ戻さない
<!-- END chrome-tab-group-browser -->
