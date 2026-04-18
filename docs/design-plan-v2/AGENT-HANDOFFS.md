# KAYOU Design Plan v2 — Agent Handoffs

Copy-paste prompts for handing off each v2 chunk to an implementation agent.

---

## Reusable prompt template

```
You are implementing design chunk [DSXX] of the KAYOU design plan v2.

REQUIRED READING (do all before writing any code):
1. /Users/alainmk/startups/kayu-project/docs/DESIGN_SYSTEM.md
2. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/00-overview.md
3. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/PROGRESS.md
4. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/[DSXX-chunk-file].md

VISUAL SOURCE OF TRUTH:
- /Users/alainmk/startups/kayu-project/docs/design-plan-v2/prototype/
  - KAYOU Prototype.html (routing, the SCREENS array, tab-bar hide list)
  - tokens.css (unchanged from v1)
  - components/*.jsx (18 files — open the ones named in the chunk)
  - design-chat.md (the full conversation; read if anything is ambiguous)

REFERENCE (do not rebuild, consume instead):
- DESIGN_SYSTEM.md — tokens, typography, shadow/radius scales, the "don't list"
- ../design-plan/ — v1 design plan (shipped); primitives, cards, shell are already in @kayu/ui
- ../design-plan/prototype/ — v1 prototype (the 6 original screens)

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

HARD CONSTRAINTS:
- Do NOT reinvent v1 primitives. If @kayu/ui has it, import it.
- Do NOT use raw hex / inline boxShadow / magic borderRadius numbers. Tokens only.
- Do NOT reintroduce Cupertino / Material native patterns — Airbnb-inspired cross-platform discipline
- Do NOT keep v1 dashboard stubs alongside v2 routes — DS11 retires them
- Run `pnpm turbo run type-check` and `pnpm turbo run lint` before declaring done
- Update PROGRESS.md with: status change, decisions, evidence

WHEN DONE:
- Summarize what landed
- Flag any deviations from the plan and why
- Flag any decisions affecting downstream chunks
- Confirm DESIGN_SYSTEM.md §15 checklist passes for any new screen
```

---

## Ready-to-send prompts

### DS01 — Shared upgrades
```
You are implementing DS01 of the KAYOU design plan v2.

REQUIRED READING:
1. /Users/alainmk/startups/kayu-project/docs/DESIGN_SYSTEM.md
2. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/00-overview.md
3. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/PROGRESS.md
4. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/DS01-shared-upgrades.md

VISUAL REFERENCE:
- /Users/alainmk/startups/kayu-project/docs/design-plan-v2/prototype/components/shared.jsx (diff vs v1 to find the 30+ new icons)
- /Users/alainmk/startups/kayu-project/docs/design-plan-v2/prototype/components/MobileShell.jsx (v2 tab-bar targets)
- /Users/alainmk/startups/kayu-project/docs/design-plan-v2/prototype/KAYOU Prototype.html (App() function for hide-tab-bar list and booking→review routing)
- /Users/alainmk/startups/kayu-project/docs/design-plan-v2/prototype/components/BookingFlow.jsx (KayouMoment polish diff)

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

This chunk unblocks the rest of v2: add 30+ icons to @kayu/ui, reshuffle the mobile tab bar to real targets (bookings/messages/provider) with role-aware tab sets, expand the hide-tab-bar list to cover booking/profile/review/onboarding/auth/quote, chain booking confirmation → WriteReview, apply KayouMoment polish (emerald glow, borderless soft-shadow summary, 48px 14px-radius buttons).
```

### DS02 — Auth
```
You are implementing DS02 of the KAYOU design plan v2.

REQUIRED READING:
1. /Users/alainmk/startups/kayu-project/docs/DESIGN_SYSTEM.md
2. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/00-overview.md
3. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/PROGRESS.md
4. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/DS02-auth.md

VISUAL REFERENCE:
- /Users/alainmk/startups/kayu-project/docs/design-plan-v2/prototype/components/Auth.jsx

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

Build the phone OTP auth flow: country picker (CD +243 / CG +242) → phone input with auto-format → 6-digit OTP grid with auto-advance → role picker (Je cherche un pro / Je suis un pro). Web has a split panel (form left, animated brand side with live feed right). Mobile is full-bleed. Retire apps/mobile/src/screens/auth/Login+Register screens.
```

### DS03 — My Bookings + Booking Detail
```
You are implementing DS03 of the KAYOU design plan v2.

REQUIRED READING:
1. /Users/alainmk/startups/kayu-project/docs/DESIGN_SYSTEM.md
2. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/00-overview.md
3. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/PROGRESS.md
4. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/DS03-bookings-detail.md

VISUAL REFERENCE:
- /Users/alainmk/startups/kayu-project/docs/design-plan-v2/prototype/components/MyBookings.jsx
- /Users/alainmk/startups/kayu-project/docs/design-plan-v2/prototype/components/BookingDetail.jsx

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

Ship MyBookings (4-tab filter: À venir / En cours / Terminées / Annulées, BookingCard with work-tile + status chip + progress banner) and BookingDetail as a single unified component with `perspective: "client" | "pro"` prop. Web: routes /bookings and /bookings/[id]. Mobile: rewrite v1 BookingsScreen + BookingDetailScreen. BookingDetail includes a 5-step timeline, QuoteBreakdown with pro commission-split, CounterpartyCard with phone/message buttons, address mini-map, and context-aware action buttons per status.
```

