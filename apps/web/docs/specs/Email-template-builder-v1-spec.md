# AutomateFlow — Email Template Builder — v1 Spec

**Module:** Email Template Builder page (replaces the `/template-builder` stub route)
**Scope:** UI ONLY — no backend, no real AI API calls, no real crawling/personalization. Mock data live-wired to Campaign Canvas via shared provider state (not a backend — same session-only pattern as everything else).
**Build target:** Cursor AI Agent
**Author:** Vikash — BusinessLabs
**Reads first:** `.cursor/rules/automateflow-core.mdc`, `campaign-canvas-v2-spec.md`, `platform-shell-sender-v1-spec.md` (for the provider pattern used by `CampaignCanvasProvider`/`SenderAccountsProvider` — this page follows the same shape)

---

## 0. What this replaces, and hard boundaries

Send Email's template dropdown (Campaign Canvas) currently filters against a static mock array in `email-templates.ts`. This spec makes that data real-ish: created here, shared live across the app via provider state, so Send Email's dropdown reflects what's actually built on this page — while still being entirely mock/session-only underneath, no backend.

**Non-negotiable boundaries:**
- No real AI API calls — AI-Assist and both Evaluate features are mock/deterministic logic, not real model calls.
- No real web crawling or LinkedIn/company-data personalization — `{personalization}` token exists visually only, greyed, non-functional.
- No real variable replacement — `{first_name}` etc. are literal text stored in the template; substituting real lead data happens only once a real sending engine exists (future).
- Do not modify Campaign Canvas's Send Email node component itself — only the **data source** it reads from changes (from the old static `email-templates.ts` array to shared provider state). The dropdown, filtering logic (`send-email-position.ts`), and UI stay as built.
- Session-only state (same as `CampaignCanvasProvider`/`SenderAccountsProvider`) — refresh loses data, that's expected and fine.

---

## 1. Provider architecture (live-wiring, not a rebuild)

- New `TemplateLibraryProvider`, sibling to `CampaignCanvasProvider` and `SenderAccountsProvider`, added at the shell layout level (same pattern established in the platform shell build).
- Holds the template array in shared session state: `{id, name, familyId, familyName, familySize, stepPosition, subject, body, previewText}[]`.
- Campaign Canvas's Send Email node's template dropdown reads from `useTemplateLibrary()` instead of importing the static `email-templates.ts` array directly. `email-templates.ts`'s mock seed data becomes this provider's **initial state** (so existing Campaign Canvas demo data/tests still work on first load) rather than being deleted outright.
- This is the same kind of "lift state to survive navigation" change already done for canvas nodes/edges — not a new pattern, just applied to templates.

---

## 2. Template List View (landing page)

- Templates are grouped and displayed **by family**, not as a flat list — each family shows as one card/row: family name, step count (e.g. "3-Step Cold Outreach"), and a preview of how many steps are filled in.
- Clicking a family opens the family editor (Section 3).
- **"Create New Family"** button starts the family-at-once creation flow.
- Empty state when no families exist yet.

---

## 3. Family-at-once creation flow (core change from earlier draft)

This is the primary authoring flow — **not** one-template-at-a-time. Creating a sequence family is a single guided flow:

