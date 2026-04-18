# DS10 — Admin Ops (desktop-only)

## Goal

Ship the internal ops dashboard: KPIs + live activity feed, a verification queue with priority/flags, a disputes workbench with severity and resolution actions, and a Mobile Money payout queue with batch actions. Desktop-only by explicit design decision; mobile does not get an admin tab.

## Why it matters

KAYOU's trust layer lives here. Verification review + dispute resolution + payout batches are workstation tasks — they require density, multi-column info, keyboard shortcuts, and bulk selection. Cramming this into a 390px screen would be a waste.

## Scope

### In scope
- `AdminOps` screen (web route `/admin`, no mobile screen)
- 4 sections accessible via sidebar nav or tabs: **Overview**, **Verification queue**, **Disputes**, **Payouts**
- Overview: 4 KPI cards + live activity feed + quick action buttons
- Verification queue: filterable list of pros awaiting review, detail pane on select, approve/reject/flag actions
- Disputes: workbench with ticket list + detail pane (full chat history, evidence carousel, resolution actions: refund client / side with pro / escalate / investigating)
- Payouts: weekly Mobile Money settlement queue, per-row status (ready/flagged/hold), batch "Envoyer N paiements" action, per-operator breakdown
- Denser visual language than the consumer app — smaller type (13-14px body), more data per tile, sticky table headers, keyboard shortcuts documented inline
- Admin-only access gate; redirect away for CLIENT/PROVIDER roles

### Out of scope
- Admin user management (inviting other admins, roles within admin) — future
- Provider profile editor from admin side — future
- Content moderation (reviews, photos) — future
- Full analytics / BI — this is an ops dashboard, not a BI tool
- Mobile admin — explicit rejection
- Full i18n for admin UI — French only like the rest

## Reference files
- `prototype/components/AdminOps.jsx` — 1106 lines, the densest single file. Sections:
  - `ADMIN_KPIS`, `VERIFICATION_QUEUE`, `DISPUTES`, `PAYOUT_QUEUE`, `ACTIVITY_FEED` mock data
  - `priorityBadge`, `disputeStatusChip`, `payoutStatusChip` helpers
  - `KpiCard`, `VerificationQueueSection`, `DisputesSection`, `PayoutsSection`, `ActivityFeed`, `AdminSidebar`

## Layout

### Overall shell

Grid `240px 1fr`:
- **Left: AdminSidebar** (240px, sticky top 0, full height)
  - KAYOU "Admin" brand at top
  - 4 nav items: Overview / Vérifs / Litiges / Payouts — each with icon + label + optional count badge
  - Spacer
  - Bottom: current user chip (Ops agent name, email, logout)
- **Right: section content** (scrollable, 20-28px padding)

### Overview

```
┌──────────────────────────────────────┐
│ Overview                              │
├────────────────────────────────────────┤
│ [KpiCard × 4]                         │
├──────────────────────────────────────┤
│  Activity feed (2/3)     Quick actions (1/3) │
│  ● 14:32 · Nouvelle résa Kinshasa     │  ┌ CTA ─────┐
│  ● 14:30 · Pascal Ilunga a soumis …  │  │ Ouvrir │
│  ● 14:28 · Payout envoyé · Grâce     │  │ verif q. │
│  ● 14:25 · Litige B-2847 · Marie K.  │  └──────────┘
│  ...                                 │  ...
└──────────────────────────────────────┘
```

KPI card:
- 4 total in a row, `grid: repeat(4, 1fr)`, 16px gap
- Each: overline label, Display 700 big value (with optional unit), delta chip (up emerald / down rose), sub caption
- Sparkline or bar mini-chart optional

Activity feed:
- 1px divided rows, 12px vertical padding
- Leading: tiny type-colored dot + mono time
- Event description in Body, keywords highlighted (e.g. location in Slate-700, amount in mono)

Quick actions: 3-4 buttons linking to the heaviest queues.

### Verification queue

Two-pane layout:
- **Left (60%):** Filter bar (priority / country / profession / wait time) + table of pros
  - Columns: Avatar+Name / Profession / Pays / Docs (4 checkboxes) / Flags / Wait / Priority
  - Row hover: Sky-subtle highlight
  - Selected row: Sky-primary left border
- **Right (40%):** Detail pane
  - Pro summary (avatar + name + profession + city+country)
  - Document thumbnails grid (ID front, ID back, selfie, address, cert) — click to full-screen
  - Flags banner (Rose-subtle) if any
  - Actions row: Approve (primary emerald) / Reject (secondary) / Flag (ghost) / Request re-upload
  - Notes textarea for internal ops
  - Audit timeline: "Soumis il y a 14min · Pascal Ilunga"

