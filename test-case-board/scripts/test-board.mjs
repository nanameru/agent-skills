#!/usr/bin/env node
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseDocument } from "yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function usage(code = 0) {
  const text = `Usage:
  test-board once --board test-board.yaml
  test-board impact --board test-board.yaml --files src/a.ts src/b.ts
  test-board issue --board test-board.yaml --issue 123
  test-board coverage --board test-board.yaml
  test-board gaps --board test-board.yaml [--root .] [--strict]
  test-board plan-issue --board test-board.yaml --issue 123 --source src/a.ts --feature "feature" --scenario "scenario" [--apply]
  test-board sync-github --board test-board.yaml --issue 123 [--apply]
  test-board serve --board test-board.yaml [--root .] [--port 41800]
`;
  console.log(text);
  process.exit(code);
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      out._.push(arg);
      continue;
    }
    const eq = arg.indexOf("=");
    if (eq !== -1) {
      out[arg.slice(2, eq)] = arg.slice(eq + 1);
      continue;
    }
    const key = arg.slice(2);
    if (key === "apply" || key === "open" || key === "strict") {
      out[key] = true;
      continue;
    }
    const values = [];
    while (i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
      values.push(argv[++i]);
    }
    out[key] = values.length <= 1 ? values[0] : values;
  }
  return out;
}

function parseBoard(boardPath) {
  const abs = path.resolve(boardPath);
  const text = fs.readFileSync(abs, "utf8");
  const document = parseDocument(text);
  if (document.errors.length) throw new Error(`invalid YAML: ${document.errors[0].message}`);
  const data = document.toJS({ maxAliasCount: 100 });
  if (!data || typeof data !== "object" || Array.isArray(data) || !Array.isArray(data.cases)) {
    throw new Error("board must be a mapping with a cases array");
  }
  const ids = new Set();
  for (const c of data.cases) {
    if (!c || typeof c !== "object" || typeof c.id !== "string" || !c.id.trim()) {
      throw new Error("every case must have a nonempty string id");
    }
    if (ids.has(c.id)) throw new Error(`duplicate case id: ${c.id}`);
    ids.add(c.id);
    for (const field of ["source", "test_file"]) {
      if (asArray(c[field]).some((value) => typeof value !== "string" || !value.trim())) {
        throw new Error(`${c.id}: ${field} must contain nonempty paths`);
      }
    }
    for (const field of ["issue", "issues"]) {
      if (asArray(c[field]).some((value) => !/^#?\d+$/.test(String(value).trim()))) {
        throw new Error(`${c.id}: ${field} must contain issue numbers`);
      }
    }
  }
  return { ...data, path: abs, text, document, project: data.project || {}, cases: data.cases };
}

function boardPath(args) {
  return args.board || "test-board.yaml";
}

function statusCounts(cases) {
  const counts = {};
  for (const c of cases) counts[c.status || "unknown"] = (counts[c.status || "unknown"] || 0) + 1;
  return counts;
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === "") return [];
  return [value];
}

