#!/usr/bin/env python3
import json
import tempfile
import unittest
from pathlib import Path

import audit_coverage as ac


class AuditCoverageTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        game = self.root / "g1"
        game.mkdir()
        (game / "result.json").write_text(json.dumps({"outcome": "loss"}), encoding="utf-8")
        rows = [
            {"game_id": "g1", "step": 3, "external": True},
            {"game_id": "g1", "step": 4, "external": False},
            {"game_id": "g1", "step": 7, "external": True},
        ]
        (game / "trace.jsonl").write_text(
            "\n".join(json.dumps(r) for r in rows) + "\n", encoding="utf-8"
        )

    def tearDown(self):
        self.tmp.cleanup()

    def test_inventory_counts_every_external_step(self):
        games, errors = ac.inventory(self.root)
        self.assertEqual(errors, [])
        self.assertEqual(games["g1"]["external_steps"], [3, 7])

    def test_complete_audit_passes(self):
        audit = self.root / "audit.jsonl"
        audit.write_text("\n".join([
            json.dumps({"record_type": "decision", "game_id": "g1", "step": 3}),
            json.dumps({"record_type": "decision", "game_id": "g1", "step": 7}),
            json.dumps({"record_type": "game", "game_id": "g1", "audited": True}),
        ]) + "\n", encoding="utf-8")
        self.assertEqual(ac.main([str(self.root), "--audit", str(audit)]), 0)

    def test_missing_decision_keeps_gate_open(self):
        audit = self.root / "audit.jsonl"
        audit.write_text(
            json.dumps({"record_type": "game", "game_id": "g1", "audited": True}) + "\n",
            encoding="utf-8",
        )
        self.assertEqual(ac.main([str(self.root), "--audit", str(audit)]), 1)


if __name__ == "__main__":
    unittest.main()