### DS04 — Messages upgrade
```
You are implementing DS04 of the KAYOU design plan v2.

REQUIRED READING:
1. /Users/alainmk/startups/kayu-project/docs/DESIGN_SYSTEM.md
2. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/00-overview.md
3. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/PROGRESS.md
4. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/DS04-messages.md

VISUAL REFERENCE:
- /Users/alainmk/startups/kayu-project/docs/design-plan-v2/prototype/components/Messages.jsx

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

Rewrite the mobile Conversations/Chat screens and add a web /messages route. Web uses split layout (360px list + thread). Mobile uses stack push to open a thread. Features: system messages (emerald pill for "Réservation confirmée"), mission banner on active threads, suggested-replies row when active, status chips on thread previews. Compose: rounded input + primary send button that enables only when draft non-empty.
```

### DS05 — Write Review upgrade
```
You are implementing DS05 of the KAYOU design plan v2.

REQUIRED READING:
1. /Users/alainmk/startups/kayu-project/docs/DESIGN_SYSTEM.md
2. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/00-overview.md
3. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/PROGRESS.md
4. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/DS05-write-review.md

VISUAL REFERENCE:
- /Users/alainmk/startups/kayu-project/docs/design-plan-v2/prototype/components/WriteReview.jsx

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

Replace the v1 ReviewScreen with the 5-dimension KAYOU rating system. Web is a single-page form with live overall-score banner; mobile is a 3-step wizard. Each DimensionRow has icon + label + description + 5-button row. QuickTags chip cloud is multi-select. Photo upload is placeholder-only (no real upload yet). Submit → success screen with emerald check + "Merci pour ton avis !". Navigation: /review/[providerId] accepts ?bookingId= and ?fromBooking=1 params.
```

### DS06 — Provider Dashboard
```
You are implementing DS06 of the KAYOU design plan v2.

REQUIRED READING:
1. /Users/alainmk/startups/kayu-project/docs/DESIGN_SYSTEM.md
2. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/00-overview.md
3. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/PROGRESS.md
4. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/DS06-provider-dashboard.md

VISUAL REFERENCE:
- /Users/alainmk/startups/kayu-project/docs/design-plan-v2/prototype/components/ProviderDashboard.jsx

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

Build the pro home screen: greeting header with trust chip + rating + "Créer un devis" CTA, availability toggle bar, 4 StatCards with Sparklines (revenue / missions / response rate / avg rating), 2-column body (Planning du jour with JobCards | Nouvelles demandes with RequestCards). Mobile compacts to vertical stack. Promote StatCard and Sparkline to @kayu/ui for reuse by DS08. Role-gate: only PROVIDER users can access /pro.
```

### DS07 — Job Requests + Quote Compose
```
You are implementing DS07 of the KAYOU design plan v2.

REQUIRED READING:
1. /Users/alainmk/startups/kayu-project/docs/DESIGN_SYSTEM.md
2. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/00-overview.md
3. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/PROGRESS.md
4. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/DS07-requests-quote.md

VISUAL REFERENCE:
- /Users/alainmk/startups/kayu-project/docs/design-plan-v2/prototype/components/JobRequests.jsx
- /Users/alainmk/startups/kayu-project/docs/design-plan-v2/prototype/components/QuoteCompose.jsx

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

Ship JobRequests (/pro/requests): inbound request cards with match %, urgency badge, budget + expiration, 2-button (Décliner / Envoyer un devis) CTA; plus active jobs grouped card. Ship QuoteCompose (/pro/devis/new?requestId=...): editable line-item table, presets per métier (plomberie/electricite/default), discount %, live subtotal → total → commission KAYOU (10%) → payout; validity days, start-date radio, prefilled message to client. Submit → QuoteSent success state.
```

### DS08 — Earnings
```
You are implementing DS08 of the KAYOU design plan v2.

REQUIRED READING:
1. /Users/alainmk/startups/kayu-project/docs/DESIGN_SYSTEM.md
2. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/00-overview.md
3. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/PROGRESS.md
4. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/DS08-earnings.md

VISUAL REFERENCE:
- /Users/alainmk/startups/kayu-project/docs/design-plan-v2/prototype/components/Earnings.jsx

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

Ship the pro Earnings screen (/pro/earnings): weekly bar chart with today-highlighted + future-dimmed bars, summary stats (balance / pending / lifetime), Mobile Money payout sheet with 4 operator tiles (M-Pesa / Airtel / Orange / MTN MoMo), masked number, fee preview, "Valider" placeholder CTA. Transaction list with 3 type-coded rows (earning emerald / payout sky / bonus amber) and status pills. Filter chips for transaction types. "Valider le paiement" is a front-end placeholder — note backend deferral in PROGRESS.
```

