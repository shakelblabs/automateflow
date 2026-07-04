# AutomateFlow — Integrations — v1 Spec

**Module:** Integrations page (`/integrations`) — new page, new sidebar nav item
**Scope:** UI ONLY — no backend, no database, no real network calls, no real OAuth/API credentials ever leaving the browser. General-purpose hub for all current and future AutomateFlow integrations, not limited to lead sourcing — v1 scaffolds a single category (Lead Sources) with one connection that's fully simulated end-to-end (Brilliant Directories), plus disabled placeholder cards for other well-known sources.
**Build target:** Cursor AI Agent
**Author:** Vikash — BusinessLabs
**Reads first:** `.cursor/rules/automateflow-core.mdc`, `platform-shell-sender-v1-spec.md` (provider + shell + sidebar pattern this page follows), `lead-list-management-v1-spec.md` (companion spec — Section 3.4/3.6 there describe exactly how that page consumes what this page produces)

**Not in this file:**
- Lead schema, list CRUD, per-lead CRUD, CSV import — entirely owned by `lead-list-management-v1-spec.md`. This spec only owns the *connection* (credentials form, test/sync mechanics, claimed-member detection logic), not what happens to the leads once handed off.
- Any category beyond Lead Sources (Email Sending, Notifications, Analytics) — page structure should visually accommodate them later, but nothing beyond Lead Sources is built now.
- Any integration beyond Brilliant Directories having real logic — Google Sheets, Salesforce, HubSpot, etc. are static disabled cards only, no form, no behavior, no further breakdown.

---

## 0. Why this exists, and hard boundaries

Lead List Management needs a real (but simulated) way to pull leads from an external system without embedding a raw credential form inside the Leads page itself — consistent with the external-entity pattern already established elsewhere (canvas nodes reference, never own, external entities). Integrations is that owning page, and it's deliberately scoped broader than just leads from the start so it doesn't need a rename/restructure the first time a non-lead integration shows up later.

**Non-negotiable boundaries:**
- No real HTTP call to Brilliant Directories' actual API (`GET/POST https://<site>/api/v2/leads/...`) or any other third-party service. "Test Connection" and "Sync Now" are both simulated/deterministic against local mock logic.
- Credentials (Site Name, Site URL, API Key, Unclaimed Plan/Subscription ID) are captured into local provider state only — never transmitted anywhere, clearly commented in code as mock, same treatment as Sender Accounts' SMTP/IMAP credential fields.
- No credential encryption — there's no backend to encrypt *for* yet, same reasoning as `platform-shell-sender-v1-spec.md` Section 0.
- Do not build real OAuth for any future integration card — every non-Brilliant-Directories source in v1 is a static, disabled, "Coming soon" card with no form behind it at all.
- Do not touch Campaign Canvas, Sender Accounts, or Template Builder pages/components.

---

## 1. Route + nav

| Page | Route |
|---|---|
| Integrations | `/integrations` (new) |

**Sidebar:** add a new nav item — no existing reserved slot for this (unlike "Leads," which already had a `DeferredNavItem` placeholder). Add it as a real (non-deferred) `Link` entry in `app-sidebar.tsx`'s `NAV_ITEMS` array, following the exact same shape as the existing entries (`href`, `label`, `icon`, `testId`). Suggested icon: `Plug` or `Puzzle` from `lucide-react` (either is acceptable — pick one and be consistent, don't introduce a new icon library).

---

## 2. Page structure

*Functional behavior only — for exact visual treatment of every element described in this and the following section, see Section 5.*

- Categorized layout — v1 renders one real category section, **"Lead Sources,"** as cards in a grid/list.
- Category structure should be visually generic (a reusable `IntegrationCategorySection` component keyed by category id/label) so adding "Email Sending," "Notifications," or "Analytics" later is a matter of adding another section, not restructuring the page.
- Each integration is a card: logo/icon placeholder, name, short description, connection status (Connected / Not Connected / Coming Soon).

### 2.1 Lead Sources category — v1 contents

