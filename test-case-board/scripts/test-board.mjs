#!/usr/bin/env node
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function usage(code = 0) {
  const text = `Usage:
  test-board once --board test-board.yaml
  test-board impact --board test-board.yaml --files src/a.ts src/b.ts
  test-board issue --board test-board.yaml --issue 123
  test-board coverage --board test-board.yaml
  test-board gaps --board test-board.yaml [--root .]
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
    if (key === "apply" || key === "open") {
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

function stripComment(value) {
  let quote = null;
  for (let i = 0; i < value.length; i++) {
    const c = value[i];
    if ((c === '"' || c === "'") && value[i - 1] !== "\\") quote = quote === c ? null : quote || c;
    if (c === "#" && !quote && (i === 0 || /\s/.test(value[i - 1]))) return value.slice(0, i).trimEnd();
  }
  return value.trimEnd();
}

function unquote(value) {
  const v = String(value ?? "").trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1);
  return v;
}

function parseInlineList(value) {
  const inner = value.trim().replace(/^\[/, "").replace(/\]$/, "");
  if (!inner.trim()) return [];
  return inner.split(",").map((item) => unquote(item.trim())).filter(Boolean);
}

function parseValue(raw) {
  const v = stripComment(String(raw ?? "")).trim();
  if (v === "") return "";
  if (v.startsWith("[") && v.endsWith("]")) return parseInlineList(v);
  if (v === "true") return true;
  if (v === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return unquote(v);
}

function parseBoard(boardPath) {
  const abs = path.resolve(boardPath);
  const text = fs.readFileSync(abs, "utf8");
  const lines = text.split(/\r?\n/);
  const board = { path: abs, text, project: {}, source_roots: [], dimensions: {}, cases: [] };
  let section = null;
  let current = null;
  let currentNested = null;

  for (const line of lines) {
    if (/^\s*$/.test(line) || /^\s*#/.test(line)) continue;

    const top = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (top) {
      section = top[1];
      current = null;
      currentNested = null;
      if (section === "source_roots") board.source_roots = parseValue(top[2]);
      continue;
    }

    if (section === "project") {
      const m = line.match(/^  ([A-Za-z0-9_-]+):\s*(.*)$/);
      if (m) board.project[m[1]] = parseValue(m[2]);
      continue;
    }

    if (section === "dimensions") {
      const m = line.match(/^  ([A-Za-z0-9_-]+):\s*(.*)$/);
      if (m) board.dimensions[m[1]] = parseValue(m[2]);
      continue;
    }

    if (section === "cases") {
      const start = line.match(/^  - id:\s*(.*)$/);
      if (start) {
        current = { id: parseValue(start[1]) };
        board.cases.push(current);
        currentNested = null;
        continue;
      }
      if (!current) continue;
      const kv = line.match(/^    ([A-Za-z0-9_-]+):\s*(.*)$/);
      if (kv) {
        const key = kv[1];
        const raw = kv[2];
        if (raw.trim() === "") {
          current[key] = {};
          currentNested = key;
        } else {
          current[key] = parseValue(raw);
          currentNested = null;
        }
        continue;
      }
      const nested = line.match(/^      ([A-Za-z0-9_-]+):\s*(.*)$/);
      if (nested && currentNested) current[currentNested][nested[1]] = parseValue(nested[2]);
    }
  }
  return board;
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
  return asArray(c.issues).map(String);
}

function sourceMatches(c, file) {
  const normalized = file.replace(/^\.\//, "");
  return asArray(c.source).some((src) => {
    const s = String(src).replace(/^\.\//, "");
    return normalized === s || normalized.startsWith(`${s}/`) || s.startsWith(`${normalized}/`);
  }) || String(c.test_file || "").replace(/^\.\//, "") === normalized;
}

function printCases(cases) {
  for (const c of cases) {
    const issues = caseIssues(c);
    const suffix = issues.length ? ` issues=#${issues.join(",#")}` : "";
    console.log(`- ${c.id} [${c.status || "unknown"}] ${c.title || ""} (${c.type || "?"}/${c.priority || "?"})${suffix}`);
    if (c.test_file) console.log(`  test: ${c.test_file}`);
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
  const tests = [...new Set(matches.map((c) => c.test_file).filter(Boolean))];
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
  const tests = [...new Set(matches.map((c) => c.test_file).filter(Boolean))];
  if (tests.length) console.log(`\ntests_to_run:\n${tests.map((t) => `- ${t}`).join("\n")}`);
}

function cmdCoverage(args) {
  const board = parseBoard(boardPath(args));
  const missingSource = board.cases.filter((c) => !asArray(c.source).length);
  const doneWithoutTest = board.cases.filter((c) => c.status === "done" && !c.test_file);
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

const LAYER_TYPES = ["unit", "integration", "e2e", "security", "regression"];

function cmdGaps(args) {
  const board = parseBoard(boardPath(args));
  const root = path.resolve(args.root || path.dirname(board.path));

  const open = board.cases.filter((c) => c.status === "todo" || c.status === "doing");
  const openUnwritten = open.filter(
    (c) => !c.test_file || !fs.existsSync(path.resolve(root, String(c.test_file)))
  );
  // "Lying board": the case claims done with a test_file that does not exist.
  const doneMissingFile = board.cases.filter(
    (c) =>
      c.status === "done" &&
      c.test_file &&
      !fs.existsSync(path.resolve(root, String(c.test_file)))
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
    console.log(`\ncases without linked issues: ${unlinked.length} (${unlinked.map((c) => c.id).join(", ")})`);
  }

  console.log("");
  if (!gapCount) {
    console.log("no gaps: open cases all have real tests, done cases all exist on disk, every layer is populated");
    return;
  }
  console.log("suggested next actions:");
  if (openUnwritten.length) {
    console.log("- batch the open cases into one GitHub Issue, write the real tests until green, then mark done with the real test_file");
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
  const s = String(value ?? "");
  if (/^[A-Za-z0-9_./:@# -]+$/.test(s) && s.trim() === s && s !== "") return s;
  return JSON.stringify(s);
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
    const insertion = `${board.text.endsWith("\n") ? "" : "\n"}${caseYaml(c)}\n`;
    fs.appendFileSync(board.path, insertion);
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
    if (c.test_file) lines.push(`  - test: \`${c.test_file}\``);
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
    <td>${htmlEscape(asArray(c.issues).join(", "))}</td>
    <td>${htmlEscape(c.test_file)}</td>
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