### DS09 — Provider Onboarding + Verification
```
You are implementing DS09 of the KAYOU design plan v2.

REQUIRED READING:
1. /Users/alainmk/startups/kayu-project/docs/DESIGN_SYSTEM.md
2. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/00-overview.md
3. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/PROGRESS.md
4. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/DS09-onboarding-verification.md

VISUAL REFERENCE:
- /Users/alainmk/startups/kayu-project/docs/design-plan-v2/prototype/components/ProviderOnboarding.jsx
- /Users/alainmk/startups/kayu-project/docs/design-plan-v2/prototype/components/ProVerification.jsx

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

Build two linked pro screens: ProviderOnboarding (/pro/onboarding — 6-step wizard: identity → craft → zones → pricing → profile → publish with auto-save between steps) and ProVerification (/pro/verify — status screen with 5 states, document upload wizard, dispute view for pros party to a litige). Promote StepIndicator to @kayu/ui (also used by DS05). Both screens hide the mobile tab bar.
```

### DS10 — Admin Ops
```
You are implementing DS10 of the KAYOU design plan v2.

REQUIRED READING:
1. /Users/alainmk/startups/kayu-project/docs/DESIGN_SYSTEM.md
2. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/00-overview.md
3. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/PROGRESS.md
4. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/DS10-admin-ops.md

VISUAL REFERENCE:
- /Users/alainmk/startups/kayu-project/docs/design-plan-v2/prototype/components/AdminOps.jsx

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

Build the desktop-only admin ops dashboard (/admin). Sidebar + 4 sections: Overview (KPIs + activity feed), Verification queue (two-pane with filters + detail + approve/reject actions), Disputes workbench (two-pane with resolution actions: rembourser / conserver / partiel / escalader), Payouts (batch-select table with Mobile Money breakdown + sticky footer summary). Denser visual language than consumer app: 13-14px body, 22-28px chip heights, sticky table headers, more columns per row. Server-side role gate (ADMIN only). NO mobile screen.
```

### DS11 — Cleanup + audit
```
You are implementing DS11 of the KAYOU design plan v2.

REQUIRED READING:
1. /Users/alainmk/startups/kayu-project/docs/DESIGN_SYSTEM.md
2. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/00-overview.md
3. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/PROGRESS.md
4. /Users/alainmk/startups/kayu-project/docs/design-plan-v2/DS11-cleanup-audit.md

WORKING DIRECTORY: /Users/alainmk/startups/kayu-project/

This is an audit + cleanup chunk, not a build. Retire v1 dashboard stubs (apps/web/src/app/dashboard/{admin,client,provider,settings}), verify mobile Login/Register are deleted, confirm role-based tab matrix and hide-tab-bar list, run token enforcement sweep, run accessibility audit on all 12 new/upgraded screens, update DESIGN_SYSTEM.md with any v2 patterns worth codifying (StepIndicator primitive, country-picker pattern, OTP input, admin denser language). Close PROGRESS with done statuses and note open TODOs (backend wiring, real Mobile Money, camera access, etc.).
```

---

## Parallelization recipe

After DS01 lands, spin up 4 agents in parallel on:
- DS02 (Auth) — an agent on `apps/mobile` and `apps/web` together
- DS03 (My Bookings + Booking Detail) — biggest client chunk
- DS06 (Provider Dashboard) — opens the pro track
- DS10 (Admin Ops) — desktop-only, isolated

Then after DS03:
- DS04 (Messages) and DS05 (Write Review) in parallel

After DS06:
- DS07 (Requests + Quote), DS08 (Earnings), DS09 (Onboarding + Verify) in parallel

Finally DS11 alone.

## Working agreement

1. All visual tokens from `@kayu/ui` — no raw hex in app code
2. Shared patterns go in `@kayu/ui`: StepIndicator (DS09), StatCard / Sparkline (DS06), MessageBubble (DS04)
3. Mobile tab bar behavior lives in ONE file (the navigator config); don't scatter role or hide-list logic
4. Retire v1 components in DS11; don't leave v1 leftovers inline during DS02-10
5. When the prototype JSX and DESIGN_SYSTEM.md disagree, DESIGN_SYSTEM.md wins — the prototype was sketching
6. Prototype's `window`-mutation architecture and `babel/standalone` transpile don't translate to production — use real imports, real bundlers
7. Tab bar visibility and role-awareness changes are breaking; test every screen after DS01
8. No Cupertino, no Material, no dark mode, no raw hex, no spinner on content. Same rules as v1.