Priority badges: `urgent` (rose), `high` (amber), `normal` (slate).

### Disputes

Same two-pane pattern:
- **Left:** Filter bar (status / severity / country / time) + disputes list
  - Each card: ref # / client name / pro name / service / severity / status chip
  - 1px Slate-subtle dividers between rows
- **Right:** Detail pane
  - Dispute header: ref, amount, opened date, countdown to SLA
  - Both sides stacked: Client statement + evidence / Pro statement + evidence
  - Timeline of all actions (opened / notifications / pro response / ops notes / resolution)
  - Internal notes (ops-only)
  - Resolution actions: "Rembourser le client", "Conserver le paiement au pro", "Remboursement partiel %", "Escalader"
  - Status chip shows current: `new / pending_pro / investigating / escalated / resolved`

Severity badges: `high` (rose-darker), `medium` (amber), `low` (slate).

### Payouts

Table layout with batch selection:
- Columns: checkbox / Pro / Opérateur (colored pill) / Numéro (masked) / Jobs count / Période / Montant / Statut / Action
- Sticky header with filter bar above (operator / status / country)
- Footer sticky bar: "X pros sélectionnés · Σ montant · [Envoyer les paiements →]"
- Status states:
  - `ready` emerald chip
  - `flagged` amber chip with reason
  - `hold` slate chip (linked to a pending dispute)

Per-row single action: "Valider" or "Bloquer" or "Détails".

## Denser visual language

This section only applies to AdminOps and should not leak to client/pro UI:
- Body text: 13px instead of 15px
- Table row height: 44-48px (denser than consumer rows)
- More data per row (5-7 columns instead of 2-3)
- Smaller chips (h 22px instead of 28px)
- Sticky headers on all lists / tables
- Row hover states required (desktop-only)

All tokens still come from `@kayu/ui` — we're using the same palette, just denser compositions. Admin does NOT invent new colors.

## Access control

- Web route `/admin` server-side checks `user.role === "ADMIN"`
- Non-admins: redirect to `/` with toast "Accès réservé"
- Admin login: same Auth flow as consumer users (DS02). Backend flag admin status on the user record. Alternative: separate `/admin/login` — DS10 decision note: **use the same phone auth** for MVP; decorate the admin surface behind a role check.

## Dependencies
- Depends on DS01 (icons)
- Does NOT depend on the pro track (DS06-09); runs parallel to them
- Blocks: DS11 audit
- Implicit dependency: backend exposes admin endpoints (`/admin/verify-queue`, `/admin/disputes`, `/admin/payouts`). If they don't exist, flag in PROGRESS; frontend ships against mock data.

## Acceptance criteria

1. Web `/admin` renders the sidebar + content shell
2. Navigating between 4 sections (Overview / Verifs / Litiges / Payouts) updates the right pane and keeps sidebar sticky
3. Overview shows 4 KPIs + activity feed (min 8 rows) + quick action buttons
4. Verification queue renders two-pane with working filter bar + selection
5. Disputes section renders two-pane with resolution action buttons
6. Payouts section renders table + batch-select + sticky footer with sum
7. Priority/severity/status chips use correct color pairings
8. Non-admin users are redirected from `/admin`

## QA checklist
- [ ] Sidebar nav highlights the active section (Sky-subtle bg + Sky-hover text)
- [ ] KPI deltas match their sign (emerald for +, rose for −)
- [ ] Activity feed time column is mono, left-aligned, 48px min width
- [ ] Priority/severity badges use correct bg/fg pairings per the prototype helper functions
- [ ] Verification table row hover is not jarring; smooth 160ms transition
- [ ] Detail pane thumbnails open a zoomable preview overlay (can be placeholder for DS10)
- [ ] Disputes detail shows both statements with visual separation (dashed horizontal divider)
- [ ] Resolution action buttons (Rembourser / Conserver / Partiel / Escalader) are clearly labeled
- [ ] Payout batch checkbox in header selects all visible rows
- [ ] Sum in footer updates live as selection changes
- [ ] Status chip "flagged" shows the reason as a tooltip (hover)
- [ ] `role === "ADMIN"` check happens server-side for SSR, not just client-side
- [ ] No admin UI leaks to mobile app (confirm no nav route points to it)
- [ ] Keyboard shortcuts documented inline (e.g. "? pour l'aide", "J/K to navigate rows") — aspirational for DS10, can ship without
