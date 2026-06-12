#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_REPO = path.resolve(__dirname, "..", "..");
const DEFAULT_INSTALLED_ROOT = path.join(os.homedir(), ".agents", "skills");

function usage(code = 0) {
  console.log(`Usage:
  manage-skills audit --repo .
  manage-skills sync --repo . --skills test-case-board loop-engineering-dev [--apply]
  manage-skills restore-script --repo . [--apply]

Options:
  --repo <path>             Canonical skills repository. Default: script repo root.
  --installed-root <path>   Installed skills root. Default: ~/.agents/skills
  --skills <names...>       Limit to listed skills.
  --apply                   Write changes. Without this, sync/restore-script preview only.
`);
  process.exit(code);
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      args._.push(arg);
      continue;
    }
    const key = arg.slice(2);
    if (key === "apply") {
      args[key] = true;
      continue;
    }
    const values = [];
    while (i + 1 < argv.length && !argv[i + 1].startsWith("--")) values.push(argv[++i]);
    args[key] = values.length <= 1 ? values[0] : values;
  }
  return args;
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === "") return [];
  return [value];
}

function repoPath(args) {
  return path.resolve(args.repo || DEFAULT_REPO);
}

function manifestPath(repo) {
  return path.join(repo, "managed-skills.json");
}

function loadManifest(repo) {
  const file = manifestPath(repo);
  if (!fs.existsSync(file)) return { version: 1, skills: [] };
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function managedSkills(args, manifest) {
  const selected = new Set(asArray(args.skills));
  const skills = manifest.skills || [];
  return selected.size ? skills.filter((s) => selected.has(s.name)) : skills;
}

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules" || entry.name === ".DS_Store") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile() || entry.isSymbolicLink()) out.push(full);
  }
  return out;
}

function hashDir(dir) {
  const hash = crypto.createHash("sha256");
  for (const file of walk(dir).sort()) {
    const rel = path.relative(dir, file);
    hash.update(rel);
    hash.update("\0");
    hash.update(fs.readFileSync(file));
    hash.update("\0");
  }
  return hash.digest("hex");
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) throw new Error(`missing installed skill: ${src}`);
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  for (const file of walk(src)) {
    const rel = path.relative(src, file);
    const target = path.join(dest, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(file, target);
    const mode = fs.statSync(file).mode;
    fs.chmodSync(target, mode);
  }
}

function audit(args) {
  const repo = repoPath(args);
  const installedRoot = path.resolve(args["installed-root"] || DEFAULT_INSTALLED_ROOT);
  const manifest = loadManifest(repo);
  const skills = managedSkills(args, manifest);
  console.log(`repo=${repo}`);
  console.log(`installed_root=${installedRoot}`);
  console.log(`managed=${skills.length}`);
  let failures = 0;
  for (const skill of skills) {
    const repoDir = path.join(repo, skill.path || skill.name);
    const installedDir = path.join(installedRoot, skill.name);
    const repoOk = skill.external ? true : fs.existsSync(path.join(repoDir, "SKILL.md"));
    const installedOk = fs.existsSync(path.join(installedDir, "SKILL.md"));
    const repoHash = skill.external ? "external" : repoOk ? hashDir(repoDir).slice(0, 12) : "-";
    const installedHash = installedOk ? hashDir(installedDir).slice(0, 12) : "-";
    const match = skill.external ? "external" : repoOk && installedOk ? repoHash === installedHash : false;
    if (!repoOk) failures++;
    console.log(`- ${skill.name} repo=${skill.external ? "external" : repoOk ? "ok" : "missing"} installed=${installedOk ? "ok" : "missing"} hash=${repoHash}/${installedHash} match=${match === "external" ? "external" : match ? "yes" : "no"}`);
  }
  if (failures) process.exitCode = 1;
}

function sync(args) {
  const repo = repoPath(args);
  const installedRoot = path.resolve(args["installed-root"] || DEFAULT_INSTALLED_ROOT);
  const manifest = loadManifest(repo);
  const skills = managedSkills(args, manifest);
  if (!skills.length) throw new Error("no matching skills in managed-skills.json");
  for (const skill of skills) {
    if (skill.external) {
      console.log(`skip external ${skill.name} source=${skill.source}`);
      continue;
    }
    const src = path.join(installedRoot, skill.name);
    const dest = path.join(repo, skill.path || skill.name);
    console.log(`${args.apply ? "sync" : "would sync"} ${src} -> ${dest}`);
    if (args.apply) copyDir(src, dest);
  }
  if (!args.apply) console.log("dry-run only; rerun with --apply to write");
}

function restoreScript(manifest) {
  const lines = [
    "#!/usr/bin/env bash",
    "set -euo pipefail",
    "",
    "echo \"Restoring managed Skills...\"",
  ];

  for (const skill of manifest.skills || []) {
    if (skill.install === false) continue;
    const source = skill.source || "nanameru/agent-skills";
    const copy = skill.copy === false ? "" : " --copy";
    lines.push(`npx skills add ${source} --skill ${skill.name} -g -y${copy}`);
  }

  lines.push("");
  lines.push("mkdir -p \"$HOME/.local/bin\" \"$HOME/.claude/skills\"");

  for (const link of manifest.postInstallLinks || []) {
    const target = link.target.replace("$HOME", "\"$HOME\"");
    const linkPath = link.link.replace("$HOME", "\"$HOME\"");
    lines.push(`ln -sfn ${target} ${linkPath}`);
  }

  lines.push("");
  lines.push("echo \"Done.\"");
  lines.push("");
  return lines.join("\n");
}

function writeRestoreScript(args) {
  const repo = repoPath(args);
  const manifest = loadManifest(repo);
  const content = restoreScript(manifest);
  const target = path.join(repo, "restore-skills.sh");
  console.log(content);
  if (args.apply) {
    fs.writeFileSync(target, content, { mode: 0o755 });
    fs.chmodSync(target, 0o755);
    console.log(`wrote ${target}`);
  } else {
    console.log("preview only; rerun with --apply to write");
  }
}

const args = parseArgs(process.argv.slice(2));
const cmd = args._[0];

try {
  if (!cmd || cmd === "help" || cmd === "--help") usage(0);
  if (cmd === "audit") audit(args);
  else if (cmd === "sync") sync(args);
  else if (cmd === "restore-script") writeRestoreScript(args);
  else usage(1);
} catch (error) {
  console.error(`manage-skills: ${error.message}`);
  process.exit(1);
}
