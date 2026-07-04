# AutomateFlow — Lead List Management — v1 Spec

**Module:** Lead List Management page (`/leads`) — replaces the disabled "Leads" sidebar placeholder and the static `LEAD_LISTS` mock currently embedded in `node-definitions.ts`
**Scope:** UI ONLY — no backend, no database, no real network calls. No real CSV parsing library (hand-rolled client-side parsing only, per tech-stack rules). Brilliant Directories sync is fully simulated/deterministic mock data — the real connection UI is owned by the companion `integrations-v1-spec.md`; this page only *consumes* that connection, it does not build it.
**Build target:** Cursor AI Agent
**Author:** Vikash — BusinessLabs
**Reads first:** `.cursor/rules/automateflow-core.mdc`, `campaign-canvas-v2-spec.md` Section 2 (exact `New Lead Added` contract that must not silently break), `platform-shell-sender-v1-spec.md` (provider + shell pattern), `Email-template-builder-v1-spec.md` Section 1 (closest precedent for live-wiring mechanics), `integrations-v1-spec.md` (companion spec — owns the Brilliant Directories connection this page reads from)

**Not in this file:**
- Tag Lead node relationship — completely out of scope. No `tags` field reserved on the schema, no UI, no mention beyond this line. Revisit entirely whenever `Tag Lead` itself moves out of "Coming soon."
- Google Sheets / CRM sync beyond Brilliant Directories — pure disabled placeholder cards, owned by `integrations-v1-spec.md`. No logic, schema, or behavior defined for them here or there.
- Real AI personalization / social-profile crawling — the social/bio fields (Section 2) are captured and stored only; actually crawling or generating personalized copy from them is future Template Builder / AI-Assist work, not this spec.

---

## 0. What this replaces, and hard boundaries

`New Lead Added` (Campaign Canvas trigger node) currently references a lead list via a dropdown backed by a static, hardcoded array in `apps/web/src/lib/node-definitions.ts` (lines 12-16):

```ts
export const LEAD_LISTS: { id: string; name: string; leadCount: number }[] = [
  { id: "q2-saas-founders", name: "Q2 SaaS Founders", leadCount: 240 },
  { id: "enterprise-cto", name: "Enterprise CTOs", leadCount: 88 },
  { id: "webinar-signups", name: "Webinar Signups — May", leadCount: 512 },
];
```

No page manages this data today — it's hardcoded, and the sidebar's "Leads" nav item is a disabled placeholder waiting for exactly this feature (`app-sidebar.tsx`, `DeferredNavItem`). This spec makes that data real-ish: a full list + per-lead CRUD management surface at `/leads`, live-wired into Campaign Canvas via provider state — same pattern already used for `TemplateLibraryProvider` — while remaining entirely mock/session-only underneath.

**Non-negotiable boundaries:**
- No real CSV parsing library — parsing is hand-rolled (`File.text()` + manual split/quote handling), since this is achievable client-side without breaking the "UI-only" rule.
- No real HTTP calls anywhere in this spec — even the Brilliant Directories "sync" is fully simulated/deterministic mock data, generated locally. The actual connection form lives in `integrations-v1-spec.md`; this page just calls into that provider's mock sync function.
- No database, no persistence beyond session state — refresh loses data, same as every other feature (`CampaignCanvasProvider`, `SenderAccountsProvider`, `TemplateLibraryProvider`).
- Do not modify `New Lead Added`'s card summary wording/format. It stays exactly `"List: {name} ({leadCount} leads)"` — only the data source changes from the static array to live provider data. `leadCount` becomes a computed value (count of actual lead records in that list) instead of a hardcoded number.
- Do not modify Campaign Canvas's node components, edges, or canvas interactions — only `node-definitions.ts` and `node-config-panel.tsx` are touched, and only for the `trigger-new-lead` node's config/data source (see Section 6).
- No `tags` field, no Tag Lead relationship — see "Not in this file" above.

---

## 1. Provider architecture (live-wiring, not a rebuild)

