---
name: ptcg-postgame-audit
description: "Audit every completed Pokemon TCG AI game and every LLM decision after a match or batch, before starting more games or declaring results stable. Use whenever Codex runs or monitors PTCG matches; a game or batch finishes; the user asks 試合結果, 勝率, 進捗, 敗因, 全試合, 一手ずつ確認, リプレイ分析, 修正して, or whether every move was reviewed; or replay/result/trace artifacts are produced. Covers wins, losses, draws, retries, and data-quality failures rather than sampling only conspicuous losses."
---

# PTCG Postgame Audit

## Parent Skill

Before acting, read `~/.agents/skills/loop-engineering-core/SKILL.md` if it exists. If unavailable, continue and report that it was missing.

Treat postgame review as a required quality gate, not an optional follow-up. Do not start the next large collection batch or claim that play is stable while any completed game or external decision remains unaudited.

## Required artifacts

For a batch root containing per-game `result.json` and `trace.jsonl`, produce:

- `postgame_audit.jsonl`: one `game` record per completed game and one `decision` record per `external=true` trace row.
- `postgame_summary.md`: matchup results, game-level causes, recurring decision defects, data defects, proposed invariants, tests, and rerun status.

Run the bundled coverage checker before and after auditing:

```bash
python3 scripts/audit_coverage.py <batch-root>
python3 scripts/audit_coverage.py <batch-root> --audit <batch-root>/postgame_audit.jsonl
```

The second command must exit 0. If it does not, report the exact pending games/steps and keep the audit gate open.

## Workflow

### 1. Freeze the batch

- Record the batch root, commit/version, model, opponent allocation, concurrency, start/end time, retries, and fallback count.
- Enumerate results from artifacts, not process expectations. Retry overshoot counts as a real completed game and must be audited.
- Include wins, losses, draws, accidents, aborted/error games, and inconsistent result/replay labels.

### 2. Audit every game from the first decision

For each game, walk all `external=true` trace rows in ascending step order. Do not sample only attacks, losses, or surprising moves.

For every decision record:

1. Freeze the pre-action observation and public information.
2. List the chosen option and all meaningful legal alternatives.
3. Compare saved `reason`, `plan`, ranking, and claimed card effects with the exact glossary/card text.
4. Follow the choice into the next observation and verify the claimed immediate result.
5. Check resources, evolution timing, energy colors, Bench space, Stadium, Ability windows, prize map, board-out risk, opponent response, and two-to-three-action continuation.
6. Classify the choice as `correct`, `reasonable`, `questionable`, `error`, or `data_defect`.
7. Record evidence and a better line for `questionable`/`error`; do not invent hidden cards or numeric win rates.

Use this JSONL shape:

```json
{"record_type":"decision","game_id":"g1","step":15,"verdict":"error","chosen":[1],"alternatives":[0],"evidence":"Bench 0; END loses to visible 70 damage","invariant":"Avoid next-turn board-out before valuing two-prize liability"}
```

Add one game record after its last decision:

```json
{"record_type":"game","game_id":"g1","outcome":"loss","audited":true,"primary_causes":["board-out"],"variance":["no evolution draw"]}
```

### 3. Separate causes

For each game, distinguish:

- decision error: a better legal line was available from known information;
- execution/reason mismatch: the selected option did not implement the stated plan;
- card/rule hallucination: reasoning contradicted exact text or legality;
- data defect: result, prize, trace, replay, or labeling was wrong;
- matchup/strategy weakness: repeated valid decisions still produced a structural disadvantage;
- variance: prizes/draws constrained all meaningful lines.

Do not describe every loss as a misplay or every win as correct play.

### 4. Fix transferable defects

When the user asks for improvement or the running task includes implementation:

1. Write a failing regression from the exact state first.
2. State a generic behavioral invariant.
3. Prefer exact facts, prompt audits, state features, or learned scoring over opponent-name hardcoding.
4. Do not mechanically overwrite an LLM choice unless enforcing legality or an explicitly authorized safety rule.
5. Run focused tests, then the relevant test-board case.
6. Rerun a small isolated batch against affected and control matchups.
7. Audit every rerun game with this Skill again.

### 5. Close the gate

Close the audit only when all are true:

- completed result count equals audited `game` record count;
- every external `(game_id, step)` has exactly one audited `decision` record;
- missing/corrupt traces are reported and resolved or explicitly blocked;
- all proposed fixes have regression evidence or are clearly marked analysis-only;
- rerun results are not called stable from a tiny sample;
- GitHub Issue/test-board knowledge logs contain the findings and commands.

If any item fails, do not start the next large batch. A small diagnostic rerun is allowed only when needed to complete the audit.

## Evidence order

1. `result.json`, exact `trace.jsonl`, and replay steps.
2. Engine state, legal options, card glossary, and deck list.
3. Screenshot for visible confirmation.
4. Official/current rules or card sources when local exact text is absent.
5. Competitive videos/articles as strategic context, not proof of the position.

Use `rg` to locate artifacts and the bundled checker to prove coverage.
