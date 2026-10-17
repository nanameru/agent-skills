import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { parse, stringify } from "yaml";

const cli = process.env.TEST_BOARD_CLI || fileURLToPath(new URL("./test-board.mjs", import.meta.url));
const layers = ["unit", "integration", "system", "e2e", "security", "regression"];

function fixture(t, board) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "test-board-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(root, "test.mjs"), "// fixture\n");
  const boardFile = path.join(root, "test-board.yaml");
  fs.writeFileSync(boardFile, typeof board === "string" ? board : stringify(board));
  return {
    root,
    boardFile,
    run: (...args) => spawnSync(process.execPath, [cli, ...args, "--board", boardFile], { cwd: root, encoding: "utf8" }),
  };
}

function completeCases() {
  return layers.map((type, i) => ({ id: `TC-${i + 1}`, type, status: "done", issues: [31], test_file: "test.mjs" }));
}

test("block source/test arrays survive impact and all test paths are emitted", (t) => {
  const f = fixture(t, `cases:
  - id: TC-759
    source:
      - src/checkout/route.ts
      - src/other.ts
    test_file:
      - first.test.ts
      - second.test.ts
    issues: [31]
`);
  const result = f.run("impact", "--files", "src/checkout/route.ts");
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /matched_cases=1/);
  assert.match(result.stdout, /- first.test.ts\n- second.test.ts/);
  assert.doesNotMatch(result.stdout, /\[object Object\]/);
  assert.match(f.run("impact", "--files", "second.test.ts").stdout, /matched_cases=1/);
});

test("flow paths with comma/hash and non-id-first mappings are preserved", (t) => {
  const f = fixture(t, 'cases:\n  - title: "Hello # world"\n    id: TC-1\n    source: ["src/a,b.ts", "src/hash#file.ts"]\n    issues: [31]\n');
  assert.match(f.run("impact", "--files", "src/a,b.ts").stdout, /matched_cases=1/);
  assert.match(f.run("impact", "--files", "src/hash#file.ts").stdout, /Hello # world/);
});

test("singular and plural Issue links are combined and deduplicated", (t) => {
  const f = fixture(t, { cases: [{ id: "TC-1", issue: 31, issues: [32, "#31"] }] });
  assert.match(f.run("issue", "--issue", "#31").stdout, /matched_cases=1/);
  assert.match(f.run("issue", "--issue", "32").stdout, /issues=#32,#31/);
  assert.doesNotMatch(f.run("gaps").stdout, /cases without linked issues/);
});

test("folded/literal scalars, anchors and arbitrary indentation use YAML semantics", (t) => {
  const f = fixture(t, `cases:
 - id: TC-1
   title: >-
     first line
     second line
   source: &paths
     - src/one.ts
   notes: |
     # retained text
   e2e:
     steps:
       - click: button
 - id: TC-2
   source: *paths
`);
  const result = f.run("impact", "--files", "src/one.ts");
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /matched_cases=2/);
  assert.match(result.stdout, /first line second line/);
});

test("gaps checks active/blocked/unknown states without treating skip as unfinished", (t) => {
  const f = fixture(t, { cases: ["active", "blocked", "unknown", "skip"].map((status, i) => ({ id: `TC-${i}`, status, issues: [31] })) });
  const result = f.run("gaps");
  assert.match(result.stdout, /open cases without a real test on disk \(3\)/);
});

test("gaps checks every file in a test_file array and rejects a directory", (t) => {
  const cases = completeCases();
  cases[0].test_file = ["test.mjs", "missing.mjs"];
  cases[1].test_file = ".";
  const f = fixture(t, { cases });
  assert.match(f.run("gaps").stdout, /done but test_file missing on disk \(2\)/);
});

test("done with an empty test_file and unlinked cases are counted", (t) => {
  const cases = completeCases();
  delete cases[0].test_file;
  cases[1].test_file = [];
  delete cases[2].issues;
  const f = fixture(t, { cases });
  const result = f.run("gaps", "--strict");
  assert.equal(result.status, 1);
  assert.match(result.stdout, /done cases without a test_file \(2\)/);
  assert.match(result.stdout, /cases without linked issues: 1/);
  assert.match(result.stdout, /gap_findings=3/);
  assert.match(f.run("coverage").stdout, /done_without_test_file=2/);
});

test("system is included in declaration gaps, not inferred from e2e", (t) => {
  const f = fixture(t, { cases: completeCases().filter((c) => c.type !== "system") });
  const result = f.run("gaps", "--strict");
  assert.equal(result.status, 1);
  assert.match(result.stdout, /empty layers: system/);
});

test("gaps remains informational by default and strict is opt-in", (t) => {
  const f = fixture(t, { cases: [] });
  assert.equal(f.run("gaps").status, 0);
  assert.equal(f.run("gaps", "--strict").status, 1);
});

test("a populated inventory can pass strict without claiming runtime acceptance", (t) => {
  const f = fixture(t, { cases: completeCases() });
  const result = f.run("gaps", "--strict");
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /gap_findings=0/);
  assert.match(result.stdout, /test execution and acceptance evidence still require verification/);
});

for (const [name, yaml] of [
  ["malformed YAML", "cases: [\n"],
  ["duplicate YAML key", "cases: []\ncases: []\n"],
  ["non-list cases", "cases: {}\n"],
  ["case without id", "cases: [{}]\n"],
  ["duplicate id", "cases: [{id: TC-1}, {id: TC-1}]\n"],
  ["object-valued source", "cases: [{id: TC-1, source: {file: src/a.ts}}]\n"],
  ["object-valued Issue", "cases: [{id: TC-1, issues: [{}]}]\n"],
]) {
  test(`rejects ${name} rather than silently reporting zero cases`, (t) => {
    const f = fixture(t, yaml);
    const result = f.run("once");
    assert.equal(result.status, 1);
    assert.match(result.stderr, /test-board:/);
    assert.doesNotMatch(result.stdout, /cases=0/);
  });
}

test("read commands do not mutate the board", (t) => {
  const f = fixture(t, { cases: completeCases() });
  const before = fs.readFileSync(f.boardFile, "utf8");
  for (const args of [["once"], ["coverage"], ["gaps"], ["impact", "--files", "test.mjs"], ["issue", "--issue", "31"], ["sync-github", "--issue", "31"]]) {
    assert.equal(f.run(...args).status, 0);
  }
  assert.equal(fs.readFileSync(f.boardFile, "utf8"), before);
});

test("plan-issue preview is read-only and apply adds to cases before later sections", (t) => {
  const f = fixture(t, '# keep comment\ncases: []\nmetadata:\n  note: keep\n');
  const args = ["plan-issue", "--issue", "31", "--source", "#fragment", "--feature", "true", "--scenario", "a: b"];
  const before = fs.readFileSync(f.boardFile, "utf8");
  assert.equal(f.run(...args).status, 0);
  assert.equal(fs.readFileSync(f.boardFile, "utf8"), before);
  const result = f.run(...args, "--apply");
  assert.equal(result.status, 0, result.stderr);
  const after = fs.readFileSync(f.boardFile, "utf8");
  const board = parse(after);
  assert.equal(board.cases.length, 1);
  assert.deepEqual(board.cases[0].source, ["#fragment"]);
  assert.equal(board.cases[0].feature, "true");
  assert.equal(board.metadata.note, "keep");
  assert.match(after, /# keep comment/);
});
