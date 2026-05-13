# Provider details page redesign — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/providers/[id]` to push visitors toward booking — new hero, proof-first section order, merged Portfolio + Projects, merged Diplomas + Certifications, toggle reviews breakdown, polished booking rail + mobile sticky bar.

**Architecture:** Pure presentation rewrite inside `apps/web`. No backend changes, no schema migrations, no new API calls. The existing `providersApi.getById(id)` response is the sole data source; what changes is how it's composed and styled. The page stays a server component that hydrates a single client component (`ProviderProfileClient`) which composes the new section components.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4, lucide-react, existing `@kayu/ui` tokens via `var(--k-*)` CSS variables. No new dependencies.

## Conventions for this plan

- **No intermediate commits.** Per project preference (see user memory), the entire redesign ships in one commit at the end. Each task ends with a browser smoke test, not a git commit.
- **No new comments** in code unless something is non-obvious (workaround, hidden constraint).
- **Tokens only** — use `var(--k-*)` CSS variables, not hardcoded hex outside what's already established in the spec (e.g. the reviews headline strip's `#FFFBF5` / `#FDE68A` warm beige is allowed because it matches the landing's provider CTA).
- **Lucide icons only.** Import individually from `lucide-react`. No emoji-as-icon.
- **Mobile is first-class.** Every task includes a mobile-viewport verification step.
- **Reference doc paths:**
  - Spec: `docs/superpowers/specs/2026-05-13-provider-details-redesign-design.md`
  - Design direction: `docs/design-direction/index.html`
  - Tokens: `packages/ui/src/tokens.ts`

## File map

**Create:**
- `apps/web/src/lib/provider/derivePitch.ts`
- `apps/web/src/components/provider-profile/BookingRail.tsx`
- `apps/web/src/components/provider-profile/MobileStickyBar.tsx`
- `apps/web/src/components/provider-profile/ProviderRecentWork.tsx`
- `apps/web/src/components/provider-profile/ProviderRecentWorkLightbox.tsx`
- `apps/web/src/components/provider-profile/ProviderCredentials.tsx`

**Rewrite (file keeps its path):**
- `apps/web/src/components/provider-profile/ProviderHeader.tsx`
- `apps/web/src/components/provider-profile/ProviderAbout.tsx`
- `apps/web/src/components/provider-profile/ProviderSkills.tsx`
- `apps/web/src/components/provider-profile/ProviderReviews.tsx`

**Delete:**
- `apps/web/src/components/provider-profile/ProviderPortfolio.tsx`
- `apps/web/src/components/provider-profile/ProviderCertifications.tsx`
- `apps/web/src/components/provider-profile/ProviderDiplomas.tsx`
- `apps/web/src/components/provider-profile/ProviderCategories.tsx`

**Update:**
- `apps/web/src/app/providers/[id]/ProviderProfileClient.tsx` (composition, section order, drop categories card)
- `apps/web/src/components/provider-profile/index.ts` (exports)

---

### Task 1: derivePitch utility

**Files:**
- Create: `apps/web/src/lib/provider/derivePitch.ts`

- [ ] **Step 1: Create the utility**

Create `apps/web/src/lib/provider/derivePitch.ts`:

```ts
export function derivePitch(description: string | null | undefined): string | null {
  if (!description) return null;
  const trimmed = description.trim();
  if (trimmed.length < 20) return null;

  const match = trimmed.match(/^([^.!?]+[.!?])/);
  const sentence = (match ? match[1] : trimmed).trim();

  if (sentence.length < 20) return null;
  if (sentence.length > 180) return sentence.slice(0, 177).trimEnd() + "…";
  return sentence;
}
```

Cases the function handles, verified by walking through each branch:

| Input | Output |
|---|---|
| `null` / `undefined` / `""` / `"   "` | `null` |
| `"Bonjour."` (8 chars) | `null` (too short) |
| `"Je suis plombier depuis 5 ans."` | `"Je suis plombier depuis 5 ans."` |
| `"Je suis plombier. J'interviens vite."` | `"Je suis plombier."` (first sentence) |
| `"Bonjour, je."` (first sentence is 12 chars) | `null` (sentence too short) |
| 200-char first sentence with no period | first 177 chars + `"…"` |
| 200-char first sentence with period at the end | first 177 chars + `"…"` |

- [ ] **Step 2: Type-check**

Run from `apps/web/`:
```bash
pnpm type-check
```
Expected: passes.

- [ ] **Step 3: Verify**

No test runner is configured for `apps/web`. The function is small enough to validate by reading the truth table above against the implementation. The function gets exercised end-to-end in Task 6 when the hero renders the pitch.

---

### Task 2: Extract BookingRail (pure extract, no behavior change)

The current rail is ~90 lines of inline JSX inside `ProviderProfileClient.tsx` (roughly lines 519–625). Extract it verbatim into its own file as a pure refactor — same look, same behavior. The next task polishes it.

**Files:**
- Create: `apps/web/src/components/provider-profile/BookingRail.tsx`
- Modify: `apps/web/src/app/providers/[id]/ProviderProfileClient.tsx`

- [ ] **Step 1: Create BookingRail.tsx with the existing markup**

Create `apps/web/src/components/provider-profile/BookingRail.tsx`. Move the existing `<aside>` block (the desktop sticky rail, lines ~519–625 in `ProviderProfileClient.tsx`) into a function component. The component takes the data + handlers it needs as props. Use this interface — the property names map directly to what the parent already computes:

```tsx
"use client";

import { MapPin, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { ProviderCategories } from "./ProviderCategories";

interface BookingRailProps {
  providerId: string;
  hourlyFormatted: string | null;
  city: string | null;
  phone: string | null;
  allowMessages: boolean;
  isOwnProfile: boolean;
  categories: Array<{ id: string; name: string; slug: string; icon?: string | null; color?: string | null }>;
  serviceZones: Array<{ id: string; city: string; commune?: string | null }>;
  onBook: () => void;
  onContact: () => void;
  onDashboard: () => void;
}

export function BookingRail(props: BookingRailProps) {
  // Paste the existing <aside>...</aside> block here, replacing:
  //   visibleProvider.user.city → props.city
  //   hourlyFormatted → props.hourlyFormatted
  //   visibleProvider.user.phone → props.phone
  //   visibility.allowMessages → props.allowMessages
  //   isOwnProfile → props.isOwnProfile
  //   provider.categories / provider.serviceZones → props.categories / props.serviceZones
  //   router.push(`/book/${provider.id}`) → props.onBook
  //   setContactOpen(true) → props.onContact
  //   router.push("/dashboard") → props.onDashboard
  return (
    <aside className="hidden self-start lg:sticky lg:top-[104px] lg:block">
      {/* the existing rail JSX, with the substitutions above */}
    </aside>
  );
}
```

- [ ] **Step 2: Wire it up in ProviderProfileClient.tsx**

In `ProviderProfileClient.tsx`:

1. Add the import:
   ```tsx
   import { BookingRail } from "@/components/provider-profile/BookingRail";
   ```
2. Replace the inline `<aside>...</aside>` block with:
   ```tsx
   <BookingRail
     providerId={provider.id}
     hourlyFormatted={hourlyFormatted}
     city={visibleProvider.user.city ?? null}
     phone={visibleProvider.user.phone ?? null}
     allowMessages={visibility.allowMessages}
     isOwnProfile={isOwnProfile}
     categories={provider.categories}
     serviceZones={provider.serviceZones}
     onBook={() => router.push(`/book/${provider.id}`)}
     onContact={() => setContactOpen(true)}
     onDashboard={() => router.push("/dashboard")}
   />
   ```
3. Remove the now-unused imports from `ProviderProfileClient.tsx` if they were only used inside the rail: `MapPin`, `MessageCircle`, `Phone`, `ShieldCheck`, `MiniRow`. `MiniRow` is a helper at the bottom of the current file — move it into `BookingRail.tsx` since only the rail uses it. Delete `MiniRow` from `ProviderProfileClient.tsx`.

- [ ] **Step 3: Verify in browser**

Run from `apps/web/`:
```bash
pnpm dev
```
Open `http://localhost:3000/providers/<any-id>` (use one from the database; the dev backend should be running too). On a viewport ≥ 1024px, the rail should look **identical to before**: same price, same buttons, same categories card under it, same shadow.

If the rail looks different, the extract dropped something — diff the original `<aside>` against the new component and reconcile.

- [ ] **Step 4: Type-check**

Run from `apps/web/`:
```bash
pnpm type-check
```
Expected: passes.

---

### Task 3: Extract MobileStickyBar (pure extract, no behavior change)

The mobile sticky bar is ~80 lines inline in `ProviderProfileClient.tsx` (roughly lines 638–722). Same pure-extract treatment as Task 2.

**Files:**
- Create: `apps/web/src/components/provider-profile/MobileStickyBar.tsx`
- Modify: `apps/web/src/app/providers/[id]/ProviderProfileClient.tsx`

- [ ] **Step 1: Create MobileStickyBar.tsx**

