## iOS / Xcode の検証は Devin の macOS セッションで行う（最優先）

この Mac はディスク容量が少ないため、`xcodebuild`・iOS シミュレータの起動・スクリーンショット撮影を**ローカルで実行しない**。
ローカルでは Swift のコードを書くだけにし、ビルド・テスト・画面確認はすべて Devin に任せる。

- セッション作成: `~/.claude/skills/devin-handoff/scripts/devin-handoff.sh create --platform macos --task "..."`（API の `platform: "macos"`）
- Linux で立ってしまったら、そのセッションに「macOS の子セッション（Xcode + iOS Simulator）を起動して同じ手順を実行して」と返信する
- 結果（ビルド / テスト件数 / スクリーンショット / 指摘）は GitHub Issue に日本語でコメントさせ、修正して push したら再度 Devin に再検証を依頼する

<!-- BEGIN codex-chat-wrapup -->
