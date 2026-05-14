# Booking Details Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the `/bookings/[id]` page around a state-led "live mission card" identity, with a real mobile breakpoint, no gradients, no fake artifacts, and a cleaner FinalOfferDialog. Pure frontend; no backend, DTO, or schema changes.

**Architecture:** Replace the monolithic `BookingDetail.tsx` with one orchestrator plus seven focused atom components (`BookingHero`, `StepStrip`, `AccordCard`, `AddressRow`, `MobileStickyBar`, `ActionsCard`, `DetailsCard`) and a state-matrix helper (`bookingActions.ts`). Rewrite `FinalOfferDialog.tsx` in place — same props, new chrome (mobile sheet / desktop dialog).

**Tech Stack:** Next.js (App Router), React 18, TypeScript, inline styles + `globals.css` CSS atoms (`k-btn`, `k-chip-*`, `k-overline`, `k-display-m`, `k-price`), `@kayu/ui` (icons via `I`, `formatMoneyFc`, tokens), `@tanstack/react-query`, `@kayu/api`, `@kayu/schemas`.

**Project conventions:**
- **No per-task commits.** Implement every task end-to-end; we commit once at the very end so the user can review the full diff.
- Match the existing inline-style + `className` pattern in `BookingDetail.tsx`. No new stylesheets, no CSS-in-JS libraries.
- Web app has no React test runner. Verification is `pnpm --filter @kayu/web typecheck` + visual checks on the dev server. Treat that as the "tests pass" gate for each task.
- Mobile-first: every component is designed at 375 px first, then expanded for ≥ 768 px.
- Spec to follow: `docs/superpowers/specs/2026-05-14-booking-details-redesign-design.md`.

---

## File Structure

### New files (all under `apps/web/src/components/bookings/`)

| File | Responsibility |
|---|---|
| `bookingActions.ts` | Pure helper: given `(booking, perspective)`, returns the canonical action set (primary CTA + secondary + destructive) for the page. Single source of truth for the §11 state matrix in the spec. |
| `BookingHero.tsx` | The state-led hero card. Owns the status chip, when/sub-line composition, optional state strip, and the counterparty row with quick-message button. Mobile and desktop layouts in one component, driven by CSS media-queries via inline styles. |
| `StepStrip.tsx` | Slim horizontal 4-dot step strip (replaces the old vertical `Timeline`). |
| `AccordCard.tsx` | Lifecycle-aware accord card. Empty (client / provider), Registered (client / provider), Locked (client / provider). Renders `EmptyStack`, `TitleBlock`, `KvGrid`, `CommissionBlock`, `EditLink` internally. |
| `AddressRow.tsx` | Pin + street + commune + optional note + `Itinéraire ↗` deep link to Google Maps. Replaces `AddressCard` + `MiniMap`. |
| `MobileStickyBar.tsx` | Sticky bottom action bar, hidden ≥ 768 px. Driven by the action set from `bookingActions.ts`. |
| `ActionsCard.tsx` | Desktop right-rail Actions block. Same action set as `MobileStickyBar`, vertically stacked. |
| `DetailsCard.tsx` | Desktop right-rail Details block (ref, créée, paiement, zone for provider). |

### Modified files

| File | Change |
|---|---|
| `apps/web/src/components/bookings/BookingDetail.tsx` | Rewritten end-to-end. Becomes a thin orchestrator: data fetching, mutations, dialog state, layout grid. All visual subcomponents move to the new files above. |
| `apps/web/src/components/bookings/FinalOfferDialog.tsx` | Rewritten in place. Props contract unchanged (`open`, `onOpenChange`, `providerId`, `clientId`, `bookingId`, `initialValues`, `heading`, `subheading`, `submitLabel`, `onSubmit`, `busy`). New chrome (mobile sheet vs desktop dialog), duration as chips, live "Résumé pour toi" preview. |

### Unchanged

`BookingCard.tsx`, `BookingStatusChip.tsx` (used by `BookingCard`), `BookingDetailPageClient.tsx`, `page.tsx`, `lib/booking-v2.ts`, all backend/schemas/api packages.

---

## Task 1: `bookingActions.ts` — derive action set from booking state

Single helper that turns `(booking, perspective)` into a `BookingActions` object the hero, sticky bar, and rail all consume. Keeps the §11 state matrix in one place.

**Files:**
- Create: `apps/web/src/components/bookings/bookingActions.ts`

- [ ] **Step 1.1: Create the helper file**

```ts
// apps/web/src/components/bookings/bookingActions.ts
import type { V2Status } from "@/lib/booking-v2";

export type Perspective = "client" | "pro";

export type BookingActionsInput = {
  v2Status: V2Status;
  backendStatus: string;
  isPaid: boolean;
  isClient: boolean;
  hasOffer: boolean;
  reviewed: boolean;
  counterpartyFirstName: string;
};

export type BookingActionId =
  | "message"
  | "messageNamed"
  | "cancel"
  | "rebook"
  | "review"
  | "confirmBooking"
  | "completeBooking"
  | "confirmPayment"
  | "createAccord"
  | "adjustAccord";

export type BookingAction = {
  id: BookingActionId;
  label: string;
  variant: "primary" | "secondary" | "ghost-danger";
  icon?: "messageCircle" | "check" | "coins" | "star" | "pencil";
};

export type BookingActions = {
  primary: BookingAction | null;
  secondary: BookingAction | null;
  destructive: BookingAction | null;
};

const messageNamed = (firstName: string): BookingAction => ({
  id: "messageNamed",
  label: firstName ? `Message à ${firstName}` : "Message",
  variant: "primary",
  icon: "messageCircle",
});

const messageSecondary: BookingAction = {
  id: "message",
  label: "Message",
  variant: "secondary",
  icon: "messageCircle",
};

const cancelGhost: BookingAction = {
  id: "cancel",
  label: "Annuler la réservation",
  variant: "ghost-danger",
};

const cancelGhostShort: BookingAction = {
  id: "cancel",
  label: "Annuler",
  variant: "ghost-danger",
};

export function deriveBookingActions(input: BookingActionsInput): BookingActions {
  const {
    v2Status,
    backendStatus,
    isPaid,
    isClient,
    hasOffer,
    reviewed,
    counterpartyFirstName: firstName,
  } = input;

  if (v2Status === "upcoming") {
    if (backendStatus === "PENDING") {
      if (isClient) {
        return {
          primary: messageNamed(firstName),
          secondary: null,
          destructive: cancelGhostShort,
        };
      }
      return {
        primary: {
          id: "confirmBooking",
          label: "Confirmer la réservation",
          variant: "primary",
          icon: "check",
        },
        secondary: hasOffer
          ? { id: "adjustAccord", label: "Ajuster l'accord", variant: "secondary", icon: "pencil" }
          : { id: "createAccord", label: "Enregistrer l'accord", variant: "secondary", icon: "coins" },
        destructive: null,
      };
    }
    if (backendStatus === "CONFIRMED") {
      if (isClient) {
        return {
          primary: messageNamed(firstName),
          secondary: null,
          destructive: cancelGhostShort,
        };
      }
      return {
        primary: {
          id: "completeBooking",
          label: "Marquer comme terminée",
          variant: "primary",
          icon: "check",
        },
        secondary: { id: "adjustAccord", label: "Ajuster l'accord", variant: "secondary", icon: "pencil" },
        destructive: null,
      };
    }
    // IN_PROGRESS or unknown upcoming
    if (isClient) {
      return { primary: messageNamed(firstName), secondary: null, destructive: null };
    }
    return {
      primary: {
        id: "completeBooking",
        label: "Marquer comme terminée",
        variant: "primary",
        icon: "check",
      },
      secondary: messageSecondary,
      destructive: null,
    };
  }

  if (v2Status === "completed") {
    if (!isPaid) {
      if (isClient) {
        return { primary: messageSecondary, secondary: null, destructive: null };
      }
      return {
        primary: {
          id: "confirmPayment",
          label: "Confirmer le paiement reçu",
          variant: "primary",
          icon: "coins",
        },
        secondary: messageSecondary,
        destructive: null,
      };
    }
    // paid
    if (isClient && !reviewed) {
      return {
        primary: { id: "review", label: "Laisser un avis", variant: "primary", icon: "star" },
        secondary: messageSecondary,
        destructive: null,
      };
    }
    if (isClient && reviewed) {
      return {
        primary: { id: "rebook", label: "Réserver à nouveau", variant: "primary" },
        secondary: messageSecondary,
        destructive: null,
      };
    }
    // provider, paid
    return { primary: messageSecondary, secondary: null, destructive: null };
  }

  // cancelled
  if (isClient) {
    return {
      primary: { id: "rebook", label: "Réserver à nouveau", variant: "primary" },
      secondary: messageSecondary,
      destructive: null,
    };
  }
  return { primary: messageSecondary, secondary: null, destructive: null };
}
```

- [ ] **Step 1.2: Typecheck**

Run: `pnpm --filter @kayu/web typecheck`
Expected: no errors related to this new file.

---

## Task 2: `StepStrip.tsx` — slim 4-dot horizontal strip

Replaces the old `Timeline` component. Renders a "SUIVI" overline + dotted strip with a hairline rail and a progress rail.

**Files:**
- Create: `apps/web/src/components/bookings/StepStrip.tsx`

- [ ] **Step 2.1: Create the component**

