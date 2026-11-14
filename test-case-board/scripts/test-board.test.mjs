import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const cliPath = fileURLToPath(new URL("./test-board.mjs", import.meta.url));

function runGaps(type, lastRun = "") {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "test-board-gaps-"));
  const boardPath = path.join(root, "test-board.yaml");
  fs.writeFileSync(
    boardPath,
    `version: 1
cases:
  - id: TC-001
    title: "Evidence check"
    status: done
    type: ${type}
    issues: [43]
${lastRun}`,
  );

  try {
    return spawnSync(
      process.execPath,
      [cliPath, "gaps", "--board", boardPath, "--root", root],
      { encoding: "utf8" },
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test("reports an e2e done case without last_run", () => {
  const result = runGaps("e2e");

  assert.equal(result.status, 0);
  assert.match(result.stdout, /done_without_run_evidence \(1\):/);
  assert.match(result.stdout, /TC-001 \[done\]/);
});

test("does not report an e2e done case with run evidence", () => {
  const result = runGaps(
    "e2e",
    `    last_run:
      revision: abc123
      at: "2026-06-12T00:00:00Z"
      provider: devin-local-playwright
      result: passed
      evidence: [.e2e/TC-001/run-1/results.json]
`,
  );

  assert.equal(result.status, 0);
  assert.doesNotMatch(result.stdout, /done_without_run_evidence/);
});

test("does not report a unit done case without last_run", () => {
  const result = runGaps("unit");

  assert.equal(result.status, 0);
  assert.doesNotMatch(result.stdout, /done_without_run_evidence/);
});

test("reports a security done case without run evidence", () => {
  const result = runGaps("security", `    last_run:\n      result: passed\n`);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /done_without_run_evidence \(1\):/);
});