- Extract the current static `LEAD_LISTS` array out of `node-definitions.ts` into a new `src/lib/lead-lists.ts` (mirroring the existing `email-templates.ts` pattern) — export the full `Lead` and `LeadList` interfaces (Section 2/3), seed data, and helper functions (`getLeadListById`, `generateLeadId`, `generateListId`, etc.).
- New `LeadListProvider`, sibling to `CampaignCanvasProvider` / `SenderAccountsProvider` / `TemplateLibraryProvider`, registered in `app-providers.tsx`.
- `lead-lists.ts`'s seed data (the three existing lists, expanded with a handful of mock leads each) becomes `LeadListProvider`'s **initial state** — not deleted — so existing Campaign Canvas demo data/tests still work unmodified on first load.
- **The live-wiring wrinkle unique to this node (flag explicitly, don't gloss over it):** `New Lead Added`'s dropdown today is rendered by the *generic* field system — `NodeConfigPanel`'s `ConfigField` component reads `field.options`, which for `leadList` is a **statically-evaluated array built once at module load** (`options: LEAD_LISTS.map(...)`, `node-definitions.ts` lines ~136-143). A static array can never reflect live provider data no matter what the provider holds. This is architecturally different from Send Email, which already bypasses the generic field system entirely via a dedicated `SendEmailConfig` component.

  **Required change:** mirror the Send Email precedent exactly — build a small dedicated `NewLeadTriggerConfig` component (`src/components/campaign/new-lead-trigger-config.tsx`) that calls `useLeadLists()` directly and renders the same visual dropdown, and wire it into `node-config-panel.tsx`'s special-case branch (`selectedNode.data.nodeType === "action-send-email" ? <SendEmailConfig .../> : ...`) as an additional `else if` for `"trigger-new-lead"`, before the generic field-map fallback. Remove the `fields: [{id: "leadList", ...}]` declarative entry from the `trigger-new-lead` `NodeDefinition` once this is in place (the dedicated component fully replaces it, same as Send Email's `fields: []`).
- `NodeDefinition["summary"]`'s signature (currently `(config: NodeConfigValues, templates?: EmailTemplate[]) => string`) gets a second optional live-data parameter, `leadLists?: LeadListSummary[]`, mirroring how `templates` is already threaded through. Update the one call site in `node-config-panel.tsx` (`summarize(selectedNode.data.nodeType, config, templates)`) to also pass `useLeadLists().lists`, and update `trigger-new-lead`'s `summary` function to look up the list from that parameter instead of the removed static `LEAD_LISTS` import.
- No other Campaign Canvas file changes. `send-email-config.tsx`, `send-email-position.ts`, edges, and validation logic (`validation.ts`) are untouched.

---

## 2. Lead schema

Individual lead fields — `email` and `first_name` are the only mandatory fields (row rejected on import/manual-add if either is missing). Everything else is optional; a missing optional field never blocks an import or breaks downstream logic.

| Group | Field | Mandatory | Notes |
|---|---|---|---|
| Core contact | `email` | **Yes** | Nothing can be emailed without it |
| Core contact | `first_name` | **Yes** | Product decision, not a technical one — `{first_name}` merge token is core to AutomateFlow's personalization pitch |
| Core contact | `last_name` | No | |
| Core contact | `company` | No | Merge token `{company}` |
| Core contact | `job_title` | No | Merge token `{job_title}` |
| Core contact | `phone_number` | No | Not used for email sending; metadata only |
| Location | `city` | No | Merge token `{city}` |
| Location | `state` | No | Stored as full name (e.g. "California"), not an ISO code |
| Location | `country` | No | Stored as full name (e.g. "United States"), not an ISO code |
| Social / personalization sources | `website`, `linkedin`, `twitter`, `facebook`, `youtube`, `instagram`, `pinterest`, `blog` | No | Raw URLs only — no crawling/fetching happens in this spec; these are storage fields for a future AI-personalization step |
| Bio / professional context | `about_me`, `quote`, `years_experience`, `credentials`, `affiliation`, `awards`, `work_experience` | No | Rich text/number fields intended as future AI-personalization source material |
| Compliance | `user_consent` | No | Captured for future compliance use; no enforcement logic in this spec |
| Internal (hidden, never rendered as a user-facing field or merge token) | `_bdMemberId` | N/A | Only present on leads synced from Brilliant Directories. Used to match a lead across repeated syncs (Section 3.6) — never shown in the UI, never exported as a mail-merge token |

**Flagged, not built:** raw timezone is **not** a stored field in v1. `sender-account-behavior.md` Section 5 already flags that lead-level timezone may matter for future business-hours sending logic — if that's ever built, timezone would be *derived* from location data at that time, not stored raw here. No action required in this spec beyond this note.

### List-level schema

| Field | Notes |
|---|---|
| `id` | Internal, generated |
| `name` | Required, set at creation |
| `leadCount` | **Computed** — count of `leads.length`, never stored/hand-edited |
| `source` | `"manual" \| "csv" \| "brilliant-directories"` — set once at list creation, shown as a badge for traceability. A list can still receive leads from multiple methods over time; `source` reflects how the list itself was originally created, not a strict single-origin guarantee. |
| `leads` | `Lead[]` — the actual records |

---

## 3. `/leads` page

