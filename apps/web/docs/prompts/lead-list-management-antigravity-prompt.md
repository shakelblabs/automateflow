Build the "Lead List Management" feature for AutomateFlow, a cold-email campaign automation platform. This is a Turborepo monorepo; you're working inside `apps/web` (Next.js App Router, TypeScript strict, Tailwind v4, shadcn/ui on Base UI — not Radix — `@xyflow/react` for an existing campaign canvas, React Context/useState for state). The project is currently frontend-only and UI-first: no backend exists, everything is mock/session-state data clearly labeled as such. Do not add a backend, a database, or any real network call as part of this task.

**Important sequencing note:** this feature has a hard dependency on a companion feature, Integrations (`apps/web/docs/specs/integrations-v1-spec.md`), which owns the Brilliant Directories connection this build consumes for one of its three import methods. Check first whether `IntegrationsProvider` (referenced in `apps/web/src/components/shell/app-providers.tsx`) already exists in the codebase:
- If it exists: read its actual exported interface (especially `useIntegrations().runSync()`) and build against the real thing.
- If it does not exist yet: build everything in this spec **except** the live Brilliant Directories hand-off (Section 3.4's target-list picker for Brilliant Directories specifically) against a small local stub matching the interface described in `integrations-v1-spec.md` Section 4, clearly commented `// STUB — replace with real useIntegrations() once integrations-v1-spec.md is built`, so nothing blocks on it and nothing has to be rewritten later beyond swapping the import.

**Read these files first, in full, before writing any code:**
1. `.cursor/rules/automateflow-core.mdc` — cross-feature architectural conventions (external-entity pattern, mock-data-then-swap pattern, provider live-wiring, and the exact "don't silently break an existing node's contract" expectation)
2. `.cursor/rules/tech-stack.mdc` — locked tech stack; do not introduce any library not listed there (this matters especially here: CSV parsing must be hand-rolled, do not add a CSV parsing package)
3. `apps/web/docs/specs/campaign-canvas-v2-spec.md` Section 2 — the exact current contract for the `New Lead Added` trigger node that this build must not silently change
4. `apps/web/docs/specs/platform-shell-sender-v1-spec.md` — the provider + app-shell pattern
5. `apps/web/docs/specs/Email-template-builder-v1-spec.md` Section 1 — the closest precedent for the live-wiring mechanics you need to replicate (a node's dropdown switching from a static array to live provider data)
6. `apps/web/docs/specs/lead-list-management-v1-spec.md` — **this is the actual spec you are building.** Read it in full, twice. Section 7 (Visual & Interaction Design System) is binding, not optional — treat its exact class names, color tokens, and component recipes as requirements, not suggestions.
7. `apps/web/docs/specs/integrations-v1-spec.md` — companion spec (read Section 3.4 and 4) for the shape of the connection you're consuming.

**Then inspect this existing code as ground truth (the spec references these; go read the actual files):**
- `apps/web/src/lib/node-definitions.ts` — current `LEAD_LISTS` array and the `trigger-new-lead` node definition you're refactoring; also study how `action-send-email` already bypasses the generic field system via a dedicated config component — you're replicating that exact pattern for `trigger-new-lead`
- `apps/web/src/components/campaign/node-config-panel.tsx` — where the special-case component wiring and the `summarize()` call site live
- `apps/web/src/components/shell/template-library-provider.tsx` — the provider pattern to mirror for `LeadListProvider`
- `apps/web/src/lib/email-templates.ts` — the mock-data-file pattern to mirror for the new `lead-lists.ts`
- `apps/web/src/components/sender-accounts/*.tsx` — the exact visual/interaction language (cards, dialogs, badges, tables, empty states, destructive confirms) you must extend, not reinvent
- `apps/web/src/app/globals.css` — the actual color/radius tokens in use

**Your task:** build `lead-list-management-v1-spec.md` end to end, following the build order in its own Section 9 (Cursor Project Setup Notes): (1) extract `lead-lists.ts` + `LeadListProvider`, wired into `app-providers.tsx`, seeded from the existing static data so nothing breaks yet → (2) the dedicated `NewLeadTriggerConfig` component + `node-config-panel.tsx` wiring + the `summarize()` signature change, verified against the existing `trigger-new-lead` behavior → (3) `/leads` list view + creation wizard + empty states → (4) per-lead CRUD + leads table (search/pagination/bulk actions) → (5) manual entry + CSV import + dedup logic → (6) Brilliant Directories consumption (per the sequencing note above) + claimed-member routing.

**Non-negotiable boundaries (the spec's Section 0 covers these — repeating because they matter most):**
- `New Lead Added`'s card summary format must stay pixel/text-identical: `"List: {name} ({leadCount} leads)"` / `"No list selected"`. Only the data source changes, from the static array to live provider data. Verify this with an actual before/after comparison, not just "it looks the same."
- No real CSV parsing library — hand-roll the parsing.
- No real network calls anywhere in this build, including for Brilliant Directories (that's fully simulated, owned by the other spec).
- Existing Campaign Canvas Playwright tests (anything touching `trigger-new-lead`) must still pass unmodified after your refactor.
- No `tags` field, no relationship to the (still-deferred) Tag Lead node — do not add either.

**UI/UX bar:** this should look and feel like it was built by the same senior designer who built Sender Accounts — same shadows, same radius scale, same motion durations, same badge recipe, same dialog and table chrome. If you find yourself inventing a new visual pattern that isn't in Section 7 or in the existing Sender Accounts code, stop and reuse something that already exists instead. Pay particular attention to the three distinct list-card states (normal list vs. the muted, non-lifting "Claimed Members" system list) and the three-tile import picker being a single shared component reused everywhere it appears, not three separate implementations.

**Testing:** Playwright, following the existing `tests/step-NN-*.spec.ts` convention. This feature is `step-13-lead-list-management.spec.ts` (confirm the current highest-numbered file in `apps/web/tests/` first in case other work has landed since this spec was written, and adjust the number accordingly). Write tests alongside each piece, not all at the end.

**Verification before you call this done** (this repo normally runs two specialized Cursor subagents — `spec-completeness-checker` and `spec-verifier` — for this gate; those aren't available in this environment, so do the equivalent yourself with the same rigor): go through every checkbox in the spec's Section 8 (Acceptance Criteria) one at a time, and for each one, either point to the exact file/line that satisfies it or fix it before moving on. Pay particular attention to the `New Lead Added` live-wiring criterion — verify it with an actual cross-page test (create a list here, switch to Campaign Builder, confirm it appears in the dropdown without a refresh), not a provider unit test in isolation — and to the claimed-member transition, which requires simulating two sequential Brilliant Directories syncs. Do not mark anything done on a "looks right" basis — verify against the actual running behavior.

If anything in the spec is ambiguous, conflicts with what you find in the existing code, or the Integrations dependency isn't resolvable the way the sequencing note above assumes, stop and flag it rather than silently picking an interpretation.
