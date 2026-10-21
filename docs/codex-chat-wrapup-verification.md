# Codex終了時整理の検証（Issue #35）

## 検証結果

- quick_validate.py: Skill is valid!
- manage-skills audit --skills codex-chat-wrapup: 正本とインストール済みのハッシュ一致。
- npx skills add . --list: codex-chat-wrapupの検出に成功。
- bash -n restore-skills.sh: 成功。
- 共通AGENTS.mdへの追記後、追記前の内容が保存されていること、ブロックが1つであることを確認。
- このチャットにも更新された共通AGENTS.mdが再注入されたことを確認。ただし他の進行中チャットへの反映は保証しない。
- CODEX_THREAD_IDで対象を確認し、set_thread_titleによる「Codex - 回答終了時の自動整理を設定済み」への変更をlist_threadsで確認。
- move_thread_to_sidebar_sectionは成功応答を返したが、list_threadsでは対象が「Tasks」に残った。hostId指定あり・なしの2回で同じ結果。移動を反映済みとは判定せず、追加の反復を停止した。

## 制約とフォローアップ

この方式はAGENTS.mdから最終回答前にSkillを呼ぶ指示であり、強制実行されるアプリイベントフックではない。中断・ツール非対応環境では動作しない。Skillのインストールと運用指示は完了したが、現在チャットの配置反映は未確認。

配置が保存されない原因はこの検証だけでは特定できない。アプリの整理ツールの書き込み・読み戻しが一致するか、後続の通常ターンで確認する。DBの直接編集や他チャットへのメッセージ送信は行っていない。

## 復元

restore-skills.shはSkillのインストールとCodex側リンクを復元する。共通AGENTS.mdの追記は、codex-chat-wrapup/references/global-instructions.mdのマーカーブロックを既存の指示を保持して追加する。同じブロックがある場合は重複追加しない。
