---
name: ai-company-ads-plan
description: dom-to-pptxのPostHog集計とGit変更履歴をPIIなしで収集し、taiyo-gyomuのAI Companyへads.plan依頼を渡してCampaign Operations案とGrowth Finance検証を作る。任意のCodexタスクからの`$ai-company-ads-plan`、AI Companyへの広告計画依頼、「広告を回して」「広告案を作って」、PostHogを使った集客分析、fixtureまたはread-only dry runを依頼された時に使う。
---

# AI Company Ads Plan

dom-to-pptxでアプリ固有の証拠を収集し、taiyo-gyomuで広告案と経済性を検証する。実広告操作は行わない。

## 実行モードを決める

- 「試す」「一回やる」「fixture」「テスト」または指定なしならfixture dry runを使う。
- 実PostHogは、ユーザーが明示し、rotation済みread-only keyが設定されている時だけ使う。
- モードが曖昧ならfixtureを選ぶ。liveへ推測で進まない。

## 開始前

1. runnerでdom-to-pptxとtaiyo-gyomuを解決する。
2. 解決した各repositoryの`AGENTS.md`を読む。
3. dom-to-pptxの`docs/operations/ai-company-control-center.md`を読む。
4. 対象が見つからない、または候補が複数なら`blocked`結果と必要な環境変数名だけを示す。

runnerは`DOM_TO_PPTX_REPO`、`TAIYO_GYOMU_REPO`、現在地、標準checkout、Codex worktreeの順に安全な候補を探す。secret値は表示しない。

## Fixture dry run

任意のディレクトリから実行する。

```bash
python3 "${CODEX_HOME:-$HOME/.codex}/skills/ai-company-ads-plan/scripts/run_ads_plan.py"
```

明示的なrepository pathが必要な場合だけ指定する。

```bash
python3 "${CODEX_HOME:-$HOME/.codex}/skills/ai-company-ads-plan/scripts/run_ads_plan.py" \
  --dom-repo /absolute/path/to/dom-to-pptx \
  --taiyo-repo /absolute/path/to/taiyo-gyomu
```

fixtureは合成値であり、実績として報告しない。

## Live read-only dry run

ユーザーがliveを明示した時だけ`--mode live`を使う。次の環境変数名がすべて設定済みかだけを確認し、値を表示しない。

- `DOM_TO_PPTX_POSTHOG_PROJECT_ID`
- `DOM_TO_PPTX_POSTHOG_PERSONAL_API_KEY`
- `DOM_TO_PPTX_POSTHOG_KEY_ROTATED_AT`

```bash
python3 "${CODEX_HOME:-$HOME/.codex}/skills/ai-company-ads-plan/scripts/run_ads_plan.py" --mode live
```

不足時はrunnerの`blocked`結果をそのまま要約する。旧keyの再利用、key作成、rotation、権限変更を代行しない。

## 結果を確認する

最低限、次を確認して報告する。

- `evidence_summary.repository`が`nanameru/dom-to-pptx-ai`
- Product Growth Snapshotがaggregate-onlyかつ`contains_pii: false`
- Campaign OperationsとGrowth Financeのownerが重複していない
- CPA、CAC、粗利LTV、LTV/CAC、回収期間のchecker状態
- `human_approval.status`が`pending`
- `executed_write_actions`が空
- advertising write、OAuth/token、権限、deploy、mergeがすべて未実行
- 一時requestが削除され、raw PostHog responseが保存されていない

実数、顧客情報、広告アカウントID、secret、Git author/email、diff本文をGitHubや回答へ記録しない。

## Hard stops

次は実行せず、人間承認前で停止する。

- campaign、ad set、ad、creativeの作成・公開・停止・再開・削除
- budget、bid、targeting、schedule、statusの変更
- OAuth、token生成、secret、権限、課金の変更
- customer list、個人データ、raw eventの送信
- merge、deploy、release

「広告を回して」は`ads.plan`の依頼として扱い、広告writeの承認とは扱わない。