```tsx
// apps/web/src/components/bookings/StepStrip.tsx
"use client";

import type { V2Status } from "@/lib/booking-v2";

const STEPS_BY_V2: Record<V2Status, { key: string; label: string }[]> = {
  upcoming: [
    { key: "booked", label: "Réservée" },
    { key: "confirmed", label: "Confirmée" },
    { key: "done", label: "Terminée" },
    { key: "paid", label: "Payée" },
  ],
  active: [
    { key: "booked", label: "Réservée" },
    { key: "confirmed", label: "Confirmée" },
    { key: "done", label: "Terminée" },
    { key: "paid", label: "Payée" },
  ],
  completed: [
    { key: "booked", label: "Réservée" },
    { key: "confirmed", label: "Confirmée" },
    { key: "done", label: "Terminée" },
    { key: "paid", label: "Payée" },
  ],
  cancelled: [
    { key: "booked", label: "Réservée" },
    { key: "cancelled", label: "Annulée" },
  ],
};

export function getStepIndex(
  v2: V2Status,
  backend: string,
  isPaid: boolean,
): number {
  if (v2 === "upcoming") return backend === "PENDING" ? 0 : 1;
  if (v2 === "active") return 2;
  if (v2 === "completed") return isPaid ? 3 : 2;
  if (v2 === "cancelled") return 1;
  return 0;
}

export function StepStrip({
  v2Status,
  backendStatus,
  isPaid,
}: {
  v2Status: V2Status;
  backendStatus: string;
  isPaid: boolean;
}) {
  const steps = STEPS_BY_V2[v2Status];
  const step = getStepIndex(v2Status, backendStatus, isPaid);
  const isCancelled = v2Status === "cancelled";
  const railColor = isCancelled ? "var(--k-danger)" : "var(--k-success)";

  // Progress rail goes from first dot center to the centre of the highest
  // "done" dot. With N steps in a `repeat(N, 1fr)` grid, dot centres sit at
  // ((2i + 1) / (2N)) of the width. So the rail starts at 1/(2N) and extends
  // by (step) / N when step > 0.
  const N = steps.length;
  const startPct = (1 / (2 * N)) * 100;
  const railPct = step > 0 ? (step / N) * 100 : 0;

  return (
    <section
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: "var(--k-r-lg)",
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <span className="k-overline">Suivi</span>
        <span
          style={{
            fontFamily: "var(--k-font-mono)",
            fontSize: 11.5,
            color: "var(--k-text-body)",
            fontWeight: 600,
          }}
        >
          {Math.min(step + 1, N)} / {N}
        </span>
      </div>
      <ol
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "grid",
          gridTemplateColumns: `repeat(${N}, 1fr)`,
          position: "relative",
        }}
      >
        {/* base rail */}
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: `${startPct}%`,
            right: `${startPct}%`,
            top: 6,
            height: 2,
            background: "var(--k-border)",
            zIndex: 0,
          }}
        />
        {/* progress rail */}
        {railPct > 0 && (
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: `${startPct}%`,
              width: `${railPct - startPct}%`,
              top: 6,
              height: 2,
              background: railColor,
              zIndex: 0,
            }}
          />
        )}
        {steps.map((s, i) => {
          const done = i < step;
          const current = i === step;
          let bg = "var(--k-surface)";
          let border = "2px solid var(--k-border)";
          let ring = "none";
          if (done) {
            bg = isCancelled && s.key === "cancelled" ? "var(--k-danger)" : "var(--k-success)";
            border = `2px solid ${bg}`;
          } else if (current) {
            bg = isCancelled ? "var(--k-danger)" : "var(--k-text-primary)";
            border = `2px solid ${bg}`;
            ring = `0 0 0 4px ${isCancelled ? "rgba(225,29,72,0.08)" : "rgba(15,23,42,0.08)"}`;
          }
          return (
            <li
              key={s.key}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                position: "relative",
                zIndex: 1,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: bg,
                  border,
                  boxShadow: ring,
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  color:
                    done || current ? "var(--k-text-primary)" : "var(--k-text-muted)",
                  fontWeight: 500,
                  textAlign: "center",
                }}
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
```

- [ ] **Step 2.2: Typecheck**

Run: `pnpm --filter @kayu/web typecheck`
Expected: no errors.

---

## Task 3: `AddressRow.tsx` — pin + body + Itinéraire deep link

**Files:**
- Create: `apps/web/src/components/bookings/AddressRow.tsx`

- [ ] **Step 3.1: Create the component**

