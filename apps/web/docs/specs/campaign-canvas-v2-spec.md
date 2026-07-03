# AutomateFlow — Campaign Canvas v2 Spec
**Module:** Campaign Builder (Canvas)
**Supersedes:** campaign-canvas-v1-spec.md (v1 is complete, verified, and frozen — do not edit that file; this is a new version)
**Scope:** UI ONLY — no backend, no real API calls. Mock data structured to be swap-compatible with future real data.
**Build target:** Cursor AI Agent
**Author:** Vikash — BusinessLabs

---

## 0. What changed from v1, and why

v1 shipped complete and verified (all 7 build steps + both subagent gates passed). This version is not a bug-patch — it changes the data model of two core nodes based on a scoping discussion. Read this section before touching code.

1. **`New Lead Added`** — no longer manages lead list creation/import inline. It only *references* an already-existing lead list. List creation/management is out of scope for Campaign Builder entirely (a separate page/feature, not built here).
2. **`Send Email`** — no longer supports manual subject/body typing inside the canvas. It becomes a **template selector**. Content creation happens on a separate (future) Template Builder page. This is the biggest change in this version — it removes the Manual/AI-Assist toggle and its text fields entirely from this node.
3. **A/B testing** on Send Email follows the same rule: Variant A/B are template selections, not manual text entry.
4. **New capability:** Save-as-reusable-campaign — save a built canvas (nodes + edges + configs, **including** the lead list reference as-is) as a reusable blueprint. **Resolved ambiguity (post-build clarification):** stripping the lead-list reference so a saved blueprint can be re-run against a *different* list is intentionally deferred to the version that builds the actual "start new campaign from blueprint" flow — since nothing consumes the blueprint yet, there's nothing to strip it *for* in this version. This version saves the full canvas verbatim.
5. **Bug fix:** left palette panel has a scroll/overflow bug — lower items are inaccessible via normal scroll at standard browser zoom (only reachable at ~160% zoom-out). This must be fixed as part of this version.
6. **`Tag Lead`** — move from active Actions group to the "Coming soon" deferred section (join `Opened?`, `Link Clicked?`, `Reply Sentiment`).

**Explicitly NOT in this version** (confirmed during scoping discussion — do not build):
- Template Library / Template Builder page itself (Send Email only scaffolds against it — see Section 2)
- Save-as-reusable-campaign's actual "start new campaign from blueprint" flow — only the "Save as Template" action is in scope this version; starting a new campaign from a saved blueprint is deferred to the version after, since it depends on this version's lead-list cleanup landing correctly first (per BusinessLabs' own sequencing decision, confirm before building if unsure)
- AI sequence/continuity review ("AI Review Sequence" button) — noted as a future idea only, not built now

---

## 1. Bug fix: Left palette scroll

**Symptom:** palette items below the fold are not reachable via scroll at normal browser zoom; only visible when the user zooms the browser out to ~160%.

**Likely cause (verify against actual code, don't assume):** the palette container has a fixed/constrained height without `overflow-y: auto`, or a parent flex container isn't correctly passing height constraints down, causing content to overflow silently instead of scrolling.

**Acceptance:** at 100% browser zoom, with enough nodes/groups to exceed the visible panel height, all items (including the "Coming soon" section) must be reachable via mouse scroll or trackpad scroll within the palette panel, independent of the rest of the page.

---

## 2. `New Lead Added` — revised config

**Before (v1):** Source dropdown — Manual list / CSV import / CRM sync (implied list creation/import happens inline)

**After (v2):**
- Single field: **"Lead List"** dropdown — lists an existing lead list by name, selected from a mock array (shape: `{id, name, leadCount}`)
- No import/creation UI of any kind in this node
- Card summary: e.g. "List: Q2 SaaS Founders (240 leads)"
- Empty state (no list selected yet): card summary reads "No list selected" and this counts as a validation warning — extend the **v1 spec's Section 3 (Connector & Validation Rules)** with a new check: entry trigger with no lead list selected → warning, added to the same live banner as the existing "no entry trigger" / "dead end" checks (not a new severity system — v1's validation is a flat warning list, keep it that way)

---

## 3. `Send Email` — revised config (core change)

**Before (v1):** Manual/AI-Assist toggle with inline Subject/Body or Intent/Tone fields.

**After (v2):**
- **"Select Template"** dropdown — populated from a mock template array. Shape: `{id, name, familyId, stepPosition, previewText}`
- Dropdown is filtered to templates matching the **current campaign's sequence family and this node's step position** (see Section 3.1 for how step position is determined)
- Below the dropdown: a link/button — **"Create or edit in Template Builder →"**. Since Template Builder doesn't exist yet, route it to a simple placeholder page/route that states "Template Builder — coming soon" (do not disable it silently; a working link to a stub page is preferred over a dead disabled button, per BusinessLabs' scaffold-for-easy-swap directive)
- **Preview area**: read-only rendering of the selected template's `previewText`, so the user can see what they picked without leaving the canvas
- No text input fields for writing email content exist in this node at all
- Card summary: e.g. "Template: Cold Open v1" or "No template selected" (empty state, counts as a dead-end-adjacent validation warning — a Send Email node with no template selected should warn, similar to an unconnected required field)