function caseIssues(c) {
  return [...new Set([...asArray(c.issues), ...asArray(c.issue)]
    .map((value) => String(value).trim().replace(/^#/, "")))];
}

function testPaths(c) {
  return asArray(c.test_file);
}

function isTestFile(root, file) {
  try {
    return fs.statSync(path.resolve(root, file)).isFile();
  } catch {
    return false;
  }
}

function sourceMatches(c, file) {
  const normalized = file.replace(/^\.\//, "");
  return asArray(c.source).some((src) => {
    const s = String(src).replace(/^\.\//, "");
    return normalized === s || normalized.startsWith(`${s}/`) || s.startsWith(`${normalized}/`);
  }) || testPaths(c).some((test) => test.replace(/^\.\//, "") === normalized);
}

function printCases(cases) {
  for (const c of cases) {
    const issues = caseIssues(c);
    const suffix = issues.length ? ` issues=#${issues.join(",#")}` : "";
    console.log(`- ${c.id} [${c.status || "unknown"}] ${c.title || ""} (${c.type || "?"}/${c.priority || "?"})${suffix}`);
    if (testPaths(c).length) console.log(`  test: ${testPaths(c).join(", ")}`);
    if (asArray(c.source).length) console.log(`  source: ${asArray(c.source).join(", ")}`);
  }
}

function cmdOnce(args) {
  const board = parseBoard(boardPath(args));
  const counts = statusCounts(board.cases);
  console.log(`board=${board.path}`);
  console.log(`project=${board.project.name || "(unknown)"}`);
  console.log(`cases=${board.cases.length}`);
  console.log(`status=${Object.entries(counts).map(([k, v]) => `${k}:${v}`).join(" ")}`);
  const todo = board.cases.filter((c) => c.status === "todo").slice(0, 10);
  if (todo.length) {
    console.log("\nnext todo:");
    printCases(todo);
  }
}

function cmdImpact(args) {
  const board = parseBoard(boardPath(args));
  const files = asArray(args.files);
  if (!files.length) throw new Error("--files is required");
  const matches = board.cases.filter((c) => files.some((f) => sourceMatches(c, f)));
  console.log(`changed=${files.join(", ")}`);
  console.log(`matched_cases=${matches.length}`);
  printCases(matches);
  const tests = [...new Set(matches.flatMap(testPaths))];
  if (tests.length) console.log(`\ntests_to_run:\n${tests.map((t) => `- ${t}`).join("\n")}`);
  const issues = [...new Set(matches.flatMap(caseIssues))];
  if (issues.length) console.log(`\nregression_risk_issues=${issues.map((n) => `#${n}`).join(", ")}`);
}

function cmdIssue(args) {
  const board = parseBoard(boardPath(args));
  if (!args.issue) throw new Error("--issue is required");
  const issue = String(args.issue).replace(/^#/, "");
  const matches = board.cases.filter((c) => caseIssues(c).includes(issue));
  console.log(`issue=#${issue}`);
  console.log(`matched_cases=${matches.length}`);
  printCases(matches);
  const tests = [...new Set(matches.flatMap(testPaths))];
  if (tests.length) console.log(`\ntests_to_run:\n${tests.map((t) => `- ${t}`).join("\n")}`);
}

function cmdCoverage(args) {
  const board = parseBoard(boardPath(args));
  const missingSource = board.cases.filter((c) => !asArray(c.source).length);
  const doneWithoutTest = board.cases.filter((c) => c.status === "done" && !testPaths(c).length);
  const e2e = board.cases.filter((c) => c.type === "e2e");
  console.log(`cases=${board.cases.length}`);
  console.log(`missing_source=${missingSource.length}`);
  console.log(`done_without_test_file=${doneWithoutTest.length}`);
  console.log(`e2e_cases=${e2e.length}`);
  if (missingSource.length) {
    console.log("\nmissing source:");
    printCases(missingSource.slice(0, 20));
  }
  if (doneWithoutTest.length) {
    console.log("\ndone without test_file:");
    printCases(doneWithoutTest.slice(0, 20));
  }
}

const LAYER_TYPES = ["unit", "integration", "system", "e2e", "security", "regression"];

function cmdGaps(args) {
  const board = parseBoard(boardPath(args));
  const root = path.resolve(args.root || path.dirname(board.path));

  const open = board.cases.filter((c) => !["done", "skip"].includes(c.status));
  const openUnwritten = open.filter(
    (c) => !testPaths(c).length || testPaths(c).some((file) => !isTestFile(root, file))
  );
  const doneWithoutTest = board.cases.filter((c) => c.status === "done" && !testPaths(c).length);
  // "Lying board": the case claims done with a test_file that does not exist.
  const doneMissingFile = board.cases.filter(
    (c) =>
      c.status === "done" &&
      testPaths(c).some((file) => !isTestFile(root, file))
  );
  const unlinked = board.cases.filter((c) => !caseIssues(c).length);

  const typeCounts = {};
  for (const c of board.cases) {
    const t = c.type || "unknown";
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  }
  const thinLayers = LAYER_TYPES.filter((t) => !(typeCounts[t] > 0));

  console.log(`board=${board.path}`);
  console.log(`root=${root}`);
  console.log(`cases=${board.cases.length}`);
  console.log(`types=${Object.entries(typeCounts).map(([k, v]) => `${k}:${v}`).join(" ")}`);

  let gapCount = 0;

  if (doneWithoutTest.length) {
    gapCount += doneWithoutTest.length;
    console.log(`\ndone cases without a test_file (${doneWithoutTest.length}):`);
    printCases(doneWithoutTest);
  }
  if (openUnwritten.length) {
    gapCount += openUnwritten.length;
    console.log(`\nopen cases without a real test on disk (${openUnwritten.length}):`);
    printCases(openUnwritten);
  }
  if (doneMissingFile.length) {
    gapCount += doneMissingFile.length;
    console.log(`\nLYING BOARD — done but test_file missing on disk (${doneMissingFile.length}):`);
    printCases(doneMissingFile);
  }
  if (thinLayers.length) {
    gapCount += thinLayers.length;
    console.log(`\nempty layers: ${thinLayers.join(", ")}`);
  }
  if (unlinked.length) {
    gapCount += unlinked.length;
    console.log(`\ncases without linked issues: ${unlinked.length} (${unlinked.map((c) => c.id).join(", ")})`);
  }

  console.log("");
  console.log(`gap_findings=${gapCount} (inventory only; not runtime acceptance)`);
  if (args.strict && gapCount) process.exitCode = 1;
  if (!gapCount) {
    console.log("no inventory gaps found; test execution and acceptance evidence still require verification");
    return;
  }
  console.log("suggested next actions:");
  if (openUnwritten.length) {
    console.log("- select one coherent gap outcome, verify its Issue, then write and run the real tests");
  }
  if (doneMissingFile.length) {
    console.log("- done cases with missing files are the worst kind of gap: restore the test or set the case back to todo");
  }
  if (thinLayers.includes("regression")) {
    console.log("- regression=0: reclassify bug-fix-derived cases to type: regression (keep their IDs)");
  }
  if (thinLayers.includes("integration")) {
    console.log("- integration=0: promote a mock-free test that crosses a real module boundary, or add one");
  }
}

function nextCaseId(cases) {
  let max = 0;
  for (const c of cases) {
    const m = String(c.id || "").match(/TC-(\d+)/i);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `TC-${String(max + 1).padStart(3, "0")}`;
}

function yamlString(value) {
  return JSON.stringify(String(value ?? ""));
}

function yamlList(values) {
  return `[${asArray(values).map(yamlString).join(", ")}]`;
}

function proposal(args, board) {
  if (!args.issue) throw new Error("--issue is required");
  const sources = asArray(args.source);
  if (!sources.length) throw new Error("--source is required");
  const feature = args.feature || "feature";
  const scenario = args.scenario || "主要シナリオ";
  const type = args.type || "regression";
  const id = nextCaseId(board.cases);
  return {
    id,
    title: `${feature}: ${scenario}`,
    feature,
    scenario,
    status: "todo",
    priority: args.priority || "medium",
    type,
    source: sources,
    test_file: args.test_file || "",
    issues: [String(args.issue).replace(/^#/, "")],
  };
}

function caseYaml(c) {
  return [
    `  - id: ${c.id}`,
    `    title: ${yamlString(c.title)}`,
    `    feature: ${yamlString(c.feature)}`,
    `    scenario: ${yamlString(c.scenario)}`,
    `    status: ${c.status}`,
    `    priority: ${c.priority}`,
    `    type: ${c.type}`,
    `    source: ${yamlList(c.source)}`,
    `    test_file: ${yamlString(c.test_file || "")}`,
    `    issues: ${yamlList(c.issues)}`,
  ].join("\n");
}

function cmdPlanIssue(args) {
  const board = parseBoard(boardPath(args));
  const c = proposal(args, board);
  console.log(caseYaml(c));
  if (args.apply) {
    board.document.get("cases").add(board.document.createNode(c));
    fs.writeFileSync(board.path, String(board.document));
    console.log(`\nappended=${c.id} board=${board.path}`);
  } else {
    console.log("\npreview only; rerun with --apply to append");
  }
}

function issueMarkdown(issue, cases) {
  const lines = [`## テストケース`, "", `Issue #${issue} に紐づく test-board ケースです。`, ""];
  if (!cases.length) lines.push("該当ケースはありません。");
  for (const c of cases) {
    lines.push(`- ${c.id} [${c.status || "unknown"}] ${c.title || ""}`);
    if (testPaths(c).length) lines.push(`  - test: ${testPaths(c).map((file) => `\`${file}\``).join(", ")}`);
    if (asArray(c.source).length) lines.push(`  - source: ${asArray(c.source).map((s) => `\`${s}\``).join(", ")}`);
  }
  return lines.join("\n");
}

function cmdSyncGithub(args) {
  const board = parseBoard(boardPath(args));
  if (!args.issue) throw new Error("--issue is required");
  const issue = String(args.issue).replace(/^#/, "");
  const cases = board.cases.filter((c) => caseIssues(c).includes(issue));
  const body = issueMarkdown(issue, cases);
  console.log(body);
  if (!args.apply) {
    console.log("\npreview only; rerun with --apply to post a GitHub Issue comment");
    return;
  }
  const result = spawnSync("gh", ["issue", "comment", issue, "--body", body], { encoding: "utf8" });
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout);
    process.exit(result.status || 1);
  }
  process.stdout.write(result.stdout);
}

function htmlEscape(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function renderHtml(board) {
  const rows = board.cases.map((c) => `<tr>
    <td>${htmlEscape(c.id)}</td>
    <td>${htmlEscape(c.status)}</td>
    <td>${htmlEscape(c.priority)}</td>
    <td>${htmlEscape(c.type)}</td>
    <td>${htmlEscape(c.feature)}</td>
    <td>${htmlEscape(c.title)}</td>
    <td>${htmlEscape(caseIssues(c).join(", "))}</td>
    <td>${htmlEscape(testPaths(c).join(", "))}</td>
  </tr>`).join("\n");
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>test-board</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;margin:24px;color:#111;background:#fafafa}
table{border-collapse:collapse;width:100%;background:white}
th,td{border:1px solid #ddd;padding:6px 8px;font-size:13px;text-align:left;vertical-align:top}
th{background:#f0f0f0;position:sticky;top:0}
.summary{margin-bottom:16px}
</style></head><body>
<div class="summary"><h1>${htmlEscape(board.project.name || "test-board")}</h1><p>${board.cases.length} cases</p></div>
<table><thead><tr><th>ID</th><th>Status</th><th>Priority</th><th>Type</th><th>Feature</th><th>Title</th><th>Issues</th><th>Test</th></tr></thead><tbody>${rows}</tbody></table>
</body></html>`;
}

function cmdServe(args) {
  const port = Number(args.port || 41800);
  const host = args.host || "127.0.0.1";
  const root = path.resolve(args.root || ".");
  const boardFile = path.resolve(root, boardPath(args));
  const server = http.createServer((req, res) => {
    try {
      if (req.url === "/api/cases") {
        const board = parseBoard(boardFile);
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ project: board.project, cases: board.cases }, null, 2));
        return;
      }
      const board = parseBoard(boardFile);
      res.setHeader("content-type", "text/html; charset=utf-8");
      res.end(renderHtml(board));
    } catch (e) {
      res.statusCode = 500;
      res.end(String(e.stack || e));
    }
  });
  server.listen(port, host, () => {
    console.log(`test-board: http://${host}:${port}/`);
    console.log(`board=${boardFile}`);
  });
}

const args = parseArgs(process.argv.slice(2));
const cmd = args._[0];

try {
  if (!cmd || cmd === "help" || cmd === "--help") usage(0);
  if (cmd === "once") cmdOnce(args);
  else if (cmd === "impact") cmdImpact(args);
  else if (cmd === "issue") cmdIssue(args);
  else if (cmd === "coverage") cmdCoverage(args);
  else if (cmd === "gaps") cmdGaps(args);
  else if (cmd === "plan-issue") cmdPlanIssue(args);
  else if (cmd === "sync-github") cmdSyncGithub(args);
  else if (cmd === "serve") cmdServe(args);
  else usage(1);
} catch (error) {
  console.error(`test-board: ${error.message}`);
  process.exit(1);
}