```tsx
// apps/web/src/components/bookings/AddressRow.tsx
"use client";

import { I } from "@kayu/ui/web";
import { fullAddress } from "@/lib/booking-v2";

type AddressBooking = {
  address?: string | null;
  city?: string | null;
  clientNotes?: string | null;
};

export function AddressRow({
  booking,
  perspective,
}: {
  booking: AddressBooking;
  perspective: "client" | "pro";
}) {
  const isClient = perspective === "client";
  const street = (booking.address ?? "").trim();
  const city = (booking.city ?? "").trim();
  const note = (booking.clientNotes ?? "").trim();
  const hasAddress = !!street || !!city;
  const compoundAddress = fullAddress(booking);
  const mapsHref = hasAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(compoundAddress)}`
    : null;

  return (
    <section
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: "var(--k-r-lg)",
        padding: "16px 18px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 12,
          gap: 8,
        }}
      >
        <h3
          className="k-heading"
          style={{ margin: 0, fontSize: 14.5, fontWeight: 600 }}
        >
          {isClient ? "Adresse d'intervention" : "Adresse client"}
        </h3>
        {city && (
          <span
            className="k-overline"
            style={{ fontFamily: "var(--k-font-mono)" }}
          >
            {city}
          </span>
        )}
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "var(--k-r-md)",
            background: "#F1F5F9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: "var(--k-text-muted)",
          }}
        >
          <I.mapPin size={16} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 500,
              color: "var(--k-text-primary)",
              lineHeight: 1.4,
            }}
          >
            {hasAddress ? street || city : "Adresse à confirmer"}
          </div>
          {hasAddress && street && city && !street.includes(city) && (
            <div
              style={{
                fontSize: 11.5,
                color: "var(--k-text-muted)",
                marginTop: 2,
              }}
            >
              {city}, Kinshasa
            </div>
          )}
          {note && (
            <div
              style={{
                marginTop: 6,
                padding: "8px 10px",
                background: "#F8FAFC",
                borderRadius: 8,
                fontSize: 12,
                color: "var(--k-text-body)",
              }}
            >
              {note}
            </div>
          )}
        </div>
        {mapsHref && (
          <a
            href={mapsHref}
            target="_blank"
            rel="noreferrer noopener"
            style={{
              alignSelf: "center",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              fontWeight: 600,
              color: "var(--k-text-primary)",
              border: "1px solid var(--k-border)",
              borderRadius: "var(--k-r-md)",
              padding: "8px 10px",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Itinéraire <I.arrowUpRight size={12} />
          </a>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 3.2: Typecheck**

Run: `pnpm --filter @kayu/web typecheck`
Expected: no errors.

---

## Task 4: `BookingHero.tsx` — state-led hero card

**Files:**
- Create: `apps/web/src/components/bookings/BookingHero.tsx`

- [ ] **Step 4.1: Create the component**

```tsx
// apps/web/src/components/bookings/BookingHero.tsx
"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { I } from "@kayu/ui/web";
import {
  formatWhen,
  initialsFromName,
  toV2Status,
  type V2Status,
} from "@/lib/booking-v2";

export type HeroCounterparty = {
  first: string;
  last: string;
  role: string;
  verified: boolean;
  rating: number | null | undefined;
  reviews: number | null | undefined;
};

export type HeroBooking = {
  id: string;
  title: string;
  status: string;
  scheduledDate?: string | Date | null;
  price?: number | null;
  isPaid?: boolean | null;
  cancelledBy?: string | null;
  cancelReason?: string | null;
  progress?: string | null;
};

type ChipTone = "warning" | "success" | "neutral" | "danger";

function HeroChip({
  tone,
  label,
  pulse,
}: {
  tone: ChipTone;
  label: string;
  pulse?: boolean;
}) {
  const map: Record<
    ChipTone,
    { bg: string; color: string; dot: string }
  > = {
    warning: {
      bg: "var(--k-warning-subtle)",
      color: "#92400E",
      dot: "var(--k-warning)",
    },
    success: {
      bg: "var(--k-success-subtle)",
      color: "#047857",
      dot: "var(--k-success)",
    },
    neutral: { bg: "#F1F5F9", color: "var(--k-text-body)", dot: "transparent" },
    danger: {
      bg: "var(--k-danger-subtle)",
      color: "#9F1239",
      dot: "var(--k-danger)",
    },
  };
  const c = map[tone];
  return (
    <span
      className="k-chip k-chip-sm"
      style={{
        background: c.bg,
        color: c.color,
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontWeight: 600,
      }}
    >
      {pulse && (
        <span
          aria-hidden
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: c.dot,
            animation: "kPulse 1.6s ease-in-out infinite",
          }}
        />
      )}
      {label}
    </span>
  );
}

function chipForStatus(v2: V2Status, backend: string): {
  tone: ChipTone;
  label: string;
  pulse: boolean;
} {
  if (v2 === "upcoming" && backend === "PENDING")
    return { tone: "warning", label: "En attente", pulse: false };
  if (v2 === "upcoming" && backend === "CONFIRMED")
    return { tone: "success", label: "Confirmée", pulse: true };
  if (v2 === "upcoming" && backend === "IN_PROGRESS")
    return { tone: "success", label: "En cours", pulse: true };
  if (v2 === "active") return { tone: "success", label: "En cours", pulse: true };
  if (v2 === "completed") return { tone: "neutral", label: "Terminée", pulse: false };
  return { tone: "danger", label: "Annulée", pulse: false };
}

function durationLabel(duration: number | null | undefined): string {
  if (duration == null) return "Durée à confirmer";
  if (duration <= 60) return "≈ 1 h";
  if (duration <= 120) return "≈ 2 h";
  if (duration <= 240) return "½ jour";
  return "Journée";
}

function buildSubLine(
  booking: HeroBooking,
  isMobile: boolean,
  duration: number | null | undefined,
): string {
  const v2 = toV2Status(booking.status);
  const parts: string[] = [booking.title || "Mission"];
  if (v2 === "upcoming" || v2 === "active" || v2 === "completed")
    parts.push(durationLabel(duration));
  if (isMobile && booking.price != null)
    parts.push(`${booking.price.toLocaleString("fr-FR")} FC`);
  return parts.join(" · ");
}

function StateStrip({
  booking,
  isClient,
  firstName,
}: {
  booking: HeroBooking;
  isClient: boolean;
  firstName: string;
}) {
  const v2 = toV2Status(booking.status);
  const wrap = (
    bg: string,
    border: string | null,
    color: string,
    children: React.ReactNode,
  ) => (
    <div
      style={{
        marginTop: 12,
        padding: "10px 12px",
        background: bg,
        border: border ? `1px solid ${border}` : "none",
        borderRadius: 10,
        fontSize: 12.5,
        color,
        lineHeight: 1.45,
        fontWeight: 500,
      }}
    >
      {children}
    </div>
  );

  if (booking.status === "PENDING") {
    return wrap(
      "#FFFBEB",
      "#FDE68A",
      "#92400E",
      isClient
        ? `${firstName || "Le pro"} n'a pas encore confirmé. Réponse habituelle en moins de 2 h.`
        : "Nouvelle demande. Confirme ou enregistre l'accord pour valider.",
    );
  }
  if (booking.status === "IN_PROGRESS" && booking.progress) {
    return wrap("#F0FDF4", "#BBF7D0", "#047857", booking.progress);
  }
  if (v2 === "completed") {
    if (!isClient && !booking.isPaid) {
      return wrap("#FFFBEB", "#FDE68A", "#92400E", "Paiement à confirmer.");
    }
    if (booking.isPaid && booking.price != null) {
      return wrap(
        "#F1F5F9",
        null,
        "var(--k-text-body)",
        `Payé en espèces · ${booking.price.toLocaleString("fr-FR")} FC`,
      );
    }
  }
  if (v2 === "cancelled") {
    const who =
      booking.cancelledBy === "provider"
        ? isClient
          ? firstName || "le pro"
          : "vous"
        : booking.cancelledBy === "client"
          ? isClient
            ? "vous"
            : "le client"
          : null;
    const reason = booking.cancelReason ? ` · « ${booking.cancelReason} »` : "";
    return wrap(
      "var(--k-danger-subtle)",
      "#FBD0D7",
      "#9F1239",
      who ? `Annulée par ${who}${reason}` : `Annulée${reason}`,
    );
  }
  return null;
}

export function BookingHero({
  booking,
  duration,
  counterparty,
  isClient,
  isDesktop,
  onMessage,
}: {
  booking: HeroBooking;
  duration: number | null | undefined;
  counterparty: HeroCounterparty;
  isClient: boolean;
  isDesktop: boolean;
  onMessage: () => void;
}) {
  const v2 = toV2Status(booking.status);
  const chip = chipForStatus(v2, booking.status);
  const isCancelled = v2 === "cancelled";
  const ref = booking.id.slice(0, 8).toUpperCase();
  const whenLabel = formatWhen(booking.scheduledDate);
  const subLine = buildSubLine(booking, !isDesktop, duration);
  const firstName = counterparty.first;
  const fullName =
    `${counterparty.first} ${counterparty.last}`.trim() || "—";
  const priceLabel = (() => {
    if (v2 === "completed") return booking.isPaid ? "Payé" : "À régler";
    if (v2 === "cancelled") return "Annulée";
    if (booking.status === "PENDING") return "Estimation";
    return "Prix convenu";
  })();

  return (
    <section
      style={{
        background: "var(--k-surface)",
        border: `1px solid ${isCancelled ? "#FBD0D7" : "var(--k-border)"}`,
        borderRadius: "var(--k-r-lg)",
        padding: isDesktop ? 22 : 18,
      }}
    >
      {/* ribbon + when + sub + (desktop) price */}
      <div
        style={
          isDesktop
            ? {
                display: "flex",
                gap: 24,
                justifyContent: "space-between",
                alignItems: "flex-end",
              }
            : undefined
        }
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
              fontSize: 11,
              color: "var(--k-text-subtle)",
              fontFamily: "var(--k-font-mono)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            <HeroChip tone={chip.tone} label={chip.label} pulse={chip.pulse} />
            <span>#{ref}</span>
          </div>
          <h1
            style={{
              fontFamily: "var(--k-font-display)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--k-text-primary)",
              margin: "12px 0 0",
              lineHeight: 1.1,
              fontSize: isDesktop ? 32 : 26,
              textDecoration: isCancelled ? "line-through" : "none",
              textDecorationThickness: 1,
            }}
          >
            {whenLabel}
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "var(--k-text-body)",
              margin: "6px 0 0",
            }}
          >
            {subLine}
          </p>
        </div>
        {isDesktop && booking.price != null && v2 !== "cancelled" && (
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div
              className="k-overline"
              style={{ fontFamily: "var(--k-font-mono)" }}
            >
              {priceLabel}
            </div>
            <div
              style={{
                fontFamily: "var(--k-font-display)",
                fontWeight: 700,
                fontSize: 28,
                letterSpacing: "-0.02em",
                color: "var(--k-text-primary)",
                marginTop: 3,
              }}
            >
              {booking.price.toLocaleString("fr-FR")} FC
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: "var(--k-text-muted)",
                marginTop: 3,
              }}
            >
              Espèces à la fin
            </div>
          </div>
        )}
      </div>

      <StateStrip booking={booking} isClient={isClient} firstName={firstName} />

      {/* counterparty */}
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          marginTop: 14,
          paddingTop: 14,
          borderTop: "1px solid var(--k-border-subtle)",
        }}
      >
        <Avatar style={{ width: isDesktop ? 42 : 38, height: isDesktop ? 42 : 38 }}>
          <AvatarFallback
            style={{
              background: "var(--k-primary)",
              color: "#fff",
              fontWeight: 600,
              fontSize: isDesktop ? 14 : 13,
            }}
          >
            {initialsFromName(counterparty.first, counterparty.last)}
          </AvatarFallback>
        </Avatar>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--k-font-display)",
              fontWeight: 600,
              fontSize: isDesktop ? 15 : 14,
              color: "var(--k-text-primary)",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            {fullName}
            {counterparty.verified && (
              <I.badgeCheck size={13} strokeColor="var(--k-success)" />
            )}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--k-text-muted)",
              marginTop: 1,
            }}
          >
            {counterparty.role}
            {counterparty.rating != null && (
              <>
                {" · "}
                <I.star size={11} strokeColor="var(--k-warning)" />{" "}
                <strong style={{ color: "var(--k-text-primary)" }}>
                  {counterparty.rating.toFixed(1)}
                </strong>
                {counterparty.reviews != null && ` (${counterparty.reviews} avis)`}
              </>
            )}
          </div>
        </div>
        <button
          onClick={onMessage}
          className="k-btn k-btn-secondary k-btn-sm"
          style={{ flexShrink: 0 }}
        >
          <I.messageCircle size={13} /> Message
        </button>
      </div>
    </section>
  );
}
```

- [ ] **Step 4.2: Typecheck**

Run: `pnpm --filter @kayu/web typecheck`
Expected: no errors.

---

## Task 5: `AccordCard.tsx` — lifecycle-aware accord card

**Files:**
- Create: `apps/web/src/components/bookings/AccordCard.tsx`

- [ ] **Step 5.1: Create the component**

```tsx
// apps/web/src/components/bookings/AccordCard.tsx
"use client";

import type { FinalOffer } from "@kayu/schemas";
import { I } from "@kayu/ui/web";
import { formatMoneyFc } from "@kayu/ui";
import { formatRelativeFR, toV2Status } from "@/lib/booking-v2";

type AccordBooking = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  price?: number | null;
  isPaid?: boolean | null;
  commissionPct?: number | null;
  commissionAmt?: number | null;
  providerNetAmt?: number | null;
  scheduledDate?: string | Date | null;
};

type AccordState = "empty" | "registered" | "locked";

function accordState(
  booking: AccordBooking,
  offer: FinalOffer | null,
): AccordState {
  if (booking.status === "COMPLETED" || booking.status === "CANCELLED")
    return "locked";
  if (offer) return "registered";
  return "empty";
}

function durationLabel(minutes: number | null | undefined): string {
  if (!minutes) return "Durée à confirmer";
  if (minutes <= 60) return "≈ 1 h";
  if (minutes <= 120) return "≈ 2 h";
  if (minutes <= 240) return "½ jour";
  return "Journée";
}

function CardHead({
  title,
  metaLabel,
  metaTone,
}: {
  title: string;
  metaLabel: string;
  metaTone: "warn" | "ok" | "neutral";
}) {
  const color =
    metaTone === "warn"
      ? "#92400E"
      : metaTone === "ok"
        ? "#047857"
        : "var(--k-text-muted)";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: 12,
        gap: 8,
      }}
    >
      <h3
        style={{
          fontFamily: "var(--k-font-display)",
          fontWeight: 600,
          fontSize: 14.5,
          margin: 0,
          color: "var(--k-text-primary)",
        }}
      >
        {title}
      </h3>
      <span
        className="k-overline"
        style={{ color, fontFamily: "var(--k-font-mono)" }}
      >
        {metaLabel}
      </span>
    </div>
  );
}

const cardShell: React.CSSProperties = {
  background: "var(--k-surface)",
  border: "1px solid var(--k-border)",
  borderRadius: "var(--k-r-lg)",
  padding: "16px 18px",
};

function EmptyClient({ estimate }: { estimate: number }) {
  return (
    <section style={cardShell}>
      <CardHead title="Accord" metaLabel="En attente" metaTone="warn" />
      <EmptyStack
        icon={<I.fileText size={20} strokeColor="var(--k-text-muted)" />}
        hl="En attente d'un accord"
        sl="Le pro revient vers toi pour confirmer le service, la durée et le prix."
        estimateLabel="Estimation initiale"
        estimateValue={estimate}
      />
    </section>
  );
}