**Explicit clarification — AI-Assist mode is fully removed from the canvas, not just Manual mode.** In v1, Send Email had two modes: Manual (type it yourself) and AI-Assist (AI drafts it inline). Both are gone in v2 — AI assistance for writing content now lives entirely on the Template Builder page (per BusinessLabs: "in email template creation we will have the ai which will help and evaluate"). The canvas node has zero content-authoring capability of any kind, in either mode. If the agent implements this and leaves an AI-Assist toggle behind "just in case," that's a spec violation — flag it as such.

### 3.1 Backward compatibility with v1 canvas data

Any existing Send Email node data created under v1 (which stored `mode: 'manual'|'ai-assist'` plus `subject`/`body`/`prompt`/`tone` fields) will not match the new schema (`templateId`). On load, treat any v1-shaped Send Email config as **unmigrated**: render it as "No template selected" (empty state, triggers the validation warning above) rather than crashing or silently discarding data with no explanation. Do not attempt to auto-convert old manual content into a template — there's nothing to convert to yet since Template Builder doesn't exist. This only matters for demo/test canvases built during v1 verification; there's no real user data at stake.

### 3.2 Determining step position for filtering

**Gap in the original scoping discussion, fixed here:** step position alone isn't enough to filter correctly. BusinessLabs' original ask was "if the user builds a 5-email follow-up campaign, only 5-step-family templates should show" — but a template pool for "step 2 of a 5-step family" is different from "step 2 of a 3-step family," even though both are step 2. Ordinal position alone can't distinguish them.

**Mock resolution:** compute two values via canvas traversal, both derived live as the canvas changes —
1. `stepPosition` — ordinal position of this Send Email node among Send Email nodes in its path from the entry trigger (as originally specced)
2. `totalStepsInPath` — total count of Send Email nodes currently reachable in the longest path from entry trigger to a terminal node (Exit/Handoff), used as a stand-in for "family size"

Filter mock templates where `template.stepPosition === stepPosition AND template.familySize === totalStepsInPath`. Since `totalStepsInPath` can change as the user adds/removes nodes elsewhere on the canvas, this filter must recompute live, not just once on node creation — mirror the same `useMemo`-on-canvas-change pattern already used for v1's validation banner.

This does not need to be sophisticated — it's a mock filter to prove the pattern works, not a real sequence-family engine. Implement as a simple traversal function, documented inline as "MOCK — replace with real family/step metadata once Template Library exists." Seed mock template data with at least two family sizes (e.g. a 3-step family and a 5-step family) so the filtering is actually visible/testable rather than trivially always matching.

---

## 4. A/B testing — same rule applies

Both Variant A and Variant B sub-forms (from v1 Section on Send Email A/B) become **template selectors**, identical in structure to Section 3 above — one selector per variant, each filtered the same way, each with its own "Create or edit in Template Builder" link.

Split-ratio slider, winning-metric dropdown, and Lock winner toggle remain unchanged from v1.

Card summary example: "A/B: Cold Open v1 vs Cold Open v2 (Reply rate)"

---

## 4.1 Required update: AI-generate (chat-to-canvas) flow

v1's Step 7 built a deterministic keyword-mapping function that generates pre-configured Send Email nodes (previously in Manual mode, with placeholder subject/body text). That generator will now produce nodes in a schema that no longer exists. This must be updated as part of this version, not left broken:

- The generator should create Send Email nodes with **no template pre-selected** (empty state) rather than attempting to fabricate a fake `templateId` that doesn't exist in the mock template array
- This means AI-generated canvases will show validation warnings ("No template selected") on every generated Send Email node until the user manually picks templates — that's expected and correct behavior now, not a bug, and should be reflected in the AI-generate flow's existing Playwright tests
- Update the v1-era test file for this flow (`tests/step-07-ai-generate.spec.ts` or equivalent) to assert the new empty-template state rather than the old manual-mode fields it was previously checking

## 5. Tag Lead — move to deferred

Move `Tag Lead` from the active Actions group into the "Coming soon" Logic/deferred subsection (joining `Opened?`, `Link Clicked?`, `Reply Sentiment`), following the exact same greyed/non-draggable/tooltip pattern already built for those three in v1. No functional change to how deferred nodes behave — just relocating this one node into that treatment.

If any existing v1 canvas data references a `Tag Lead` node, it should still render correctly (read-only is acceptable) rather than crash — this is a defensive requirement since mock/demo canvases built during v1 testing may still reference it.

---

## 6. Save as Campaign Template (scope: save only, not reuse)

**What's in scope this version:**
- A **"Save as Campaign Template"** action (button in top bar, near existing Save/Publish) that serializes the current canvas's full node/edge/config state into a named blueprint object
- Stored as mock local state (an in-memory or localStorage-free — per artifact/browser-storage rules, use React state or a simple mock store — array of saved blueprints; no backend)
- A confirmation dialog on save: user names the blueprint (e.g. "Standard 5-Touch Cold Outreach")
- A simple **read-only list view** (can be a modal or side panel) showing saved blueprints by name — this proves the save action worked, without needing to build the full "start new campaign from this blueprint" flow

**Explicitly NOT in scope this version:** the "start a new campaign from a saved blueprint, with lead list reset" flow. That's the version after this one — flag this clearly if asked to build it prematurely. **Resolved:** the lead-list reference is saved as-is in the blueprint (not stripped) in this version, since stripping only becomes meaningful once the reuse flow exists to consume it.

---

## 7. Acceptance Criteria (v2 checklist)

- [ ] Left palette scrolls correctly at 100% browser zoom, all items including "Coming soon" section reachable
- [ ] `New Lead Added` shows only a Lead List dropdown (mock data), no import/creation UI
- [ ] Unselected lead list triggers a validation warning
- [ ] `Send Email` shows only Select Template dropdown + preview + Template Builder link — no manual text fields AND no AI-Assist toggle anywhere
- [ ] Template dropdown filters by both step position AND total-steps-in-path (family size), recomputed live as canvas changes
- [ ] Mock template data includes at least two family sizes (e.g. 3-step and 5-step) so filtering is actually testable
- [ ] Template Builder link routes to a real (if stub) page, not a dead disabled element
- [ ] Unselected template triggers a validation warning
- [ ] A/B Variant A and B both use the same template-selector pattern, independently
- [ ] Old v1-shaped Send Email data (manual/AI-assist fields) loads without crashing, renders as "No template selected"
- [ ] AI-generate (chat-to-canvas) flow updated: generates Send Email nodes with no template pre-selected, existing tests updated to match
- [ ] `Tag Lead` renders under "Coming soon," greyed, non-draggable, matching existing deferred-node pattern exactly
- [ ] "Save as Campaign Template" serializes and stores the current canvas, with a naming dialog
- [ ] Saved blueprints are visible in a read-only list
- [ ] No console errors across all of the above
- [ ] All new interactions have corresponding Playwright tests

---

## 8. Cursor Project Setup Notes

- Update `.cursor/rules/campaign-canvas.mdc` rule 5 ("node types are fixed to Section 2 of the v1 spec") to instead reference this v2 spec as the current source of truth, while keeping v1 spec in the repo as historical record — do not delete it.
- Re-run `spec-completeness-checker` and `spec-verifier` subagents against **this** document once v2 build steps are complete — update their file-path references if they hardcode "v1" anywhere.
- Recommended build order: (1) palette scroll bug fix — quick win, do first; (2) New Lead Added cleanup; (3) Send Email template-selector rebuild, including backward-compat handling for old v1 data (Section 3.1); (4) A/B template selectors; (5) update AI-generate flow to match the new Send Email schema (Section 4.1) — must come after step 3, since it depends on the new schema existing; (6) Tag Lead relocation; (7) Save as Campaign Template. This order front-loads the change that touches the most other nodes (Send Email) before the additive, lower-risk items, and places the AI-generate fix right after its dependency instead of forgetting it at the end.
