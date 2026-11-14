import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const cli = fileURLToPath(new URL("../bin/test-board", import.meta.url));

// These temporary files are synthetic test-file references, not test results.
function fixture(t, board, files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ledger-cli-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const root = path.join(dir, "root");
  fs.mkdirSync(root);
  for (const file of files) {
    const target = path.join(root, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, "// Synthetic test file for CLI integration.\n");
  }
  const boardPath = path.join(dir, "test-board.yaml");
  fs.writeFileSync(boardPath, board);
  return { boardPath, root };
}

function runCli({ boardPath, root }, ...args) {
  const result = spawnSync(cli, [...args, "--board", boardPath], {
    cwd: root,
    encoding: "utf8",
  });
  assert.ifError(result.error);
  assert.equal(result.signal, null);
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}

function caseIds(output) {
  return [...output.matchAll(/^- (CASE-[A-Z0-9-]+) \[/gm)].map((match) => match[1]);
}

function testsToRun(output) {
  const section = output.split("\ntests_to_run:\n")[1];
  assert.ok(section, "expected tests_to_run in CLI output");
  return section.split("\n\n")[0].split("\n").filter(Boolean).map((line) => {
    assert.match(line, /^- /);
    return line.slice(2);
  });
}

const tracingBoard = `version: 1
cases:
  - id: CASE-AUTH
    title: Auth directory
    status: done
    type: integration
    source: [src/auth]
    test_file: tests/auth.test.mjs
    issues: [48, 148]
  - id: CASE-AUTHENTICATION
    title: Authentication sibling
    status: done
    type: integration
    source: [src/authentication]
    test_file: tests/authentication.test.mjs
    issues: [148]
  - id: CASE-BILLING
    title: Billing file
    status: done
    type: integration
    source: [src/billing/charge.mjs]
    test_file: tests/billing.test.mjs
    issues: [53, 48]
`;

const tracingFiles = [
  "tests/auth.test.mjs",
  "tests/authentication.test.mjs",
  "tests/billing.test.mjs",
];

test("issue selects whole issue numbers 48 and 148 and returns their test files", (t) => {
  const board = fixture(t, tracingBoard, tracingFiles);

  const issue48 = runCli(board, "issue", "--issue", "#48");
  assert.match(issue48, /^issue=#48$/m);
  assert.match(issue48, /^matched_cases=2$/m);
  assert.deepEqual(caseIds(issue48), ["CASE-AUTH", "CASE-BILLING"]);
  assert.deepEqual(testsToRun(issue48), ["tests/auth.test.mjs", "tests/billing.test.mjs"]);

  const issue148 = runCli(board, "issue", "--issue", "148");
  assert.match(issue148, /^issue=#148$/m);
  assert.match(issue148, /^matched_cases=2$/m);
  assert.deepEqual(caseIds(issue148), ["CASE-AUTH", "CASE-AUTHENTICATION"]);
  assert.deepEqual(testsToRun(issue148), ["tests/auth.test.mjs", "tests/authentication.test.mjs"]);
});

test("impact matches source directory descendants and ancestors without matching sibling prefixes", (t) => {
  const board = fixture(t, tracingBoard, tracingFiles);

  const auth = runCli(board, "impact", "--files", "./src/auth/session.mjs");
  assert.match(auth, /^matched_cases=1$/m);
  assert.deepEqual(caseIds(auth), ["CASE-AUTH"]);
  assert.deepEqual(testsToRun(auth), ["tests/auth.test.mjs"]);

  const sibling = runCli(board, "impact", "--files", "src/authentication/session.mjs");
  assert.match(sibling, /^matched_cases=1$/m);
  assert.deepEqual(caseIds(sibling), ["CASE-AUTHENTICATION"]);
  assert.deepEqual(testsToRun(sibling), ["tests/authentication.test.mjs"]);

  const ancestor = runCli(board, "impact", "--files", "src");
  assert.match(ancestor, /^matched_cases=3$/m);
  assert.deepEqual(caseIds(ancestor), ["CASE-AUTH", "CASE-AUTHENTICATION", "CASE-BILLING"]);
  assert.deepEqual(testsToRun(ancestor), tracingFiles);
});

test("impact traces an exact test_file and deduplicates related issues across matched cases", (t) => {
  const board = fixture(t, tracingBoard, tracingFiles);

  const testFile = runCli(board, "impact", "--files", "./tests/billing.test.mjs");
  assert.match(testFile, /^matched_cases=1$/m);
  assert.deepEqual(caseIds(testFile), ["CASE-BILLING"]);
  assert.deepEqual(testsToRun(testFile), ["tests/billing.test.mjs"]);
  assert.match(testFile, /^regression_risk_issues=#53, #48$/m);

  const otherFile = runCli(board, "impact", "--files", "tests/billing.test.mjs.bak");
  assert.match(otherFile, /^matched_cases=0$/m);
  assert.deepEqual(caseIds(otherFile), []);
  assert.doesNotMatch(otherFile, /tests_to_run:/);

  const combined = runCli(board, "impact", "--files", "src/auth/session.mjs", "tests/billing.test.mjs");
  assert.match(combined, /^matched_cases=2$/m);
  assert.deepEqual(caseIds(combined), ["CASE-AUTH", "CASE-BILLING"]);
  assert.deepEqual(testsToRun(combined), ["tests/auth.test.mjs", "tests/billing.test.mjs"]);
  assert.match(combined, /^regression_risk_issues=#48, #148, #53$/m);
});

test("gaps distinguishes todo and done for nonempty test_file paths missing on disk", (t) => {
  // Scope: nonempty paths only. A done case with an empty test_file is not covered here.
  const board = fixture(t, `version: 1
cases:
  - id: CASE-TODO-MISSING
    title: Planned test missing
    status: todo
    type: integration
    test_file: tests/todo-missing.test.mjs
    issues: [48]
  - id: CASE-DONE-MISSING
    title: Claimed test missing
    status: done
    type: integration
    test_file: tests/done-missing.test.mjs
    issues: [48]
  - id: CASE-TODO-PRESENT
    title: Planned test present
    status: todo
    type: integration
    test_file: tests/todo-present.test.mjs
    issues: [48]
  - id: CASE-DONE-PRESENT
    title: Completed test present
    status: done
    type: integration
    test_file: tests/done-present.test.mjs
    issues: [48]
`, ["tests/todo-present.test.mjs", "tests/done-present.test.mjs"]);

  const output = runCli(board, "gaps", "--root", board.root);
  const open = output.match(/open cases without a real test on disk \(1\):\n([\s\S]*?)(?=\n\n|$)/);
  const lying = output.match(/LYING BOARD — done but test_file missing on disk \(1\):\n([\s\S]*?)(?=\n\n|$)/);
  assert.ok(open, "expected one open case with a missing test file");
  assert.ok(lying, "expected one done case with a missing test file");
  assert.deepEqual(caseIds(open[1]), ["CASE-TODO-MISSING"]);
  assert.deepEqual(caseIds(lying[1]), ["CASE-DONE-MISSING"]);
  assert.doesNotMatch(output, /CASE-TODO-PRESENT|CASE-DONE-PRESENT/);
});