### 3.1 Step 1: Family setup
- Family name (e.g. "Cold Outreach — SaaS Founders")
- Family size — dropdown or stepper: 1 / 3 / 5 steps (matching Campaign Canvas's existing mock family sizes; extendable later but these three are sufficient for v1)
- Confirms → generates that many empty step slots

### 3.2 Step 2: Fill each step
- All steps are visible together in the editor (tabs, or a vertical stack with clear step numbering — tabs preferred for focus, but stacked is acceptable if simpler to build well)
- Each step slot has:
  - **Manual / AI-Assist mode toggle** (same pattern as Campaign Canvas's original Send Email mock, reused here — not reinvented)
  - Manual: Subject + Body fields
  - AI-Assist: Intent/offer prompt + Tone dropdown + "Generate" → mock placeholder copy into Subject/Body
  - **Variable token picker** (Section 4) — inserts tokens into whichever field has focus
  - **Evaluate actions** (Section 5) — "Check Spam Score" and "Check Tone & Sequence Fit," both scoped to this step, with the sequence-fit check able to reference sibling steps' content since they're all in the same editing session
- Because all steps exist in memory together during this flow, the sequence-fit check (Section 5.2) can genuinely compare step 2's opening line against step 1's content for repetition — this is the reason family-at-once matters, not just a UX preference.

### 3.3 Step 3: Save
- **"Save Family"** — single action, saves all steps as individual template records sharing one `familyId`, into `TemplateLibraryProvider`
- Partial saves are allowed (a step can be left blank and filled in later via edit) — but the family itself is created/saved as one unit, not step-by-step separate saves
- Success toast, returns to Template List View

### 3.4 Editing an existing family
- Opens the same multi-step editor, pre-filled, same Save action (overwrites in place)

---

## 4. Variable / merge-field tokens

- A token picker (dropdown or button row) near each step's Subject/Body fields, inserting the token as literal text at cursor position
- **v1 real tokens:** `{first_name}`, `{last_name}`, `{company}`, `{job_title}`, `{city}`
- **Future token, shown but disabled:** `{personalization}` — greyed out in the picker, tooltip "Coming soon — AI-powered personalization from lead data"
- Tokens inserted into text are just literal strings (`{first_name}`) — no live preview substitution needed in v1 (no lead data exists to substitute from yet); the preview area (Section 3.2) shows the raw template text including literal tokens

---

## 5. AI Evaluate features (mock, not real AI)

Both are user-triggered buttons per step, not automatic on every keystroke.

### 5.1 Check Spam Score
- Scans the step's current Subject + Body against a static list of common spam-trigger words/phrases (e.g. "free," "buy now," "act now," "guarantee," "risk-free," "click here," excessive `!`, ALL-CAPS runs)
- Returns a mock score (0-100) + a risk label ("Low" / "Medium" / "High")
- Lists flagged words/phrases, with each one highlighted inline in the text and a short generic improvement suggestion (e.g. "Consider a softer alternative to 'Act now'")
- Deterministic — same input always produces the same score (a simple rule-based function, not randomness), so results feel meaningful and testable

### 5.2 Check Tone & Sequence Fit
- Compares the step's content against its selected Tone dropdown value using a simple mock heuristic (e.g. exclamation-mark density, average sentence length, presence of casual phrases) → flags mismatches like "This reads more casual than your selected 'Professional' tone"
- **Sequence guidance**, keyed to `stepPosition` within the family:
  - Step 1 → guidance: "This should introduce yourself and the offer clearly."
  - Step 2 → guidance: "Reference the previous email briefly, don't repeat the pitch — add new value."
  - Step 3+ → guidance: "Consider social proof or a new angle, not just 'following up.'"
- If other steps in the family have content, run a simple repetition check (e.g. shared-phrase overlap above a naive threshold) between this step and the immediately preceding step, flagging likely duplication
- This is guidance text, not a hard block — never prevents saving

---

## 6. Acceptance Criteria (checklist)

- [ ] Template List View groups templates by family, shows step-fill progress
- [ ] "Create New Family" starts the family-size-first flow (1/3/5 steps)
- [ ] All steps in a family are editable together in one session
- [ ] Manual and AI-Assist modes both work per step (AI mock-generates placeholder copy)
- [ ] Variable token picker inserts `{first_name}`, `{last_name}`, `{company}`, `{job_title}`, `{city}` correctly
- [ ] `{personalization}` token visible, disabled, tooltipped
- [ ] Check Spam Score returns a deterministic mock score + flagged words + suggestions
- [ ] Check Tone & Sequence Fit returns tone-mismatch feedback + step-position-appropriate guidance + basic repetition check against the prior step
- [ ] Save Family writes all steps as linked records (shared `familyId`) into `TemplateLibraryProvider`
- [ ] Editing an existing family pre-fills correctly and overwrites on save
- [ ] Campaign Canvas's Send Email dropdown reflects templates created here (live provider read, confirmed by creating a template here and seeing it appear in the canvas dropdown without a page refresh)
- [ ] Campaign Canvas's existing filtering logic (`send-email-position.ts`, stepPosition + familySize) continues to work correctly against provider-sourced data
- [ ] No console errors across all of the above
- [ ] All new interactions have corresponding Playwright tests

---

## 7. Explicitly deferred (do not build this version)

- Real AI API calls (writing or evaluation) — everything in Sections 3.2 and 5 is deterministic mock logic
- Real web crawling / LinkedIn / company data for `{personalization}`
- Real variable substitution with actual lead data (requires the sending engine, doesn't exist yet)
- Family sizes beyond 1/3/5
- Any backend persistence — session-only, same as the rest of the app

---

## 8. Cursor Project Setup Notes

- Reuse `save-template-dialog.tsx`'s overlay pattern, `AppButton`, existing form-field styling — do not reinvent.
- Reuse Send Email's original Manual/AI-Assist mock-generation logic pattern (from Campaign Canvas v1, before it was removed in v2) as the basis for this page's AI-Assist — same placeholder-copy approach, don't design a new mock generation style.
- The provider-wiring change to Send Email's dropdown is a **data-source swap**, not a UI change — verify Campaign Canvas's existing step-08 tests (`send-email-template.spec.ts`) still pass unmodified against the new provider-backed data, since the shape must be identical to what those tests already expect.
- Test file naming: continue `step-NN` convention — e.g. `step-12-template-builder.spec.ts`.
- Run `spec-completeness-checker` and `spec-verifier` against this spec once built, same gate as every prior feature. Pay particular attention to the live-wiring acceptance criterion — verify it with an actual cross-page test (create template here, switch to Campaign Builder, confirm it appears), not just a unit test of the provider in isolation.
