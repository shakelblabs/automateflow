Build the "Integrations" feature for AutomateFlow, a cold-email campaign automation platform. This is a Turborepo monorepo; you're working inside `apps/web` (Next.js App Router, TypeScript strict, Tailwind v4, shadcn/ui on Base UI — not Radix — `@xyflow/react` for an existing canvas, React Context/useState for state). The project is currently frontend-only and UI-first: no backend exists, everything is mock/session-state data clearly labeled as such. Do not add a backend, a database, or any real network call as part of this task.

**Read these files first, in full, before writing any code:**
1. `.cursor/rules/automateflow-core.mdc` — cross-feature architectural conventions (external-entity pattern, mock-data-then-swap pattern, provider live-wiring)
2. `.cursor/rules/tech-stack.mdc` — locked tech stack; do not introduce any library not listed there
3. `apps/web/docs/specs/platform-shell-sender-v1-spec.md` — the provider + app-shell + sidebar pattern this build follows
4. `apps/web/docs/specs/integrations-v1-spec.md` — **this is the actual spec you are building.** Read it in full, twice. Section 5 (Visual & Interaction Design System) is binding, not optional — treat its exact class names, color tokens, and component recipes as requirements, not suggestions.
5. `apps/web/docs/specs/lead-list-management-v1-spec.md` — companion spec (read at least Section 3.4 and 3.6, and Section 7 for the visual language this page must match) — you are not building this one, but you own the connection it consumes, so you need to know the shape of that hand-off.

**Then inspect this existing code as ground truth for the visual language (Section 5 of the spec references these; go read the actual files, don't rely on the spec's paraphrase alone):**
- `apps/web/src/components/shell/sender-accounts-provider.tsx` and `apps/web/src/components/sender-accounts/*.tsx` — this is the provider pattern and the exact visual/interaction language (cards, dialogs, badges, empty states, destructive confirms) you must extend, not reinvent
- `apps/web/src/components/shell/app-providers.tsx` — where your new provider gets registered
- `apps/web/src/components/shell/app-sidebar.tsx` and `apps/web/src/components/shell/deferred-nav-item.tsx` — sidebar nav pattern
- `apps/web/src/app/globals.css` — the actual color/radius tokens (emerald/teal accent, slate neutrals, `--radius: 0.625rem` scale)

**Your task:** build `integrations-v1-spec.md` end to end, following the build order in its own Section 8 (Cursor Project Setup Notes). That means, in order: `IntegrationsProvider` + `/integrations` page shell + sidebar nav item → Brilliant Directories connect form + Test Connection → Sync Now with a **stateful** mock generator (it must remember the previous sync's data within the session so the claimed-member detection in Section 3.5 is actually demonstrable across two clicks, not just randomized noise) → claimed-member flagging logic → static "Coming Soon" cards → the hand-off interface (`useIntegrations().runSync()`) that `lead-list-management-v1-spec.md` will consume.

**Non-negotiable boundaries (the spec's Section 0 covers these — repeating because they matter most):**
- No real HTTP call to Brilliant Directories or anywhere else. Test Connection and Sync Now are both fully simulated/deterministic.
- Credentials (Site Name, Site URL, API Key, Unclaimed Plan/Subscription ID) live in local provider state only, commented as mock, never transmitted.
- No new npm dependencies — this spec needs none.
- Do not touch Campaign Canvas, Sender Accounts, or Template Builder code.
- Google Sheets / Salesforce / HubSpot cards are static and inert — no forms, no click behavior, no logic at all behind them.

**UI/UX bar:** this should look and feel like it was built by the same senior designer who built Sender Accounts — same shadows, same radius scale, same motion durations, same badge recipe, same dialog chrome. If you find yourself inventing a new visual pattern that isn't in Section 5 or in the existing Sender Accounts code, stop and reuse something that already exists instead.

**Testing:** Playwright, following the existing `tests/step-NN-*.spec.ts` convention. This feature is `step-14-integrations.spec.ts` (confirm the current highest-numbered file in `apps/web/tests/` first in case other work has landed since this spec was written, and adjust the number accordingly). Write tests alongside each piece, not all at the end.

**Verification before you call this done** (this repo normally runs two specialized Cursor subagents — `spec-completeness-checker` and `spec-verifier` — for this gate; those aren't available in this environment, so do the equivalent yourself with the same rigor): go through every checkbox in the spec's Section 7 (Acceptance Criteria) one at a time, and for each one, either point to the exact file/line that satisfies it or fix it before moving on. Pay particular attention to the claimed-member transition criterion — you must actually simulate two sequential syncs in a test and confirm the second one correctly flags the transition, not just check that the first sync's output looks plausible. Do not mark anything done on a "looks right" basis — verify against the actual running behavior.

If anything in the spec is ambiguous or conflicts with what you find in the existing code, stop and flag it rather than silently picking an interpretation.
