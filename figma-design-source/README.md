# Figma Design Source の公開範囲と確認

配布版はinstalled版と全文一致しない。今回採用したのはdescriptionと冒頭の適用条件の一般化、モード判定文の限定、OpenAI metadataの変更に限る。後発のゲート、ブランド／Cover、library参照、機能ページ、遷移・Overlay、アイコン、表示言語、配置監査、コンポーネント化ループなどの手順・参照・補助ファイルは未同期。旧PRの残りの手順を維持する。

## TC-015-01: 限定確認手順

1. `SKILL.md` のdescriptionと冒頭、モード判定を読み、Figmaを明示指定した案件に限定され、通常のUI作業にFigma工程を要求しないことを確認する。
2. 旧PRの `SKILL.md` と比較し、上記以外の手順が保たれていることを確認する。案件固有の情報や端末固有のパスを公開していないことを確認する。
3. `agents/openai.yaml` の説明とプロンプトが明示指定を条件とし、プロンプトに `$figma-design-source` を含むことを確認する。
4. `managed-skills.json` と `restore-skills.sh` にFigmaの登録と両リンクがあり、既存の登録とリンクが保たれていることを確認する。実復元は行わない。
