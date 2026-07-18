#!/usr/bin/env python3
"""Inventory completed PTCG games and prove postgame audit coverage."""

import argparse
import json
import sys
from pathlib import Path


def load_json(path):
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def inventory(root):
    games = {}
    errors = []
    for result_path in sorted(root.rglob("result.json")):
        game_id = result_path.parent.name
        try:
            result = load_json(result_path)
        except Exception as exc:
            errors.append(f"invalid result {result_path}: {exc}")
            continue
        trace_path = result_path.parent / "trace.jsonl"
        decisions = []
        if trace_path.exists():
            for line_no, raw in enumerate(trace_path.read_text(encoding="utf-8").splitlines(), 1):
                if not raw.strip():
                    continue
                try:
                    row = json.loads(raw)
                except Exception as exc:
                    errors.append(f"invalid trace {trace_path}:{line_no}: {exc}")
                    continue
                if row.get("external") is True:
                    step = row.get("step")
                    if step is None:
                        errors.append(f"missing external step {trace_path}:{line_no}")
                    else:
                        decisions.append(int(step))
        elif not result.get("error"):
            errors.append(f"missing trace {trace_path}")
        games[game_id] = {
            "outcome": result.get("outcome") or ("error" if result.get("error") else "unknown"),
            "result": str(result_path),
            "trace": str(trace_path),
            "external_steps": sorted(set(decisions)),
        }
    return games, errors


def load_audit(path):
    game_records = set()
    decision_records = set()
    errors = []
    for line_no, raw in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not raw.strip():
            continue
        try:
            row = json.loads(raw)
        except Exception as exc:
            errors.append(f"invalid audit {path}:{line_no}: {exc}")
            continue
        kind = row.get("record_type")
        game_id = row.get("game_id")
        if kind == "game" and game_id and row.get("audited") is True:
            game_records.add(str(game_id))
        elif kind == "decision" and game_id is not None and row.get("step") is not None:
            decision_records.add((str(game_id), int(row["step"])))
        else:
            errors.append(f"unrecognized audit record {path}:{line_no}")
    return game_records, decision_records, errors


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("root", type=Path)
    ap.add_argument("--audit", type=Path)
    args = ap.parse_args(argv)

    games, errors = inventory(args.root)
    expected_games = set(games)
    expected_decisions = {
        (game_id, step)
        for game_id, game in games.items()
        for step in game["external_steps"]
    }
    audited_games = set()
    audited_decisions = set()
    if args.audit:
        if not args.audit.exists():
            errors.append(f"missing audit {args.audit}")
        else:
            audited_games, audited_decisions, audit_errors = load_audit(args.audit)
            errors.extend(audit_errors)

    pending_games = sorted(expected_games - audited_games) if args.audit else sorted(expected_games)
    pending_decisions = sorted(expected_decisions - audited_decisions) if args.audit else sorted(expected_decisions)
    extra_games = sorted(audited_games - expected_games)
    extra_decisions = sorted(audited_decisions - expected_decisions)
    report = {
        "complete": bool(args.audit) and not errors and not pending_games and not pending_decisions,
        "completed_games": len(expected_games),
        "external_decisions": len(expected_decisions),
        "audited_games": len(audited_games),
        "audited_decisions": len(audited_decisions),
        "pending_games": pending_games,
        "pending_decisions": [{"game_id": g, "step": s} for g, s in pending_decisions],
        "extra_games": extra_games,
        "extra_decisions": [{"game_id": g, "step": s} for g, s in extra_decisions],
        "errors": errors,
        "games": games,
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if errors:
        return 2
    if args.audit and not report["complete"]:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