function EmptyProvider({
  estimate,
  clientFirstName,
  onCreate,
}: {
  estimate: number;
  clientFirstName: string;
  onCreate: () => void;
}) {
  return (
    <section style={cardShell}>
      <CardHead title="Accord à enregistrer" metaLabel="À faire" metaTone="warn" />
      <EmptyStack
        icon={<I.fileText size={20} strokeColor="var(--k-text-muted)" />}
        hl={
          clientFirstName
            ? `Confirme l'accord avec ${clientFirstName}`
            : "Confirme l'accord avec le client"
        }
        sl="Saisis le service final, la durée, le prix et l'adresse. La réservation passera à Confirmée."
        estimateLabel="Estimation initiale du client"
        estimateValue={estimate}
      />
      <button
        onClick={onCreate}
        className="k-btn k-btn-primary"
        style={{ width: "100%", marginTop: 14 }}
      >
        <I.coins size={14} /> Enregistrer l'accord final
      </button>
    </section>
  );
}

function EmptyStack({
  icon,
  hl,
  sl,
  estimateLabel,
  estimateValue,
}: {
  icon: React.ReactNode;
  hl: string;
  sl: string;
  estimateLabel: string;
  estimateValue: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: "#F1F5F9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontFamily: "var(--k-font-display)",
          fontWeight: 600,
          fontSize: 15,
          color: "var(--k-text-primary)",
          marginBottom: 3,
        }}
      >
        {hl}
      </div>
      <div
        style={{
          fontSize: 12.5,
          color: "var(--k-text-muted)",
          lineHeight: 1.5,
          maxWidth: 280,
        }}
      >
        {sl}
      </div>
      <div
        style={{
          marginTop: 14,
          padding: "10px 14px",
          background: "#F8FAFC",
          borderRadius: 10,
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          width: "100%",
          fontSize: 12.5,
        }}
      >
        <span style={{ color: "var(--k-text-muted)" }}>{estimateLabel}</span>
        <span
          style={{
            fontFamily: "var(--k-font-mono)",
            color: "var(--k-text-primary)",
          }}
        >
          {formatMoneyFc(estimateValue)}
        </span>
      </div>
    </div>
  );
}

function TitleBlock({
  title,
  description,
  priceLabel,
  price,
  struck,
}: {
  title: string;
  description?: string | null;
  priceLabel: string;
  price: number;
  struck?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: "var(--k-font-display)",
            fontWeight: 700,
            fontSize: 16,
            color: "var(--k-text-primary)",
          }}
        >
          {title}
        </div>
        {description && (
          <div
            style={{
              fontSize: 12.5,
              color: "var(--k-text-body)",
              marginTop: 4,
              lineHeight: 1.45,
            }}
          >
            {description}
          </div>
        )}
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div
          className="k-overline"
          style={{ fontFamily: "var(--k-font-mono)" }}
        >
          {priceLabel}
        </div>
        <div
          style={{
            fontFamily: "var(--k-font-display)",
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: "-0.02em",
            color: "var(--k-text-primary)",
            marginTop: 2,
            textDecoration: struck ? "line-through" : "none",
            textDecorationThickness: 1,
          }}
        >
          {formatMoneyFc(price)}
        </div>
      </div>
    </div>
  );
}

function KvGrid({
  rows,
  cols = 2,
}: {
  rows: { label: string; value: string; mono?: boolean }[];
  cols?: 2 | 3;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: "12px 16px",
        marginTop: 14,
        paddingTop: 14,
        borderTop: "1px dashed var(--k-border-subtle)",
      }}
    >
      {rows.map((r) => (
        <div key={r.label}>
          <div
            className="k-overline"
            style={{ fontFamily: "var(--k-font-mono)" }}
          >
            {r.label}
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--k-text-primary)",
              fontWeight: 500,
              marginTop: 2,
              fontFamily: r.mono ? "var(--k-font-mono)" : "var(--k-font-body)",
            }}
          >
            {r.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function PayNote({
  paid,
  cancelled,
}: {
  paid?: boolean;
  cancelled?: boolean;
}) {
  const text = cancelled
    ? "Mission annulée. Aucune transaction."
    : paid
      ? "Réglé en espèces à la fin de la mission."
      : "Paiement en espèces à la fin de la mission.";
  const Icon = paid ? I.check : cancelled ? I.x : I.coins;
  return (
    <div
      style={{
        marginTop: 14,
        padding: "9px 12px",
        background: "#F8FAFC",
        borderRadius: 10,
        fontSize: 12,
        color: "var(--k-text-body)",
        display: "flex",
        gap: 7,
        alignItems: "center",
      }}
    >
      <Icon size={13} strokeColor="var(--k-text-muted)" />
      {text}
    </div>
  );
}

function CommissionBlock({
  pct,
  amt,
  net,
  labelTotal,
  labelNet,
}: {
  pct: number;
  amt: number;
  net: number;
  labelTotal: string;
  labelNet: string;
}) {
  return (
    <div
      style={{
        marginTop: 12,
        paddingTop: 12,
        borderTop: "1px solid var(--k-border-subtle)",
        display: "grid",
        gap: 5,
        fontSize: 12.5,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ color: "var(--k-text-muted)" }}>
          {labelTotal} ({pct} %)
        </span>
        <span
          style={{
            fontFamily: "var(--k-font-mono)",
            color: "var(--k-text-primary)",
          }}
        >
          −{formatMoneyFc(amt)}
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ color: "var(--k-text-body)", fontWeight: 600 }}>
          {labelNet}
        </span>
        <span
          style={{
            fontFamily: "var(--k-font-display)",
            fontWeight: 700,
            color: "var(--k-success)",
            fontSize: 14,
          }}
        >
          {formatMoneyFc(net)}
        </span>
      </div>
    </div>
  );
}

function EditLink({ onClick }: { onClick: () => void }) {
  return (
    <div
      style={{
        marginTop: 12,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <button
        onClick={onClick}
        style={{
          background: "transparent",
          border: 0,
          color: "var(--k-text-primary)",
          fontSize: 12.5,
          fontWeight: 600,
          padding: 0,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          textDecoration: "underline",
          textUnderlineOffset: 3,
          textDecorationThickness: 1,
          textDecorationColor: "var(--k-text-subtle)",
        }}
      >
        <I.pencil size={12} /> Ajuster l'accord
      </button>
    </div>
  );
}

export function AccordCard({
  booking,
  offer,
  perspective,
  isDesktop,
  paidAt,
  onCreate,
  onAdjust,
  clientFirstName,
}: {
  booking: AccordBooking;
  offer: FinalOffer | null;
  perspective: "client" | "pro";
  isDesktop: boolean;
  paidAt?: string | Date | null;
  onCreate: () => void;
  onAdjust: () => void;
  clientFirstName: string;
}) {
  const isClient = perspective === "client";
  const v2 = toV2Status(booking.status);
  const state = accordState(booking, offer);
  const estimate = booking.price ?? 0;

  if (state === "empty") {
    if (v2 === "cancelled") {
      return (
        <section style={cardShell}>
          <CardHead title="Accord" metaLabel="Non conclu" metaTone="neutral" />
          <EmptyStack
            icon={<I.x size={20} strokeColor="var(--k-text-muted)" />}
            hl="Aucun accord enregistré"
            sl="La mission a été annulée avant qu'un accord ne soit conclu."
            estimateLabel="Estimation initiale"
            estimateValue={estimate}
          />
        </section>
      );
    }
    if (isClient) return <EmptyClient estimate={estimate} />;
    return (
      <EmptyProvider
        estimate={estimate}
        clientFirstName={clientFirstName}
        onCreate={onCreate}
      />
    );
  }

  // registered or locked
  const title = offer?.title ?? booking.title ?? "Service";
  const description = offer?.description ?? booking.description ?? null;
  const price = offer?.price ?? booking.price ?? 0;
  const duration = offer?.duration ?? null;
  const isLocked = state === "locked";
  const isCancelled = v2 === "cancelled";
  const pct =
    offer?.commissionPct ?? booking.commissionPct ?? 10;
  const amt =
    offer?.commissionAmt ??
    booking.commissionAmt ??
    Math.round((price * pct) / 100);
  const net = offer?.providerNetAmt ?? booking.providerNetAmt ?? price - amt;

  // labels
  const headerLabel = isLocked
    ? isCancelled
      ? "Annulé"
      : "Clôturé"
    : "Confirmé";
  const headerTone = isLocked ? "neutral" : "ok";
  const priceLabel = isLocked
    ? isClient
      ? booking.isPaid
        ? "Payé"
        : isCancelled
          ? "Annulée"
          : "À régler"
      : booking.isPaid
        ? "Encaissé"
        : isCancelled
          ? "Annulée"
          : "À encaisser"
    : "Prix convenu";

  const kvRows = isLocked
    ? [
        { label: "Durée", value: durationLabel(duration) },
        {
          label: booking.isPaid ? "Payé le" : "Date",
          value: formatRelativeFR(paidAt ?? booking.scheduledDate ?? null),
        },
      ]
    : [
        { label: "Durée", value: durationLabel(duration) },
        {
          label: "Confirmé",
          value: formatRelativeFR(
            (offer?.acceptedAt as Date | string | null | undefined) ??
              (offer?.createdAt as Date | string | null | undefined) ??
              null,
          ),
        },
      ];

  if (isDesktop) {
    kvRows.push({
      label: "Référence",
      value: `#${booking.id.slice(0, 8).toUpperCase()}`,
      mono: true,
    });
  }

  return (
    <section style={cardShell}>
      <CardHead
        title="Accord final"
        metaLabel={headerLabel}
        metaTone={headerTone}
      />
      <TitleBlock
        title={title}
        description={description}
        priceLabel={priceLabel}
        price={price}
        struck={isCancelled}
      />
      <KvGrid rows={kvRows} cols={isDesktop ? 3 : 2} />
      <PayNote paid={!!booking.isPaid && isLocked} cancelled={isCancelled} />
      {!isClient && (
        <CommissionBlock
          pct={pct}
          amt={amt}
          net={net}
          labelTotal="Commission KAYOU"
          labelNet={isLocked ? "Gain net" : "Gain net estimé"}
        />
      )}
      {!isClient && !isLocked && <EditLink onClick={onAdjust} />}
    </section>
  );
}
```

- [ ] **Step 5.2: Typecheck**

Run: `pnpm --filter @kayu/web typecheck`
Expected: no errors.

---

## Task 6: `MobileStickyBar.tsx` and `ActionsCard.tsx` — render the action set

Both consume the same `BookingActions` object from `bookingActions.ts`.

**Files:**
- Create: `apps/web/src/components/bookings/MobileStickyBar.tsx`
- Create: `apps/web/src/components/bookings/ActionsCard.tsx`

- [ ] **Step 6.1: Create `MobileStickyBar.tsx`**

```tsx
// apps/web/src/components/bookings/MobileStickyBar.tsx
"use client";

import { I } from "@kayu/ui/web";
import type { BookingAction, BookingActions } from "./bookingActions";

const iconFor: Partial<Record<
  NonNullable<BookingAction["icon"]>,
  keyof typeof I
>> = {
  messageCircle: "messageCircle",
  check: "check",
  coins: "coins",
  star: "star",
  pencil: "pencil",
};

function classFor(variant: BookingAction["variant"]): string {
  if (variant === "primary") return "k-btn k-btn-primary";
  if (variant === "secondary") return "k-btn k-btn-secondary";
  return "k-btn k-btn-ghost";
}

function colorFor(variant: BookingAction["variant"]): React.CSSProperties {
  if (variant === "ghost-danger")
    return { color: "var(--k-danger)", fontWeight: 500 };
  return {};
}

function Btn({
  action,
  onClick,
  flex,
  disabled,
}: {
  action: BookingAction;
  onClick: () => void;
  flex: number;
  disabled?: boolean;
}) {
  const IconCmp = action.icon ? I[iconFor[action.icon] ?? "check"] : null;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={classFor(action.variant)}
      style={{ flex, ...colorFor(action.variant) }}
    >
      {IconCmp && <IconCmp size={14} />}
      {action.label}
    </button>
  );
}

export function MobileStickyBar({
  actions,
  busy,
  onAction,
}: {
  actions: BookingActions;
  busy: boolean;
  onAction: (id: BookingAction["id"]) => void;
}) {
  const left = actions.destructive ?? actions.secondary ?? null;
  const right = actions.primary;
  if (!left && !right) return null;
  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        background: "var(--k-surface)",
        borderTop: "1px solid var(--k-border)",
        padding: "12px 14px",
        paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
        display: "flex",
        gap: 8,
        zIndex: 20,
      }}
    >
      {left ? (
        <Btn action={left} onClick={() => onAction(left.id)} flex={2} disabled={busy} />
      ) : null}
      {right ? (
        <Btn
          action={right}
          onClick={() => onAction(right.id)}
          flex={left ? 3 : 1}
          disabled={busy}
        />
      ) : null}
    </div>
  );
}
```

- [ ] **Step 6.2: Create `ActionsCard.tsx`**

```tsx
// apps/web/src/components/bookings/ActionsCard.tsx
"use client";

