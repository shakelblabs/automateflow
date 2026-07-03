<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know
This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:automateflow-project-rules -->
# AutomateFlow — Cross-Tool Project Rules

This section applies across all AI coding tools used on this project (Cursor, Antigravity, Claude Code, or any other AGENTS.md-compatible tool). Tool-specific detail beyond this summary lives in `.cursor/rules/*.mdc` for Cursor specifically — read those too when working in Cursor.

## Specs are the source of truth
Every feature has a versioned spec under `apps/web/docs/specs/`. Read the relevant spec in full before writing code. Do not build against assumptions when a spec exists — if something is ambiguous or missing from the spec, stop and ask rather than guessing.

Current specs:
- `campaign-canvas-v1-spec.md` — historical, superseded, do not build against
- `campaign-canvas-v2-spec.md` — current source of truth for Campaign Canvas
- `platform-shell-sender-v1-spec.md` — App Shell + Sender Accounts page
- `Email-template-builder-v1-spec.md` — Email Template Builder page

Domain concept docs (non-UI logic, referenced by specs): `apps/web/docs/concepts/sender-account-behavior.md`

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

(Note: these were previously run as ad-hoc Cursor subagent prompts, not saved as fixed definition files. If working in a tool that supports persistent skill/subagent definitions — e.g. Antigravity's `.agents/skills/`, Claude's `.claude/agents/` — recreate them there as fixed, reusable definitions rather than re-deriving instructions each time.)

## Testing
Every new interaction gets a corresponding Playwright test, written alongside the feature, not deferred to the end. Full suite must stay green at every checkpoint — a temporarily red suite is not acceptable even mid-build. Continue the existing `tests/step-NN-*.spec.ts` numbering convention.

## Known open architectural decisions
- Sender Account: campaign-level pooled setting vs. per-node override capability — not yet decided, default to campaign-level.
- Business-hours-only sending — intended long-term, not yet decided for first shipped version.
<!-- END:automateflow-project-rules -->
