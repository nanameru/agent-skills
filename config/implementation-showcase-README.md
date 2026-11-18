# implementation-showcase の配布

Skill 本体は `implementation-showcase/` に収録し、`managed-skills.json` と `restore-skills.sh` に登録する。共通 AGENTS の追加節は `common-agents/implementation-showcase.patch` に記録する。配布・installed の変更には別途承認が必要。

配布後は Skill 本体の全ファイルを installed と比較し、共通 AGENTS の該当節と `autonomous-dev/SKILL.md` の追加行を照合する。ハーネス側のリンクは既存の実体と解決先を確認し、勝手に置き換えない。共通 AGENTS のパッチは文脈行を含まないため、作業コピーで `git apply --unidiff-zero --check` を実行し、対象行と適用前後の差分を照合する。