import { I } from "@kayu/ui/web";
import type { BookingAction, BookingActions } from "./bookingActions";

const iconFor: Partial<Record<
  NonNullable<BookingAction["icon"]>,
  keyof typeof I
>> = {
  messageCircle: "messageCircle",
  check: "check",
  coins: "coins",
  star: "star",
  pencil: "pencil",
};

function classFor(variant: BookingAction["variant"]): string {
  if (variant === "primary") return "k-btn k-btn-primary";
  if (variant === "secondary") return "k-btn k-btn-secondary";
  return "k-btn k-btn-ghost";
}

function colorFor(variant: BookingAction["variant"]): React.CSSProperties {
  if (variant === "ghost-danger")
    return { color: "var(--k-danger)", fontWeight: 500 };
  return {};
}

function Btn({
  action,
  onClick,
  disabled,
  marginTop,
}: {
  action: BookingAction;
  onClick: () => void;
  disabled?: boolean;
  marginTop?: number;
}) {
  const IconCmp = action.icon ? I[iconFor[action.icon] ?? "check"] : null;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={classFor(action.variant)}
      style={{ width: "100%", marginTop, ...colorFor(action.variant) }}
    >
      {IconCmp && <IconCmp size={14} />}
      {action.label}
    </button>
  );
}

export function ActionsCard({
  actions,
  busy,
  onAction,
}: {
  actions: BookingActions;
  busy: boolean;
  onAction: (id: BookingAction["id"]) => void;
}) {
  const { primary, secondary, destructive } = actions;
  if (!primary && !secondary && !destructive) return null;
  return (
    <section
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: "var(--k-r-lg)",
        padding: 16,
      }}
    >
      <div className="k-overline" style={{ marginBottom: 10 }}>
        Actions
      </div>
      {primary && (
        <Btn action={primary} onClick={() => onAction(primary.id)} disabled={busy} />
      )}
      {secondary && (
        <Btn
          action={secondary}
          onClick={() => onAction(secondary.id)}
          disabled={busy}
          marginTop={primary ? 8 : 0}
        />
      )}
      {destructive && (
        <Btn
          action={destructive}
          onClick={() => onAction(destructive.id)}
          disabled={busy}
          marginTop={primary || secondary ? 6 : 0}
        />
      )}
    </section>
  );
}
```

- [ ] **Step 6.3: Typecheck**

Run: `pnpm --filter @kayu/web typecheck`
Expected: no errors.

---

## Task 7: `DetailsCard.tsx` — desktop right-rail Details block

**Files:**
- Create: `apps/web/src/components/bookings/DetailsCard.tsx`

- [ ] **Step 7.1: Create the component**

```tsx
// apps/web/src/components/bookings/DetailsCard.tsx
"use client";

import {
  formatRelativeFR,
  paymentStatusLabel,
  type V2Status,
} from "@/lib/booking-v2";

type DetailsBooking = {
  id: string;
  createdAt?: string | Date | null;
  isPaid?: boolean | null;
  paymentMethod?: string | null;
  city?: string | null;
};

function Row({
  label,
  value,
  mono,
  first,
}: {
  label: string;
  value: string;
  mono?: boolean;
  first?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: first ? "0 0 7px" : "7px 0",
        borderTop: first ? "none" : "1px solid var(--k-border-subtle)",
        fontSize: 12.5,
      }}
    >
      <span style={{ color: "var(--k-text-muted)" }}>{label}</span>
      <span
        style={{
          color: "var(--k-text-primary)",
          fontWeight: 500,
          fontFamily: mono ? "var(--k-font-mono)" : "var(--k-font-body)",
          fontSize: mono ? 11.5 : 12.5,
        }}
      >
        {value}
      </span>
    </div>
  );
}

export function DetailsCard({
  booking,
  isClient,
}: {
  booking: DetailsBooking;
  isClient: boolean;
}) {
  return (
    <section
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: "var(--k-r-lg)",
        padding: "16px 18px",
      }}
    >
      <div className="k-overline" style={{ marginBottom: 10 }}>
        Détails
      </div>
      <Row
        label="Réservation"
        value={`#${booking.id.slice(0, 8).toUpperCase()}`}
        mono
        first
      />
      <Row label="Créée" value={formatRelativeFR(booking.createdAt)} />
      <Row label="Paiement" value={paymentStatusLabel(booking)} />
      {!isClient && <Row label="Zone" value={booking.city ?? "—"} />}
    </section>
  );
}
```

- [ ] **Step 7.2: Typecheck**

Run: `pnpm --filter @kayu/web typecheck`
Expected: no errors.

---

## Task 8: Rewrite `FinalOfferDialog.tsx` — sheet (mobile) / dialog (desktop)

Same props contract, new chrome.

**Files:**
- Modify: `apps/web/src/components/bookings/FinalOfferDialog.tsx` (full rewrite)

- [ ] **Step 8.1: Rewrite the file in place**

```tsx
// apps/web/src/components/bookings/FinalOfferDialog.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { finalOffersApi } from "@kayu/api";
import { formatMoneyFc } from "@kayu/ui";
import { I } from "@kayu/ui/web";

type CreateFinalOfferInput = Parameters<
  ReturnType<typeof finalOffersApi>["create"]
>[0];

export type FinalOfferDialogInitialValues = {
  title?: string;
  description?: string;
  price?: number | string;
  durationHours?: number | string;
  scheduledDate?: Date | string;
  address?: string;
  city?: string;
  notes?: string;
};

export type FinalOfferDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: string;
  clientId: string;
  conversationId?: string;
  bookingId?: string;
  initialValues?: FinalOfferDialogInitialValues;
  heading?: string;
  subheading?: string;
  submitLabel?: string;
  onSubmit: (offer: CreateFinalOfferInput) => Promise<unknown>;
  busy: boolean;
  commissionPct?: number;
  clientFirstName?: string;
};

const DURATION_OPTIONS: { key: string; label: string; minutes: number }[] = [
  { key: "1h", label: "1 h", minutes: 60 },
  { key: "2h", label: "2 h", minutes: 120 },
  { key: "half", label: "½ jour", minutes: 240 },
  { key: "day", label: "Journée", minutes: 480 },
];

function defaultDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return d;
}

function toDateTimeLocalValue(value: Date | string | undefined) {
  const d = value instanceof Date ? value : value ? new Date(value) : defaultDate();
  if (Number.isNaN(d.getTime())) return toDateTimeLocalValue(defaultDate());
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function nearestDurationKey(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 90) return "1h";
  if (minutes <= 180) return "2h";
  if (minutes <= 360) return "half";
  return "day";
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return isDesktop;
}

const labelStyle: React.CSSProperties = {
  fontSize: 10.5,
  color: "var(--k-text-muted)",
  fontFamily: "var(--k-font-mono)",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: 6,
  display: "block",
  fontWeight: 600,
};

const optStyle: React.CSSProperties = {
  fontFamily: "var(--k-font-display)",
  fontWeight: 500,
  fontSize: 10.5,
  color: "var(--k-text-subtle)",
  marginLeft: 6,
  textTransform: "none",
  letterSpacing: 0,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 12px",
  border: "1px solid var(--k-border)",
  borderRadius: "var(--k-r-md)",
  background: "var(--k-surface)",
  color: "var(--k-text-primary)",
  fontFamily: "var(--k-font-body)",
  fontSize: 14,
  minHeight: 42,
  boxSizing: "border-box",
  outline: "none",
};

