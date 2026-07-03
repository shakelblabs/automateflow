# AutomateFlow — App Shell + Sender Accounts — v1 Spec

**Module:** Platform shell + Sender Accounts page
**Scope:** UI ONLY — no backend, no real OAuth/SMTP/IMAP connections, no persistence beyond mock/local state. Same rules as Campaign Canvas v1/v2.
**Build target:** Cursor AI Agent
**Author:** Vikash — BusinessLabs
**Reads first:** `.cursor/rules/automateflow-core.mdc`, `docs/concepts/sender-account-behavior.md`, `campaign-canvas-v2-spec.md` (for existing patterns/components to reuse, not duplicate)

**Not in this file:** Template Builder is a separate, not-yet-scoped feature. It will get its own dedicated spec after this build ships — do not build it, reference it, or leave placeholder code for it as part of this spec. The sidebar's "Template Builder" nav item should point at whatever route already exists today (the current stub) unchanged — this spec does not modify that page.

---

## 0. Why this exists, and hard boundaries

Campaign Builder currently renders as a single page with no navigation shell — this blocks adding Sender Accounts (and any future page) as a real, reachable part of the app. This spec closes that gap and scaffolds Sender Accounts to the same standard as Campaign Canvas: fully real UI/UX, mock data underneath, structured so a backend can be plugged in later without a rebuild.

**Non-negotiable boundaries:**
- No real OAuth flow, no real SMTP/IMAP connection, no real email sending. Everything is UI + mock/local state.
- No credential encryption logic — there's no backend to encrypt *for* yet. Captured credentials live in local component state only, clearly commented as mock, never sent anywhere.
- No real reply-polling/IMAP-sync logic (job scheduling) — out of scope per `sender-account-behavior.md`, deferred to whenever the real sending/reply engine is built.
- Do not touch Campaign Canvas's existing components/files except where explicitly noted (wrapping it in the new shell).
- Do not touch or modify the existing `/template-builder` stub route — out of scope for this spec entirely.
- Reuse existing patterns/components where they already exist (dialogs, buttons, form field styling) — do not rebuild styling conventions from scratch for this new page.

---

## 1. App Shell (Sidebar + Top Nav)

**Layout:** wraps every page in the app — Campaign Builder, Sender Accounts, and future pages.

