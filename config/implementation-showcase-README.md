# implementation-showcase の追加差分

`implementation-showcase.patch` は、未マージの PR #34 にある Skill の追加変更を記録する。main には Skill 本体がまだないため、このパッチだけでは通常の restore で導入されない。PR #34 と統合する際は、その時点の本文とこの差分を照合する。別の未配布変更は含まない。

配布後の確認は、対象ファイルのバックアップを private な場所に取り、差分を目視してから行う。共通 AGENTS は実体の該当節、`autonomous-dev/SKILL.md` は「成果物を見る」の追加行、`implementation-showcase` は二つの対象ファイルを installed 側と比較する。全文比較で別の未配布変更が出た場合は対象箇所を個別に比較し、全ファイルが一致したとは報告しない。ハーネス側のリンクの解決先とリンク自体も確認する。インストールやパッチの適用には別途承認が必要。