- **Brilliant Directories** — the one real (simulated) connection. See Section 3.
- **Google Sheets, Salesforce, HubSpot** (pick these three, or equivalent well-known names) — static disabled cards, "Coming soon" badge/tooltip, no click behavior, no form, no further breakdown. Purely signals the page's future direction.

---

## 3. Brilliant Directories connection

### 3.1 Connect form

Fields, all required to submit:
- **Site Name** — free text, user-facing label for this connection (useful once multiple BD sites might be connected later, even though v1 only needs one)
- **Site URL** — free text (the BD site's base URL)
- **API Key** — free text, masked input (password-style) since it's credential-shaped even though nothing real happens with it
- **Unclaimed Plan/Subscription ID** — free text/number. This corresponds to Brilliant Directories' internal `subscription_id` field — each BD site configures its own membership plans, and which plan ID represents an "unclaimed" (free, not-yet-upgraded) listing varies per site (one site might use `10`, another `4`). This value is what the simulated sync logic uses to decide which synced records count as active leads vs. already-claimed members.

### 3.2 Test Connection

- Validates all four fields are non-empty and reasonably well-formatted (e.g. Site URL looks like a URL, API Key non-trivial length) — then shows a simulated "Connected successfully" state. No real request is made.

### 3.3 Sync Now

- Manual button only — **no scheduled/automatic sync in v1**, no "sync frequency" UI at all (not even a disabled one — this isn't a case that needs the visible-but-disabled treatment, it's simply not offered).
- Each click runs a local, deterministic mock sync function that returns a batch of simulated lead-shaped records matching the `Lead` schema from `lead-list-management-v1-spec.md` Section 2, each including the hidden `_bdMemberId` field.
- **The mock sync generator must be stateful across calls within a session** (not purely random each time) so the claimed-member transition (Section 3.5) is actually demonstrable: the same `_bdMemberId` values should reappear across repeated "Sync Now" clicks, with at least one specific mock member having an `email` value on its first appearance and **no** `email` value on a subsequent sync — this is the one case in this entire codebase where mock data needs memory of its own prior output, so implement it as simple in-memory state inside `IntegrationsProvider`, not a pure function.
- Sync results do not automatically land in any lead list — see Section 3.4.
- Last-synced timestamp and a simple sync history/log (timestamp + record count per past sync, this session only) are shown on the connection's detail view.

### 3.4 Hand-off to Lead List Management

- This spec does **not** decide which list synced leads land in — per `lead-list-management-v1-spec.md` Section 3.4, the user picks a target list (existing or "create new") from the Leads page's shared import picker, which calls into this provider's sync function to fetch the batch, then hands the result to `LeadListProvider`.
- The claimed-member detection itself (comparing this sync's records against the previous sync's by `_bdMemberId`, per Section 3.5 below) happens inside `IntegrationsProvider`, tagging each returned record as `newly_claimed: boolean` — `LeadListProvider` reads that flag to decide whether to route the record into the target list or straight into the global "Claimed Members" list (per `lead-list-management-v1-spec.md` Section 3.6). The claimed-members *list* itself lives in `LeadListProvider`'s domain, not here — this provider only detects and flags the transition.

### 3.5 Claimed-member detection logic (the actual rule)

- Every simulated sync batch is compared, by `_bdMemberId`, against the immediately preceding sync's batch (stored in `IntegrationsProvider`'s in-memory state).
- If a member ID's `email` field was populated in the prior sync and is empty/missing in the current sync → flag that record `newly_claimed: true`.
- All other records → `newly_claimed: false`.
- This must be genuinely demonstrable in the UI, not just described: the mock generator ships with at least one scripted example of this transition occurring on the second "Sync Now" click.

### 3.6 Connection management

- **Edit** — update any of the four connection fields.
- **Disconnect** — removes the connection entirely (confirm step, destructive action, matching the existing delete-confirm pattern from Sender Accounts).
- **View last-synced timestamp + sync history/log** — per Section 3.3.

---

## 4. Provider architecture