```tsx
"use client";

import { MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileStickyBarProps {
  hourlyFormatted: string | null;
  rating: number;
  totalReviews: number;
  phone: string | null;
  allowMessages: boolean;
  isOwnProfile: boolean;
  onBook: () => void;
  onContact: () => void;
  onDashboard: () => void;
}

export function MobileStickyBar(props: MobileStickyBarProps) {
  // Move the existing fixed bottom bar div here with the same substitutions
  // pattern as Task 2.
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center gap-3 px-4 py-3 md:hidden"
      style={{
        background: "var(--k-surface)",
        borderTop: "1px solid var(--k-border)",
        boxShadow: "0 -4px 20px -8px rgba(15,23,42,0.1)",
      }}
    >
      {/* existing JSX */}
    </div>
  );
}
```

- [ ] **Step 2: Wire it up in ProviderProfileClient.tsx**

1. Import:
   ```tsx
   import { MobileStickyBar } from "@/components/provider-profile/MobileStickyBar";
   ```
2. Replace the inline `<div className="fixed bottom-0 left-0 right-0 z-40 ...">` block with:
   ```tsx
   <MobileStickyBar
     hourlyFormatted={hourlyFormatted}
     rating={provider.rating}
     totalReviews={provider.totalReviews}
     phone={visibleProvider.user.phone ?? null}
     allowMessages={visibility.allowMessages}
     isOwnProfile={isOwnProfile}
     onBook={() => router.push(`/book/${provider.id}`)}
     onContact={() => setContactOpen(true)}
     onDashboard={() => router.push("/dashboard")}
   />
   ```

- [ ] **Step 3: Verify in browser**

Dev server. Open Chrome devtools, toggle device toolbar to iPhone 14 (390×844). Provider page should still show the sticky bottom bar with price/icons/Réserver, identical to before.

- [ ] **Step 4: Type-check**

```bash
pnpm type-check
```
Expected: passes.

---

### Task 4: Polish BookingRail per spec

Apply the spec §7 changes to the now-isolated `BookingRail.tsx`.

**Files:**
- Modify: `apps/web/src/components/provider-profile/BookingRail.tsx`

- [ ] **Step 1: Update the props to include rail-specific data**

Extend the props interface:

```tsx
interface BookingRailProps {
  providerId: string;
  firstName: string;
  hourlyRate: number | null;
  rating: number;
  totalReviews: number;
  totalJobs: number;
  responseTime: number | null;
  verificationStatus: "PENDING" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED" | undefined;
  phone: string | null;
  allowMessages: boolean;
  isOwnProfile: boolean;
  onBook: () => void;
  onContact: () => void;
  onDashboard: () => void;
}
```

Remove the `city`, `categories`, `serviceZones`, and `hourlyFormatted` props from the previous version — the rail no longer renders the categories card or the city row, and the formatted price is computed inside.

- [ ] **Step 2: Rewrite the rail's JSX per spec**

Inside the function, derive formatting helpers:

```tsx
const hourlyFormatted = props.hourlyRate
  ? props.hourlyRate.toLocaleString("fr-FR")
  : null;
const responseLabel = formatResponseTime(props.responseTime);
const showVerifiedTrust = props.verificationStatus === "VERIFIED";
const showReviewTrust = props.totalReviews >= 5;
```

Where `formatResponseTime` is the same helper as in `ProviderHeader.tsx` today — duplicate the function at the bottom of `BookingRail.tsx`:

```tsx
function formatResponseTime(minutes?: number | null) {
  if (!minutes || minutes <= 0) return null;
  if (minutes < 60) return `${minutes} min`;
  return `${Math.round(minutes / 60)} h`;
}
```

JSX structure inside the existing `<aside className="hidden self-start lg:sticky lg:top-[104px] lg:block">` wrapper:

```tsx
<div
  style={{
    background: "var(--k-surface)",
    border: "1px solid var(--k-border)",
    borderRadius: "var(--k-r-lg)",
    boxShadow: "var(--k-e2)",
    padding: 24,
  }}
>
  {hourlyFormatted ? (
    <>
      <div className="k-caption" style={{ letterSpacing: "0.06em", textTransform: "uppercase" }}>À partir de</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 4 }}>
        <span
          className="k-price"
          style={{
            fontFamily: "var(--k-font-mono)",
            fontWeight: 700,
            fontSize: 32,
            letterSpacing: "-0.01em",
            color: "var(--k-text-primary)",
          }}
        >
          {hourlyFormatted}
        </span>
        <span style={{ fontSize: 14, color: "var(--k-text-muted)", fontWeight: 500 }}>FC / h</span>
      </div>
    </>
  ) : (
    <div>
      <div className="k-caption">Prix de départ</div>
      <div className="k-display-m" style={{ margin: "4px 0 0" }}>À convenir</div>
    </div>
  )}

  <p style={{ fontSize: 12, color: "var(--k-text-muted)", marginTop: 10, lineHeight: 1.5 }}>
    Le prix final est convenu avec {props.firstName}. Paiement en espèces à la fin de la mission.
  </p>

  {/* In-card stats strip */}
  <div
    style={{
      display: "flex",
      gap: 14,
      marginTop: 14,
      paddingTop: 14,
      borderTop: "1px solid var(--k-border-subtle)",
      fontSize: 12,
    }}
  >
    {props.rating > 0 && (
      <div style={{ color: "var(--k-text-body)" }}>
        <b style={{ color: "var(--k-text-primary)", display: "block", fontWeight: 700 }}>
          ★ {props.rating.toFixed(1).replace(".", ",")}
        </b>
        {props.totalReviews} avis
      </div>
    )}
    {responseLabel && (
      <div style={{ color: "var(--k-text-body)" }}>
        <b style={{ color: "var(--k-text-primary)", display: "block", fontWeight: 700 }}>{responseLabel}</b>
        réponse
      </div>
    )}
    {props.totalJobs > 0 && (
      <div style={{ color: "var(--k-text-body)" }}>
        <b style={{ color: "var(--k-text-primary)", display: "block", fontWeight: 700 }}>{props.totalJobs}</b>
        missions
      </div>
    )}
  </div>

  {/* Actions */}
  {props.isOwnProfile ? (
    <button className="k-btn k-btn-secondary k-btn-lg" style={{ marginTop: 16, width: "100%" }} onClick={props.onDashboard}>
      Tableau de bord
    </button>
  ) : (
    <>
      <button className="k-btn k-btn-primary k-btn-lg" style={{ marginTop: 16, width: "100%" }} onClick={props.onBook}>
        Demander une réservation
      </button>
      {(props.phone || props.allowMessages) && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: props.phone && props.allowMessages ? "1fr 1fr" : "1fr",
            gap: 8,
            marginTop: 8,
          }}
        >
          {props.phone && (
            <a className="k-btn k-btn-secondary" href={`tel:${props.phone}`}>
              <Phone className="h-4 w-4" /> Appeler
            </a>
          )}
          {props.allowMessages && (
            <button className="k-btn k-btn-secondary" onClick={props.onContact}>
              <MessageCircle className="h-4 w-4" /> Message
            </button>
          )}
        </div>
      )}
    </>
  )}

  {/* Reassurance footer */}
  {!props.isOwnProfile && (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        marginTop: 14,
        paddingTop: 14,
        borderTop: "1px solid var(--k-border-subtle)",
        fontSize: 11,
        color: "var(--k-text-body)",
      }}
    >
      <ReassureRow>Aucun paiement avant le travail</ReassureRow>
      {showVerifiedTrust && <ReassureRow>Identité vérifiée par KAYOU</ReassureRow>}
      {showReviewTrust && (
        <ReassureRow>
          Note moyenne {props.rating.toFixed(1).replace(".", ",")} sur {props.totalReviews} avis
        </ReassureRow>
      )}
    </div>
  )}
</div>
```

Add a small `ReassureRow` helper at the bottom of the same file:

```tsx
function ReassureRow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <ShieldCheck className="h-3.5 w-3.5" style={{ color: "var(--k-success)" }} />
      <span>{children}</span>
    </div>
  );
}
```

Remove the `<ProviderCategories ... />` block that was previously rendered inside the rail aside — that card is being deleted in Task 14.

- [ ] **Step 3: Update the call site in ProviderProfileClient.tsx**

Update the `<BookingRail />` call to match the new props:

```tsx
<BookingRail
  providerId={provider.id}
  firstName={provider.user.firstName}
  hourlyRate={visibleProvider.hourlyRate}
  rating={provider.rating}
  totalReviews={provider.totalReviews}
  totalJobs={provider.totalJobs}
  responseTime={provider.responseTime}
  verificationStatus={provider.verificationStatus}
  phone={visibleProvider.user.phone ?? null}
  allowMessages={visibility.allowMessages}
  isOwnProfile={isOwnProfile}
  onBook={() => router.push(`/book/${provider.id}`)}
  onContact={() => setContactOpen(true)}
  onDashboard={() => router.push("/dashboard")}
/>
```

Don't yet delete `ProviderCategories.tsx` — it's still imported elsewhere temporarily. It gets deleted in Task 14.

- [ ] **Step 4: Verify in browser**

Dev server. Provider page on a ≥1024px viewport:

- Price is 32px mono, with `FC / h` unit in smaller muted text next to it.
- Below: reassurance copy referencing the provider's first name.
- 1px divider, then 3 inline stats (★ rating + avis · response · missions). Each cell hidden when its data is null/0.
- Primary blue Réserver button, full width.
- Below: 2-column grid for Appeler + Message (single column if only one is available).
- 1px divider, then up to 3 small green-check reassurance lines.
- Test the "no hourly rate" case: temporarily clear it in your test data or pick a provider without one; the rail should show "Prix de départ / À convenir".

- [ ] **Step 5: Type-check**

```bash
pnpm type-check
```
Expected: passes.

---

### Task 5: Polish MobileStickyBar per spec

Apply spec §8 changes.

**Files:**
- Modify: `apps/web/src/components/provider-profile/MobileStickyBar.tsx`

- [ ] **Step 1: Rewrite the bar's JSX**

Inside the existing wrapper div, the content layout per spec:

```tsx
<div className="min-w-0 flex-shrink">
  {props.hourlyFormatted ? (
    <>
      <div style={{ fontSize: 9, color: "var(--k-text-muted)" }}>À partir de</div>
      <div>
        <span
          style={{
            fontFamily: "var(--k-font-mono)",
            fontWeight: 700,
            fontSize: 13,
            color: "var(--k-text-primary)",
          }}
        >
          {props.hourlyFormatted} FC
        </span>
        <span style={{ fontSize: 9, color: "var(--k-text-muted)", marginLeft: 2 }}>/h</span>
      </div>
    </>
  ) : (
    <>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--k-text-primary)" }}>À convenir</div>
      <div style={{ fontSize: 10, color: "var(--k-text-muted)" }}>Discussion puis offre finale</div>
    </>
  )}
</div>
<div className="flex-1" />

{props.isOwnProfile ? (
  <button
    onClick={props.onDashboard}
    className="k-btn"
    style={{ height: 44, padding: "0 22px", background: "var(--k-surface)", border: "1px solid var(--k-border)" }}
  >
    Tableau de bord
  </button>
) : (
  <>
    {props.phone && (
      <a
        href={`tel:${props.phone}`}
        aria-label="Appeler"
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: "var(--k-surface)",
          border: "1px solid var(--k-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--k-text-primary)",
        }}
      >
        <Phone className="h-[16px] w-[16px]" />
      </a>
    )}
    {props.allowMessages && (
      <button
        onClick={props.onContact}
        aria-label="Message"
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: "var(--k-surface)",
          border: "1px solid var(--k-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--k-text-primary)",
        }}
      >
        <MessageCircle className="h-[16px] w-[16px]" />
      </button>
    )}
    <button
      className="k-btn k-btn-primary"
      style={{ height: 40, padding: "0 18px", borderRadius: 999, fontWeight: 600 }}
      onClick={props.onBook}
    >
      Réserver
    </button>
  </>
)}
```

The previous version showed rating + reviews in the price block (`★ {rating} · {totalReviews} avis`) — per spec §8, drop that line. The price block is just the price + unit, or `À convenir` + sub-line.

Update the props — `rating` and `totalReviews` are no longer needed:

```tsx
interface MobileStickyBarProps {
  hourlyFormatted: string | null;
  phone: string | null;
  allowMessages: boolean;
  isOwnProfile: boolean;
  onBook: () => void;
  onContact: () => void;
  onDashboard: () => void;
}
```

- [ ] **Step 2: Update the call site**

In `ProviderProfileClient.tsx`:

```tsx
<MobileStickyBar
  hourlyFormatted={hourlyFormatted}
  phone={visibleProvider.user.phone ?? null}
  allowMessages={visibility.allowMessages}
  isOwnProfile={isOwnProfile}
  onBook={() => router.push(`/book/${provider.id}`)}
  onContact={() => setContactOpen(true)}
  onDashboard={() => router.push("/dashboard")}
/>
```

- [ ] **Step 3: Verify in browser**

Dev server, mobile viewport (390×844). Sticky bottom bar:
- Left: small "À partir de" caption + mono price + small "/h"
- Right: circular Phone button (if phone visible) + circular MessageCircle button (if allowed) + rounded primary pill "Réserver"
- Old `★ rating · avis` line under price is gone

Test `hourlyFormatted == null` case: shows "À convenir" / "Discussion puis offre finale".

- [ ] **Step 4: Type-check**

```bash
pnpm type-check
```
Expected: passes.

---

### Task 6: Rewrite ProviderHeader (the new hero)

This is the biggest single component change. Spec §1 covers every detail.

**Files:**
- Modify: `apps/web/src/components/provider-profile/ProviderHeader.tsx`

- [ ] **Step 1: Update the props shape**

The component receives the same `provider` object it does today; add an `onFavorite` + `isFavorited` (already there) and add a `description` prop so the pitch can render:

```tsx
interface ProviderHeaderProps {
  provider: {
    id: string;
    userId: string;
    profession: string;
    description?: string | null;
    hourlyRate?: number | null;
    rating: number;
    totalReviews: number;
    totalJobs: number;
    responseTime?: number | null;
    isCertified: boolean;
    isPremium: boolean;
    isAvailable: boolean;
    verificationStatus?: "PENDING" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED";
    experience?: number | null;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatar?: string | null;
      city?: string | null;
      country: string;
      isVerified: boolean;
      createdAt: string;
    };
    categories: Array<{ id: string; name: string; slug: string; icon?: string | null; color?: string | null }>;
    subcategories: Array<{ id: string; name: string; slug: string; isPrimary: boolean }>;
    serviceZones: Array<{ id: string; city: string; commune?: string | null }>;
  };
  onFavorite?: () => void;
  isFavorited?: boolean;
}
```

`description` is already on the provider object in `ProviderProfileClient`'s data shape, so passing it through is automatic — `<ProviderHeader provider={visibleProvider} />` already passes the full provider.

- [ ] **Step 2: Replace the JSX**

The new component body, replacing everything from `return (` through the closing `)` of the existing component (keep the `formatResponseTime` helper at the bottom):

