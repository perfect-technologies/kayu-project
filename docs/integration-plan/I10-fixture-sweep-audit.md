# I10 — Fixture sweep + E2E audit

## Goal

Close the integration. No residual fixtures in app code. Every wired screen has proper loading / empty / error states. End-to-end smoke test traces the full client and pro journeys against real backend data. PROGRESS marked closed.

## Why it matters

Integration work naturally leaves debris. Half-deleted constants, fallback static data "for safety", `useState([])` defaults that silently mask bugs — these are the kind of drift that turns an audit clean build into a mocked mess 6 months later. I10 is the explicit checkpoint.

## Scope

### In scope
- Search + delete all remaining fixture constants in `apps/web` and `apps/mobile`
- For each wired screen: verify loading + empty + error states render correctly
- E2E smoke test: simulate a full client journey and a full pro journey against a dev backend
- Update `DEVELOPER_GUIDE.md` with current backend domain list + endpoint inventory
- Close `PROGRESS.md` with done statuses and open-TODO section

### Out of scope
- Automated test harness (Playwright / Detox) — future
- Performance audit (TTI, bundle size)
- Real PSP integration (I06 deferred)
- Admin UI if I09 was skipped

## The fixture sweep

Run these greps in both `apps/web` and `apps/mobile`:

```bash
# Data fixtures that MUST be gone
grep -rE "const (BOOKINGS|INCOMING_REQUESTS|PRO_ACTIVE_JOBS|TODAY_JOBS|NEW_REQUESTS|STATS|EARNINGS_WEEKLY|TRANSACTIONS|BALANCES|DEMO_THREADS|DEMO_ACCOUNTS|INITIAL_DATA|VERIFY_STATE|PRO_DISPUTE|VERIFICATION_QUEUE|DISPUTES|PAYOUT_QUEUE|ADMIN_KPIS) = \[" apps/

# Static config constants that STAY (these are product config, not data)
grep -rE "const (COUNTRIES|CATEGORIES|PRESET_LINE_ITEMS|SUGGESTED_REPLIES|SERVICE_OPTIONS|LANGUAGES|HOURLY_PRESETS|CITIES) = " apps/
```

The first grep must return zero matches. The second lists what we intentionally keep:
- **COUNTRIES** — CD/CG dial code config; static product config, not data.
- **CATEGORIES** — should be reduced to a client-side fallback list for offline-first, with live data coming from `/categories`. Confirm `apps/mobile` uses `FALLBACK_STRIP` only when offline; wired when online.
- **PRESET_LINE_ITEMS** — quote presets per category; product catalog.
- **SUGGESTED_REPLIES** — messages quick-replies; product config.
- **SERVICE_OPTIONS** — booking flow's service type options; product catalog.
- **LANGUAGES, HOURLY_PRESETS, CITIES** — onboarding form options; product config.

If any of these are ambitious enough to be data (e.g. `CITIES` should come from a `/cities` endpoint), create a follow-up ticket rather than lumping into I10.

## Per-screen state audit

Walk through each wired screen and confirm three states render:

### Client track

| Screen | Loading state | Empty state | Error state |
|---|---|---|---|
| Home | skeleton from `@kayu/ui` | category strip fallback | ErrorState with retry |
| Search | `WideProviderCardSkeleton × 4` | "Aucun pro trouvé" with "Effacer les filtres" CTA | retry |
| Provider profile | `ProviderProfileSkeleton` | (n/a — profile exists or 404) | 404 page for missing id; retry for 5xx |
| Booking flow | form renders optimistically | (n/a) | inline error above submit button |
| MyBookings | skeleton tabs | "Aucune réservation à venir" per-tab copy | retry |
| BookingDetail | skeleton sections | (n/a) | 404 if missing; retry for 5xx |
| Messages inbox | skeleton rows | "Aucun message" | retry |
| Messages thread | skeleton bubbles | "Début de la conversation" | retry |
| WriteReview | form renders optimistically | (n/a) | inline error |
| Auth | brand panel + form skeleton | (n/a) | inline under inputs |

### Pro track