*Functional behavior only — for exact visual treatment (spacing, color, motion, component chrome) of every element described below, see Section 7.*

### 3.1 List view (landing page)

- Table/card list of all lead lists: `name`, `leadCount` (computed), `source` badge.
- Clicking a list opens its detail view (Section 3.3).
- **"New List"** button starts the creation flow (Section 3.2).
- Empty state (zero lists): prominent, friendly empty state with a single "Create your first list" CTA that opens the creation flow directly.

### 3.2 List creation flow

- Wizard: Step 1 — name the list. Step 2 — immediately offers the import method picker (Manual / CSV / Brilliant Directories), but **"Skip for now"** is always available, creating an empty named list with `leadCount: 0`.
- Manual/CSV/Brilliant Directories can all be used later from an existing list's detail view too — the wizard's step 2 is a convenience, not the only entry point.

### 3.3 List detail view — per-lead CRUD

- Full per-lead CRUD: table of leads in the list, view any lead's full field set, edit any field inline or via a detail dialog, delete individual leads (with confirm step, matching the existing destructive-action pattern from Sender Accounts' delete flow).
- **Leads table UX:**
  - Search/filter by name or email.
  - Pagination (lists can hold 500+ leads per existing mock data — no unpaginated full-table render).
  - Bulk select + bulk delete + bulk move-to-another-list.
- **Empty state** (list exists, zero leads): import method options (Manual / CSV / Brilliant Directories) shown inline in the empty state, not just a generic "no leads" message.
- **"Add Leads"** button (when the list already has leads) opens the same import picker used in the creation wizard and empty state — one shared component, not three different pickers.

### 3.4 Import methods

**Manual entry** — a form for all Section 2 fields, `email` and `first_name` marked required, submit adds one lead to the current list (dedup rules apply, Section 3.5).

**CSV upload** — file upload, parsed entirely client-side (no library, hand-rolled parsing per tech-stack rules). Fixed/expected header row, case-insensitive and whitespace-trimmed matching:

| Order | Header | Maps to | Required |
|---|---|---|---|
| 1 | `email` | `email` | **Yes** |
| 2 | `first_name` | `first_name` | **Yes** |
| 3 | `last_name` | `last_name` | No |
| 4 | `company` | `company` | No |
| 5 | `job_title` | `job_title` | No |
| 6 | `phone_number` | `phone_number` | No |
| 7 | `city` | `city` | No |
| 8 | `state` | `state` | No |
| 9 | `country` | `country` | No |
| 10 | `website` | `website` | No |
| 11 | `linkedin` | `linkedin` | No |
| 12 | `twitter` | `twitter` | No |
| 13 | `facebook` | `facebook` | No |
| 14 | `youtube` | `youtube` | No |
| 15 | `instagram` | `instagram` | No |
| 16 | `pinterest` | `pinterest` | No |
| 17 | `blog` | `blog` | No |
| 18 | `about_me` | `about_me` | No |
| 19 | `quote` | `quote` | No |
| 20 | `years_experience` | `years_experience` | No |
| 21 | `credentials` | `credentials` | No |
| 22 | `affiliation` | `affiliation` | No |
| 23 | `awards` | `awards` | No |
| 24 | `work_experience` | `work_experience` | No |
| 25 | `user_consent` | `user_consent` | No |

- Unknown/extra columns in an uploaded file are ignored, not treated as an error.
- A downloadable empty template CSV (this header row only) is offered on the import UI.
- Malformed rows (missing `email` or `first_name`) are **skipped**, never crash the import, and are reported in a post-import summary ("Imported 240, skipped 12 — see details"). Rows with dirty/missing optional fields import fine with those fields blank.

**Brilliant Directories** — this page does **not** own the connection. It reads connection status from `integrations-v1-spec.md`'s `IntegrationsProvider`:
- If not connected: the option is shown but directs the user to `/integrations` to connect first (not a dead click, not a duplicate credential form on this page).
- If connected: clicking it calls the integration's simulated sync function, then presents a target-list picker (existing list or "create new") — same picker pattern as CSV — before actually writing the returned leads into `LeadListProvider`.

### 3.5 Deduplication

- Same list, same email already present → new/updated row is **skipped**, reported in the import summary as a duplicate.
- Different list, same email already present elsewhere → **allowed**, with a soft warning shown ("This lead is also in: Q2 SaaS Founders, Webinar Signups — May").

### 3.6 Claimed-member handling (Brilliant Directories only)