**Sidebar (left, persistent):**
- Workspace/product name at top
- Nav items, in order:
  1. **Campaign Builder** (active page today) — links to existing canvas
  2. **Sender Accounts** — new page, this spec
  3. **Template Builder** — links to the existing stub route, unchanged (not part of this spec's scope)
  4. **Dashboard** — greyed/disabled, "Coming soon" tooltip, same visual treatment as Campaign Canvas's deferred nodes
  5. **Leads** — greyed/disabled, "Coming soon" tooltip, same treatment
- Active page indicator (highlight current nav item)
- **Width budget — important:** Campaign Canvas already spends ~660px on its own left palette (320px) + right inspector (340px), leaving the middle canvas to fill whatever's left. An additional wide (~240px+) app-level sidebar on top of that will meaningfully crush the canvas on laptop-sized screens. Default the app sidebar to a **narrow icon rail (~64-72px, icons only, tooltip on hover)** rather than a wide labeled sidebar. Expand-to-labeled-view on hover or toggle is fine as a nice-to-have, but icon-rail must be the default so Campaign Builder's existing layout isn't broken by this addition.

**Top bar — two-tier structure, not a replacement:**
- The app shell adds a **thin, global utility bar** (breadcrumb/page title + user menu) that sits above every page.
- Campaign Canvas's **existing page-level top bar** (campaign name, status badge, Test run/Save/Publish) is NOT replaced, merged, or rebuilt — it remains exactly as built, rendering as that page's own header, directly below the new global bar. This is an intentional two-tier structure (common pattern: thin global bar + contextual page header), not a bug to reconcile into one bar. Do not attempt to merge Campaign Canvas's actions into the app shell's top bar.
- Sender Accounts gets its own simple page-level header (title + primary action button, "Add Sender Account") following the same two-tier pattern, for consistency.
- User/account menu on the global bar — mock only (avatar + name, dropdown can be static/non-functional).

**State persistence across navigation — explicit technical requirement:**
Campaign Canvas's nodes/edges currently live in page-local React state, which Next.js will unmount on route change by default — silently discarding an in-progress canvas the moment someone navigates away and back. To honestly meet "no data loss within a session" (below), canvas state must be **lifted out of the page component into a provider/context or store that lives at the app-shell layout level**, not inside the page itself, so it survives route changes. This is a real architectural change, not just a claim — flag it explicitly in the Section 1 build plan rather than assuming it falls out for free.

**Acceptance:**
- Navigating between Campaign Builder and Sender Accounts via sidebar works and preserves each page's own state independently within a session (a hard page refresh losing state is acceptable, per existing no-persistence rules — but clicking to another page and back must not lose in-progress work)
- Sidebar defaults to icon-rail width; Campaign Canvas's existing 3-panel layout is not visually cramped as a result
- Campaign Canvas's existing top bar renders unchanged, below the new global utility bar — no double-bar visual awkwardness, no lost functionality
- Coming-soon items are visibly disabled, non-clickable, tooltipped
- No console errors on navigation

---

## 1.1 Route map (explicit, don't let the agent invent paths)

| Page | Route |
|---|---|
| Campaign Builder | `/` (existing — confirm this is the current root; if Campaign Canvas currently lives elsewhere, keep its existing path rather than moving it) |
| Sender Accounts | `/sender-accounts` |
| Template Builder | existing stub route, untouched — do not modify |
| Dashboard | not routed yet — nav item only, disabled |
| Leads | not routed yet — nav item only, disabled |

---

## 2. Sender Accounts Page

### 2.1 Account List View
- Table/card list of connected accounts (mock data array: `{id, email, connectionType: 'smtp'|'oauth', dailyCap, mockUsageToday}`)
- Each row shows: email, connection type badge, daily cap, a usage indicator (progress bar or "32/50 today" — static mock number per account, not live-updating)
- Empty state when no accounts added yet

### 2.2 Add Sender Account flow
- **"Add Sender Account"** button opens a dialog/modal (mirror `save-template-dialog.tsx`'s overlay pattern)
- Two connection method tabs/options:
  - **"Connect with Google" / "Connect with Outlook"** — visibly present, **disabled**, tooltip "Coming soon — OAuth connection" (same scaffold-not-fake pattern used elsewhere in the app)
  - **Manual (SMTP/IMAP)** — the working v1 path:
    - Email address field
    - SMTP: host, port, username, password
    - IMAP: host, port, username, password (can default to "same as SMTP" checkbox to reduce form friction)
    - Daily cap field — number input, default 50 (per `sender-account-behavior.md` Section 1), editable
- On submit: validates required fields, adds to the mock account list, closes dialog, success toast (matches existing Save/Publish toast pattern)
- **All credential fields are captured into local state only** — clearly commented in code as mock/local, never transmitted. Include a **"Test Connection" button, visibly present but disabled**, tooltip "Coming soon" — same scaffold pattern as the OAuth buttons, not omitted and not faked with a real handshake.

### 2.3 Account detail / edit
- Clicking an account opens edit view (same dialog, pre-filled) — edit and delete both work against the mock local array
- Delete requires a confirm step (destructive action)

### 2.4 Pool visualization (read-only demo)
- A simple section showing, conceptually, how the assignment logic from `sender-account-behavior.md` would distribute leads across accounts — e.g. a static/mock table: "Account | Assigned leads today (mock) | Room left"
- This is illustrative only — it does not reflect real campaign data or perform real assignment. Label clearly as a preview/demo of the pooling concept, not live data.

---

## 3. Explicitly deferred (do not build this version)

- Real OAuth connection flow
- Real SMTP/IMAP send or connection testing
- Real reply-polling/IMAP sync
- Credential encryption/secure backend storage
- Live-updating usage counters (Section 2.4's pool view is illustrative/static only)
- Template Builder in any form — separate spec, separate conversation, not part of this build

---

## 4. Acceptance Criteria (checklist)

- [ ] Sidebar + top nav wraps all pages, navigation works, no state loss within a session
- [ ] Sidebar defaults to icon-rail width, doesn't crush Campaign Canvas's existing layout
- [ ] Campaign Canvas's existing top bar unchanged, no double-bar issue
- [ ] Coming-soon nav items (Dashboard, Leads) greyed, disabled, tooltipped
- [ ] Template Builder nav item links to existing stub route, unmodified
- [ ] Sender Accounts: list view renders mock accounts with usage indicators
- [ ] Add Sender Account: manual SMTP/IMAP form works end-to-end (add, appears in list)
- [ ] Add Sender Account: OAuth buttons visible, disabled, tooltipped
- [ ] Test Connection button visible, disabled, tooltipped
- [ ] Edit and delete sender accounts work against mock state
- [ ] Pool visualization section renders, clearly labeled as illustrative/mock
- [ ] No console errors across all of the above
- [ ] All new interactions have corresponding Playwright tests

---

## 5. Cursor Project Setup Notes

- Reuse existing dialog/modal, button, and form-field components/styling from Campaign Canvas rather than creating new ones — check `save-template-dialog.tsx`, `AppButton` usage first.
- Update `.cursor/rules/automateflow-core.mdc` if any new conventions emerge (e.g. a shared form-field component pattern) — keep it as the single source of truth, don't create a second rules file.
- Recommended build order: (1) App Shell first, since Sender Accounts needs it to be reachable/testable at all; (2) Sender Accounts. Run `spec-completeness-checker` and `spec-verifier` against this spec once both are done, same gate process as Campaign Canvas.
- Test file naming: continue the existing `tests/step-NN-*.spec.ts` numbering convention (Campaign Canvas is currently at step-09) — e.g. `step-10-app-shell.spec.ts`, `step-11-sender-accounts.spec.ts` — rather than inventing a new naming scheme.