```tsx
const fullName = `${provider.user.firstName} ${provider.user.lastName}`.trim();
const initials = `${provider.user.firstName[0] ?? "?"}${provider.user.lastName[0] ?? ""}`.toUpperCase();
const city = provider.user.city ?? "";
const pitch = derivePitch(provider.description);
const responseLabel = formatResponseTime(provider.responseTime);
const yearJoined = new Date(provider.user.createdAt).getFullYear();
const primarySubcategory = provider.subcategories.find((s) => s.isPrimary)?.name ?? null;
const zoneSummary = provider.serviceZones
  .slice(0, 2)
  .map((z) => z.commune ?? z.city)
  .filter(Boolean)
  .join(", ");

const topRated =
  provider.isPremium ||
  provider.totalReviews >= 50 ||
  (provider.totalReviews >= 5 && provider.rating >= 4.8);
const identityVerified = provider.verificationStatus === "VERIFIED";

const ratingFormatted = provider.rating > 0 ? provider.rating.toFixed(1).replace(".", ",") : "—";
const reviewSub = provider.totalReviews > 0 ? `${provider.totalReviews} avis` : "Pas encore d'avis";
const experienceLabel = provider.experience && provider.experience > 0 ? `${provider.experience} ans` : "Nouveau";

const primaryCategory = provider.categories[0] ?? null;
const secondaryCategories = provider.categories.slice(1);

return (
  <div className="mx-auto max-w-[1200px] px-5 pt-6 md:px-10">
    {/* Breadcrumb */}
    <div
      className="k-caption mb-4 hidden items-center gap-1.5 md:flex"
      style={{ color: "var(--k-text-muted)" }}
    >
      <a href="/">Accueil</a>
      <span>›</span>
      <a href="/services">Prestataires</a>
      <span>›</span>
      <span style={{ color: "var(--k-text-primary)" }}>{fullName}</span>
    </div>

    {/* Hero card */}
    <div
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: "var(--k-r-lg)",
        boxShadow: "var(--k-e1)",
        padding: 24,
      }}
    >
      {/* Top row: availability + share/fav (desktop only) */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2" style={{ fontSize: 12, fontWeight: 500 }}>
          <span
            aria-hidden
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: provider.isAvailable ? "var(--k-success)" : "var(--k-text-subtle)",
              boxShadow: provider.isAvailable ? "0 0 0 3px rgba(16,185,129,0.18)" : "none",
              display: "inline-block",
            }}
          />
          <span style={{ color: provider.isAvailable ? "var(--k-success-dark, #15803D)" : "var(--k-text-muted)" }}>
            {provider.isAvailable
              ? responseLabel
                ? `Disponible aujourd'hui · Répond en ${responseLabel}`
                : "Disponible aujourd'hui"
              : "Indisponible actuellement"}
          </span>
        </div>

        <div className="hidden gap-2 md:flex">
          <button
            onClick={handleShare}
            aria-label="Partager"
            className="inline-flex items-center justify-center"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "1px solid var(--k-border)",
              background: "var(--k-surface)",
              color: "var(--k-text-body)",
              cursor: "pointer",
            }}
          >
            <Share2 className="h-[15px] w-[15px]" />
          </button>
          <button
            onClick={handleFavorite}
            disabled={favLoading}
            aria-label={isFavorited ? "Retirer des favoris" : "Ajouter aux favoris"}
            className="inline-flex items-center justify-center"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "1px solid var(--k-border)",
              background: "var(--k-surface)",
              color: isFavorited ? "var(--k-accent)" : "var(--k-text-body)",
              cursor: "pointer",
            }}
          >
            <Heart className="h-[15px] w-[15px]" fill={isFavorited ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      {/* Identity row */}
      <div className="grid items-start gap-5 md:grid-cols-[130px_1fr]">
        <div
          style={{
            width: 92,
            height: 92,
            borderRadius: 16,
            overflow: "hidden",
            background: "var(--k-beige, #F5F2E9)",
            flexShrink: 0,
          }}
          className="md:!h-[130px] md:!w-[130px]"
        >
          {provider.user.avatar ? (
            <img
              src={provider.user.avatar}
              alt={fullName}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : initials.trim() ? (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--k-font-mono)",
                fontWeight: 700,
                fontSize: 36,
                color: "var(--k-text-muted)",
              }}
            >
              {initials}
            </div>
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <User className="h-10 w-10" style={{ color: "var(--k-text-muted)" }} />
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="k-display-l" style={{ margin: 0 }}>
              {fullName}
            </h1>
            {identityVerified && <ShieldCheck className="h-[22px] w-[22px]" style={{ color: "var(--k-success)" }} />}
          </div>
          <div className="k-body-l mt-1" style={{ color: "var(--k-text-body)" }}>
            {primarySubcategory ? `${provider.profession} · ${primarySubcategory}` : provider.profession}
          </div>
          {(city || zoneSummary) && (
            <div className="mt-1 flex items-center gap-1.5" style={{ fontSize: 13, color: "var(--k-text-muted)" }}>
              <MapPin className="h-3.5 w-3.5" />
              {city}
              {zoneSummary && ` · ${zoneSummary}`}
            </div>
          )}
          {pitch && (
            <p
              style={{
                fontSize: 14,
                color: "var(--k-text-body)",
                lineHeight: 1.55,
                marginTop: 12,
                marginBottom: 0,
                paddingLeft: 12,
                borderLeft: "2px solid var(--k-border)",
                fontStyle: "italic",
                maxWidth: 560,
              }}
              className="text-[13px] md:text-[14px]"
            >
              {pitch}
            </p>
          )}
        </div>
      </div>

      {/* Trust ribbon */}
      <div
        className="grid grid-cols-2 gap-0 border-t pt-4 md:grid-cols-4 md:pt-5"
        style={{ borderColor: "var(--k-border-subtle)", marginTop: 20 }}
      >
        <RibbonCell
          icon={<Star className="h-3 w-3" style={{ color: "var(--k-warning)", fill: "var(--k-warning)" }} />}
          label="Note"
          value={ratingFormatted}
          sub={reviewSub}
        />
        <RibbonCell
          icon={<Briefcase className="h-3 w-3" style={{ color: "var(--k-text-muted)" }} />}
          label="Missions"
          value={String(provider.totalJobs)}
          sub={`depuis ${yearJoined}`}
          divider
        />
        <RibbonCell
          icon={<Clock className="h-3 w-3" style={{ color: responseLabel && provider.responseTime && provider.responseTime < 60 ? "var(--k-success)" : "var(--k-text-muted)" }} />}
          label="Délai"
          value={responseLabel ?? "À confirmer"}
          sub="moyenne 7 jours"
          divider
          valueColor={responseLabel && provider.responseTime && provider.responseTime < 60 ? "var(--k-success-dark, #15803D)" : undefined}
        />
        <RibbonCell
          icon={<Award className="h-3 w-3" style={{ color: "var(--k-text-muted)" }} />}
          label="Expérience"
          value={experienceLabel}
          sub={provider.user.country === "CD" ? "RDC" : provider.user.country === "CG" ? "Congo" : provider.user.country}
          divider
        />
      </div>

      {/* Chip strip */}
      <div
        className="flex flex-wrap gap-1.5 border-t pt-4"
        style={{ borderColor: "var(--k-border-subtle)", marginTop: 16 }}
      >
        {primaryCategory && (
          <CategoryChip category={primaryCategory} primary />
        )}
        {secondaryCategories.map((cat) => (
          <CategoryChip key={cat.id} category={cat} />
        ))}
        {identityVerified && (
          <span className="k-chip k-chip-sm k-chip-success">
            <ShieldCheck className="h-3 w-3" /> Identité vérifiée
          </span>
        )}
        {topRated && (
          <span className="k-chip k-chip-sm k-chip-warning">
            <Award className="h-3 w-3" /> Top rated
          </span>
        )}
        {provider.isCertified && (
          <span className="k-chip k-chip-sm k-chip-primary">
            <BadgeCheck className="h-3 w-3" /> Certifié KAYOU
          </span>
        )}
      </div>
    </div>
  </div>
);
```

Helpers at the bottom of the file:

```tsx
function RibbonCell({
  icon,
  label,
  value,
  sub,
  divider,
  valueColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  divider?: boolean;
  valueColor?: string;
}) {
  return (
    <div
      className={divider ? "md:border-l md:pl-4" : ""}
      style={divider ? { borderColor: "var(--k-border-subtle)" } : undefined}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: "var(--k-text-muted)",
          fontWeight: 600,
        }}
      >
        {icon}
        {label}
      </div>
      <div
        style={{
          marginTop: 4,
          fontFamily: "var(--k-font-display)",
          fontWeight: 700,
          fontSize: 20,
          letterSpacing: "-0.005em",
          color: valueColor ?? "var(--k-text-primary)",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11, color: "var(--k-text-muted)" }}>{sub}</div>
    </div>
  );
}

function CategoryChip({
  category,
  primary,
}: {
  category: { name: string; icon?: string | null; color?: string | null };
  primary?: boolean;
}) {
  if (primary && category.color) {
    return (
      <span
        className="k-chip k-chip-sm"
        style={{
          color: category.color,
          background: `${category.color}14`, // 8% opacity
          borderColor: `${category.color}33`, // 20% opacity
          fontWeight: 600,
        }}
      >
        {category.name}
      </span>
    );
  }
  return (
    <span className={`k-chip k-chip-sm${primary ? " k-chip-primary" : ""}`}>
      {category.name}
    </span>
  );
}
```

Update the imports at the top of the file:

```tsx
import {
  Award,
  BadgeCheck,
  Briefcase,
  Clock,
  Heart,
  MapPin,
  ShieldCheck,
  Share2,
  Star,
  User,
} from "lucide-react";
import { useState } from "react";
import { derivePitch } from "@/lib/provider/derivePitch";
```

Remove the now-unused `Avatar`/`AvatarImage`/`AvatarFallback` imports and the `TopRatedRibbon` import — both leave the component.

Also remove the old `BigStat` / `BigStatValue` helpers at the bottom of the file (replaced by `RibbonCell`).

Keep the `formatResponseTime` function unchanged at the bottom and the existing `ProviderHeaderSkeleton` export unchanged at the bottom (still used by the loading state).

- [ ] **Step 3: Verify breadcrumb removal in ProviderProfileClient.tsx**

The mobile back bar in `ProviderProfileClient.tsx` (lines ~437–479) still has Heart + Share buttons. Spec §9 says the hero hides its own favorite/share on mobile to avoid duplication with the back bar — which is what the `hidden md:flex` class on the top row above already does. Leave the back bar as-is.

- [ ] **Step 4: Verify in browser**

Dev server. Open a provider page on desktop (≥1024px) and on mobile (390×844). Walk through:

**Desktop checks:**
- Breadcrumb above the card.
- Green availability dot + line at top-left of the card.
- Share + Heart small circular buttons top-right.
- 130×130 square avatar with the photo; if you have a test provider without an avatar, the initials fallback renders in mono on beige.
- Name (large, 30px), inline shield-check (when verified).
- Profession · primary subcategory line.
- MapPin + city · zones line.
- Italic pitch line in a left-bordered block, only when description's first sentence is ≥20 chars.
- 4-cell trust ribbon: Note · Missions · Délai · Expérience, with sub-text under each. Délai goes green when responseTime < 60.
- Chip strip: primary category in its own color, then secondaries, then trust chips.

**Mobile checks:**
- No breadcrumb (it's `hidden md:flex`).
- Top row: only availability line; share/fav are in the back bar above.
- Avatar 92×92 stacks above the name block.
- Ribbon collapses to 2×2 grid, no dividers visible (only md+ has the vertical borders).
- Chips wrap cleanly.

**Edge cases:**
- Provider without `description` → no pitch line.
- Provider with `description` < 20 chars → no pitch line.
- Provider with `experience = null` → "Expérience: Nouveau" + country.
- Provider with `rating = 0`, `totalReviews = 0` → "—" + "Pas encore d'avis".

- [ ] **Step 5: Type-check**

```bash
pnpm type-check
```
Expected: passes.

---

### Task 7: Rewrite ProviderAbout (with meta row, line-clamp, "Lire plus" toggle)

**Files:**
- Modify: `apps/web/src/components/provider-profile/ProviderAbout.tsx`

- [ ] **Step 1: Update props + body**

The component currently receives `provider` and renders the description. Replace the body:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

interface ProviderAboutProps {
  provider: {
    description?: string | null;
    experience?: number | null;
    serviceZones: Array<{ id: string; city: string; commune?: string | null }>;
  };
}

export function ProviderAbout({ provider }: ProviderAboutProps) {
  const [expanded, setExpanded] = useState(false);
  const [isClipped, setIsClipped] = useState(false);
  const pRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    const el = pRef.current;
    if (!el) return;
    setIsClipped(el.scrollHeight > el.clientHeight + 1);
  }, [provider.description]);

  if (!provider.description || provider.description.trim().length === 0) {
    return null;
  }

  const zoneSummary = (() => {
    if (provider.serviceZones.length === 0) return null;
    const names = provider.serviceZones.map((z) => z.commune ?? z.city).filter(Boolean);
    if (names.length <= 4) return names.join(", ");
    return `${names.slice(0, 4).join(", ")} +${names.length - 4} autres`;
  })();

  const experienceLabel =
    provider.experience && provider.experience > 0 ? `${provider.experience} ans` : null;

  // Languages: hardcoded for v1 (no DB field yet) — flagged in spec out-of-scope.
  const languagesLabel = "Français, Lingala";

  const hasMeta = experienceLabel || zoneSummary || languagesLabel;

  return (
    <ProviderSection title="À propos">
      <p
        ref={pRef}
        style={{
          fontSize: 14,
          color: "var(--k-text-body)",
          lineHeight: 1.6,
          margin: 0,
          display: expanded ? "block" : "-webkit-box",
          WebkitLineClamp: expanded ? "unset" : 5,
          WebkitBoxOrient: "vertical",
          overflow: expanded ? "visible" : "hidden",
        }}
      >
        {provider.description}
      </p>
      {isClipped && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="k-btn k-btn-ghost"
          style={{ marginTop: 8, padding: "4px 0", fontSize: 13, fontWeight: 600, color: "var(--k-primary)" }}
        >
          {expanded ? "Réduire" : "Lire plus"}
        </button>
      )}

      {hasMeta && (
        <div
          className="grid gap-4 md:grid-cols-3"
          style={{
            borderTop: "1px solid var(--k-border-subtle)",
            paddingTop: 14,
            marginTop: 14,
          }}
        >
          {experienceLabel && <AboutMeta label="Expérience" value={experienceLabel} />}
          {zoneSummary && <AboutMeta label="Zones desservies" value={zoneSummary} />}
          <AboutMeta label="Langues" value={languagesLabel} />
        </div>
      )}
    </ProviderSection>
  );
}

function AboutMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: "var(--k-text-muted)",
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 14, color: "var(--k-text-primary)", fontWeight: 600, marginTop: 2 }}>
        {value}
      </div>
    </div>
  );
}
```