- New `IntegrationsProvider`, sibling to `CampaignCanvasProvider` / `SenderAccountsProvider` / `TemplateLibraryProvider` / `LeadListProvider`, registered in `app-providers.tsx`.
- Holds: the Brilliant Directories connection config (or `null` if not connected), connection status, sync history log, and the in-memory "previous sync batch" state needed for Section 3.5's detection logic.
- Exposes a hook, `useIntegrations()`, with at minimum: `connection`, `connect()`, `updateConnection()`, `disconnect()`, `testConnection()`, `runSync()` (returns the tagged batch described in Section 3.4), `syncHistory`.
- Session-only state, same as every other provider in this app — refresh loses the connection, that's expected and fine.

---

## 5. Visual & Interaction Design System (senior UI/UX detail)

Same standard as `lead-list-management-v1-spec.md` Section 7 — exact values, extending the existing design language already built for Sender Accounts, not a new visual style. Read that section's Section 7.1 (design tokens) first; it is not repeated in full here, only extended where this page needs something new.

### 5.1 Page shell & header

Same structural pattern as `sender-accounts-header.tsx` / the Leads page header:
- `h-16` sticky header, `border-b border-slate-200/80`, `bg-white/80 backdrop-blur-md`.
- Icon badge (`h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-50 text-emerald-600 shadow-sm ring-1 ring-emerald-500/10`) using a plug/connection icon (`Plug` or `Link2` — whichever is chosen here must be used identically on the Leads page wherever Brilliant Directories is referenced, per `lead-list-management-v1-spec.md` Section 7.11).
- Title `text-xl font-bold tracking-tight text-slate-900` reading "Integrations", subtitle `text-xs font-medium text-slate-500` reading "Connect external tools and data sources".
- Stat block (divider + label/value pair, same visual pattern as "Total Capacity"/"Total Leads"): label "Connected", value count of active connections (v1: 0 or 1).
- No primary CTA button in the header itself (unlike Sender Accounts/Leads) — connecting happens by clicking an integration card, not a global "Add" action, since this page's cards are the entry points.

Page background/wrapper: identical gradient and container treatment as every other page (`bg-gradient-to-br from-slate-50 via-white to-slate-100/50`, `p-6 md:p-8`, `mx-auto max-w-7xl`).

### 5.2 Category sections

