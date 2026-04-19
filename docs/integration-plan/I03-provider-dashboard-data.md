# I03 — Provider Dashboard: backend data + wiring

## Goal

Expand `GET /dashboard/provider` to return the three sections the pro home needs (today's schedule, new requests, stats with sparklines) plus availability state. Wire the web (`/pro`) and mobile (`ProviderDashboardScreen`) to consume it. Delete `TODAY_JOBS`, `NEW_REQUESTS`, `STATS` fixtures.

## Why it matters

The pro dashboard is the pro's daily entry point. Right now every piece of data on it is hardcoded. Once this lands, the pro sees their real world: real bookings, real earnings, real request queue.

## Scope

### In scope
- Expand backend `/dashboard/provider` response shape
- Add an availability toggle endpoint (`PATCH /providers/me/availability`) if not present
- Add a stats-summary shape for the 4 StatCards (revenue / missions / response rate / avg rating) — values + sparkline arrays
- **Onboarding banner** at the top of the dashboard: if the pro hasn't completed onboarding (`Provider.onboardingCompleteAt` is null), render a persistent Sky-subtle banner with a progress-aware CTA ("Étape N/6 · Continuer") that resumes the wizard at the last saved step
- **Feature gating** for partial pros: pro screens that require a complete profile (JobRequests, QuoteCompose, Earnings) show a gated empty state pointing at onboarding until it's complete
- Wire both platforms to `useQuery(queryKeys.dashboard.provider)`
- Delete fixtures

### Out of scope
- Job requests feed (that's I04's scope — the dashboard's "Nouvelles demandes" section will render empty until I04 lands, OR return an empty `newRequests: []` from the backend with a TODO)
- Earnings details (I06 — the stats number is the summary, detail page is elsewhere)
- Calendar view (the "Calendrier" button is a placeholder link)
- Notification bell dropdown (future)

## Backend state

`apps/backend/src/modules/dashboard/` has `DashboardService.getProviderDashboard(user)` returning a generic object. Expand it.

### New response shape

```ts
// @kayu/schemas — responses.ts
export const DashboardProviderResponseSchema = z.object({
  provider: ProviderSchema,                   // current pro's own data
  onboarding: z.object({
    isComplete: z.boolean(),                   // true if Provider.onboardingCompleteAt is set
    currentStep: z.number().int().min(0).max(5).nullable(),  // null when complete
    totalSteps: z.number().int(),              // 6
    missingForPublish: z.array(z.string()).optional(),       // only present if incomplete, e.g. ["hourlyRate", "bio"]
  }),
  availability: z.object({
    isAvailable: z.boolean(),
    zoneCity: z.string().nullable(),
    zoneRadiusKm: z.number().nullable(),
  }),
  today: z.object({
    jobs: z.array(TodayJobSchema),             // confirmed bookings for today
    estimatedRecette: z.number(),              // sum of today's fees
  }),
  newRequests: z.array(RequestPreviewSchema),  // top N inbound job requests (from I04; empty until then)
  stats: z.object({
    period: z.string(),                          // "month" | "week"
    revenue: z.object({
      value: z.number(),
      deltaPct: z.number(),                     // vs previous period
      sparkline: z.array(z.number()),           // last 7 points
    }),
    missions: z.object({
      value: z.number(),
      deltaPct: z.number(),
      sparkline: z.array(z.number()),
    }),
    responseRate: z.object({
      value: z.number(),                        // 0-100
      label: z.string(),                        // "Excellent" | "Bon" | "À améliorer"
    }),
    avgRating: z.object({
      value: z.number(),                        // 0-5
      delta: z.number(),                        // e.g. +0.1
    }),
  }),
  notifications: z.object({ unreadCount: z.number() }),
})

export const TodayJobSchema = z.object({
  id: z.string(),
  time: z.string(),       // "09:00"
  duration: z.string(),   // "~2h"
  kind: z.string(),       // service type
  client: UserSummarySchema,
  address: z.string(),
  distance: z.number(),   // km
  status: z.enum(["confirmed", "en_route", "completed"]),
  fee: z.number(),
})

export const RequestPreviewSchema = z.object({
  id: z.string(),
  client: UserSummarySchema,
  newClient: z.boolean(),
  clientRating: z.number().nullable(),
  clientJobs: z.number(),
  service: z.string(),
  message: z.string(),                   // snippet
  when: z.string(),                       // display string
  address: z.string(),
  distance: z.number(),
  matchScore: z.number(),                 // 0-100
  receivedAt: z.string(),
  urgent: z.boolean(),
})
```

### Service logic

```ts
// dashboard.service.ts
async getProviderDashboard(actor: Actor) {
  const providerId = await this.getProviderIdByUserId(actor.id)

  const [provider, jobs, newRequests, stats] = await Promise.all([
    this.providersService.findByIdForOwner(providerId),
    this.bookingsService.findTodayConfirmedForProvider(providerId),
    this.requestsService.findTopForProvider(providerId, 3),  // I04 feeds this; empty until then
    this.computeProviderStats(providerId),
  ])

  return {
    provider,
    availability: {
      isAvailable: provider.isAvailable,
      zoneCity: provider.city,
      zoneRadiusKm: provider.zoneRadiusKm ?? 10,
    },
    today: {
      jobs,
      estimatedRecette: jobs.reduce((acc, j) => acc + j.fee, 0),
    },
    newRequests,
    stats: { period: "month", ...stats },
    notifications: { unreadCount: await this.notificationsService.countUnread(actor.id) },
  }
}
```

For `computeProviderStats`, compute:
- **revenue.value**: sum of `Transaction.netAmt` where `type = EARNING` in current month (once I06 lands; until then sum of `Booking.price` where `status = COMPLETED` in month)
- **revenue.deltaPct**: compare to previous month
- **revenue.sparkline**: daily revenue for last 7 days
- **missions.value**: count of completed bookings in month
- **missions.deltaPct**: vs previous month
- **responseRate.value**: % of requests responded to within 24h (or a reasonable proxy)
- **avgRating.value**: `Provider.rating` (already computed by review module)
- **avgRating.delta**: vs 30 days ago

If any metric can't be computed (e.g. no completed bookings), return `0` and a default delta, never null.

### Availability toggle

Add `PATCH /providers/me/availability` body `{ isAvailable: boolean }`. Already partially implemented in `updateMe` maybe — if so, route to that. If not, add.

## `@kayu/api` additions

```ts
// endpoints/dashboard.ts
getProviderDashboard: () => client.get<DashboardProviderResponseType>("/dashboard/provider")

// endpoints/providers.ts
updateAvailability: (data: { isAvailable: boolean }) =>
  client.patch<{ success: boolean }>("/providers/me/availability", data)
```

## Onboarding banner (web + mobile)

Render at the very top of the dashboard when `data.onboarding.isComplete === false`.

**Web:**
```tsx
{!data.onboarding.isComplete && (
  <div role="alert" className="bg-sky-subtle border border-sky-200 rounded-xl p-4 mb-6 flex items-center gap-4">
    <div className="h-10 w-10 rounded-full bg-white grid place-items-center text-sky-600">
      <Icon.sparkles size={18} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="font-display font-semibold text-ink">Complétez votre inscription</div>
      <div className="text-sm text-body">
        Étape {(data.onboarding.currentStep ?? 0) + 1} sur {data.onboarding.totalSteps} ·
        Vous apparaîtrez dans les recherches dès que votre profil sera publié.
      </div>
      <div className="h-1.5 rounded-full bg-sky-100 mt-3 overflow-hidden">
        <div
          className="h-full bg-sky-500 transition-all"
          style={{ width: `${((data.onboarding.currentStep ?? 0) / data.onboarding.totalSteps) * 100}%` }}
        />
      </div>
    </div>
    <Link href="/pro/onboarding" className="k-btn k-btn-primary">
      Continuer <Icon.arrowRight size={14} />
    </Link>
  </div>
)}
```

**Mobile:** same pattern, full-width card with radius 16, `elev.e2`. The CTA does `navigation.navigate("ProviderOnboarding")`.

### Banner is not dismissible
The onboarding banner persists across sessions until the wizard is complete. No "later" dismiss — partial pros don't receive requests, so there's no dashboard value without finishing.

### Feature gating while incomplete

Other pro screens behave like this when `onboarding.isComplete === false`:
- **JobRequests** (`/pro/requests`): render an empty state "Complétez votre inscription pour recevoir des demandes" with CTA to onboarding.
- **QuoteCompose** (`/pro/devis/new`): same gate before opening the form. If the user somehow landed here, block with the same empty state.
- **Earnings** (`/pro/earnings`): show the empty chart + "Vous recevrez vos premières missions après la publication de votre profil" copy.
- **Verification** (`/pro/verify`): accessible (onboarding and verification are separate concerns — onboarding makes you visible; verification adds the trust badge).

Rule of thumb: if a screen needs a **published** provider to be useful, gate it. If a screen is about the **person** (verification, profile edit later), don't gate.

## Frontend wiring — web

File: `apps/web/src/app/pro/page.tsx` + `apps/web/src/components/pro/ProviderDashboard.tsx`

Replace the three fixtures:
- `TODAY_JOBS` → `data.today.jobs`
- `NEW_REQUESTS` → `data.newRequests`
- `STATS` → `data.stats`

```tsx
const { data, isLoading, error, refetch } = useQuery({
  queryKey: queryKeys.dashboard.provider,
  queryFn: () => dashboardApi(apiClient).getProviderDashboard(),
})

const availMut = useMutation({
  mutationFn: (isAvailable: boolean) => providersApi(apiClient).updateAvailability({ isAvailable }),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.provider }),
})
```

States:
- Loading → `<ProviderDashboardSkeleton/>` (exists from D08)
- Error → `<ErrorState onRetry={() => refetch()}/>`
- Role-gate: middleware redirect if `user.role !== "PROVIDER"` (already in place from DS06)

## Frontend wiring — mobile

File: `apps/mobile/src/screens/pro/ProviderDashboardScreen.tsx`

Same pattern. Toggle the availability switch → `availMut.mutate(newValue)`. Optimistic update local state while the mutation is in flight; rollback on error.

## Fixtures to delete

- Web `apps/web/src/.../fixtures.ts`: `TODAY_JOBS`, `NEW_REQUESTS`, `STATS`
- Mobile `apps/mobile/src/.../fixtures.ts`: same

Keep `PRO_ME` (the current pro's own profile) — it's replaced by the `data.provider` field from the API; no fixture needed.

## Dependencies
- No hard dependency. I04 populates `newRequests` more richly; until then the backend returns empty list.
- Blocks I10

## Acceptance criteria

1. `GET /dashboard/provider` returns the expanded shape including `onboarding.isComplete` + `currentStep`
2. Web `/pro` and mobile ProviderDashboardScreen render real data
3. Pros with incomplete onboarding see a persistent banner with progress indicator and a "Continuer" CTA that resumes the wizard
4. Tapping "Continuer" opens the onboarding at `data.onboarding.currentStep` (not step 0)
5. Pros with `isComplete === true` never see the banner
6. JobRequests / QuoteCompose / Earnings screens show gated empty states when onboarding is incomplete
7. Availability toggle persists to DB (reflects on provider profile in search)
8. Stat cards show accurate delta % vs previous month
9. "Nouvelles demandes" section renders empty gracefully until I04 lands
10. Fixtures deleted from both platforms

## QA checklist
- [ ] `grep -r "TODAY_JOBS\|NEW_REQUESTS" apps/` returns nothing
- [ ] Pro with 0 completed bookings → stats show 0 values, no NaN or crashes
- [ ] Pro with 3+ confirmed bookings today → today.jobs renders them correctly, sorted by time
- [ ] Availability toggle off → pro disappears from search immediately (cache invalidation)
- [ ] Revenue sparkline renders 7 data points (one per day)
- [ ] Response rate label uses the right threshold: ≥90% "Excellent", ≥70% "Bon", else "À améliorer"
- [ ] Avg rating matches `Provider.rating` from the database
- [ ] Delta % uses the correct sign and color (green up / rose down)
- [ ] Client-role user accessing `/pro` is redirected to `/`
- [ ] Loading state shows skeleton, not spinner
- [ ] Error state has a retry button that refetches
- [ ] **Brand-new pro just finished OTP** → lands on `/pro/onboarding` step 1 (not dashboard)
- [ ] **Pro abandoned onboarding at step 3, comes back** → lands on `/pro`, banner reads "Étape 4 sur 6", progress bar at ~50%, tapping continue opens wizard at step 4 (preserves draft)
- [ ] Completed pro → no banner, no gated sections
- [ ] Incomplete pro navigates to `/pro/requests` → sees "Complétez votre inscription pour recevoir des demandes" empty state (not an empty list)
- [ ] Incomplete pro navigates to `/pro/devis/new` → same gated empty state
- [ ] Incomplete pro navigates to `/pro/earnings` → chart renders all zeros + gated copy
- [ ] Incomplete pro navigates to `/pro/verify` → accessible (not gated — verification is independent)
