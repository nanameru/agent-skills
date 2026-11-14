# 共通 AGENTS の Security 2.0 選択ルール

`security-2.0-selection.patch` は、共通 AGENTS の「GitHub・テスト管理」の末尾へ承認済みの選択ルール1段落を追加する。全文や旧版は含まない。適用は自動化されておらず、この作業では実機へ再適用しない。

## 限定復元手順

将来の復元は権限と適用対象を確認したうえで行う。対象は `~/.agents/AGENTS.md` の実体だけ。ハーネス側リンクを置換せず、実体の他設定を保持する。以下はリポジトリのルートから、private な一時ディレクトリで作業する例。バックアップと作業コピーは Git に入れない。`TARGET` は実体へのリンクを解決した結果であり、解決先やファイル種別に疑問があれば停止する。

```bash
PATCH="$PWD/config/common-agents/security-2.0-selection.patch"
TARGET="$(python3 -c 'import os; print(os.path.realpath(os.path.expanduser("~/.agents/AGENTS.md")))')"
WORK="$(mktemp -d)"
chmod 700 "$WORK"
test -f "$TARGET" && test ! -L "$TARGET" || { echo '対象を確認できません'; exit 1; }
cp -p "$TARGET" "$WORK/AGENTS.before"
cp -p "$TARGET" "$WORK/AGENTS.md"
```

1. patch の `+` 行（`+++` を除く）の選択ルールを正確な1段落として、作業コピーの段落と完全一致で比較する。同じ Security 2.0 選択ルールの一部・別表現・重複があれば、完全一致の有無にかかわらず部分適用または曖昧な状態として停止する。そうした問題がなく、一致が正しい位置に1回だけあれば既適用として終了する。2回以上なら停止する。対象の「GitHub・テスト管理」と次の「本人と直接話すとき」見出しがそれぞれ一度だけ存在し、挿入位置がその境界であることを確認する。見出しや文脈が違う場合も停止する。目視確認には秘密情報を外へ出さない環境を使う。
完全一致の件数は次のコマンドで確認できる。これは部分適用・別表現や位置の目視確認を代替しない。

```bash
python3 - "$PATCH" "$WORK/AGENTS.md" <<'PYCODE'
import pathlib, sys
patch, target = (pathlib.Path(p).read_text() for p in sys.argv[1:])
paragraphs = [line[1:] for line in patch.splitlines() if line.startswith('+') and not line.startswith('+++') and len(line) > 1]
if len(paragraphs) != 1:
    raise SystemExit('patch の段落が曖昧です')
lines = target.splitlines()
count = lines.count(paragraphs[0])
print('完全一致した段落数:', count)
if count > 1 or any('Security 2.0' in line and line != paragraphs[0] for line in lines):
    raise SystemExit('重複・部分適用・別表現の可能性があるため停止します')
PYCODE
```

2. 完全一致0回かつ部分適用・曖昧さがない場合のみ、作業コピーに適用する。`git apply --check` が失敗したら停止し、強制適用しない。

```bash
(cd "$WORK" && git apply --check "$PATCH" && git apply "$PATCH")
```

3. 作業コピーと `AGENTS.before` の差分を確認し、選択ルールの1段落と区切りの空行以外に変化がないこと、段落が正確に1回だけ存在することを確認する。確認前後に実体またはリンクが変わった場合は停止し、最初から対象を確認する。
4. 実体への復元が別途承認された場合に限り、直前に実体が `AGENTS.before` と一致しリンクの解決先も変化していないことを再確認して、作業コピーの内容を実体へ書き戻す。リネームや `cp` でリンクを上書きしない。適用後に実体の内容とリンクを読み戻し、1段落だけの差分と他設定の保持を確認する。競合や不一致があれば停止し、バックアップは private なまま保持する。

## 配布 Skill の原本との差分と依存

`autonomous-dev` の3ファイルは原本を全文読み、次の privacy 一般化だけを行った。Security 2.0 の選択段落、実行条件、固定 SHA、`normal`、脅威モデル名による選択、予算・権限・既存 scan 状態・secret 非表示・実行承認は保持する。

- `SKILL.md`「担当を立てる」: 試行事例のリポジトリ固有名を「あるリポジトリ」に変更。
- `SKILL.md`「セキュリティのスキャン」: プロファイル固有名を `<SECURITY_THREAT_MODEL_NAME>` に、鍵ファイルと組織 ID の取得元をそれぞれ `DEVIN_API_KEY_FILE` と `DEVIN_ORG_ID` に一般化。実行前に正しい値を環境へ設定し、値を表示・記録しない。
- `SKILL.md`「成果物を見る」・「見える化」: ローカル URL と個別プロジェクトの canvas ツールパスを用途別 placeholder に変更。
- `verified-facts.md`「確かめたこと」: ローカルプレビュー URL を placeholder に変更。`routing.md` は変更なし。

必須の外部 Skill 参照は `github-issue-driven-dev/SKILL.md`、`grilling/SKILL.md`、`requirements-kickoff/SKILL.md` および `requirements-kickoff/references/canvas.md`。いずれも標準 Skill 置き場に実在を確認したが、この登録には含めない。`routing.md` と `verified-facts.md` は同じディレクトリに含める。manifest の `install: false` により通常の restore では導入されない。
