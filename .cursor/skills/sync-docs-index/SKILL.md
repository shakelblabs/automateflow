---
name: sync-docs-index
description: >-
  Keeps AGENTS.md's cross-tool docs index (specs, concept docs, handoff prompts,
  verification subagents) in sync with what actually exists on disk, using a
  lightweight manifest cache instead of re-reading every file. Use immediately
  after creating, renaming, or deleting any file under apps/web/docs/specs/,
  apps/web/docs/concepts/, apps/web/docs/prompts/, .cursor/agents/, or
  .cursor/rules/ — or whenever the afterFileEdit hook's additional_context flags
  "AGENTS.md docs-index may be stale".
---

# Sync docs index

AGENTS.md is the cross-tool source of truth other agentic tools (Antigravity, Claude Code, etc.) read instead of this project's Cursor-specific conversation history. It goes stale the moment a spec/agent/rule file is added or removed and nobody updates the list. This skill keeps it current **cheaply** — never re-scan or re-read everything, only touch what changed.

## The scratchpad

`.cursor/state/docs-index.json` is the cache of "what AGENTS.md currently claims exists." It records, per watched folder, the exact filenames AGENTS.md already accounts for. Treat it as the single source of truth for "have I already synced this" — never re-derive that by re-reading AGENTS.md's prose each time.

## Procedure

1. Read `.cursor/state/docs-index.json`.
2. For each folder key (`specs`, `concepts`, `prompts`, `rules`, `agents`), list the real directory (`folders.<key>` gives the path) and diff against the manifest's array for that key.
3. If nothing differs, stop — do not edit AGENTS.md or the manifest.
4. For each **added** file: read only that file's first ~20 lines (title/frontmatter/opening paragraph) to write one sentence describing it — do not read the whole file or any other files.
5. For each **removed** file: note it needs removing from AGENTS.md's list.
6. Edit `AGENTS.md` at the precise anchor for that category (see below) — add/remove exactly the lines that changed, nothing else. Match the existing bullet style and level of detail already in the file.
7. Update `.cursor/state/docs-index.json`: add/remove the filename(s) in the relevant array, bump `lastSyncedWithAgentsMd` to today's date.
8. If the change is a **new spec**, also sanity-check whether any older "frozen" spec's route map/description needs a superseded-by note (see the existing `platform-shell-sender-v1-spec.md` line in AGENTS.md for the pattern) — add one only if the new spec genuinely supersedes something, don't add noise otherwise.
9. If the change is a **new verification subagent** under `.cursor/agents/`, update the "Two-subagent verification gate" paragraph's file list.

## AGENTS.md anchors

- Specs → bullet list under `Current specs:` in the `<!-- BEGIN:automateflow-project-rules -->` block.
- Concept docs → the single `Domain concept docs (...)` line — append `, apps/web/docs/concepts/<file>` to the existing sentence.
- Handoff prompts → the `Cross-tool handoff prompts (...)` line already points at the whole `apps/web/docs/prompts/` folder generically; only edit it if the *nature* of that folder's contents changes, not for every new prompt file.
- Verification subagents → the `.cursor/agents/spec-completeness-checker.mdc ... and .cursor/agents/spec-verifier.mdc` sentence in "Two-subagent verification gate".
- `.cursor/rules/*.mdc` additions are referenced generically (`.cursor/rules/*.mdc`) and normally need **no** AGENTS.md edit — only touch that section if a new rule introduces a cross-tool concept worth summarizing.

## Efficiency rules (why this is fast)

- Never do a full-repo search. The manifest tells you exactly which 5 folders to check and what they last contained — one `readdir` per folder.
- Never re-read files that already exist in the manifest — only read files that are new.
- Never rewrite AGENTS.md wholesale — targeted edits only, at the anchors above.
- If the hook's `additional_context` already tells you exactly which files were added/removed, skip the diff step and go straight to reading those specific new files.

## After syncing

Report back briefly (one line) confirming what was updated in AGENTS.md and the manifest — don't narrate the whole procedure to the user.