Add the import at the top:

```tsx
import { ProviderSection } from "./ProviderSection";
```

If `ProviderAboutSkeleton` is exported by this file today, keep it — `ProviderProfileClient` uses it during loading.

- [ ] **Step 2: Verify in browser**

Dev server.

- A provider with a long description: paragraph clamps to 5 lines, "Lire plus" button shows.
- Click "Lire plus": full description renders, button becomes "Réduire".
- Provider with a short description (one paragraph): no toggle button.
- Provider with no description: section is fully hidden.
- Meta row: Expérience cell only when `experience > 0`; Zones cell only when there are zones; Langues always shown.

- [ ] **Step 3: Type-check**

```bash
pnpm type-check
```
Expected: passes.

---

### Task 8: Build ProviderRecentWorkLightbox

A modal carousel for project images. Use the existing Radix Dialog (already a dep).

**Files:**
- Create: `apps/web/src/components/provider-profile/ProviderRecentWorkLightbox.tsx`

- [ ] **Step 1: Create the lightbox component**

```tsx
"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";

export interface LightboxImage {
  imageUrl: string;
  thumbnailUrl?: string | null;
  caption?: string | null;
  imageType?: "BEFORE" | "DURING" | "AFTER" | "GENERAL" | "DETAIL" | "PLAN" | null;
}

interface ProviderRecentWorkLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: LightboxImage[];
  startIndex?: number;
  title?: string;
}

export function ProviderRecentWorkLightbox({
  open,
  onOpenChange,
  images,
  startIndex = 0,
  title,
}: ProviderRecentWorkLightboxProps) {
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    if (open) setIndex(Math.min(startIndex, Math.max(images.length - 1, 0)));
  }, [open, startIndex, images.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, images.length - 1));
      else if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, images.length]);

  if (images.length === 0) return null;
  const img = images[index];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[min(1100px,95vw)] p-0"
        style={{ background: "var(--k-text-primary)", border: "none" }}
      >
        <div style={{ position: "relative", aspectRatio: "16/10", background: "#000" }}>
          <img
            src={img.imageUrl}
            alt={img.caption ?? title ?? ""}
            style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
          />
          {img.imageType && img.imageType !== "GENERAL" && (
            <span
              style={{
                position: "absolute",
                top: 14,
                left: 14,
                background: "var(--k-surface)",
                padding: "4px 10px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                color: "var(--k-text-primary)",
              }}
            >
              {img.imageType === "BEFORE"
                ? "Avant"
                : img.imageType === "AFTER"
                ? "Après"
                : img.imageType === "DURING"
                ? "En cours"
                : img.imageType === "DETAIL"
                ? "Détail"
                : "Plan"}
            </span>
          )}
          <button
            onClick={() => onOpenChange(false)}
            aria-label="Fermer"
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.95)",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X className="h-4 w-4" />
          </button>
          {index > 0 && (
            <button
              onClick={() => setIndex(index - 1)}
              aria-label="Précédent"
              style={navBtnStyle("left")}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {index < images.length - 1 && (
            <button
              onClick={() => setIndex(index + 1)}
              aria-label="Suivant"
              style={navBtnStyle("right")}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>
        {(img.caption || title) && (
          <div style={{ padding: "14px 18px", color: "#fff", fontSize: 13 }}>
            {title && <div style={{ fontWeight: 600 }}>{title}</div>}
            {img.caption && <div style={{ color: "rgba(255,255,255,0.7)", marginTop: 4 }}>{img.caption}</div>}
            <div style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
              {index + 1} / {images.length}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function navBtnStyle(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute",
    top: "50%",
    [side]: 14,
    transform: "translateY(-50%)",
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.95)",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  } as React.CSSProperties;
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```
Expected: passes.

The lightbox is verified in Task 9 once it's wired up.

---

### Task 9: Build ProviderRecentWork (merge Portfolio + PortfolioProjects)

**Files:**
- Create: `apps/web/src/components/provider-profile/ProviderRecentWork.tsx`

- [ ] **Step 1: Create the component**

Spec §3 has the merge logic. Code:

```tsx
"use client";

import { useMemo, useState } from "react";
import { ProviderSection } from "./ProviderSection";
import {
  ProviderRecentWorkLightbox,
  type LightboxImage,
} from "./ProviderRecentWorkLightbox";

type ImageType = "BEFORE" | "DURING" | "AFTER" | "GENERAL" | "DETAIL" | "PLAN";

interface Project {
  id: string;
  title: string;
  description?: string | null;
  duration?: number | null;
  price?: number | null;
  isFeatured: boolean;
  createdAt: string;
  images: Array<{
    id: string;
    imageType: ImageType;
    imageUrl: string;
    thumbnailUrl?: string | null;
    caption?: string | null;
    displayOrder: number;
  }>;
}

interface PortfolioImage {
  id: string;
  imageUrl: string;
  title: string;
  description?: string | null;
  order: number;
}

interface ProviderRecentWorkProps {
  portfolio: PortfolioImage[];
  projects: Project[];
}

export function ProviderRecentWork({ portfolio, projects }: ProviderRecentWorkProps) {
  const [lightbox, setLightbox] = useState<{
    open: boolean;
    images: LightboxImage[];
    startIndex: number;
    title?: string;
  }>({ open: false, images: [], startIndex: 0 });

  const { featured, gallery, projectCount, photoCount } = useMemo(() => {
    const featuredSorted = [...projects]
      .filter((p) => p.images.length > 0)
      .sort((a, b) => {
        if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    const featured = featuredSorted.slice(0, 2);
    const featuredIds = new Set(featured.map((p) => p.id));
    const remainingProjectImages = projects
      .filter((p) => !featuredIds.has(p.id))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .flatMap((p) =>
        [...p.images]
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((img) => ({
            imageUrl: img.imageUrl,
            thumbnailUrl: img.thumbnailUrl,
            caption: img.caption ?? p.title,
            imageType: img.imageType,
          }))
      );
    const portfolioImages = [...portfolio]
      .sort((a, b) => a.order - b.order)
      .map((p) => ({
        imageUrl: p.imageUrl,
        thumbnailUrl: null,
        caption: p.title,
        imageType: null,
      }));
    const gallery: LightboxImage[] = [...portfolioImages, ...remainingProjectImages];
    const photoCount = projects.reduce((sum, p) => sum + p.images.length, 0) + portfolio.length;
    return { featured, gallery, projectCount: projects.length, photoCount };
  }, [portfolio, projects]);

  if (featured.length === 0 && gallery.length === 0) return null;

  const openProject = (project: Project) => {
    const images = [...project.images]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((img) => ({
        imageUrl: img.imageUrl,
        thumbnailUrl: img.thumbnailUrl,
        caption: img.caption,
        imageType: img.imageType,
      }));
    setLightbox({ open: true, images, startIndex: 0, title: project.title });
  };

  const openGalleryAt = (startIndex: number) => {
    setLightbox({ open: true, images: gallery, startIndex, title: undefined });
  };

  const heroCount = `${projectCount} projet${projectCount > 1 ? "s" : ""} · ${photoCount} photo${photoCount > 1 ? "s" : ""}`;
  const visibleGallery = gallery.slice(0, 6);
  const overflowCount = gallery.length - 5; // when > 6, 6th tile becomes the "+N" overlay

  return (
    <>
      <ProviderSection
        title="Travaux récents"
        meta={<span style={{ fontSize: 12, color: "var(--k-text-muted)" }}>{heroCount}</span>}
      >
        {featured.length > 0 && (
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            {featured.map((project) => (
              <FeaturedCard key={project.id} project={project} onOpen={() => openProject(project)} />
            ))}
          </div>
        )}

        {visibleGallery.length > 0 && (
          <div
            className="grid grid-cols-4 gap-1.5 md:grid-cols-6"
            style={{ marginTop: featured.length > 0 ? 14 : 0 }}
          >
            {visibleGallery.map((img, i) => {
              const isOverflow = gallery.length > 6 && i === 5;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => openGalleryAt(i)}
                  className="overflow-hidden"
                  style={{
                    aspectRatio: "1/1",
                    borderRadius: 8,
                    background: "var(--k-beige, #F5F2E9)",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    position: "relative",
                  }}
                  aria-label={isOverflow ? `Voir ${overflowCount} photos de plus` : "Agrandir l'image"}
                >
                  <img
                    src={img.thumbnailUrl ?? img.imageUrl}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                      opacity: isOverflow ? 0.4 : 1,
                    }}
                  />
                  {isOverflow && (
                    <span
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: 16,
                        background: "rgba(15,23,42,0.55)",
                      }}
                    >
                      +{overflowCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </ProviderSection>

      <ProviderRecentWorkLightbox
        open={lightbox.open}
        onOpenChange={(open) => setLightbox((l) => ({ ...l, open }))}
        images={lightbox.images}
        startIndex={lightbox.startIndex}
        title={lightbox.title}
      />
    </>
  );
}

function FeaturedCard({ project, onOpen }: { project: Project; onOpen: () => void }) {
  const heroImg =
    project.images.find((i) => i.imageType === "AFTER") ??
    [...project.images].sort((a, b) => a.displayOrder - b.displayOrder)[0];
  const hasBeforeAfter =
    project.images.some((i) => i.imageType === "BEFORE") &&
    project.images.some((i) => i.imageType === "AFTER");
  const durationLabel = formatDuration(project.duration);
  const priceLabel = project.price ? `${project.price.toLocaleString("fr-FR")} FC` : null;

  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: 12,
        overflow: "hidden",
        padding: 0,
        textAlign: "left",
        cursor: "pointer",
      }}
    >
      <div style={{ aspectRatio: "16/10", position: "relative" }}>
        <img
          src={heroImg.imageUrl}
          alt={project.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        {hasBeforeAfter && (
          <span
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              background: "var(--k-surface)",
              padding: "3px 8px",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              color: "var(--k-text-primary)",
            }}
          >
            Avant / après
          </span>
        )}
      </div>
      <div style={{ padding: "12px 14px 14px" }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "var(--k-text-primary)" }}>
          {project.title}
        </div>
        {(durationLabel || priceLabel) && (
          <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 12, color: "var(--k-text-muted)" }}>
            {durationLabel && (
              <span>
                Durée <b style={{ color: "var(--k-text-primary)", fontFamily: "var(--k-font-mono)" }}>{durationLabel}</b>
              </span>
            )}
            {priceLabel && (
              <span>
                À partir de <b style={{ color: "var(--k-text-primary)", fontFamily: "var(--k-font-mono)" }}>{priceLabel}</b>
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

function formatDuration(minutes?: number | null): string | null {
  if (!minutes || minutes <= 0) return null;
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) {
    const h = Math.round(minutes / 60);
    return `${h} h`;
  }
  const d = Math.round(minutes / 1440);
  return `${d} j`;
}
```

Update `ProviderSection.tsx` to accept an optional `meta` prop if it doesn't already — read it first:

- [ ] **Step 2: Add `meta` prop to ProviderSection if missing**

Read `apps/web/src/components/provider-profile/ProviderSection.tsx`. If it doesn't accept a `meta` prop (right-aligned content next to the title), add support:

```tsx
interface ProviderSectionProps {
  title: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
}
```

In the header row, render `meta` to the right of the title with `display:flex; justify-content:space-between; align-items:center`.

If the current `ProviderSection` already supports this, skip.

- [ ] **Step 3: Type-check**

```bash
pnpm type-check
```
Expected: passes. The component isn't wired into the page yet — that's Task 10.

---

### Task 10: Wire ProviderRecentWork into the page; delete ProviderPortfolio

**Files:**
- Modify: `apps/web/src/app/providers/[id]/ProviderProfileClient.tsx`
- Delete: `apps/web/src/components/provider-profile/ProviderPortfolio.tsx`

- [ ] **Step 1: Replace ProviderPortfolio with ProviderRecentWork**

In `ProviderProfileClient.tsx`:

1. Update the imports:
   ```tsx
   // remove:
   //   ProviderPortfolio, ProviderPortfolioSkeleton
   import { ProviderRecentWork } from "@/components/provider-profile/ProviderRecentWork";
   ```
2. Replace the existing `<ProviderPortfolio ... />` block with:
   ```tsx
   <ProviderRecentWork
     portfolio={visibleProvider.portfolio}
     projects={visibleProvider.portfolioProjects}
   />
   ```
3. In the loading skeleton block (the `if (loading)` branch), remove the `<ProviderPortfolioSkeleton />` line — `ProviderRecentWork` doesn't have a sibling skeleton yet, and the existing skeleton stack is acceptable without it for v1.

- [ ] **Step 2: Delete the old component**

```bash
rm apps/web/src/components/provider-profile/ProviderPortfolio.tsx
```

- [ ] **Step 3: Update the barrel export**

In `apps/web/src/components/provider-profile/index.ts`, remove the lines exporting `ProviderPortfolio` and `ProviderPortfolioSkeleton`. Add:
```ts
export { ProviderRecentWork } from "./ProviderRecentWork";
export { ProviderRecentWorkLightbox } from "./ProviderRecentWorkLightbox";
```

- [ ] **Step 4: Verify in browser**

Dev server. Provider page (desktop and mobile):

- Section titled "Travaux récents" with count line on the right.
- Up to 2 featured project cards in a 2-column (desktop) or 1-column (mobile) grid.
- Featured card with both BEFORE and AFTER images shows the "Avant / après" pill.
- Below: 4-col (mobile) or 6-col (desktop) thumbnail strip.
- Click a featured card → lightbox opens at the first image of that project; arrow keys navigate; Esc closes.
- Click a gallery tile → lightbox opens at that tile's index, navigating across the combined gallery.
- 7th+ image in the gallery: the 6th tile becomes a "+N" overlay.

Edge cases:
- Provider with no projects but legacy portfolio images → no featured row, gallery strip only.
- Provider with zero of both → section is hidden entirely.

- [ ] **Step 5: Type-check**

```bash
pnpm type-check
```
Expected: passes.

---

### Task 11: Rewrite ProviderReviews (toggle variant)

**Files:**
- Modify: `apps/web/src/components/provider-profile/ProviderReviews.tsx`

- [ ] **Step 1: Update the headline / breakdown block**

The current file is ~488 lines — most of it is the review list + pagination + the existing breakdown card. **Keep the list and pagination behavior intact.** Only replace the header summary card with the new headline strip + toggle breakdown.