| Screen | Loading | Empty | Error |
|---|---|---|---|
| ProviderDashboard | `ProviderDashboardSkeleton` | "Aucune mission aujourd'hui" / "Pas de demande" | retry |
| JobRequests | skeleton cards | "Pas de nouvelle demande" | retry |
| QuoteCompose | fetch-request skeleton | (n/a) | inline + block submit |
| Earnings | skeleton chart + rows | "Pas encore de transactions" | retry |
| Onboarding | form renders optimistically from cached draft | (n/a) | inline + retry for PATCH errors |
| Verification | skeleton status card | "Commencez votre vérification" | retry |

For each screen, **manually** trigger: (a) backend off → error state; (b) empty dataset → empty state; (c) slow response → loading state. Document results in PROGRESS.

## E2E smoke test — client journey

1. Open the app on a real phone. Hit `/auth`.
2. Enter a real CD phone → receive OTP → enter → land on role picker.
3. Tap "Je cherche un pro" → redirect to `/`.
4. Home shows real stats + categories.
5. Tap "Plomberie" → Search results show real providers in Kinshasa.
6. Tap a pro → Provider profile loads real data (ratings, skills, portfolio).
7. Tap "Réserver" → Booking flow with real provider.
8. Confirm booking → Kayou Moment plays → redirects to `/review/[providerId]?fromBooking=1`.
9. Submit review → success → back home.
10. Go to Bookings tab → the new booking is there, status "À venir".
11. Tap booking → BookingDetail shows real data.
12. Send a message to the pro → real messaging persists.

If any step fails, block on fixing before proceeding.

## E2E smoke test — pro journey

1. Seed a provider account (onboarding complete, verified). Log in.
2. Dashboard shows real today's jobs, stats, new requests.
3. Pick a new request from the inbox → detail → "Envoyer un devis".
4. QuoteCompose opens with request prefilled.
5. Add 2 line items, 10% discount, 7-day validity → submit.
6. Quote sent; pro receives "Devis envoyé" success.
7. (As client) Log in on another device / incognito → see the quote in their request detail → accept.
8. (Back as pro) Dashboard shows the new booking in today's schedule.
9. Mark booking as COMPLETED → Earnings section updates with new EARNING transaction.
10. Go to Earnings → weekly chart shows the new earning → balance increases.
11. Tap "Demander un paiement" → select M-Pesa → enter phone → Valider.
12. Payout appears in PENDING status in transactions list.

## DEVELOPER_GUIDE.md refresh

Update the top-level guide with:
- Full domain list: identity, providers, categories, bookings, reviews, messaging, notifications, favorites, settings, stats, geo, admin, **quotes, earnings, job-requests, verification** (new)
- Endpoint inventory — link to OpenAPI or inline the full list
- How to add a new screen (scaffold, wire, test)
- How to add a new backend domain (module + Zod schemas + API client)

## PROGRESS close

Update `integration-plan/PROGRESS.md`:
- Mark I01-I08 as `done` (and I09 if wired; else `deferred`)
- Fill the "Open TODOs" section:
  - Real PSP integration for Mobile Money payouts (I06 stub)
  - Cloud storage for verification docs (I08 stub)
  - Admin disputes/payouts UI if I09 was skipped
  - WebSockets for real-time messaging
  - Automated e2e tests
  - i18n (FR → Lingala / Swahili future)
  - Push notifications

## Dependencies
- Requires all other chunks
- Terminal — blocks nothing

## Acceptance criteria

1. Zero data fixtures in app code (only product-config constants remain)
2. Every wired screen has loading + empty + error states tested
3. Client E2E smoke passes end-to-end
4. Pro E2E smoke passes end-to-end
5. `DEVELOPER_GUIDE.md` updated
6. PROGRESS marked done with open TODOs enumerated

## QA checklist
- [ ] Fixture grep returns zero matches for data constants
- [ ] Static-config grep shows ONLY the intentionally-kept constants
- [ ] No `useState([...{ hardcoded }])` default arrays in screen components
- [ ] Every `useQuery` has an associated loading state handled in the UI
- [ ] Every `useQuery` has an associated error state
- [ ] Every list has an empty state
- [ ] Client smoke test: all 12 steps pass
- [ ] Pro smoke test: all 12 steps pass
- [ ] `turbo run lint` passes
- [ ] `turbo run type-check` passes
- [ ] DEVELOPER_GUIDE reflects current domain list
- [ ] PROGRESS marks I01-I08 done; I09 noted as deferred or done; I10 done