- Every lead synced from Brilliant Directories carries the hidden `_bdMemberId` field (Section 2), used purely to match the same underlying BD member across repeated syncs — never shown in the UI.
- If a lead that had an `email` value in an earlier sync is returned **without** an `email` in a later sync (same `_bdMemberId`), that member has converted to a paid/claimed BD plan and must stop receiving sales email outreach.
- On detecting this transition, the lead is **automatically moved** out of its current list into a single, **global** `"Claimed Members"` list.
  - This list is created **lazily** — only the first time any lead actually converts, not upfront when a Brilliant Directories connection is set up.
  - It is fully viewable and manageable like any other list (per-lead CRUD applies) — it is not a locked/read-only suppression list. Exclusion from campaign sends is a convention (campaigns simply shouldn't select it), not an enforced technical lock in this spec.

---

## 4. Empty states (consolidated reference)

| State | Treatment |
|---|---|
| Zero lists exist | Prominent "Create your first list" CTA, opens creation wizard |
| A list exists, zero leads | Import method options (Manual / CSV / Brilliant Directories) shown inline |
| CSV import with all rows invalid | Import summary shows "0 imported, N skipped" with reasons — never a blank/silent failure |

---

## 5. `New Lead Added` contract — must not break

This is the explicit "don't silently break this" contract, per `campaign-canvas-v2-spec.md` Section 2:

- Field: single **"Lead List"** dropdown — unchanged.
- Card summary format: unchanged — `"List: {name} ({leadCount} leads)"`, or `"No list selected"` when empty (unchanged validation-warning behavior per v2 spec's Section 3 extension).
- Only the **data source** changes: dropdown options and `leadCount` now come from `useLeadLists()` (live, computed) instead of the static `LEAD_LISTS` array.
- No visual, interaction, or validation-severity changes to this node.

---

## 6. Explicitly deferred (do not build this version)

- Tag Lead relationship of any kind.
- Real CSV parsing library, real Google Sheets/CRM sync, real Brilliant Directories API calls — everything data-import-related beyond manual entry and hand-rolled CSV parsing is simulated.
- Real AI personalization, web/social crawling using the stored social/bio fields — storage only in this spec.
- Enforcement of `user_consent` (e.g. blocking sends to non-consented leads) — field exists, no logic reads it yet.
- Per-list description field, created/updated timestamps on lists — deliberately excluded from v1 list schema.
- Any backend persistence — session-only, same as the rest of the app.

---

## 7. Visual & Interaction Design System (senior UI/UX detail)

This section is written to the same standard a senior product designer would hand to engineering — exact values, not vibes. It **extends the existing design language already built for Sender Accounts** (`sender-accounts-header.tsx`, `sender-account-list.tsx`, `sender-account-dialog.tsx`, `delete-sender-account-dialog.tsx`) rather than inventing a new visual style. Every class/value below is either lifted directly from that existing code or a deliberate, explained extension of it. Do not introduce a different visual language for this page — a user should not be able to tell Lead Management was built in a separate pass from Sender Accounts.

### 7.1 Design tokens in play (already defined, reuse — do not redefine)

- **Accent color:** emerald/teal gradient family (`emerald-500/600/700`, `teal-400/500`) for primary actions, success states, and active/hover accents. `--ring: #10b981` (emerald-500) is the global focus-ring color.
- **Neutral scale:** `slate-50` through `slate-900` for backgrounds, borders, and text hierarchy.
- **Destructive:** `red-600`/`red-700` for actions, `red-50`/`red-100` for backgrounds, `red-600` on `red-50` for inline errors.
- **New accent needed — claimed/warning state:** `amber-500/600/700` family. Not used elsewhere in the app yet; introduce it specifically for "claimed member" and "duplicate warning" indicators (Section 7.8) so these read as a distinct third state (not success, not destructive — a caution/informational state).
- **New accent needed — external-source distinction:** `violet-500/600/700` family, used only for the Brilliant Directories source badge (Section 7.8), so leads/lists sourced externally are visually distinguishable at a glance from manually-managed ones. CSV keeps the `blue-500/700` tone already used for the OAuth "outlook"-style badge in Sender Accounts, reused here for consistency of meaning ("blue = imported in bulk from a file"), not because CSV and Outlook are related — just reusing an existing tone rather than adding a fourth new color family.
- **Radius scale:** `rounded-[0.625rem]` (buttons, inputs, small controls), `rounded-xl` (icon avatars, fieldsets, small dialogs), `rounded-2xl` (cards, main dialogs, empty states).
- **Shadow recipes (reuse verbatim):**
  - Card resting: `shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05),0_1px_4px_-1px_rgba(0,0,0,0.02)] ring-1 ring-slate-200/50`
  - Card hover: `hover:shadow-[0_8px_24px_-4px_rgba(16,185,129,0.1),0_4px_12px_-2px_rgba(16,185,129,0.06)] hover:ring-emerald-500/30 hover:-translate-y-1`
  - Dialog: `shadow-2xl`
- **Motion:** `transition-all duration-300` for card hover/lift, `duration-1000 ease-out` for progress-bar-style fills, `animate-in fade-in zoom-in-95 duration-300` for dialogs, `duration-500` for empty-state entrance. Never introduce a different easing/duration family — consistency of "how things move" matters as much as color.

### 7.2 Page shell & header

Mirror `sender-accounts-header.tsx` exactly in structure:
- `h-16` sticky header, `border-b border-slate-200/80`, `bg-white/80 backdrop-blur-md`, `sticky top-0 z-10`.
- Left: icon badge (`h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-50 text-emerald-600 shadow-sm ring-1 ring-emerald-500/10`) using the `Users` icon (already the icon used for this nav item in `app-sidebar.tsx` — keep it consistent between sidebar and page header).
- Title: `text-xl font-bold tracking-tight text-slate-900` reading "Lead Lists". Subtitle directly under it: `text-xs font-medium text-slate-500` reading "Manage lead lists and import contacts for your campaigns".
- Vertical divider (`hidden h-8 w-px bg-slate-200 md:block`) then a stat block matching the "Total Capacity" pattern: label `text-[10px] font-bold uppercase tracking-wider text-slate-400` reading "Total Leads", value `text-sm font-semibold text-slate-700` showing the sum of `leadCount` across all lists (excluding the "Claimed Members" list from this total, since those are explicitly not active leads).
- Right: primary CTA, gradient button matching "Add Sender Account" exactly (`bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 transition-all`), `Plus` icon, label "New List".

Page background and content wrapper: identical to `sender-accounts-page.tsx` — `bg-gradient-to-br from-slate-50 via-white to-slate-100/50` full-height wrapper, content area `p-6 md:p-8`, `mx-auto max-w-7xl` inner container.

### 7.3 List view — list cards

Grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`.

Each list card (not the "Claimed Members" list — see below for its distinct treatment):
- Base: `group cursor-pointer flex flex-col bg-white rounded-2xl p-5` + the card resting/hover shadow recipes from Section 7.1.
- Header row: icon avatar `h-10 w-10 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors` (icon: `Users` or `List` from lucide-react — pick one, use consistently) + list name `font-semibold text-slate-900 truncate text-[15px]`, with the source badge (Section 7.8) right-aligned, same placement as the connection-type badge in `sender-account-list.tsx`.
- Body: lead count as a prominent stat — `text-2xl font-bold text-slate-900` for the number, `text-xs text-slate-500` for the "leads" label beside/below it (bigger than Sender Accounts' usage text, since this is the card's primary piece of information, not a secondary metric).
- Footer: `mt-auto pt-4 border-t border-slate-100`, a subtle "View leads →" affordance in `text-xs font-medium text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity` — only appears on hover, reinforcing the card is clickable without cluttering the resting state.

**"Claimed Members" list — distinct treatment (important, don't let it look like a normal list):** same card shape, but: `bg-slate-50/60` instead of white, `ring-slate-200/40` (no colored hover glow — hovering shows only a neutral `ring-slate-300/50`, no `-translate-y-1` lift, since this list isn't meant to invite the same "go add more leads here" interaction), icon avatar uses `amber-50`/`amber-500` instead of the emerald hover state, and a small system-list indicator badge (`text-[10px] font-bold uppercase tracking-wider text-slate-400` reading "System List") next to the name. It's still fully clickable/manageable (per Section 3.6) — this is a visual cue, not a functional lock.

### 7.4 List creation wizard

Reuse `sender-account-dialog.tsx`'s modal chrome exactly: `fixed inset-0 z-50` overlay (`bg-slate-900/20 backdrop-blur-sm`), panel centered near top (`pt-[8vh]`), `max-w-lg` (step 1) growing to `max-w-2xl` (step 2, to fit three import method tiles side by side), `rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-300`, sticky header and footer with `backdrop-blur-md`.

- Step indicator: two small dots (`h-1.5 w-6 rounded-full`, active = `bg-emerald-500`, inactive = `bg-slate-200`) in the header, not a heavy stepper component — keep it light.
- Step 1: single `Input` for list name, exact same focus/shadow treatment as `sender-email-input` (`shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500`).
- Step 2: three selectable tiles in a `grid grid-cols-3 gap-3` (stack to `grid-cols-1` below `sm`): Manual, CSV, Brilliant Directories. Each tile: `rounded-xl border border-slate-200 bg-white p-4 text-center cursor-pointer transition-all hover:border-emerald-500/40 hover:bg-emerald-50/30`, selected state adds `ring-2 ring-emerald-500 bg-emerald-50/50`. Icon on top (`UserPlus` / `Upload` / a plug-style icon — see Section 7.11), label below, one-line description below that in `text-xs text-slate-500`. If Brilliant Directories isn't connected yet, its tile shows the same visual family as a disabled OAuth button in Sender Accounts (`bg-slate-50 text-slate-400 border-dashed`, `cursor-not-allowed`) with a tooltip "Connect on the Integrations page first" — clicking it navigates to `/integrations` rather than doing nothing.
- "Skip for now" — a plain text link/ghost button, bottom-left of the footer, visually subordinate to the primary "Continue"/"Create List" button (bottom-right, gradient, matches "Add account" button treatment).

### 7.5 List detail view — leads table

- Use the shadcn `Table` component (already available per shadcn/ui in this project) rather than hand-rolled divs — this is the one place in the app dense enough (500+ rows) to need real table semantics (sortable headers, proper `<thead>`/`<tbody>`, screen-reader row/column semantics).
- Table container: `rounded-2xl border border-slate-200/50 bg-white overflow-hidden` with an `overflow-x-auto` inner wrapper so it degrades to horizontal scroll on narrow viewports rather than reflowing/stacking (data tables should not become card-stacks — that pattern is reserved for the list-of-lists view, Section 7.3).
- Header row: `bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500`, sticky (`sticky top-0 z-10`) so it stays visible while scrolling a long list.
- Row: `border-b border-slate-100 hover:bg-slate-50/60 transition-colors`, first column a checkbox (bulk select), clicking anywhere else in the row opens the per-lead detail dialog (Section 7.6) — same "row is the click target" pattern as `sender-account-row`.
- A lead flagged `newly_claimed`/moved to Claimed Members shows the claimed badge (Section 7.8) inline in an obvious column (e.g. right after name/email), not hidden in an overflow menu.
- **Search bar:** top-left above the table, `Input` with a leading `Search` icon (`absolute left-3 text-slate-400`, input gets `pl-9`), placeholder "Search by name or email…", same focus-ring treatment as every other input in the app.
- **Bulk action bar:** appears only when ≥1 row is selected — a bar that slides/fades in above the table header (`animate-in slide-in-from-top-2 fade-in duration-200`), `bg-slate-900 text-white rounded-xl px-4 py-2.5 flex items-center justify-between`, left side "{N} selected", right side ghost-style white-on-dark buttons for "Move to list…" and "Delete" (delete opens the same destructive confirm dialog as Section 7.9, phrased for bulk: "Delete 12 leads?").
- **Pagination footer:** `flex items-center justify-between border-t border-slate-100 px-4 py-3`, left side "Showing 1–50 of 240", right side prev/next as `AppButton variant="ghost" size="sm"` with chevron icons, disabled state at boundaries using the existing `disabled:opacity-50` treatment already built into `AppButton`.

### 7.6 Per-lead detail / edit dialog

Same modal chrome as Section 7.4. Fields are grouped into `fieldset`s exactly like SMTP/IMAP grouping in `sender-account-dialog.tsx` (`rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 shadow-sm` with a `legend`):
- **Core Contact** — email, first name, last name, company, job title, phone.
- **Location** — city, state, country.
- **Social & Personalization Sources** — the eight URL fields, rendered as a `grid grid-cols-2 gap-3` of compact inputs (these are low-stakes fields, don't give them the same visual weight as email/name).
- **Bio & Professional Context** — `about_me` and `work_experience` as `Textarea` (`min-h-[80px]`, matching the Textarea treatment already built in `node-config-panel.tsx`), the rest as compact inputs in a `grid grid-cols-2 gap-3`.
- If this lead is in the Claimed Members list, show a non-dismissible inline banner at the top of the dialog body (`rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs p-2.5`, icon: a small lock/ban icon) reading "This lead converted to a paid plan and is excluded from campaign sends." — informational, doesn't block editing.

### 7.7 Import pickers (Manual / CSV / Brilliant Directories)

The same three-tile picker component from Section 7.4 Step 2 is reused verbatim wherever an import entry point appears (creation wizard, empty-list state, "Add Leads" button) — **one shared component**, not three different implementations, both for engineering reasons and so the visual pattern is instantly recognizable everywhere it appears.

**CSV picker, once selected:**
- Dropzone: `rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-8 text-center transition-colors hover:border-emerald-400 hover:bg-emerald-50/20`, an `Upload` icon centered above the text "Drag & drop a CSV file, or click to browse", accepts `.csv` only.
- Below the dropzone, a quiet ghost-style link with a `Download` icon: "Download template CSV".
- After a file is selected/parsed, replace the dropzone with a **preview summary card**: `rounded-xl border border-slate-200 bg-white p-4`, showing "512 rows detected" (large, `text-lg font-semibold`), then a breakdown: "✓ 500 will be imported" (emerald), "⚠ 12 skipped — missing required fields" (amber, expandable to show which rows/reasons), before the final "Import" button is enabled.

**Brilliant Directories picker, once selected (only reachable if connected):**
- Shows a compact summary of the connection (site name, last synced) and a "Sync Now" button (delegates to `IntegrationsProvider`, per `integrations-v1-spec.md`) — clicking it runs the sync then immediately shows the same preview-summary card pattern as CSV (rows detected / will import / claimed-and-excluded count) before confirming into the target list.

### 7.8 Badges & status indicators

All badges use the existing `Badge` component (`components/ui/badge.tsx`) with the `outline` variant and this exact color-token recipe already established in `sender-account-list.tsx` (`border-{color}-500/20 bg-{color}-500/10 text-{color}-700`), just with different color families per meaning:

| Badge | Color family | Label |
|---|---|---|
| Source: Manual | `slate` | "Manual" |
| Source: CSV | `blue` | "CSV" |
| Source: Brilliant Directories | `violet` | "Brilliant Directories" |
| Claimed / Do Not Email | `amber` | "Claimed — Do Not Email" |
| Cross-list duplicate warning | `amber` (outline, lighter weight than the claimed badge — smaller text, no bold) | "Also in {n} lists" |

All badges: `uppercase text-[10px] font-bold tracking-wider rounded-md px-2 py-0.5` (matching the connection-type badge exactly), except the duplicate-warning pill, which is intentionally quieter (`normal-case text-[11px] font-medium`, no uppercase/bold) since it's informational, not a categorical label.

### 7.9 Destructive actions (delete confirm)

Reuse `delete-sender-account-dialog.tsx` verbatim as the pattern for: delete list, delete individual lead, bulk-delete leads, disconnect-triggered-removal-of-synced-data (if ever relevant). Same chrome: `max-w-md rounded-xl border border-slate-200 bg-white shadow-xl`, `AlertTriangle` icon in `h-8 w-8 rounded-lg bg-red-100 text-red-700`, header/footer border pattern, red confirm button (`bg-red-600 hover:bg-red-700`). Only the copy changes per context (e.g. "Delete this list? This removes {leadCount} leads with it." for a list; "Delete 12 leads?" for bulk).

### 7.10 Empty states

**Zero lists:** verbatim reuse of `sender-accounts-empty`'s pattern — `rounded-2xl border border-slate-200/60 bg-white/50 px-6 py-20 text-center shadow-sm backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500`, glow-halo icon treatment (`absolute inset-0 animate-pulse rounded-full bg-emerald-400/20 blur-xl` behind a `h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-50 text-emerald-600 shadow-inner ring-1 ring-emerald-500/20` icon container using `Users`), heading "No lead lists yet" (`text-lg font-semibold tracking-tight text-slate-900`), description, and the "Create your first list" CTA button directly below (this is the one empty state that gets a button; the next one gets inline tiles instead).

**Empty list (zero leads):** same visual chrome, but instead of a single CTA button, the three import tiles from Section 7.7 are shown directly inline below the heading/description — the user shouldn't need a second click to see their options.

### 7.11 Iconography (lucide-react only, no new icon library)

`Users` (page/nav, list card default), `Plus` (new list, add lead), `UserPlus` (manual entry), `Upload` (CSV), a plug/link icon such as `Link2` or `Plug` (Brilliant Directories — pick one, use identically on this page and on the Integrations page for the same connection), `Search` (table search), `Trash2` (delete — matches existing usage in `node-config-panel.tsx`), `AlertTriangle` (destructive confirms — matches existing usage), a lock-style icon such as `Lock` or `ShieldOff` (claimed/do-not-email badge — `Lock` is already used decoratively on `DeferredNavItem`, reusing it here ties the visual vocabulary together: "restricted" always looks like a lock in this app), `Download` (CSV template).

### 7.12 Responsive behavior

- List card grid: `1 → 2 → 3` columns at default/`md`/`lg` breakpoints (matches Sender Accounts' `1 → 2` pattern, extended one step further since list cards carry less content per card than sender account cards).
- Leads table: horizontal scroll on narrow viewports (`overflow-x-auto`), never card-stacked — table semantics and column alignment matter more here than avoiding a scrollbar.
- Header stat block (`Total Leads`) hides below `md`, same as Sender Accounts' "Total Capacity" block — the primary CTA and title always stay visible, secondary stats are the first thing to go on small screens.
- Import tiles: `grid-cols-3` collapses to `grid-cols-1` below `sm`.
- Bulk action bar and search input stack vertically below `sm` rather than competing for horizontal space.

### 7.13 Accessibility

- Every icon-only button has `aria-label` (matches existing convention, e.g. `delete-node-btn`).
- All dialogs: `role="dialog"`, `aria-label` describing the action, `Escape` key closes (matches `sender-account-dialog.tsx`'s existing keydown handler pattern exactly).
- Focus-visible rings are never removed — `focus-visible:ring-2 focus-visible:ring-emerald-500` (or `/40` opacity variants for inputs) on every interactive element, no exceptions.
- Bulk-select checkboxes have accessible labels ("Select {lead name}"), not bare unlabeled checkboxes.
- Status is never color-only: every badge carries a text label (Section 7.8), never just a colored dot.
- Table headers use real `<th>` semantics (via the shadcn `Table` component) so screen readers announce column context per cell.

---

## 8. Acceptance Criteria (checklist)

- [ ] `/leads` route renders list view; sidebar "Leads" item is no longer disabled and links here
- [ ] Zero-list empty state shows "Create your first list" CTA
- [ ] List creation wizard: name → import method picker (Manual/CSV/Brilliant Directories) → "Skip for now" always available
- [ ] List detail view: per-lead table with search/filter, pagination, bulk select + bulk delete/move
- [ ] Per-lead CRUD: view, edit any field, delete individual leads, with confirm step on delete
- [ ] Manual entry form enforces `email` + `first_name` required, adds to current list
- [ ] CSV upload parses the fixed header format client-side (no external parsing library), skips invalid rows with a reported summary, ignores unknown columns, offers a downloadable template
- [ ] Same-list duplicate emails are skipped and reported; cross-list duplicates allowed with a soft warning
- [ ] Brilliant Directories import option reflects connection status from `IntegrationsProvider`; prompts to connect first if not connected
- [ ] A simulated Brilliant Directories sync that includes a lead losing its email across two syncs correctly and automatically moves that lead to the global, lazily-created "Claimed Members" list
- [ ] "Claimed Members" list is fully viewable/manageable, not read-only-locked
- [ ] `New Lead Added` node: dropdown and card summary format are pixel/text-identical to before, now reading from `useLeadLists()` live data (verified by adding a list here and seeing it appear in the canvas dropdown without a page refresh)
- [ ] `leadCount` shown in the canvas card is computed from actual lead records, not a static number
- [ ] No console errors across all of the above
- [ ] All new interactions have corresponding Playwright tests
- [ ] Visual treatment matches Section 7 exactly — same card/dialog/badge/motion recipes as Sender Accounts, no ad-hoc styling divergence (spot-check: card shadows, dialog chrome, badge color tokens, focus rings)

---

## 9. Cursor Project Setup Notes

- Reuse existing dialog/modal, button, form-field, and destructive-confirm patterns from Sender Accounts and Template Builder — do not rebuild styling conventions from scratch. Section 7 documents exactly which existing components/classes to lift for each new element — treat it as binding, not inspirational.
- Build order: (1) extract `lead-lists.ts` + `LeadListProvider`, wired into `app-providers.tsx`, seeded from existing data — verify nothing breaks yet; (2) `NewLeadTriggerConfig` component + `node-config-panel.tsx` wiring + `summarize()` signature change — verify `New Lead Added` still renders/behaves identically against provider data; (3) `/leads` list view + creation wizard + empty states (Section 7.2-7.4, 7.10); (4) per-lead CRUD + leads table UX (Section 7.5-7.6); (5) manual entry + CSV import + dedup logic (Section 7.7); (6) Brilliant Directories consumption (depends on `integrations-v1-spec.md` being built first, or at least its `IntegrationsProvider` interface being stable) + claimed-member logic.
- No new npm dependencies required — CSV parsing is hand-rolled per tech-stack rules; Brilliant Directories has no real HTTP client need since it's fully simulated.
- Verify Campaign Canvas's existing tests (particularly anything touching `trigger-new-lead`) still pass unmodified against the new provider-backed data, since the shape/behavior must be identical to what those tests already expect — same verification approach used for Template Builder's live-wiring of Send Email.
- Test file naming: `step-13-lead-list-management.spec.ts`.
- Run `spec-completeness-checker` and `spec-verifier` against this spec once built, same two-subagent gate as every prior feature. Pay particular attention to: the `New Lead Added` live-wiring criterion (verify with an actual cross-page test, not just a provider unit test) and the claimed-member transition logic (requires simulating two sequential syncs, not just one).