Each category (v1: just "Lead Sources") is introduced with the exact label treatment already used for "Step settings" in `node-config-panel.tsx`: `text-xs font-medium tracking-wide text-slate-500 uppercase` followed by a `Separator` immediately below it, then the card grid (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`) beneath. This is a deliberate reuse of an existing "section label" pattern rather than inventing a new heading style for category dividers.

### 5.3 Integration cards — three distinct states, three distinct visual treatments

This is the one place on this page where getting the states right matters most — a user should never wonder whether a card is clickable.

**Connected (Brilliant Directories, once set up):**
- Full card treatment from `lead-list-management-v1-spec.md` Section 7.3's card recipe (white, `rounded-2xl`, resting/hover shadow, `cursor-pointer`, hover lift) — this card IS interactive (click to manage).
- Status badge: emerald, filled dot + text, "Connected" (`inline-flex items-center gap-1.5`, dot = `h-1.5 w-1.5 rounded-full bg-emerald-500`, text = same badge recipe as Section 7.8 but `emerald` family).
- Below the name/description, a compact meta line: `text-xs text-slate-500` showing "Last synced 2 hours ago" (or "Never synced" if connected but not yet synced).

**Not Connected (Brilliant Directories, before setup):**
- Same card shape, but `ring-slate-200/40` only (no colored hover glow yet — nothing to "open" in the success sense, clicking starts a setup flow, not a management view), still fully `cursor-pointer` since clicking it is the entire point.
- Status badge: `slate` outline, "Not Connected".
- A small inline "Connect →" affordance, same hover-reveal pattern as the Leads page's "View leads →" (Section 7.3), `text-emerald-600`.

**Coming Soon (Google Sheets, Salesforce, HubSpot, etc.):**
- Deliberately inert visual treatment, borrowed directly from the disabled OAuth buttons in `sender-account-dialog.tsx`: `bg-slate-50 text-slate-400 border-dashed`, `cursor-not-allowed`, no hover lift/shadow change at all (this is the key differentiator from the two clickable states above — a static card should visibly not react to hover).
- Icon rendered at reduced opacity/grayscale (`opacity-50 grayscale`) rather than full-color, reinforcing inertness even before reading the badge.
- Status badge: `slate` outline, dashed border (`border-dashed border-slate-300 bg-slate-50 text-slate-400`), "Coming Soon".
- `title="Coming soon"` tooltip attribute, matching the `DeferredNavItem` convention exactly.

### 5.4 Brilliant Directories connect form

Reuse `sender-account-dialog.tsx`'s modal chrome and fieldset pattern exactly — single fieldset, "Connection Details," containing:
- Site Name (`Input`, plain text)
- Site URL (`Input`, plain text, placeholder `https://yoursite.brilliantdirectories.com`)
- API Key (`Input type="password"`, masked, same treatment as the SMTP password field)
- Unclaimed Plan/Subscription ID (`Input`, plain text, helper text below in `text-xs text-slate-500`: "The membership plan ID your site uses for unclaimed listings — check your BD admin panel under Subscriptions.")

All four inputs use the identical focus/shadow treatment as every other input in the app (`shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500`).

### 5.5 Test Connection — real interactive states (unlike Sender Accounts' permanently-disabled version)

Sender Accounts' "Test Connection" button is permanently disabled (real feature, not built). This one is different — it's a real (simulated) action and needs real interaction states:
- **Default:** `AppButton variant="secondary"`, label "Test Connection".
- **Testing (in-flight):** label changes to "Testing…" with a small spinning `Loader2` icon (`animate-spin`) to its left, button disabled during this ~600-800ms simulated delay — long enough to feel like something happened, short enough not to feel broken.
- **Success:** button briefly shows a filled emerald state (`bg-emerald-600 text-white`) with a `Check` icon and label "Connected" for about 2 seconds, then reverts to the default label (the persistent proof of success is the card's "Connected" badge once the form is saved, not the button staying green forever).
- **Failure (fields invalid/empty):** inline error text below the form, same recipe as Sender Accounts' form error (`text-xs font-medium text-red-600 bg-red-50 p-2 rounded-md`).

### 5.6 Sync Now + sync history log

- **Sync Now button:** primary gradient treatment matching "Add Sender Account"/"Save changes" (`bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-lg shadow-emerald-500/20`), with the same in-flight spinner pattern as Test Connection ("Syncing…" + `Loader2`) during the ~800ms simulated delay.
- **Sync history log:** a simple list below the connection details, most recent first, each row `flex items-center justify-between border-b border-slate-100 py-2.5 text-sm`: timestamp (`text-slate-500`) + record count (`text-slate-900 font-medium`, e.g. "18 records") +, when applicable, an inline amber badge (same `amber` recipe as the claimed badge on the Leads page, Section 7.8 there) reading "2 claimed" so a user scanning sync history immediately sees when conversions happened.
- **Newest row highlight:** the row just added after a sync briefly flashes `bg-emerald-50` fading to transparent over ~1.5s (`transition-colors duration-[1500ms]`) so the user's eye is drawn to what just changed, rather than a static list silently growing.

### 5.7 Connection management (edit / disconnect)

- Same dialog chrome as the connect form (Section 5.4), pre-filled, reopened via clicking the connected card.
- "Disconnect" is a ghost-style destructive text button (`text-red-600 hover:text-red-700 hover:bg-red-50`), positioned bottom-left of the dialog footer — same placement convention as the "Delete" button inside `sender-account-dialog.tsx`'s edit mode.
- Disconnect opens the same destructive confirm dialog chrome as `delete-sender-account-dialog.tsx` (Section 7.9 of the Leads spec) — "Disconnect Brilliant Directories? This removes the connection; leads already imported are not affected."

### 5.8 Iconography

`Plug` or `Link2` (this integration/connection concept generally — pick one, use identically here and on the Leads page), `Loader2` (in-flight spinner states, new to this spec — not used elsewhere in the app yet, but a standard lucide-react icon so no new dependency), `Check` (Test Connection success), `AlertTriangle` (disconnect confirm, matches existing usage).

### 5.9 Responsive behavior

- Card grid: `1 → 2 → 3` columns, same breakpoints as the Leads page.
- Header stat block hides below `md`, same convention as every other page header.
- Connect form fields stack single-column at all breakpoints (four fields is short enough not to need a multi-column layout at any width, unlike Sender Accounts' SMTP/IMAP grid).

### 5.10 Accessibility

- Same baseline as `lead-list-management-v1-spec.md` Section 7.13: `aria-label` on icon-only buttons, `role="dialog"` + `Escape`-to-close on all dialogs, focus-visible rings never removed, status never color-only (every badge carries text).
- Coming Soon cards: `aria-disabled="true"` and non-interactive semantics (not a real `<button>`/`<a>` if it does nothing — a plain `<div>` with `title` tooltip, matching `DeferredNavItem`'s exact approach), so screen readers and keyboard navigation correctly skip them as inert rather than announcing a broken control.

---

## 6. Explicitly deferred (do not build this version)

- Real HTTP calls to Brilliant Directories or any other service.
- Any category beyond Lead Sources (Email Sending, Notifications, Analytics) — structure should accommodate them, none are built.
- Real logic/forms for Google Sheets, Salesforce, HubSpot, or any lead source beyond Brilliant Directories.
- Scheduled/automatic sync of any kind.
- Credential encryption or secure backend storage.
- Multiple simultaneous Brilliant Directories connections (v1 supports exactly one).

---

## 7. Acceptance Criteria (checklist)

- [ ] `/integrations` route renders; new sidebar nav item added and links here (not a `DeferredNavItem` — this one is real, unlike "Leads" was)
- [ ] Page renders categorized layout; "Lead Sources" is the only populated category in v1
- [ ] Brilliant Directories card: Connect form with all four fields (Site Name, Site URL, API Key, Unclaimed Plan/Subscription ID)
- [ ] Test Connection validates field presence/format and shows simulated success — no real request made
- [ ] Sync Now runs the deterministic mock generator, shows last-synced timestamp + sync history log
- [ ] Two sequential Sync Now clicks demonstrate at least one `_bdMemberId` losing its `email` between syncs, correctly flagged `newly_claimed: true`
- [ ] Edit connection, disconnect (with confirm), both work against provider state
- [ ] Google Sheets / Salesforce / HubSpot (or equivalent) render as static disabled "Coming soon" cards — no click behavior, no forms
- [ ] `useIntegrations().runSync()` is successfully consumed by the Leads page's import picker (`lead-list-management-v1-spec.md` Section 3.4) end-to-end — verified by a cross-page test, not a provider unit test in isolation
- [ ] No console errors across all of the above
- [ ] All new interactions have corresponding Playwright tests
- [ ] Visual treatment matches Section 5 exactly — card state differentiation (Connected/Not Connected/Coming Soon) is visually unambiguous, same shadow/badge/motion recipes as the rest of the app

---

## 8. Cursor Project Setup Notes

- Reuse existing dialog/modal, button, form-field, masked-input, and destructive-confirm patterns from Sender Accounts — do not rebuild styling conventions from scratch. Section 5 documents exactly which existing components/classes to lift for each new element.
- Build order: (1) `IntegrationsProvider` + `/integrations` page shell + sidebar nav item; (2) Brilliant Directories connect form + Test Connection; (3) Sync Now with the stateful mock generator (this is the trickiest piece — get the "remembers previous sync" behavior right before wiring anything else to it); (4) claimed-member flagging logic; (5) static Coming Soon cards (low-risk, do this whenever convenient); (6) hand-off integration with `lead-list-management-v1-spec.md`'s import picker — this step has a hard dependency on that spec's `LeadListProvider` existing, so sequence the two builds accordingly (either this page's provider first with Leads' consumption wired in last, or build both providers together before wiring the cross-provider hand-off).
- No new npm dependencies required — no real HTTP client needed since nothing here makes a real network call.
- Test file naming: `step-14-integrations.spec.ts`.
- Run `spec-completeness-checker` and `spec-verifier` against this spec once built, same two-subagent gate as every prior feature. Pay particular attention to the claimed-member transition criterion — it requires simulating two sequential syncs in the test, not just checking the first sync's output.