export function FinalOfferDialog({
  open,
  onOpenChange,
  providerId,
  clientId,
  conversationId,
  bookingId,
  initialValues,
  heading,
  subheading,
  submitLabel,
  onSubmit,
  busy,
  commissionPct = 10,
  clientFirstName,
}: FinalOfferDialogProps) {
  const isDesktop = useIsDesktop();
  const adjusting = !!initialValues?.title;
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [price, setPrice] = useState(
    initialValues?.price != null ? String(initialValues.price) : "",
  );
  const [durationKey, setDurationKey] = useState(() =>
    nearestDurationKey(
      initialValues?.durationHours != null
        ? Number(String(initialValues.durationHours).replace(",", ".")) * 60
        : null,
    ),
  );
  const [scheduledDate, setScheduledDate] = useState(
    toDateTimeLocalValue(initialValues?.scheduledDate),
  );
  const [address, setAddress] = useState(initialValues?.address ?? "");
  const [city, setCity] = useState(initialValues?.city ?? "Kinshasa");
  const [notes, setNotes] = useState(initialValues?.notes ?? "");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(initialValues?.title ?? "");
    setDescription(initialValues?.description ?? "");
    setPrice(initialValues?.price != null ? String(initialValues.price) : "");
    setDurationKey(
      nearestDurationKey(
        initialValues?.durationHours != null
          ? Number(String(initialValues.durationHours).replace(",", ".")) * 60
          : null,
      ),
    );
    setScheduledDate(toDateTimeLocalValue(initialValues?.scheduledDate));
    setAddress(initialValues?.address ?? "");
    setCity(initialValues?.city ?? "Kinshasa");
    setNotes(initialValues?.notes ?? "");
    setFormError(null);
  }, [open, initialValues]);

  const parsedPrice = useMemo(() => Number(price), [price]);
  const commission = useMemo(() => {
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) return 0;
    return Math.round((parsedPrice * commissionPct) / 100);
  }, [parsedPrice, commissionPct]);
  const net = Math.max(0, parsedPrice - commission);

  if (!open) return null;

  const dialogTitle =
    heading ??
    (adjusting
      ? "Ajuster l'accord"
      : clientFirstName
        ? `Confirme l'accord avec ${clientFirstName}`
        : "Confirme l'accord");
  const dialogSub =
    subheading ??
    (adjusting
      ? "L'accord précédent sera remplacé par cette mise à jour."
      : "Indique ce que tu vas faire, la durée, le prix convenu et l'adresse. Le client recevra une confirmation immédiate.");
  const dialogCrumb = `ACCORD FINAL · ${adjusting ? "AJUSTEMENT" : "NOUVEAU"}`;
  const submit = async () => {
    const minutes =
      DURATION_OPTIONS.find((o) => o.key === durationKey)?.minutes ?? 60;
    const parsedScheduledDate = new Date(scheduledDate);
    if (!title.trim() || title.trim().length < 3) {
      setFormError("Indique le service convenu (3 caractères min).");
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setFormError("Indique un prix valide en FC.");
      return;
    }
    if (!scheduledDate || Number.isNaN(parsedScheduledDate.getTime())) {
      setFormError("Choisis une date et une heure valides.");
      return;
    }
    setFormError(null);
    await onSubmit({
      providerId,
      clientId,
      conversationId,
      bookingId,
      title: title.trim(),
      description: description.trim() || undefined,
      price: parsedPrice,
      duration: minutes,
      scheduledDate: parsedScheduledDate,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      notes: notes.trim() || undefined,
      paymentMethod: "cash",
    });
    onOpenChange(false);
  };

  const headerBlock = (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        alignItems: "flex-start",
        padding: isDesktop ? "18px 20px 0" : "8px 18px 0",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="k-overline" style={{ fontFamily: "var(--k-font-mono)" }}>
          {dialogCrumb}
        </div>
        <h2
          style={{
            fontFamily: "var(--k-font-display)",
            fontWeight: 700,
            fontSize: isDesktop ? 22 : 20,
            color: "var(--k-text-primary)",
            margin: "4px 0 0",
            letterSpacing: "-0.01em",
            lineHeight: 1.15,
          }}
        >
          {dialogTitle}
        </h2>
        <p
          className="k-body-m"
          style={{ color: "var(--k-text-muted)", margin: "4px 0 0", fontSize: 12.5 }}
        >
          {dialogSub}
        </p>
      </div>
      <button
        aria-label="Fermer"
        onClick={() => onOpenChange(false)}
        style={{
          border: "1px solid var(--k-border)",
          background: "var(--k-surface)",
          borderRadius: "var(--k-r-md)",
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "var(--k-text-body)",
        }}
      >
        <I.x size={16} />
      </button>
    </div>
  );

  const fields = (
    <div style={{ padding: isDesktop ? "14px 20px 0" : "14px 18px 0" }}>
      <div>
        <span style={labelStyle}>Service</span>
        <input
          className="k-input"
          style={inputStyle}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setFormError(null);
          }}
          placeholder="Service convenu"
        />
      </div>
      <div style={{ marginTop: 14 }}>
        <span style={labelStyle}>
          Description<span style={optStyle}>facultatif</span>
        </span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description courte"
          rows={3}
          style={{
            ...inputStyle,
            minHeight: 60,
            resize: "vertical",
            fontFamily: "var(--k-font-body)",
          }}
        />
      </div>
      <div
        style={{
          marginTop: 14,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
        }}
      >
        <div>
          <span style={labelStyle}>Prix convenu</span>
          <div
            style={{
              ...inputStyle,
              display: "flex",
              alignItems: "center",
              padding: 0,
              paddingLeft: 12,
              paddingRight: 8,
            }}
          >
            <input
              inputMode="numeric"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                setFormError(null);
              }}
              placeholder="35 000"
              style={{
                flex: 1,
                border: 0,
                outline: 0,
                fontSize: 14,
                fontFamily: "var(--k-font-body)",
                color: "var(--k-text-primary)",
                background: "transparent",
                padding: "10px 0",
                minWidth: 0,
              }}
            />
            <span
              style={{
                fontFamily: "var(--k-font-mono)",
                fontSize: 11.5,
                color: "var(--k-text-muted)",
              }}
            >
              FC
            </span>
          </div>
        </div>
        <div>
          <span style={labelStyle}>Durée</span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {DURATION_OPTIONS.map((opt) => {
              const on = durationKey === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setDurationKey(opt.key)}
                  style={{
                    padding: "8px 11px",
                    border: `1px solid ${on ? "var(--k-text-primary)" : "var(--k-border)"}`,
                    background: on ? "var(--k-text-primary)" : "var(--k-surface)",
                    color: on ? "#fff" : "var(--k-text-body)",
                    borderRadius: 999,
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <span style={labelStyle}>Date et heure</span>
        <input
          type="datetime-local"
          value={scheduledDate}
          onChange={(e) => setScheduledDate(e.target.value)}
          style={inputStyle}
        />
      </div>
      <div
        style={{
          marginTop: 14,
          display: "grid",
          gridTemplateColumns: isDesktop ? "1fr 200px" : "1fr",
          gap: 10,
        }}
      >
        <div>
          <span style={labelStyle}>
            Adresse<span style={optStyle}>facultatif</span>
          </span>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Av. de la Paix, n° 24"
            style={inputStyle}
          />
        </div>
        <div>
          <span style={labelStyle}>Commune</span>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Gombe"
            style={inputStyle}
          />
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <span style={labelStyle}>
          Précision utile<span style={optStyle}>facultatif</span>
        </span>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Portail bleu, en face de la pharmacie Wenge."
          style={inputStyle}
        />
      </div>
      {/* Résumé */}
      <div
        style={{
          marginTop: 18,
          padding: 14,
          background: "#F8FAFC",
          borderRadius: "var(--k-r-lg)",
        }}
      >
        <div className="k-overline" style={{ fontFamily: "var(--k-font-mono)" }}>
          Résumé pour toi
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "4px 12px",
            marginTop: 8,
            fontSize: 13,
          }}
        >
          <span style={{ color: "var(--k-text-muted)" }}>Total convenu</span>
          <span
            style={{
              textAlign: "right",
              fontFamily: "var(--k-font-mono)",
              color: "var(--k-text-primary)",
            }}
          >
            {formatMoneyFc(Number.isFinite(parsedPrice) ? parsedPrice : 0)}
          </span>
          <span style={{ color: "var(--k-text-muted)" }}>
            Commission KAYOU ({commissionPct} %)
          </span>
          <span
            style={{
              textAlign: "right",
              fontFamily: "var(--k-font-mono)",
              color: "var(--k-text-primary)",
            }}
          >
            −{formatMoneyFc(commission)}
          </span>
          <div
            style={{
              gridColumn: "1 / -1",
              height: 1,
              background: "var(--k-border-subtle)",
              margin: "6px 0",
            }}
          />
          <span
            style={{ color: "var(--k-text-body)", fontWeight: 600 }}
          >
            Gain net estimé
          </span>
          <span
            style={{
              textAlign: "right",
              fontFamily: "var(--k-font-display)",
              fontWeight: 700,
              color: "var(--k-success)",
              fontSize: 14,
            }}
          >
            {formatMoneyFc(net)}
          </span>
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 11.5,
            color: "var(--k-text-muted)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <I.coins size={12} strokeColor="var(--k-text-muted)" />
          Paiement en espèces. Le gain est crédité après confirmation du paiement reçu.
        </div>
      </div>
      {formError && (
        <div
          role="alert"
          style={{
            marginTop: 12,
            color: "#9F1239",
            background: "var(--k-danger-subtle)",
            borderRadius: 10,
            padding: "9px 12px",
            fontSize: 12.5,
          }}
        >
          {formError}
        </div>
      )}
    </div>
  );

  const footer = (
    <div
      style={{
        display: "flex",
        gap: 10,
        padding: isDesktop ? "14px 20px" : "14px 18px",
        marginTop: 18,
        borderTop: "1px solid var(--k-border-subtle)",
        background: "var(--k-surface)",
      }}
    >
      <button
        className="k-btn k-btn-secondary"
        style={{ flex: 1 }}
        onClick={() => onOpenChange(false)}
      >
        Annuler
      </button>
      <button
        className="k-btn k-btn-primary"
        style={{ flex: 2 }}
        disabled={busy || !title.trim() || !price.toString().trim()}
        onClick={submit}
      >
        {submitLabel ?? (adjusting ? "Mettre à jour l'accord" : "Confirmer l'accord")}
      </button>
    </div>
  );

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 80,
    background: "rgba(15,23,42,0.42)",
    display: "flex",
    alignItems: isDesktop ? "center" : "flex-end",
    justifyContent: "center",
    padding: isDesktop ? 20 : 0,
  };

  const containerStyle: React.CSSProperties = isDesktop
    ? {
        width: "min(520px, 100%)",
        borderRadius: 16,
        background: "var(--k-surface)",
        boxShadow:
          "0 24px 60px -16px rgba(15,23,42,0.35), 0 2px 6px rgba(15,23,42,0.06)",
        maxHeight: "min(720px, calc(100vh - 32px))",
        overflowY: "auto",
      }
    : {
        width: "100%",
        borderRadius: "20px 20px 0 0",
        background: "var(--k-surface)",
        maxHeight: "calc(100vh - 24px)",
        overflowY: "auto",
        boxShadow: "0 -8px 32px -8px rgba(15,23,42,0.25)",
      };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={overlayStyle}
      onClick={() => onOpenChange(false)}
    >
      <div style={containerStyle} onClick={(e) => e.stopPropagation()}>
        {!isDesktop && (
          <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 0" }}>
            <span
              aria-hidden
              style={{
                width: 36,
                height: 4,
                background: "#CBD5E1",
                borderRadius: 999,
              }}
            />
          </div>
        )}
        {headerBlock}
        {fields}
        {footer}
      </div>
    </div>
  );
}
```

- [ ] **Step 8.2: Typecheck**

Run: `pnpm --filter @kayu/web typecheck`
Expected: no errors. (If any caller passes the now-supported new `commissionPct` / `clientFirstName` props, that's fine because they're optional and unused at call sites that don't pass them.)

---

## Task 9: Rewrite `BookingDetail.tsx` — orchestrator

This is the biggest task. Replace the entire current file. The new `BookingDetail` is a thin orchestrator that:

1. Detects viewport (`useIsDesktop`).
2. Builds the counterparty descriptor (the perspective flip lives here).
3. Owns mutations + react-query invalidations (`cancel`, `update`, `createOffer`).
4. Renders `BookingHero` → `StepStrip` → grid (main column with `AccordCard` + `AddressRow`; aside with `ActionsCard` + `DetailsCard` on desktop).
5. Renders `MobileStickyBar` outside the grid on mobile.
6. Dispatches `BookingAction.id` to the right handler.
7. Renders `FinalOfferDialog` only when needed.

**Files:**
- Modify: `apps/web/src/components/bookings/BookingDetail.tsx` (full rewrite)

- [ ] **Step 9.1: Rewrite the file in place**

```tsx
// apps/web/src/components/bookings/BookingDetail.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bookingsApi, finalOffersApi, queryKeys } from "@kayu/api";
import type { FinalOffer } from "@kayu/schemas";
import { I } from "@kayu/ui/web";
import { apiClient } from "@/lib/api";
import { toV2Status } from "@/lib/booking-v2";
import { BookingHero } from "./BookingHero";
import { StepStrip } from "./StepStrip";
import { AccordCard } from "./AccordCard";
import { AddressRow } from "./AddressRow";
import { MobileStickyBar } from "./MobileStickyBar";
import { ActionsCard } from "./ActionsCard";
import { DetailsCard } from "./DetailsCard";
import { FinalOfferDialog } from "./FinalOfferDialog";
import {
  deriveBookingActions,
  type BookingAction,
} from "./bookingActions";

