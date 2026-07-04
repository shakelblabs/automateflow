#!/usr/bin/env node
/**
 * afterFileEdit hook — cheap drift-check for AGENTS.md's docs index.
 *
 * Design goal: never do expensive work on every keystroke/edit. This script only
 * does a directory-listing diff against the manifest at .cursor/state/docs-index.json
 * (the "scratchpad"). It never reads file contents, never calls an LLM, and always
 * exits 0 with valid JSON so it fails open (never blocks the edit that triggered it).
 *
 * If — and only if — a watched folder's file list has actually drifted from the
 * manifest, it returns `additional_context` nudging the agent to run the
 * `sync-docs-index` skill. Otherwise it stays silent.
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = process.cwd();
const MANIFEST_PATH = path.join(REPO_ROOT, ".cursor", "state", "docs-index.json");
const LOG_PATH = path.join(REPO_ROOT, ".cursor", "hooks", "logs", "check-docs-index.log");

function log(line) {
  try {
    fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
    fs.appendFileSync(LOG_PATH, `[${new Date().toISOString()}] ${line}\n`);
  } catch {
    // Logging must never crash the hook.
  }
}

function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function extractEditedPath(raw) {
  // Defensive: hook payload shape isn't pinned down here, so try common field
  // names first, then fall back to a plain substring scan of the raw payload.
  try {
    const data = JSON.parse(raw);
    const candidates = [
      data.file_path,
      data.filePath,
      data.path,
      data.target_file,
      data?.tool_input?.path,
      data?.tool_input?.file_path,
      data?.tool_input?.target_file,
      data?.input?.path,
      data?.input?.file_path,
    ].filter(Boolean);
    if (candidates.length > 0) return String(candidates[0]);
  } catch {
    // fall through to substring scan below
  }
  return raw; // let the substring checks below scan the whole raw payload
}

function listMdFiles(absFolder) {
  try {
    return fs
      .readdirSync(absFolder)
      .filter((f) => f.endsWith(".md") || f.endsWith(".mdc"));
  } catch {
    return null; // folder missing/unreadable — don't treat as drift
  }
}

function diff(current, known) {
  const currentSet = new Set(current);
  const knownSet = new Set(known);
  const added = current.filter((f) => !knownSet.has(f));
  const removed = known.filter((f) => !currentSet.has(f));
  return { added, removed };
}

function main() {
  const raw = readStdin();
  const editedPath = extractEditedPath(raw).replace(/\\/g, "/");

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  } catch (err) {
    log(`Could not read manifest, skipping check: ${err.message}`);
    process.stdout.write("{}");
    return;
  }

  const watched = [
    { key: "specs", folder: manifest.folders.specs },
    { key: "concepts", folder: manifest.folders.concepts },
    { key: "prompts", folder: manifest.folders.prompts },
    { key: "rules", folder: manifest.folders.rules },
    { key: "agents", folder: manifest.folders.agents },
  ];

  // Only bother scanning if the edited path plausibly touched a watched folder —
  // this keeps the common case (editing unrelated app code) essentially free.
  const relevant = watched.filter((w) => editedPath.includes(w.folder));
  if (relevant.length === 0) {
    process.stdout.write("{}");
    return;
  }

  const messages = [];
  for (const w of relevant) {
    const absFolder = path.join(REPO_ROOT, w.folder);
    const current = listMdFiles(absFolder);
    if (current === null) continue;
    const known = manifest[w.key] || [];
    const { added, removed } = diff(current, known);
    if (added.length > 0 || removed.length > 0) {
      const parts = [];
      if (added.length) parts.push(`new: ${added.join(", ")}`);
      if (removed.length) parts.push(`removed: ${removed.join(", ")}`);
      messages.push(`${w.folder} drifted from .cursor/state/docs-index.json (${parts.join("; ")})`);
    }
  }

  if (messages.length === 0) {
    process.stdout.write("{}");
    return;
  }

  log(`Drift detected: ${messages.join(" | ")}`);
  const context =
    `AGENTS.md docs-index may be stale — ${messages.join(" | ")}. ` +
    `Run the sync-docs-index skill now to update AGENTS.md and .cursor/state/docs-index.json before finishing this task.`;

  process.stdout.write(JSON.stringify({ additional_context: context }));
}

try {
  main();
} catch (err) {
  // Fail open, always. A broken hook must never block a real file edit.
  log(`Unexpected error, failing open: ${err && err.stack ? err.stack : err}`);
  process.stdout.write("{}");
}
