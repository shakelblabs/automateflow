<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know
This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Context7 MCP (live library docs)
Project MCP config: `.cursor/mcp.json` (safe to commit — no secrets). Cursor rule: `.cursor/rules/context7.mdc`.
API key lives only in root `.env` as `CONTEXT7_API_KEY` (gitignored). Copy from `.env.example`, paste your free key from https://context7.com/dashboard, then reload MCP in **Cursor Settings → MCP**. Leave empty for unauthenticated access (lower rate limits).
<!-- END:nextjs-agent-rules -->


<!-- BEGIN:automateflow-project-rules -->
# AutomateFlow — Cross-Tool Project Rules

This section applies across all AI coding tools used on this project (Cursor, Antigravity, Claude Code, or any other AGENTS.md-compatible tool). Tool-specific detail beyond this summary lives in `.cursor/rules/*.mdc` for Cursor specifically — read those too when working in Cursor.

## Specs are the source of truth
Every feature has a versioned spec under `apps/web/docs/specs/`. Read the relevant spec in full before writing code. Do not build against assumptions when a spec exists — if something is ambiguous or missing from the spec, stop and ask rather than guessing.

Current specs:
- `campaign-canvas-v1-spec.md` — historical, superseded, do not build against
- `campaign-canvas-v2-spec.md` — current source of truth for Campaign Canvas
- `platform-shell-sender-v1-spec.md` — App Shell + Sender Accounts page (note: its Section 1.1 route map lists Leads/Integrations as unrouted placeholders — that's now superseded by the two specs below; this file is frozen/historical and not edited in place per the versioning rule below)
- `Email-template-builder-v1-spec.md` — Email Template Builder page
- `lead-list-management-v1-spec.md` — Lead List Management page (`/leads`) — full lead schema, list/per-lead CRUD, manual + CSV import, live-wires `New Lead Added`'s dropdown off the old static `LEAD_LISTS` array
- `integrations-v1-spec.md` — Integrations page (`/integrations`) — general-purpose integrations hub; v1 scaffolds the Brilliant Directories connection (simulated) that the Lead List Management spec consumes

Domain concept docs (non-UI logic, referenced by specs): `apps/web/docs/concepts/sender-account-behavior.md`

Cross-tool handoff prompts (self-contained prompts for pasting into a different agentic tool's own chat, e.g. Antigravity — no dependency on any prior conversation): `apps/web/docs/prompts/`. Add one here whenever a spec needs to be handed to a tool that can't read this project's own conversation history.

### Keeping this index from going stale
`.cursor/state/docs-index.json` is a plain-JSON manifest (tool-agnostic, not Cursor-specific) recording exactly which spec/concept/prompt/rule/agent files this AGENTS.md currently accounts for. Whenever you add, rename, or delete a file under `apps/web/docs/specs/`, `apps/web/docs/concepts/`, `apps/web/docs/prompts/`, `.cursor/rules/`, or `.cursor/agents/`, diff the real folder listing against that manifest — it's a single cheap directory read, no need to re-scan the whole repo or re-read files you've already accounted for — then update both this file and the manifest together. In Cursor this is automated: an `afterFileEdit` hook (`.cursor/hooks/check-docs-index.js`) runs this diff automatically and flags drift, and `.cursor/skills/sync-docs-index/SKILL.md` documents the exact sync procedure. Other tools without a hook mechanism should just do the same cheap diff manually before finishing a task that touched these folders.

## The external-entity pattern
Canvas nodes reference external entities (Lead List, Email Template, Sender Account) via a dropdown/selector inside a node's config panel — they do not manage creation/editing of that entity inline. New cross-cutting concepts should default to this same pattern unless a spec explicitly decides otherwise.

## Mock-data-then-swap
Features are built UI-first against clearly-labeled MOCK data with the same shape real data will eventually have. Comment mock data/logic inline as `// MOCK — replace with real data once [X] exists`.

## Scope discipline
- UI-only unless a spec explicitly says otherwise — no real backend calls, no real OAuth/SMTP/IMAP, no real AI API calls, no real persistence beyond mock/session state, unless the spec says so.
- Do not invent new node types, fields, or features not in the spec. Flag gaps rather than filling them in.
- Do not touch files outside the current feature's scope without flagging it first.

## Two-subagent verification gate
After a spec's build order is complete, run two verification passes with fresh context before calling a feature done:
- **Completeness check** — checklist-level PASS/FAIL/UNVERIFIABLE against the spec's acceptance criteria
- **Field-by-field verification** — detailed audit of actual implementation against the spec's schema

In Cursor, these are saved as fixed, reusable subagent definitions — `.cursor/agents/spec-completeness-checker.mdc` (generic: pass it any spec path under `docs/specs/`, not just Campaign Canvas) and `.cursor/agents/spec-verifier.mdc`. Those two files are Cursor's own format and won't be auto-loaded by other tools. If working in a tool that supports persistent skill/subagent definitions (e.g. Antigravity's `.agents/skills/`, Claude's `.claude/agents/`), recreate equivalents there rather than re-deriving instructions each time. If working in a tool with no such mechanism at all, at minimum manually replicate the same rigor — go through every acceptance-criteria checkbox one at a time with evidence, don't just eyeball it — before calling a feature done.

## Testing
Every new interaction gets a corresponding Playwright test, written alongside the feature, not deferred to the end. Full suite must stay green at every checkpoint — a temporarily red suite is not acceptable even mid-build. Continue the existing `tests/step-NN-*.spec.ts` numbering convention.

## Known open architectural decisions
- Sender Account: campaign-level pooled setting vs. per-node override capability — not yet decided, default to campaign-level.
- Business-hours-only sending — intended long-term, not yet decided for first shipped version.
<!-- END:automateflow-project-rules -->