Identify the existing breakdown card (today's `RatingBreakdown` or similar block at the top of the rendered output) and replace it with:

```tsx
const recommendPct = useMemo(() => {
  if (stats.totalReviews < 5) return null;
  const positive = (stats.ratingBreakdown[5] ?? 0) + (stats.ratingBreakdown[4] ?? 0);
  return Math.round((positive / stats.totalReviews) * 100);
}, [stats.totalReviews, stats.ratingBreakdown]);

const ratingFormatted = stats.ratingAverages.overall > 0
  ? stats.ratingAverages.overall.toFixed(1).replace(".", ",")
  : "—";
const filledStars = Math.round(stats.ratingAverages.overall);

const [breakdownOpen, setBreakdownOpen] = useState(false);

if (stats.totalReviews === 0) {
  return (
    <ProviderSection title="Ce que disent les clients">
      <p style={{ fontSize: 14, color: "var(--k-text-muted)", margin: 0 }}>
        Pas encore d'avis. Soyez le premier à recommander {firstName}.
      </p>
    </ProviderSection>
  );
}

return (
  <ProviderSection title="Ce que disent les clients">
    <div
      style={{
        background: "#FFFBF5",
        border: "1px solid #FDE68A",
        borderRadius: 10,
        padding: 16,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div
            style={{
              fontFamily: "var(--k-font-display)",
              fontWeight: 800,
              fontSize: 44,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              color: "var(--k-text-primary)",
            }}
          >
            {ratingFormatted}
          </div>
          <div>
            <div style={{ color: "var(--k-warning)", fontSize: 14 }}>
              {"★".repeat(filledStars)}
              {"☆".repeat(5 - filledStars)}
            </div>
            <div style={{ fontSize: 12, color: "var(--k-text-muted)", marginTop: 4 }}>
              {stats.totalReviews} avis{stats.totalBookings > 0 ? ` · ${stats.totalBookings} missions terminées` : ""}
            </div>
            {recommendPct !== null && (
              <div
                style={{
                  fontSize: 11,
                  color: "var(--k-success-dark, #15803D)",
                  fontWeight: 600,
                  marginTop: 6,
                }}
              >
                ✓ {recommendPct}% des clients recommandent {firstName}
              </div>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setBreakdownOpen((v) => !v)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 12,
            fontWeight: 600,
            color: "var(--k-primary-strong, var(--k-primary))",
            background: "var(--k-surface)",
            border: "1px solid var(--k-border)",
            padding: "5px 10px",
            borderRadius: 99,
            cursor: "pointer",
          }}
        >
          {breakdownOpen ? "Masquer ▴" : "Voir le détail ▾"}
        </button>
      </div>

      {breakdownOpen && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 14,
            borderTop: "1px solid #FDE68A",
          }}
        >
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-x-6">
            <BreakdownRow label="Ponctualité" value={stats.ratingAverages.punctuality} />
            <BreakdownRow label="Qualité" value={stats.ratingAverages.quality} />
            <BreakdownRow label="Communication" value={stats.ratingAverages.communication} />
            <BreakdownRow label="Rapport qualité/prix" value={stats.ratingAverages.value} />
          </div>
        </div>
      )}
    </div>

    {/* The existing review list + pagination markup goes here — keep as is */}
  </ProviderSection>
);
```

`BreakdownRow` helper at the bottom of the file:

```tsx
function BreakdownRow({ label, value }: { label: string; value: number }) {
  if (!value || value <= 0) return null;
  const pct = Math.min(100, (value / 5) * 100);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "110px 1fr 30px", gap: 8, alignItems: "center", fontSize: 12 }}>
      <span style={{ color: "var(--k-text-muted)" }}>{label}</span>
      <div style={{ height: 5, background: "#F1F5F9", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "var(--k-success)", borderRadius: 99 }} />
      </div>
      <span style={{ fontFamily: "var(--k-font-mono)", fontWeight: 700, fontSize: 11, color: "var(--k-text-primary)", textAlign: "right" }}>
        {value.toFixed(1).replace(".", ",")}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Make sure props include `firstName`**

Update `ProviderReviewsProps` to receive `firstName` (used in the empty state and the recommend line). The call site in `ProviderProfileClient.tsx` should pass `firstName={provider.user.firstName}`.

- [ ] **Step 3: Verify in browser**

Dev server.

- Provider with ≥5 reviews: yellow strip shows big rating + stars + counts + recommend line; "Voir le détail ▾" pill on the right.
- Click pill → breakdown reveals with 4 rows (one per dimension, hiding any row with value 0). Pill becomes "Masquer ▴".
- Provider with 1–4 reviews: same strip but no "X% recommandent" line.
- Provider with 0 reviews: section shows the muted empty line, no strip, no toggle.
- Provider with `visibility.showReviews === false`: section is hidden by the existing parent guard.

- [ ] **Step 4: Type-check**

```bash
pnpm type-check
```
Expected: passes.

---

### Task 12: Rewrite ProviderSkills (chip strip with levels)

**Files:**
- Modify: `apps/web/src/components/provider-profile/ProviderSkills.tsx`

- [ ] **Step 1: Replace the body**

The current implementation uses horizontal progress bars per skill. Replace with chips.

```tsx
"use client";

import { ProviderSection } from "./ProviderSection";

interface ProviderSkillsProps {
  skills: Array<{ id: string; name: string; level: number }>;
}

const LEVEL_LABELS: Record<number, string> = {
  1: "débutant",
  2: "intermédiaire",
  3: "avancé",
  4: "expert",
  5: "maître",
};

export function ProviderSkills({ skills }: ProviderSkillsProps) {
  if (skills.length === 0) return null;

  return (
    <ProviderSection title="Compétences">
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {skills.map((skill) => {
          const levelLabel = LEVEL_LABELS[skill.level] ?? null;
          return (
            <span
              key={skill.id}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12,
                padding: "5px 10px",
                borderRadius: 999,
                background: "#F1F5F9",
                color: "var(--k-text-body)",
              }}
            >
              {skill.name}
              {levelLabel && (
                <span style={{ fontFamily: "var(--k-font-mono)", color: "var(--k-text-muted)", fontSize: 10 }}>
                  {levelLabel}
                </span>
              )}
            </span>
          );
        })}
      </div>
    </ProviderSection>
  );
}
```

If `ProviderSkillsSkeleton` is exported by this file, keep it unchanged — `ProviderProfileClient` loading state uses it.

- [ ] **Step 2: Verify in browser**

Dev server. The Compétences section now shows flat chips, one per skill, each with the level word in mono italic-ish styling next to the name. No more horizontal bars.

- [ ] **Step 3: Type-check**

```bash
pnpm type-check
```
Expected: passes.

---

### Task 13: Build ProviderCredentials (merge Certs + Diplomas)

**Files:**
- Create: `apps/web/src/components/provider-profile/ProviderCredentials.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { CheckCircle2, FileText, Clock } from "lucide-react";
import { ProviderSection } from "./ProviderSection";

type Status = "PENDING" | "VERIFIED" | "REJECTED" | "UNDER_REVIEW";

interface Credential {
  id: string;
  title: string;
  issuingOrg: string;
  issueDate?: string | null;
  expiryDate?: string | null;
  isLifetime?: boolean;
  status: Status;
  documents: Array<{ id: string; fileUrl: string; fileName: string }>;
}

interface ProviderCredentialsProps {
  diplomas: Credential[];
  certifications: Credential[];
}

export function ProviderCredentials({ diplomas, certifications }: ProviderCredentialsProps) {
  if (diplomas.length === 0 && certifications.length === 0) return null;

  return (
    <ProviderSection title="Crédentiels">
      {diplomas.length > 0 && (
        <CredentialGroup title="Diplômes" items={diplomas} kind="diploma" />
      )}
      {certifications.length > 0 && (
        <div style={{ marginTop: diplomas.length > 0 ? 16 : 0 }}>
          <CredentialGroup title="Certifications" items={certifications} kind="certification" />
        </div>
      )}
    </ProviderSection>
  );
}

function CredentialGroup({
  title,
  items,
  kind,
}: {
  title: string;
  items: Credential[];
  kind: "diploma" | "certification";
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "var(--k-text-muted)",
          fontWeight: 600,
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      {items.map((item, idx) => (
        <CredentialRow key={item.id} item={item} kind={kind} isFirst={idx === 0} />
      ))}
    </div>
  );
}