export interface BookingDetailData {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  address?: string | null;
  city?: string | null;
  scheduledDate?: string | Date | null;
  createdAt?: string | Date | null;
  paidAt?: string | Date | null;
  price?: number | null;
  commissionPct?: number | null;
  commissionAmt?: number | null;
  providerNetAmt?: number | null;
  isPaid?: boolean | null;
  paymentMethod?: string | null;
  providerId?: string | null;
  clientId?: string | null;
  cancelledBy?: string | null;
  cancelReason?: string | null;
  clientNotes?: string | null;
  providerNotes?: string | null;
  duration?: number | null;
  provider?: {
    id?: string | null;
    userId?: string | null;
    profession?: string | null;
    user?: {
      firstName?: string | null;
      lastName?: string | null;
      isVerified?: boolean | null;
      avatar?: string | null;
    } | null;
  } | null;
  client?: {
    id?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    avatar?: string | null;
  } | null;
  progress?: string | null;
  reviewed?: boolean | null;
  rating?: number | null;
  reviewCount?: number | null;
}

type BackendStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

type BookingMutationInput = {
  status?: BackendStatus;
  isPaid?: true;
  paymentMethod?: "cash";
};

function useIsDesktop() {
  const [v, setV] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => setV(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return v;
}

export function BookingDetail({
  booking,
  perspective,
}: {
  booking: BookingDetailData;
  perspective: "client" | "pro";
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isDesktop = useIsDesktop();
  const isClient = perspective === "client";
  const v2 = toV2Status(booking.status);

  const counterparty = isClient
    ? {
        first: booking.provider?.user?.firstName ?? "",
        last: booking.provider?.user?.lastName ?? "",
        id: booking.provider?.userId ?? null,
        role: booking.provider?.profession
          ? `Votre ${booking.provider.profession}`
          : "Votre pro",
        verified: !!booking.provider?.user?.isVerified,
        rating: booking.rating ?? null,
        reviews: booking.reviewCount ?? null,
      }
    : {
        first: booking.client?.firstName ?? "",
        last: booking.client?.lastName ?? "",
        id: booking.client?.id ?? booking.clientId ?? null,
        role: "Client",
        verified: false,
        rating: null,
        reviews: null,
      };

  const clientFirstName = booking.client?.firstName ?? "";

  const onMessage = () => {
    const name = `${counterparty.first} ${counterparty.last}`.trim();
    if (counterparty.id) {
      router.push(
        `/messages?recipientId=${encodeURIComponent(counterparty.id)}&recipientName=${encodeURIComponent(name || counterparty.role)}`,
      );
      return;
    }
    router.push("/messages");
  };

  const cancelMutation = useMutation({
    mutationFn: () => bookingsApi(apiClient).cancel(booking.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.bookings.detail(booking.id),
      });
    },
  });
  const updateMutation = useMutation({
    mutationFn: (data: BookingMutationInput) =>
      bookingsApi(apiClient).update(booking.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.bookings.detail(booking.id),
      });
    },
  });

  const offerQueryParams = useMemo(() => ({ bookingId: booking.id }), [booking.id]);
  const { data: offersData } = useQuery({
    queryKey: queryKeys.finalOffers.all(offerQueryParams),
    queryFn: () => finalOffersApi(apiClient).getAll(offerQueryParams),
    enabled: !!booking.id,
  });
  const bookingOffers = offersData?.finalOffers ?? [];
  const activeOffer: FinalOffer | null = useMemo(() => {
    const accepted = bookingOffers.find((o) => o.status === "ACCEPTED");
    if (accepted) return accepted;
    return bookingOffers.find((o) => o.status === "PENDING") ?? null;
  }, [bookingOffers]);

  const createOffer = useMutation({
    mutationFn: (data: Parameters<ReturnType<typeof finalOffersApi>["create"]>[0]) =>
      finalOffersApi(apiClient).create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.bookings.detail(booking.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.finalOffers.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages.conversations(),
      });
    },
  });

  const providerRecordId = booking.provider?.id ?? null;
  const clientUserId = booking.client?.id ?? booking.clientId ?? null;
  const isLockedStatus =
    booking.status === "COMPLETED" || booking.status === "CANCELLED";
  const canRecordOffer =
    !isClient && !isLockedStatus && !!providerRecordId && !!clientUserId;

  const [offerOpen, setOfferOpen] = useState(false);

  const scheduledForOffer = (() => {
    const source = activeOffer?.scheduledDate ?? booking.scheduledDate;
    if (!source) return undefined;
    return source instanceof Date ? source : new Date(source);
  })();
  const offerInitialValues = {
    title: activeOffer?.title ?? booking.title ?? "",
    description: activeOffer?.description ?? booking.description ?? "",
    price: activeOffer?.price ?? booking.price ?? "",
    durationHours:
      activeOffer?.duration != null
        ? String(Math.max(0.25, activeOffer.duration / 60))
        : booking.duration != null
          ? String(Math.max(0.25, booking.duration / 60))
          : undefined,
    scheduledDate: scheduledForOffer,
    address: activeOffer?.address ?? booking.address ?? "",
    city: activeOffer?.city ?? booking.city ?? "Kinshasa",
    notes: activeOffer?.notes ?? "",
  };

  const onCompleteBooking = async () => {
    if (booking.status === "CONFIRMED") {
      await updateMutation.mutateAsync({ status: "IN_PROGRESS" });
    }
    updateMutation.mutate({ status: "COMPLETED" });
  };

  const busy = cancelMutation.isPending || updateMutation.isPending;

  const actions = deriveBookingActions({
    v2Status: v2,
    backendStatus: booking.status,
    isPaid: !!booking.isPaid,
    isClient,
    hasOffer: !!activeOffer,
    reviewed: !!booking.reviewed,
    counterpartyFirstName: counterparty.first,
  });

  const onAction = (id: BookingAction["id"]) => {
    switch (id) {
      case "message":
      case "messageNamed":
        return onMessage();
      case "cancel":
        return cancelMutation.mutate();
      case "rebook":
        if (booking.providerId)
          router.push(`/providers/${booking.providerId}`);
        return;
      case "review":
        if (booking.providerId)
          router.push(
            `/review/${booking.providerId}?bookingId=${booking.id}`,
          );
        return;
      case "confirmBooking":
        return updateMutation.mutate({ status: "CONFIRMED" });
      case "completeBooking":
        return void onCompleteBooking();
      case "confirmPayment":
        return updateMutation.mutate({ isPaid: true, paymentMethod: "cash" });
      case "createAccord":
      case "adjustAccord":
        setOfferOpen(true);
        return;
    }
  };

  const accordDuration = activeOffer?.duration ?? booking.duration ?? null;
  const heroBooking = {
    id: booking.id,
    title: activeOffer?.title ?? booking.title,
    status: booking.status,
    scheduledDate: activeOffer?.scheduledDate ?? booking.scheduledDate,
    price: activeOffer?.price ?? booking.price,
    isPaid: booking.isPaid ?? false,
    cancelledBy: booking.cancelledBy,
    cancelReason: booking.cancelReason,
    progress: booking.progress,
  };

  return (
    <div
      style={{
        maxWidth: 1080,
        margin: "0 auto",
        padding: isDesktop ? "16px 24px 40px" : "12px 16px 96px",
      }}
    >
      <button
        onClick={() => router.push("/bookings")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "transparent",
          border: 0,
          cursor: "pointer",
          color: "var(--k-text-muted)",
          fontSize: 11,
          padding: "6px 2px",
          marginBottom: 12,
          fontFamily: "var(--k-font-mono)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        <I.arrowLeft size={13} /> Mes réservations
      </button>

      <BookingHero
        booking={heroBooking}
        duration={accordDuration}
        counterparty={counterparty}
        isClient={isClient}
        isDesktop={isDesktop}
        onMessage={onMessage}
      />

      <div style={{ marginTop: 12 }}>
        <StepStrip
          v2Status={v2}
          backendStatus={booking.status}
          isPaid={!!booking.isPaid}
        />
      </div>

      <div
        style={{
          marginTop: 12,
          display: "grid",
          gap: isDesktop ? 18 : 12,
          gridTemplateColumns: isDesktop ? "1fr 300px" : "1fr",
          alignItems: "start",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: isDesktop ? 14 : 12,
          }}
        >
          <AccordCard
            booking={booking}
            offer={activeOffer}
            perspective={perspective}
            isDesktop={isDesktop}
            paidAt={booking.paidAt}
            onCreate={() => setOfferOpen(true)}
            onAdjust={() => setOfferOpen(true)}
            clientFirstName={clientFirstName}
          />
          <AddressRow booking={booking} perspective={perspective} />
        </div>

        {isDesktop && (
          <aside
            style={{
              position: "sticky",
              top: 20,
              alignSelf: "start",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <ActionsCard actions={actions} busy={busy} onAction={onAction} />
            <DetailsCard booking={booking} isClient={isClient} />
          </aside>
        )}
      </div>

      {!isDesktop && (
        <MobileStickyBar actions={actions} busy={busy} onAction={onAction} />
      )}

      {canRecordOffer && providerRecordId && clientUserId && (
        <FinalOfferDialog
          open={offerOpen}
          onOpenChange={setOfferOpen}
          providerId={providerRecordId}
          clientId={clientUserId}
          bookingId={booking.id}
          initialValues={offerInitialValues}
          onSubmit={(data) => createOffer.mutateAsync(data)}
          busy={createOffer.isPending}
          commissionPct={booking.commissionPct ?? 10}
          clientFirstName={clientFirstName}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 9.2: Typecheck**

Run: `pnpm --filter @kayu/web typecheck`
Expected: no errors.

---

## Task 10: Visual verification on the dev server

The web app is the gate here — no test runner, so we verify manually with the dev server.

- [ ] **Step 10.1: Start dev server**

Run: `pnpm --filter @kayu/web dev`
Expected: server up at http://localhost:3000.

- [ ] **Step 10.2: Verify each booking state**

For each state, open `/bookings/[id]` of a real booking matching that state (or use the existing seed data and toggle via the admin / pro dashboard). Check both viewports:

| Viewport | State | What to verify |
|---|---|---|
| Mobile (375 px) | PENDING / client | Amber chip, amber state strip, sticky bar shows ghost-danger "Annuler" + primary "Message à {firstName}". |
| Mobile | PENDING / provider | Amber strip with "Nouvelle demande…", AccordCard empty-provider with primary CTA, sticky bar: secondary "Enregistrer l'accord" + primary "Confirmer la réservation". |
| Mobile | CONFIRMED / client (offer attached) | Green pulse chip, no strip, AccordCard registered-client, no commission block, sticky bar: ghost "Annuler" + primary "Message…". |
| Mobile | CONFIRMED / provider | Same hero, AccordCard registered-provider with commission block + "Ajuster l'accord" link, sticky bar: secondary "Ajuster l'accord" + primary "Marquer comme terminée". |
| Mobile | IN_PROGRESS w/ `progress` | Green pulse "En cours" chip, green state strip with progress copy. |
| Mobile | COMPLETED + paid / client (not reviewed) | Neutral chip, receipt strip "Payé en espèces · …", primary "Laisser un avis". |
| Mobile | COMPLETED + paid / client (reviewed) | Same hero, primary "Réserver à nouveau". |
| Mobile | COMPLETED + unpaid / provider | Amber strip "Paiement à confirmer", primary "Confirmer le paiement reçu". |
| Mobile | CANCELLED | Rose-bordered hero, struck-through date, rose strip with reason + cancelled-by. |
| Desktop (≥ 768 px) | Any state | Hero spans content column with price block right-aligned, 1fr/300 px grid below, sticky right rail with Actions + Détails. No mobile sticky bar visible. |

- [ ] **Step 10.3: Visual sweep — no gradients, no fake artifacts**

Run: `grep -n "linear-gradient\|radial-gradient" apps/web/src/components/bookings/*.tsx`
Expected: no results.

Run: `grep -n "MiniMap\|ChatPreview\|QuoteBreakdown" apps/web/src/components/bookings/*.tsx`
Expected: no results (these are gone).

- [ ] **Step 10.4: Open FinalOfferDialog (provider perspective)**

From a PENDING booking as a provider, tap "Enregistrer l'accord final". Verify:

- Mobile: bottom sheet rises from the bottom with grabber, scrollable, footer sticky.
- Desktop: centred 520 px dialog.
- Duration chips reflect the closest of (1 h / 2 h / ½ jour / Journée).
- Typing a price updates the Résumé block live (total / commission / net).
- Submit creates the offer and the page refetches; the AccordCard flips to registered-provider.
- Reopen via "Ajuster l'accord" — crumb says `· AJUSTEMENT`, header says "Ajuster l'accord", submit label says "Mettre à jour l'accord".

- [ ] **Step 10.5: Run typecheck on the full workspace**

Run: `pnpm --filter @kayu/web typecheck`
Expected: zero errors.

---

## Task 11: Final commit

Per project convention: no per-task commits — one commit at the end that the user reviews as a single diff.

- [ ] **Step 11.1: Inspect the full diff**

Run: `git status && git diff --stat`
Expected: 9 new files in `apps/web/src/components/bookings/`, 2 modified (`BookingDetail.tsx`, `FinalOfferDialog.tsx`).

- [ ] **Step 11.2: Stage and commit**

```bash
git add apps/web/src/components/bookings/
git commit -m "$(cat <<'EOF'
Rebuild booking details page with state-led hero and lifecycle accord

- Replace the BookingDetail monolith with seven focused atoms
  (BookingHero, StepStrip, AccordCard, AddressRow, MobileStickyBar,
  ActionsCard, DetailsCard) plus a shared bookingActions helper.
- Add real mobile breakpoint at 768 px (sticky bottom bar < md;
  1fr/300 px grid with sticky right rail >= md).
- Drop the fake mini-map and chat preview; replace the vertical
  timeline with a slim 4-dot step strip.
- Make the Accord card lifecycle-aware (empty / registered / locked
  x client / provider), with provider commission + net earnings
  block and a discreet 'Ajuster l'accord' link.
- Redesign FinalOfferDialog: bottom sheet on mobile, centred dialog
  on desktop, duration as chips, live Resume preview.
- Remove all gradient backgrounds (design-direction compliance).
EOF
)"
```

- [ ] **Step 11.3: Verify the commit**

Run: `git log -1 --stat`
Expected: the new commit with 9 files added + 2 modified.

---

## Self-Review Notes

- **Spec coverage:** §1 page composition → Task 9; §2 hero → Task 4; §3 step strip → Task 2; §4 accord (all 6 variants) → Task 5; §5 address row → Task 3; §6 mobile sticky bar → Task 6; §7 desktop rail (Actions + Détails) → Tasks 6 + 7; §8 FinalOfferDialog → Task 8; §9 atoms / icon mapping → addressed inline; §10 mobile vs desktop breakpoints → Task 9 (grid + `useIsDesktop`); §11 state matrix → Task 1; §12 edge cases → handled in Tasks 3 (no address), 4 (no scheduledDate, missing verified, cancelledBy/reason), 5 (cancelled-no-offer, no description), 8 (validation), 9 (no provider data); §13 acceptance criteria → Task 10.2 covers each row.
- **No placeholders:** every code step shows complete code; every verification step has the exact command + expected output.
- **Type consistency:** `BookingAction.id` enum is declared once in `bookingActions.ts` and consumed by `MobileStickyBar`, `ActionsCard`, and `BookingDetail`'s `onAction` switch. `BookingDetailData` keeps the same field names as the existing version (the orchestrator is the only consumer that talks to the API). `HeroBooking` / `AccordBooking` / `DetailsBooking` are tightly-scoped structural subtypes the orchestrator passes down — TypeScript's structural typing will accept the full `BookingDetailData` for each.
- **No per-task commits:** intentionally omitted per project memory; one commit at the end (Task 11).