function CredentialRow({
  item,
  kind,
  isFirst,
}: {
  item: Credential;
  kind: "diploma" | "certification";
  isFirst: boolean;
}) {
  const issueYear = item.issueDate ? new Date(item.issueDate).getFullYear() : null;
  const expiryYear = item.expiryDate ? new Date(item.expiryDate).getFullYear() : null;

  let dateLine: string;
  if (kind === "diploma") {
    dateLine = issueYear ? `${item.issuingOrg} · ${issueYear}` : item.issuingOrg;
  } else {
    if (item.isLifetime) dateLine = `${item.issuingOrg} · à vie`;
    else if (expiryYear) dateLine = `${item.issuingOrg} · expire en ${expiryYear}`;
    else if (issueYear) dateLine = `${item.issuingOrg} · ${issueYear}`;
    else dateLine = item.issuingOrg;
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 0",
        borderTop: isFirst ? "none" : "1px solid var(--k-border-subtle)",
        gap: 12,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: "var(--k-text-primary)" }}>{item.title}</div>
        <div style={{ fontSize: 12, color: "var(--k-text-muted)", marginTop: 2 }}>{dateLine}</div>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
        <StatusBadge status={item.status} />
        {item.documents[0] && (
          <a
            href={item.documents[0].fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "var(--k-primary-strong, var(--k-primary))",
              fontSize: 11,
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <FileText className="h-3 w-3" /> Voir
          </a>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  if (status === "VERIFIED") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 3,
          fontSize: 11,
          color: "var(--k-success-dark, #15803D)",
          background: "var(--k-success-soft, #DCFCE7)",
          padding: "2px 7px",
          borderRadius: 99,
          fontWeight: 600,
        }}
      >
        <CheckCircle2 className="h-3 w-3" /> Vérifié
      </span>
    );
  }
  if (status === "PENDING" || status === "UNDER_REVIEW") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 3,
          fontSize: 11,
          color: "var(--k-text-muted)",
          background: "var(--k-surface-muted, #F8FAFC)",
          padding: "2px 7px",
          borderRadius: 99,
          fontWeight: 500,
        }}
      >
        <Clock className="h-3 w-3" /> En attente
      </span>
    );
  }
  return null;
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```
Expected: passes. Wiring is in Task 14.

---

### Task 14: Wire ProviderCredentials, finalize section order, delete old components

This is the integration task. Updates `ProviderProfileClient.tsx` to use all the new components in the proof-first order, and deletes the four components being retired.

**Files:**
- Modify: `apps/web/src/app/providers/[id]/ProviderProfileClient.tsx`
- Modify: `apps/web/src/components/provider-profile/index.ts`
- Delete: `apps/web/src/components/provider-profile/ProviderCertifications.tsx`
- Delete: `apps/web/src/components/provider-profile/ProviderDiplomas.tsx`
- Delete: `apps/web/src/components/provider-profile/ProviderCategories.tsx`

- [ ] **Step 1: Update imports in ProviderProfileClient.tsx**

Replace the bulk import from `@/components/provider-profile` with the final set:

```tsx
import {
  ProviderHeader,
  ProviderHeaderSkeleton,
  ProviderAbout,
  ProviderAboutSkeleton,
  ProviderSkills,
  ProviderSkillsSkeleton,
  ProviderRecentWork,
  ProviderReviews,
  ProviderReviewsSkeleton,
  ProviderCredentials,
  BookingForm,
  ContactDialog,
} from "@/components/provider-profile";
import { BookingRail } from "@/components/provider-profile/BookingRail";
import { MobileStickyBar } from "@/components/provider-profile/MobileStickyBar";
```

Remove imports for the deleted components and skeletons: `ProviderPortfolio`, `ProviderPortfolioSkeleton`, `ProviderCategories`, `ProviderCategoriesSkeleton`, `ProviderCertifications`, `ProviderCertificationsSkeleton`, `ProviderDiplomas`, `ProviderDiplomasSkeleton`.

- [ ] **Step 2: Rewrite the body composition**

In the main render branch (`return (` near the end), the left-column `<div className="space-y-4">` block becomes:

```tsx
<div className="space-y-4">
  <ProviderAbout provider={visibleProvider} />
  <ProviderRecentWork
    portfolio={visibleProvider.portfolio}
    projects={visibleProvider.portfolioProjects}
  />
  {visibility.showReviews && (
    <ProviderReviews
      providerId={provider.id}
      firstName={provider.user.firstName}
      initialReviews={visibleProvider.recentReviews}
      stats={visibleProvider.stats}
    />
  )}
  {provider.skills.length > 0 && <ProviderSkills skills={provider.skills} />}
  {visibility.showCertifications && (
    <ProviderCredentials
      diplomas={visibleProvider.diplomas}
      certifications={visibleProvider.certifications}
    />
  )}
</div>
```

The right-column `<aside>` already contains the polished `<BookingRail />`. **Remove** the `<div className="mt-4"><ProviderCategories ... /></div>` block underneath the rail — categories live in the hero chip strip now.

**Remove** the entire `<div className="lg:hidden"><ProviderCategories ... /></div>` block lower in the file — the standalone Categories card is gone on mobile too.

- [ ] **Step 3: Update the loading skeleton block**

In the `if (loading)` branch, simplify the skeleton stack:

```tsx
<div className="space-y-4">
  <ProviderAboutSkeleton />
  <ProviderSkillsSkeleton />
  <ProviderReviewsSkeleton />
</div>
```

Drop `ProviderPortfolioSkeleton`, `ProviderCategoriesSkeleton`, `ProviderCertificationsSkeleton`, `ProviderDiplomasSkeleton`. We don't create new skeletons for `ProviderRecentWork` and `ProviderCredentials` in v1 — the page just won't show their placeholders, which is acceptable.

The right column under loading was:

```tsx
<div className="space-y-4">
  <ProviderCategoriesSkeleton />
</div>
```

Remove this block entirely — there's no longer a sidebar card during loading.

- [ ] **Step 4: Delete the old components**

```bash
rm apps/web/src/components/provider-profile/ProviderCertifications.tsx
rm apps/web/src/components/provider-profile/ProviderDiplomas.tsx
rm apps/web/src/components/provider-profile/ProviderCategories.tsx
```

- [ ] **Step 5: Update the barrel export**

Open `apps/web/src/components/provider-profile/index.ts`. Remove every export for the deleted components and their skeletons:
- `ProviderCertifications`, `ProviderCertificationsSkeleton`
- `ProviderDiplomas`, `ProviderDiplomasSkeleton`
- `ProviderCategories`, `ProviderCategoriesSkeleton`

Add (if not already exported by Task 10):
```ts
export { ProviderRecentWork } from "./ProviderRecentWork";
export { ProviderRecentWorkLightbox } from "./ProviderRecentWorkLightbox";
export { ProviderCredentials } from "./ProviderCredentials";
```

`BookingRail` and `MobileStickyBar` are imported directly by `ProviderProfileClient.tsx` and don't need to be in the barrel, but adding them is harmless.

- [ ] **Step 6: Verify in browser — full page walkthrough**

Dev server. Open a provider profile on desktop and on mobile. Walk top to bottom:

**Desktop:**
1. Breadcrumb above the hero.
2. Hero card with all the elements from Task 6.
3. À propos card.
4. Travaux récents card.
5. Reviews card with toggle.
6. Compétences card.
7. Crédentiels card.
8. Right rail (polished, sticky as you scroll).
9. No standalone Categories card anywhere.

**Mobile:**
1. Back bar at top.
2. Hero card.
3. Same section order as desktop, single-column.
4. Sticky bottom bar pinned at the bottom.

**Coverage cases to test:**
- A provider with no description → "À propos" section absent.
- A provider with no portfolio at all → "Travaux récents" absent.
- A provider with 0 reviews → "Ce que disent les clients" shows the empty line.
- A provider with no skills → "Compétences" absent.
- A provider with no certs/diplomas → "Crédentiels" absent.
- A provider with `visibility.profileVisible !== "PUBLIC"` and the viewer not authorized → existing access-denied screen still renders.
- Viewing your own profile → rail shows "Tableau de bord", mobile bar shows "Tableau de bord" pill.

- [ ] **Step 7: Type-check + production build**

From `apps/web/`:
```bash
pnpm type-check
pnpm build
```
Both must pass.

---

### Task 15: Final review + ship

**Files:** None modified — this is the gating task before commit.

- [ ] **Step 1: Type-check across the workspace**

From the repo root:
```bash
pnpm -w type-check
```
or alternatively, the individual packages that could be affected:
```bash
cd apps/web && pnpm type-check
```
Expected: passes.

- [ ] **Step 2: Production build**

From `apps/web/`:
```bash
pnpm build
```
Expected: builds successfully. If Next reports any unused-import or unused-prop warnings related to the deleted components, fix them.

- [ ] **Step 3: Manual full QA pass**

Dev server. With both a "fully-populated" test provider (reviews, portfolio projects, multiple categories, all credentials, hourly rate set) AND a "sparse" test provider (no description, no portfolio, 0 reviews, no skills, no certs, no hourly rate), walk both:

- Desktop ≥1280px
- Desktop 1024px (table layout)
- Tablet ~768px
- Mobile 390×844

For each, click through:
- Réserver (rail and mobile bar)
- Appeler (when phone visible)
- Message (when allowed)
- Favorite toggle
- Share
- Voir le détail on reviews
- Lire plus on About
- Click a featured project → lightbox opens, navigation works, Esc closes
- Click a gallery tile → lightbox opens at the right index
- Click the +N tile → lightbox opens at index 5
- Open your own provider profile → rail/bar show "Tableau de bord"

Anything broken: fix before committing.

- [ ] **Step 4: Stage and commit (one commit, per project convention)**

From the repo root:
```bash
git add apps/web/src/lib/provider/derivePitch.ts \
        apps/web/src/components/provider-profile/ \
        apps/web/src/app/providers/[id]/ProviderProfileClient.tsx \
        docs/superpowers/specs/2026-05-13-provider-details-redesign-design.md \
        docs/superpowers/plans/2026-05-13-provider-details-redesign.md
git status
```

Verify nothing unexpected is staged (no `.next/`, no env files, no unrelated changes). Then:

```bash
git commit -m "$(cat <<'EOF'
Redesign provider details page around booking

Rebuilds /providers/[id] to push toward booking instead of reading like a CV.
New hero (square avatar, italic pitch from description, trust ribbon, chips
with category colors), proof-first section order (About → Travaux récents →
Reviews → Compétences → Crédentiels), merged Portfolio + PortfolioProjects
into a single Travaux récents card with featured projects + gallery +
lightbox, merged Certifications + Diplomas into Crédentiels, toggle reviews
breakdown with "X% recommandent" headline, polished right rail and mobile
sticky bar.

Mobile views designed as first-class (web app is the mobile experience
until the Expo app ships).

Spec: docs/superpowers/specs/2026-05-13-provider-details-redesign-design.md
Plan: docs/superpowers/plans/2026-05-13-provider-details-redesign.md
EOF
)"
```

- [ ] **Step 5: Verify commit**

```bash
git log -1 --stat
```
Expected: one commit touching the files listed in the File map at the top of this plan (creates + rewrites + deletes), plus the spec and plan markdown files. No unrelated files.

Done.
