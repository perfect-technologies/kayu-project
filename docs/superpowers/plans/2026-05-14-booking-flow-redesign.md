# Booking Flow Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/book/[providerId]` as a 4-step flow (Service · Date · Adresse · Récap) wired to real provider availability, with a category-aware task taxonomy and a structured Kinshasa address picker. Both mobile (375 px) and desktop (≥768 px) layouts are first-class.

**Architecture:**
- Backend: 1 Prisma migration (2 nullable columns on `Booking`), 1 new availability endpoint on the `providers` module, 1 new recent-addresses endpoint on the `identity` module, slot-conflict check added to `bookings.service#create`. All backend logic TDD'd via `node:test` + hand-rolled Prisma fakes (existing convention).
- Shared: 2 new constants (`SUBCATEGORY_TASKS`, `KIN_COMMUNES`) in `packages/schemas`, extended `CreateBookingDto`, new availability + recent-addresses Zod schemas. Typed client wrappers added in `packages/api`.
- Frontend: complete rewrite of `apps/web/src/app/book/[providerId]/BookingFlowClient.tsx` into a reducer-driven shell with 4 step components, a `SidebarRail` for desktop, a `MobileStickyBar` for mobile, and a reusable `AvailabilityCalendar`. Draft persists to `sessionStorage`. No web unit tests (project has none); rely on TypeScript + manual UAT.

**Tech Stack:** TypeScript · Next.js (App Router) · NestJS · Prisma · Postgres · Zod · TanStack Query · Tailwind · Lucide.

**Spec:** `docs/superpowers/specs/2026-05-14-booking-flow-redesign-design.md` (commit `b428581`).

**User instruction (memory):** No per-task commits. Implement everything end-to-end, then a single commit at the very end. The spec was its own commit; the implementation will be its own commit. **Skip the "commit step" inside each task.** A final commit task is defined at the bottom (Task 22).

---

## File Structure

### New files

| Path | Responsibility |
|---|---|
| `packages/schemas/src/tasks.ts` | `SUBCATEGORY_TASKS` map + `CUSTOM_TASK_KEY` + `getTasksForSubcategory()`. |
| `packages/schemas/src/communes.ts` | `KIN_COMMUNES` tuple + `KIN_COMMUNES_TUPLE` for Zod enums. |
| `apps/backend/prisma/migrations/<timestamp>_booking_subcategory_commune/migration.sql` | DDL for the 2 new columns + index. |
| `apps/backend/src/modules/providers/providers-availability.service.ts` | Availability computation. |
| `apps/backend/src/modules/providers/providers-availability.service.spec.ts` | Unit tests for availability logic. |
| `apps/backend/src/modules/identity/recent-addresses.service.ts` | Read recent unique addresses for current client. |
| `apps/backend/src/modules/identity/recent-addresses.service.spec.ts` | Unit tests for recent-addresses parsing. |
| `apps/web/src/components/booking/BookingShell.tsx` | Shell: top bar + stepper + grid + mobile sticky bar. |
| `apps/web/src/components/booking/BookingStepper.tsx` | Progress strip. |
| `apps/web/src/components/booking/MobileStickyBar.tsx` | Bottom CTA bar (mobile). |
| `apps/web/src/components/booking/SidebarRail.tsx` | Sticky right rail (desktop). |
| `apps/web/src/components/booking/AvailabilityCalendar.tsx` | Month-view calendar with availability dots. |
| `apps/web/src/components/booking/RecapCard.tsx` | Generic recap card with edit link. |
| `apps/web/src/components/booking/Step1Service.tsx` | Subcategory + task + duration + description. |
| `apps/web/src/components/booking/Step2DateTime.tsx` | Calendar + period filter + slots. |
| `apps/web/src/components/booking/Step3Address.tsx` | City pill + recents + commune + street + repère. |
| `apps/web/src/components/booking/Step4Recap.tsx` | Recap cards + price card + terms. |
| `apps/web/src/components/booking/booking-state.ts` | `BookingDraft` type + reducer + `useBookingDraft` hook (with `sessionStorage`). |

### Modified files

| Path | Change |
|---|---|
| `apps/backend/prisma/schema.prisma` | Add `subcategoryId` (FK) + `commune` (string?) on `Booking`; add inverse relation on `Subcategory`. |
| `packages/schemas/src/dto.ts` | Extend `CreateBookingDto` with `subcategoryId?` + `commune?`. |
| `packages/schemas/src/index.ts` | Export new files. |
| `apps/backend/src/modules/bookings/bookings.service.ts` | Persist new fields; add slot-conflict check. |
| `apps/backend/src/modules/bookings/bookings.service.spec.ts` | Test slot-conflict path. |
| `apps/backend/src/modules/providers/providers.controller.ts` | Add `GET /providers/:id/availability` route. |
| `apps/backend/src/modules/providers/providers.module.ts` | Register `ProvidersAvailabilityService`. |
| `apps/backend/src/modules/identity/identity.controller.ts` | Add `GET /me/recent-addresses` route. |
| `apps/backend/src/modules/identity/identity.module.ts` | Register `RecentAddressesService`. |
| `packages/api/src/endpoints.ts` | Add `availability` on providers, `recentAddresses` on identity. |
| `apps/web/src/app/book/[providerId]/BookingFlowClient.tsx` | Full rewrite. Becomes a thin orchestrator over the new components. |

### Deleted files

| Path | Reason |
|---|---|
| (none) | Existing `apps/web/src/components/booking/BookingCalendar.tsx` is the **provider's** dashboard schedule view — keep, untouched. |

---

## Phase A — Shared schemas & constants

### Task 1: Add `SUBCATEGORY_TASKS` constant

**Files:**
- Create: `packages/schemas/src/tasks.ts`
- Modify: `packages/schemas/src/index.ts`

- [ ] **Step 1: Create the tasks file**

Create `packages/schemas/src/tasks.ts`:

```ts
export const SUBCATEGORY_TASKS: Record<string, readonly string[]> = {
  "maconnerie":              ["Travaux neufs", "Réparation", "Rénovation", "Devis sur place"],
  "platrerie":               ["Pose", "Réparation", "Devis sur place"],
  "carrelage":               ["Pose", "Réparation", "Devis sur place"],
  "peinture":                ["Intérieur", "Extérieur", "Retouche", "Devis sur place"],
  "toiture":                 ["Réparation urgente", "Étanchéité", "Inspection", "Refonte"],
  "plomberie-generale":      ["Dépannage urgent", "Installation", "Diagnostic", "Devis"],
  "sanitaires":              ["Pose WC / lavabo", "Réparation fuite", "Détartrage", "Devis"],
  "electricite-generale":    ["Dépannage urgent", "Installation", "Diagnostic", "Mise aux normes"],
  "electricite-automobile":  ["Diagnostic", "Réparation", "Pose accessoires"],
  "climatisation":           ["Installation", "Entretien", "Réparation", "Recharge gaz"],
  "menuiserie-bois":         ["Sur mesure", "Pose porte / fenêtre", "Réparation", "Devis"],
  "menuiserie-aluminium":    ["Pose porte / fenêtre", "Réparation", "Devis"],
  "agencement":              ["Cuisine", "Dressing", "Bureau", "Devis"],
  "serrurerie":              ["Dépannage urgent", "Changement serrure", "Pose blindage", "Devis"],
  "metallerie":              ["Portail / grille", "Réparation", "Sur mesure", "Devis"],
  "mecanique-auto":          ["Vidange", "Diagnostic", "Réparation", "Révision"],
  "carrosserie":             ["Bosse / rayure", "Peinture", "Devis"],
  "pneumatiques":            ["Changement", "Équilibrage", "Réparation crevaison"],
  "coiffure":                ["Coupe", "Tresses", "Coloration", "Soin"],
  "esthetique":              ["Manucure", "Pédicure", "Soin visage", "Maquillage"],
  "bien-etre":               ["Massage", "Spa"],
  "couture":                 ["Sur mesure", "Retouches", "Réparation"],
  "nettoyage-textile":       ["Lavage", "Pressing", "Détachage"],
  "nettoyage":               ["Ménage standard", "Grand nettoyage", "Vitres", "Après chantier"],
  "jardinage":               ["Tonte", "Taille", "Entretien régulier", "Aménagement"],
  "demenagement":            ["Petit volume", "Grand volume", "Démontage / montage"],
  "garde-enfants":           ["Ponctuel", "Régulier", "Soir / week-end"],
  "education":               ["Soutien scolaire", "Cours particuliers", "Aide aux devoirs"],
  "soins-domicile":          ["Soin infirmier", "Visite médicale", "Suivi régulier"],
  "sport":                   ["Coaching personnel", "Programme régulier", "Cours d'essai"],
  "developpement":           ["Site web", "Application", "Maintenance", "Devis"],
  "support-informatique":    ["Dépannage urgent", "Installation", "Formation"],
  "reseaux":                 ["Installation", "Dépannage", "Diagnostic"],
  "transport-personnes":     ["Course unique", "Aller-retour", "Trajet long"],
  "livraison":               ["Course express", "Standard", "Volumineux"],
  "organisation-evenements": ["Mariage", "Anniversaire", "Événement pro"],
  "animation":               ["DJ", "MC", "Spectacle"],
  "traiteur":                ["Cocktail", "Buffet", "Service complet"],
  "gardiennage":             ["Ponctuel", "Régulier", "Événement"],
  "protection":              ["Garde rapprochée", "Surveillance", "Conseil"],
};

export const CUSTOM_TASK_KEY = "__custom__";

export function getTasksForSubcategory(slug: string): readonly string[] {
  return SUBCATEGORY_TASKS[slug] ?? [];
}
```

- [ ] **Step 2: Re-export from index**

Open `packages/schemas/src/index.ts` and add a line:

```ts
export * from "./tasks";
```

(Place it next to the other `export * from` lines, alphabetically.)

- [ ] **Step 3: Type-check the package**

Run from `packages/schemas/`: `pnpm tsc --noEmit`
Expected: zero errors.

---

### Task 2: Add `KIN_COMMUNES` constant

**Files:**
- Create: `packages/schemas/src/communes.ts`
- Modify: `packages/schemas/src/index.ts`

- [ ] **Step 1: Create the communes file**

Create `packages/schemas/src/communes.ts`:

```ts
export const KIN_COMMUNES = [
  "Bandalungwa",
  "Barumbu",
  "Bumbu",
  "Gombe",
  "Kalamu",
  "Kasa-Vungu",
  "Kimbanseke",
  "Kinshasa",
  "Kintambo",
  "Kisenso",
  "Lemba",
  "Limete",
  "Lingwala",
  "Makala",
  "Maluku",
  "Masina",
  "Matete",
  "Mont Ngafula",
  "Ndjili",
  "Ngaba",
  "Ngaliema",
  "Ngiri-Ngiri",
  "Nsele",
  "Selembao",
] as const;

export type KinCommune = (typeof KIN_COMMUNES)[number];

// Tuple form for Zod's z.enum() which wants a non-empty string-tuple
export const KIN_COMMUNES_TUPLE = KIN_COMMUNES as unknown as [string, ...string[]];
```

- [ ] **Step 2: Re-export from index**

Add to `packages/schemas/src/index.ts`:

```ts
export * from "./communes";
```

- [ ] **Step 3: Type-check the package**

Run from `packages/schemas/`: `pnpm tsc --noEmit`
Expected: zero errors.

---

### Task 3: Extend `CreateBookingDto` and add new DTOs

**Files:**
- Modify: `packages/schemas/src/dto.ts`

- [ ] **Step 1: Add the imports at the top of dto.ts**

Open `packages/schemas/src/dto.ts`. Just below the existing top-of-file `import { z } from "zod"` (and any sibling imports), add:

```ts
import { KIN_COMMUNES_TUPLE } from "./communes";
```

- [ ] **Step 2: Extend `CreateBookingDto`**

Find the existing `export const CreateBookingDto = z.object({ ... });` block. Add two optional fields just before the closing brace:

```ts
  subcategoryId: IdSchema.optional(),
  commune: z.enum(KIN_COMMUNES_TUPLE).optional(),
```

The full block should now read:

```ts
export const CreateBookingDto = z.object({
  providerId: IdSchema,
  title: z.string().min(1),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  scheduledDate: z.coerce.date(),
  duration: z.number().int().positive().optional(),
  price: z.number().min(0).optional(),
  clientNotes: z.string().optional(),
  subcategoryId: IdSchema.optional(),
  commune: z.enum(KIN_COMMUNES_TUPLE).optional(),
});
```

- [ ] **Step 3: Add `AvailabilityQuery` and `AvailabilityResponse`**

Add at the end of `packages/schemas/src/dto.ts`:

```ts
export const AvailabilityQuery = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "from must be YYYY-MM-DD"),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "to must be YYYY-MM-DD"),
});

export const AvailabilityDay = z.object({
  date: z.string(),
  status: z.enum(["available", "off", "full", "past"]),
  slots: z.array(z.string()),
});

export const AvailabilityResponse = z.object({
  days: z.array(AvailabilityDay),
  workWindow: z.object({ start: z.string(), end: z.string() }).nullable(),
});

export const RecentAddressItem = z.object({
  commune: z.string().nullable(),
  street: z.string().nullable(),
  raw: z.string(),
  lastUsedAt: z.string(),
});

export const RecentAddressesResponse = z.array(RecentAddressItem);
```

- [ ] **Step 4: Type-check**

Run from `packages/schemas/`: `pnpm tsc --noEmit`
Expected: zero errors.

---

## Phase B — Backend

### Task 4: Prisma migration — add columns to `Booking`

**Files:**
- Modify: `apps/backend/prisma/schema.prisma`
- Create: `apps/backend/prisma/migrations/<timestamp>_booking_subcategory_commune/migration.sql` (auto-generated)

- [ ] **Step 1: Edit the schema**

Open `apps/backend/prisma/schema.prisma`. Find `model Booking { ... }`. Inside the `// Détails` group (where `address`, `city`, `scheduledDate`, etc. live), add two fields:

```prisma
  subcategoryId  String?
  subcategory    Subcategory? @relation(fields: [subcategoryId], references: [id])
  commune        String?
```

Then in the indexes block at the bottom of `Booking`, add:

```prisma
  @@index([subcategoryId])
```

- [ ] **Step 2: Add inverse relation on `Subcategory`**

Find `model Subcategory { ... }`. In its relations group (alongside `providers` and `jobRequests`), add:

```prisma
  bookings    Booking[]
```

- [ ] **Step 3: Generate the migration**

Run from `apps/backend/`:

```bash
pnpm prisma migrate dev --name booking_subcategory_commune
```

Expected: a new migration folder is created with a SQL file adding the two columns and the index. Prisma client regenerates.

- [ ] **Step 4: Verify the SQL**

Open the new file under `apps/backend/prisma/migrations/<timestamp>_booking_subcategory_commune/migration.sql` and confirm it contains:

```sql
ALTER TABLE "Booking" ADD COLUMN "subcategoryId" TEXT;
ALTER TABLE "Booking" ADD COLUMN "commune" TEXT;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_subcategoryId_fkey"
  FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Booking_subcategoryId_idx" ON "Booking"("subcategoryId");
```

(Order or wording may differ slightly; what matters is that both columns + the FK + the index exist.)

---

### Task 5: TDD `ProvidersAvailabilityService.computeRange` (off / past / available basics)

**Files:**
- Create: `apps/backend/src/modules/providers/providers-availability.service.ts`
- Create: `apps/backend/src/modules/providers/providers-availability.service.spec.ts`

- [ ] **Step 1: Write the first failing tests**

Create `apps/backend/src/modules/providers/providers-availability.service.spec.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { ProvidersAvailabilityService } from "./providers-availability.service";

const PROVIDER_ID = "prov_1";

function makePrismaFake(opts: {
  schedules?: Array<{ dayOfWeek: number; startTime: string; endTime: string; isAvailable: boolean }>;
  exceptions?: Array<{ date: Date; isAvailable: boolean }>;
  bookings?: Array<{ scheduledDate: Date; duration: number | null; status: string }>;
} = {}) {
  return {
    availabilitySchedule: {
      findMany: async () => opts.schedules ?? [],
    },
    availabilityException: {
      findMany: async () => opts.exceptions ?? [],
    },
    booking: {
      findMany: async () => opts.bookings ?? [],
    },
  } as unknown as ConstructorParameters<typeof ProvidersAvailabilityService>[0];
}

test("days outside the weekly schedule are 'off'", async () => {
  // Provider works only Monday (dayOfWeek=1)
  const prisma = makePrismaFake({
    schedules: [{ dayOfWeek: 1, startTime: "08:00", endTime: "18:00", isAvailable: true }],
  });
  const service = new ProvidersAvailabilityService(prisma);
  const now = new Date("2026-05-20T08:00:00Z"); // Wednesday
  const result = await service.computeRange(PROVIDER_ID, "2026-05-21", "2026-05-22", now);

  // 2026-05-21 is Thursday — off; 2026-05-22 is Friday — off.
  assert.equal(result.days.length, 2);
  assert.equal(result.days[0].status, "off");
  assert.equal(result.days[1].status, "off");
});

test("past days are 'past'", async () => {
  const prisma = makePrismaFake({
    schedules: [{ dayOfWeek: 0, startTime: "08:00", endTime: "18:00", isAvailable: true },
                { dayOfWeek: 1, startTime: "08:00", endTime: "18:00", isAvailable: true },
                { dayOfWeek: 2, startTime: "08:00", endTime: "18:00", isAvailable: true },
                { dayOfWeek: 3, startTime: "08:00", endTime: "18:00", isAvailable: true },
                { dayOfWeek: 4, startTime: "08:00", endTime: "18:00", isAvailable: true },
                { dayOfWeek: 5, startTime: "08:00", endTime: "18:00", isAvailable: true },
                { dayOfWeek: 6, startTime: "08:00", endTime: "18:00", isAvailable: true }],
  });
  const service = new ProvidersAvailabilityService(prisma);
  const now = new Date("2026-05-22T10:00:00Z");
  const result = await service.computeRange(PROVIDER_ID, "2026-05-20", "2026-05-21", now);

  assert.equal(result.days[0].status, "past");
  assert.equal(result.days[1].status, "past");
});

test("an open weekday produces 1-hour slots covering the schedule window", async () => {
  const prisma = makePrismaFake({
    schedules: [{ dayOfWeek: 4, startTime: "08:00", endTime: "11:00", isAvailable: true }], // Thursday
  });
  const service = new ProvidersAvailabilityService(prisma);
  const now = new Date("2026-05-20T07:00:00Z");
  const result = await service.computeRange(PROVIDER_ID, "2026-05-21", "2026-05-21", now);

  assert.equal(result.days[0].status, "available");
  assert.deepEqual(result.days[0].slots, ["08:00", "09:00", "10:00"]);
  assert.deepEqual(result.workWindow, { start: "08:00", end: "11:00" });
});
```

- [ ] **Step 2: Run the test — expect failure**

Run from `apps/backend/`:

```bash
node --test -r ts-node/register src/modules/providers/providers-availability.service.spec.ts
```

Expected: failure ("Cannot find module './providers-availability.service'").

- [ ] **Step 3: Implement the service skeleton**

Create `apps/backend/src/modules/providers/providers-availability.service.ts`:

```ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

type AvailabilityDayStatus = "available" | "off" | "full" | "past";

export interface AvailabilityDay {
  date: string;
  status: AvailabilityDayStatus;
  slots: string[];
}

export interface AvailabilityRangeResult {
  days: AvailabilityDay[];
  workWindow: { start: string; end: string } | null;
}

const SLOT_MINUTES = 60;

function ymd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function eachDay(fromYmd: string, toYmd: string): Date[] {
  const out: Date[] = [];
  const start = new Date(`${fromYmd}T00:00:00Z`);
  const end = new Date(`${toYmd}T00:00:00Z`);
  for (let d = new Date(start); d <= end; d = new Date(d.getTime() + 86400000)) {
    out.push(new Date(d));
  }
  return out;
}

function parseHHMM(s: string): { h: number; m: number } {
  const [hh, mm] = s.split(":").map(Number);
  return { h: hh, m: mm };
}

function generateSlots(start: string, end: string): string[] {
  const a = parseHHMM(start);
  const b = parseHHMM(end);
  const startMin = a.h * 60 + a.m;
  const endMin = b.h * 60 + b.m;
  const slots: string[] = [];
  for (let t = startMin; t + SLOT_MINUTES <= endMin; t += SLOT_MINUTES) {
    slots.push(`${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`);
  }
  return slots;
}

@Injectable()
export class ProvidersAvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async computeRange(
    providerId: string,
    fromYmd: string,
    toYmd: string,
    now: Date = new Date(),
  ): Promise<AvailabilityRangeResult> {
    const [schedules, exceptions, bookings] = await Promise.all([
      this.prisma.availabilitySchedule.findMany({ where: { providerId } }),
      this.prisma.availabilityException.findMany({
        where: { providerId, date: { gte: new Date(`${fromYmd}T00:00:00Z`), lte: new Date(`${toYmd}T23:59:59Z`) } },
      }),
      this.prisma.booking.findMany({
        where: {
          providerId,
          status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
          scheduledDate: { gte: new Date(`${fromYmd}T00:00:00Z`), lte: new Date(`${toYmd}T23:59:59Z`) },
        },
        select: { scheduledDate: true, duration: true },
      }),
    ]);

    const scheduleByDow = new Map<number, { startTime: string; endTime: string; isAvailable: boolean }>();
    for (const s of schedules) scheduleByDow.set(s.dayOfWeek, s);

    const exceptionByDate = new Map<string, boolean>();
    for (const e of exceptions) exceptionByDate.set(ymd(e.date), e.isAvailable);

    const today = ymd(now);

    const days: AvailabilityDay[] = eachDay(fromYmd, toYmd).map((d) => {
      const dateStr = ymd(d);

      if (dateStr < today) {
        return { date: dateStr, status: "past", slots: [] };
      }

      const dow = d.getUTCDay();
      const sched = scheduleByDow.get(dow);
      if (!sched || !sched.isAvailable) {
        return { date: dateStr, status: "off", slots: [] };
      }

      const exception = exceptionByDate.get(dateStr);
      if (exception === false) {
        return { date: dateStr, status: "off", slots: [] };
      }

      let slots = generateSlots(sched.startTime, sched.endTime);

      // Drop today's past hours
      if (dateStr === today) {
        const cutoff = now.getUTCHours() * 60 + now.getUTCMinutes();
        slots = slots.filter((slot) => {
          const { h, m } = parseHHMM(slot);
          return h * 60 + m >= cutoff;
        });
      }

      // Drop slots that overlap any existing booking for this date
      const dayBookings = bookings.filter((b) => ymd(b.scheduledDate) === dateStr);
      slots = slots.filter((slot) => {
        const { h, m } = parseHHMM(slot);
        const slotStartMin = h * 60 + m;
        const slotEndMin = slotStartMin + SLOT_MINUTES;
        for (const b of dayBookings) {
          const bStart = b.scheduledDate.getUTCHours() * 60 + b.scheduledDate.getUTCMinutes();
          const bEnd = bStart + (b.duration ?? 60);
          if (slotStartMin < bEnd && slotEndMin > bStart) return false;
        }
        return true;
      });

      return {
        date: dateStr,
        status: slots.length > 0 ? "available" : "full",
        slots,
      };
    });

    const anySchedule = schedules[0];
    const workWindow = anySchedule ? { start: anySchedule.startTime, end: anySchedule.endTime } : null;

    return { days, workWindow };
  }
}
```

- [ ] **Step 4: Run the tests — expect pass**

```bash
node --test -r ts-node/register src/modules/providers/providers-availability.service.spec.ts
```

Expected: 3 tests pass.

---

### Task 6: TDD slot filtering (exceptions, today's past hours, booking overlaps, "full" status)

**Files:**
- Modify: `apps/backend/src/modules/providers/providers-availability.service.spec.ts`

- [ ] **Step 1: Add four more tests at the bottom of the spec**

```ts
test("an exception with isAvailable=false overrides the schedule", async () => {
  const prisma = makePrismaFake({
    schedules: [{ dayOfWeek: 4, startTime: "08:00", endTime: "11:00", isAvailable: true }],
    exceptions: [{ date: new Date("2026-05-21T00:00:00Z"), isAvailable: false }],
  });
  const service = new ProvidersAvailabilityService(prisma);
  const now = new Date("2026-05-20T07:00:00Z");
  const result = await service.computeRange(PROVIDER_ID, "2026-05-21", "2026-05-21", now);

  assert.equal(result.days[0].status, "off");
  assert.deepEqual(result.days[0].slots, []);
});

test("today drops slots whose hour has already passed", async () => {
  const prisma = makePrismaFake({
    schedules: [{ dayOfWeek: 4, startTime: "08:00", endTime: "12:00", isAvailable: true }],
  });
  const service = new ProvidersAvailabilityService(prisma);
  const now = new Date("2026-05-21T10:30:00Z"); // Thursday 10:30
  const result = await service.computeRange(PROVIDER_ID, "2026-05-21", "2026-05-21", now);

  assert.equal(result.days[0].status, "available");
  assert.deepEqual(result.days[0].slots, ["11:00"]);
});

test("an existing booking blocks overlapping slots", async () => {
  const prisma = makePrismaFake({
    schedules: [{ dayOfWeek: 4, startTime: "08:00", endTime: "12:00", isAvailable: true }],
    bookings: [{
      scheduledDate: new Date("2026-05-21T09:00:00Z"),
      duration: 120, // covers 09:00 – 11:00
      status: "CONFIRMED",
    }],
  });
  const service = new ProvidersAvailabilityService(prisma);
  const now = new Date("2026-05-20T07:00:00Z");
  const result = await service.computeRange(PROVIDER_ID, "2026-05-21", "2026-05-21", now);

  assert.equal(result.days[0].status, "available");
  assert.deepEqual(result.days[0].slots, ["08:00", "11:00"]);
});

test("when every slot is taken the day is 'full'", async () => {
  const prisma = makePrismaFake({
    schedules: [{ dayOfWeek: 4, startTime: "08:00", endTime: "10:00", isAvailable: true }],
    bookings: [
      { scheduledDate: new Date("2026-05-21T08:00:00Z"), duration: 60, status: "PENDING" },
      { scheduledDate: new Date("2026-05-21T09:00:00Z"), duration: 60, status: "CONFIRMED" },
    ],
  });
  const service = new ProvidersAvailabilityService(prisma);
  const now = new Date("2026-05-20T07:00:00Z");
  const result = await service.computeRange(PROVIDER_ID, "2026-05-21", "2026-05-21", now);

  assert.equal(result.days[0].status, "full");
  assert.deepEqual(result.days[0].slots, []);
});
```

- [ ] **Step 2: Run all tests in the spec**

```bash
node --test -r ts-node/register src/modules/providers/providers-availability.service.spec.ts
```

Expected: 7 tests pass (3 from Task 5 + 4 new). The implementation from Task 5 already handles all these cases — if any fails, debug rather than rewriting tests.

---

### Task 7: Wire `ProvidersAvailabilityService` into the providers module + controller

**Files:**
- Modify: `apps/backend/src/modules/providers/providers.module.ts`
- Modify: `apps/backend/src/modules/providers/providers.controller.ts`

- [ ] **Step 1: Register the service in the module**

Open `apps/backend/src/modules/providers/providers.module.ts`. Add to the imports at the top:

```ts
import { ProvidersAvailabilityService } from "./providers-availability.service";
```

Add `ProvidersAvailabilityService` to both the `providers:` array AND the `exports:` array of the `@Module({...})` decorator.

- [ ] **Step 2: Add the controller route**

Open `apps/backend/src/modules/providers/providers.controller.ts`. Add to the imports:

```ts
import { ProvidersAvailabilityService } from "./providers-availability.service";
import { AvailabilityQuery } from "@kayu/schemas";
import { ZodValidationPipe } from "../../common/zod/zod-validation.pipe"; // adjust path to whatever the project uses
```

(If the project doesn't have a `ZodValidationPipe`, look at how an existing controller validates query params and follow the same pattern. Many controllers in this codebase use `body.parse()` inline — fine to do the same here.)

In the controller class, inject the new service in the constructor (alongside any existing injected services) and add the route:

```ts
@Get(":id/availability")
async availability(
  @Param("id") id: string,
  @Query() query: { from?: string; to?: string },
) {
  const parsed = AvailabilityQuery.parse(query);
  return this.availabilityService.computeRange(id, parsed.from, parsed.to);
}
```

If the constructor was `constructor(private readonly providersService: ProvidersService) {}`, change to:

```ts
constructor(
  private readonly providersService: ProvidersService,
  private readonly availabilityService: ProvidersAvailabilityService,
) {}
```

- [ ] **Step 3: Boot the backend and curl the endpoint**

```bash
cd apps/backend && pnpm dev
```

In another shell, find a real provider id from the seed (`pnpm prisma studio` or run a quick `select id from "Provider" limit 1`), then:

```bash
curl "http://localhost:3001/providers/<PROVIDER_ID>/availability?from=2026-05-20&to=2026-05-25"
```

Expected: a JSON `{ days: [...], workWindow: {...} | null }` shape with one entry per day in the range.

---

### Task 8: TDD slot-conflict 409 in `bookings.service.create`

**Files:**
- Modify: `apps/backend/src/modules/bookings/bookings.service.spec.ts`
- Modify: `apps/backend/src/modules/bookings/bookings.service.ts`

- [ ] **Step 1: Add a failing test**

Open `apps/backend/src/modules/bookings/bookings.service.spec.ts`. Add a new test at the bottom that exercises `create()` against a Prisma fake with an overlapping existing booking.

The exact shape of the existing fake setup is `makeBooking(...)` (see top of file). Reuse it. The test should:

1. Construct a service whose `prisma.provider.findUnique` returns `{ id: "prov_1", userId: "user_pro_1", isAvailable: true }`.
2. Make `prisma.booking.findMany` (the new conflict-check query) return a booking at `2026-05-21T09:00:00Z` for 120 min (covers 09:00–11:00).
3. Call `service.create(actor, { providerId: "prov_1", title: "X", scheduledDate: new Date("2026-05-21T10:00:00Z"), duration: 60, ... })`.
4. Assert it throws `ConflictException` with code/message containing `SLOT_TAKEN`.

Reference shape:

```ts
test("create throws ConflictException when a slot conflict exists", async () => {
  const prisma = {
    provider: { findUnique: async () => ({ id: "prov_1", userId: "user_pro_1", isAvailable: true }) },
    booking: { findMany: async () => [{ scheduledDate: new Date("2026-05-21T09:00:00Z"), duration: 120 }] },
    $transaction: async (fn: (tx: typeof prisma) => unknown) => fn(prisma),
  };
  const notifications = { create: async () => undefined };
  const service = new BookingsService(prisma as any, notifications as any);

  const actor = makeActor({ id: "client_1", role: "CLIENT" });

  await assert.rejects(
    () => service.create(actor, {
      providerId: "prov_1",
      title: "Coupe",
      scheduledDate: new Date("2026-05-21T10:00:00Z"),
      duration: 60,
      price: 0,
    } as any),
    (err: any) => err?.constructor?.name === "ConflictException" && /SLOT_TAKEN/.test(err.message),
  );
});
```

(Adjust the `BookingsService` constructor args to match the real signature — peek at the top of `bookings.service.ts` to see what it actually takes.)

- [ ] **Step 2: Run — expect failure**

```bash
node --test -r ts-node/register src/modules/bookings/bookings.service.spec.ts
```

Expected: the new test fails (no conflict check exists yet → booking is created instead of throwing).

- [ ] **Step 3: Add the conflict check in the service**

Open `apps/backend/src/modules/bookings/bookings.service.ts`. Find the `create()` method (currently around line 231). Add this block right after the existing `if (!provider.isAvailable) { throw ... }` and BEFORE the `prisma.$transaction(...)` call:

```ts
const slotStart = body.scheduledDate;
const slotDuration = body.duration ?? 60;
const slotEnd = new Date(slotStart.getTime() + slotDuration * 60_000);

// Look at neighbouring bookings for this provider on that calendar day
const dayStart = new Date(slotStart);
dayStart.setUTCHours(0, 0, 0, 0);
const dayEnd = new Date(dayStart);
dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

const sameDay = await this.prisma.booking.findMany({
  where: {
    providerId: body.providerId,
    status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
    scheduledDate: { gte: dayStart, lt: dayEnd },
  },
  select: { scheduledDate: true, duration: true },
});

const conflict = sameDay.some((b) => {
  const bStart = b.scheduledDate.getTime();
  const bEnd = bStart + ((b.duration ?? 60) * 60_000);
  return slotStart.getTime() < bEnd && slotEnd.getTime() > bStart;
});

if (conflict) {
  throw new ConflictException("SLOT_TAKEN: this slot is no longer available");
}
```

Add `ConflictException` to the existing `@nestjs/common` import at the top of the file:

```ts
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
```

- [ ] **Step 4: Persist the new optional fields**

Still in `bookings.service.ts#create`, find the `tx.booking.create({ data: { ... } })` call. Add two more entries to the `data` object:

```ts
subcategoryId: body.subcategoryId ?? null,
commune: body.commune ?? null,
```

- [ ] **Step 5: Re-run tests — expect pass**

```bash
node --test -r ts-node/register src/modules/bookings/bookings.service.spec.ts
```

Expected: all tests pass, including the new conflict test.

---

### Task 9: TDD `RecentAddressesService.findForClient`

**Files:**
- Create: `apps/backend/src/modules/identity/recent-addresses.service.ts`
- Create: `apps/backend/src/modules/identity/recent-addresses.service.spec.ts`
- Modify: `apps/backend/src/modules/identity/identity.module.ts`
- Modify: `apps/backend/src/modules/identity/identity.controller.ts`

- [ ] **Step 1: Write the failing tests**

Create `apps/backend/src/modules/identity/recent-addresses.service.spec.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { RecentAddressesService } from "./recent-addresses.service";

function fake(rows: Array<{ address: string | null; commune: string | null; createdAt: Date }>) {
  return {
    booking: {
      findMany: async () => rows.map((r, i) => ({ id: `b_${i}`, ...r })),
    },
  } as unknown as ConstructorParameters<typeof RecentAddressesService>[0];
}

test("returns latest unique addresses, parsed", async () => {
  const prisma = fake([
    { address: "Av. de la Justice n° 42, Gombe, Kinshasa", commune: "Gombe", createdAt: new Date("2026-05-10") },
    { address: "Av. de la Justice n° 42, Gombe, Kinshasa", commune: "Gombe", createdAt: new Date("2026-05-12") }, // dup, newer
    { address: "Bd Lumumba 12, Limete, Kinshasa", commune: "Limete", createdAt: new Date("2026-05-11") },
  ]);
  const service = new RecentAddressesService(prisma);
  const out = await service.findForClient("client_1", 3);

  assert.equal(out.length, 2);
  // Newest first
  assert.equal(out[0].commune, "Gombe");
  assert.equal(out[0].street, "Av. de la Justice n° 42");
  assert.equal(out[0].lastUsedAt, new Date("2026-05-12").toISOString());
  assert.equal(out[1].commune, "Limete");
  assert.equal(out[1].street, "Bd Lumumba 12");
});

test("respects the limit", async () => {
  const prisma = fake([
    { address: "A, Gombe, Kinshasa", commune: "Gombe", createdAt: new Date("2026-05-10") },
    { address: "B, Limete, Kinshasa", commune: "Limete", createdAt: new Date("2026-05-11") },
    { address: "C, Lemba, Kinshasa", commune: "Lemba", createdAt: new Date("2026-05-12") },
    { address: "D, Masina, Kinshasa", commune: "Masina", createdAt: new Date("2026-05-13") },
  ]);
  const service = new RecentAddressesService(prisma);
  const out = await service.findForClient("client_1", 2);
  assert.equal(out.length, 2);
});

test("falls back to raw when commune column is null and address is unparseable", async () => {
  const prisma = fake([
    { address: "near the big mango tree", commune: null, createdAt: new Date("2026-05-10") },
  ]);
  const service = new RecentAddressesService(prisma);
  const out = await service.findForClient("client_1", 3);
  assert.equal(out[0].street, null);
  assert.equal(out[0].commune, null);
  assert.equal(out[0].raw, "near the big mango tree");
});
```

- [ ] **Step 2: Run — expect failure**

```bash
node --test -r ts-node/register src/modules/identity/recent-addresses.service.spec.ts
```

Expected: failure ("Cannot find module './recent-addresses.service'").

- [ ] **Step 3: Implement the service**

Create `apps/backend/src/modules/identity/recent-addresses.service.ts`:

```ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

export interface RecentAddressItem {
  commune: string | null;
  street: string | null;
  raw: string;
  lastUsedAt: string;
}

function parseStreet(raw: string, commune: string | null): string | null {
  if (!raw) return null;
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  // Drop trailing "Kinshasa" and the commune segment if present
  const filtered = parts.filter((p) => p.toLowerCase() !== "kinshasa" && p.toLowerCase() !== (commune ?? "").toLowerCase());
  return filtered.length > 0 ? filtered.join(", ") : null;
}

@Injectable()
export class RecentAddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async findForClient(clientId: string, limit: number): Promise<RecentAddressItem[]> {
    const rows = await this.prisma.booking.findMany({
      where: { clientId, address: { not: null } },
      select: { address: true, commune: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    const seen = new Set<string>();
    const out: RecentAddressItem[] = [];
    for (const r of rows) {
      if (out.length >= limit) break;
      const raw = (r.address ?? "").trim();
      if (!raw) continue;
      const dedupKey = `${raw}|${r.commune ?? ""}`;
      if (seen.has(dedupKey)) continue;
      seen.add(dedupKey);
      out.push({
        commune: r.commune ?? null,
        street: parseStreet(raw, r.commune),
        raw,
        lastUsedAt: r.createdAt.toISOString(),
      });
    }
    return out;
  }
}
```

- [ ] **Step 4: Re-run — expect pass**

```bash
node --test -r ts-node/register src/modules/identity/recent-addresses.service.spec.ts
```

Expected: 3 tests pass.

- [ ] **Step 5: Wire into the identity module**

Open `apps/backend/src/modules/identity/identity.module.ts`. Add to imports:

```ts
import { RecentAddressesService } from "./recent-addresses.service";
```

Add `RecentAddressesService` to the `providers:` and `exports:` arrays of `@Module({...})`.

- [ ] **Step 6: Add the controller route**

Open `apps/backend/src/modules/identity/identity.controller.ts`. Add the import:

```ts
import { RecentAddressesService } from "./recent-addresses.service";
```

Inject in the constructor (alongside any existing injected services):

```ts
constructor(
  private readonly identityService: IdentityService,
  private readonly recentAddresses: RecentAddressesService,
  // ...any existing injections
) {}
```

Add the route — use whatever auth decorator the rest of the controller uses (`@CurrentActor()` is the project's pattern; check the file's existing methods if you're unsure):

```ts
@Get("me/recent-addresses")
async getRecentAddresses(
  @CurrentActor() actor: Actor,
  @Query("limit") limitStr?: string,
) {
  const limit = Math.min(Math.max(Number(limitStr) || 3, 1), 10);
  return this.recentAddresses.findForClient(actor.id, limit);
}
```

(If the existing controller mounts at `/identity`, the route becomes `/identity/me/recent-addresses` — that's acceptable. The frontend just hits whatever URL the typed client wraps.)

- [ ] **Step 7: Smoke-test via curl**

```bash
curl -H "Authorization: Bearer <a-client-token>" "http://localhost:3001/identity/me/recent-addresses?limit=3"
```

(Adjust path prefix to match what the controller actually mounts as.)

Expected: `[]` for a fresh client, or an array of objects matching the Zod `RecentAddressItem` shape for a client with prior bookings.

---

## Phase C — API client

### Task 10: Add typed wrappers in `packages/api`

**Files:**
- Modify: `packages/api/src/endpoints.ts`

- [ ] **Step 1: Find the `providersApi` factory**

Open `packages/api/src/endpoints.ts`. Locate the `providersApi(client)` factory function (returns `{ list, getById, ... }`).

- [ ] **Step 2: Add an `availability` method**

Inside the returned object, add:

```ts
availability: (id: string, params: { from: string; to: string }) =>
  client.get<import("@kayu/schemas").AvailabilityResponseType>(
    `/providers/${encodeURIComponent(id)}/availability`,
    { params },
  ),
```

(If the file uses inferred Zod types via `z.infer`, follow that pattern instead of importing the raw type. Look at how nearby endpoints do it.)

- [ ] **Step 3: Find or create an `identityApi` factory**

In the same file, find the factory that hits identity routes (it might be called `usersApi`, `meApi`, or `identityApi` — search for `/me` or `/identity`). If none exists, follow the established factory pattern and add:

```ts
recentAddresses: (params: { limit?: number } = {}) =>
  client.get<import("@kayu/schemas").RecentAddressItemType[]>(
    "/identity/me/recent-addresses",
    { params },
  ),
```

(Adjust the URL prefix to match the actual mount point used by the identity controller.)

- [ ] **Step 4: Type-check**

Run from `packages/api/`: `pnpm tsc --noEmit`
Expected: zero errors.

---

## Phase D — Frontend foundation

> **Note on tests:** the web app has no test infra. Verification for frontend tasks is **TypeScript clean (`pnpm --filter web typecheck` or equivalent) + visual UAT in the dev server**. Each task ends with "boot dev, eyeball the change."

### Task 11: Create `BookingShell`, `BookingStepper`, `MobileStickyBar`

**Files:**
- Create: `apps/web/src/components/booking/BookingShell.tsx`
- Create: `apps/web/src/components/booking/BookingStepper.tsx`
- Create: `apps/web/src/components/booking/MobileStickyBar.tsx`

- [ ] **Step 1: Create `BookingStepper.tsx`**

```tsx
"use client";

import { ReactNode } from "react";

interface Step { label: string; shortLabel?: string; }
interface Props {
  steps: Step[];
  current: number; // 0-indexed
}

export function BookingStepper({ steps, current }: Props) {
  return (
    <div className="flex gap-1.5 px-4 pb-3 pt-1 md:gap-2.5 md:px-7">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex-1">
            <div
              style={{
                height: 3,
                borderRadius: 2,
                background: done || active ? "var(--k-primary)" : "var(--k-border)",
                transition: "background 200ms",
              }}
            />
            <div
              className="mt-1.5 text-[10px] font-semibold uppercase tracking-wide md:mt-2 md:text-[11px]"
              style={{ color: active ? "var(--k-text-primary)" : "var(--k-text-muted)" }}
            >
              <span className="md:hidden">{i + 1} · {s.shortLabel ?? s.label.split(" ")[0]}</span>
              <span className="hidden md:inline">{i + 1} · {s.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Create `MobileStickyBar.tsx`**

```tsx
"use client";

import { ArrowLeft, ArrowRight, Check } from "lucide-react";

interface Props {
  canGoBack: boolean;
  onBack: () => void;
  onPrimary: () => void;
  primaryLabel: string;
  primaryDisabled?: boolean;
  variant?: "continue" | "confirm";
}

export function MobileStickyBar({
  canGoBack,
  onBack,
  onPrimary,
  primaryLabel,
  primaryDisabled,
  variant = "continue",
}: Props) {
  return (
    <div
      className="md:hidden"
      style={{
        position: "sticky",
        bottom: 0,
        paddingBottom: "calc(env(safe-area-inset-bottom, 0) + 12px)",
        paddingTop: 12,
        paddingLeft: 16,
        paddingRight: 16,
        background:
          "linear-gradient(to top, var(--k-bg) 70%, color-mix(in srgb, var(--k-bg) 0%, transparent) 100%)",
        display: "flex",
        gap: 8,
      }}
    >
      {canGoBack && (
        <button
          onClick={onBack}
          className="k-btn"
          style={{
            flex: "0 0 88px",
            height: 48,
            borderRadius: 12,
            border: "1px solid var(--k-border)",
            background: "var(--k-surface)",
            fontWeight: 600,
            color: "var(--k-text-body)",
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
      )}
      <button
        onClick={onPrimary}
        disabled={primaryDisabled}
        className="k-btn k-btn-primary"
        style={{
          flex: 1,
          height: 48,
          borderRadius: 12,
          fontWeight: 700,
          opacity: primaryDisabled ? 0.5 : 1,
        }}
      >
        {primaryLabel}
        {variant === "continue" ? <ArrowRight className="h-4 w-4" /> : <Check className="h-4 w-4" />}
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Create `BookingShell.tsx`**

```tsx
"use client";

import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Layout } from "@/components/layout";
import { BookingStepper } from "./BookingStepper";

interface Props {
  title: string;
  steps: Array<{ label: string; shortLabel?: string }>;
  currentStep: number;
  onBack: () => void;
  main: ReactNode;
  aside?: ReactNode;
  bottomBar?: ReactNode;
}

export function BookingShell({ title, steps, currentStep, onBack, main, aside, bottomBar }: Props) {
  return (
    <Layout>
      <div style={{ background: "var(--k-bg)", minHeight: "100%" }}>
        <div className="mx-auto max-w-[1100px] pt-3 md:pt-6">
          <div className="flex items-center gap-2.5 px-4 md:px-7">
            <button
              onClick={onBack}
              aria-label="Retour"
              className="flex h-9 w-9 items-center justify-center rounded-full md:h-10 md:w-10"
              style={{
                border: "1px solid var(--k-border)",
                background: "var(--k-surface)",
                color: "var(--k-text-primary)",
              }}
            >
              <ArrowLeft className="h-[18px] w-[18px]" />
            </button>
            <h1 className="k-display-m" style={{ margin: 0, fontSize: "clamp(17px, 2.2vw, 22px)" }}>
              {title}
            </h1>
          </div>
          <BookingStepper steps={steps} current={currentStep} />
          <div className="grid gap-6 px-4 pb-6 md:grid-cols-[1fr_320px] md:px-7">
            <main>{main}</main>
            {aside && <aside className="hidden md:block self-start sticky top-5">{aside}</aside>}
          </div>
        </div>
        {bottomBar}
      </div>
    </Layout>
  );
}
```

- [ ] **Step 4: Type-check the web app**

Run from `apps/web/`: `pnpm tsc --noEmit`
Expected: no new errors introduced (existing errors in unrelated files are OK).

---

### Task 12: Create `SidebarRail`

**Files:**
- Create: `apps/web/src/components/booking/SidebarRail.tsx`

- [ ] **Step 1: Write the file**

```tsx
"use client";

import { ArrowLeft, Star, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProviderMini {
  firstName: string;
  lastName: string;
  profession: string;
  avatarUrl: string | null;
  rating: number;
}

interface SummaryLine {
  label: string;
  value: string | null;
}

interface Props {
  provider: ProviderMini;
  summary: SummaryLine[];           // Service / Date / Adresse rows
  startingPriceFC: number;
  primaryLabel: string;
  primaryDisabled?: boolean;
  onPrimary: () => void;
  onBack?: () => void;
  variant?: "summary" | "confirm";   // confirm hides redundant summary on Step 4
}

export function SidebarRail({
  provider,
  summary,
  startingPriceFC,
  primaryLabel,
  primaryDisabled,
  onPrimary,
  onBack,
  variant = "summary",
}: Props) {
  const fullName = `${provider.firstName} ${provider.lastName}`.trim();
  const initials = `${(provider.firstName[0] ?? "?").toUpperCase()}${(provider.lastName[0] ?? "").toUpperCase()}`;

  return (
    <div
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: "var(--k-r-lg)",
        padding: 20,
      }}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={provider.avatarUrl ?? undefined} alt={fullName} />
          <AvatarFallback
            style={{ background: "#F5F2E9", color: "#7a5e2b", fontWeight: 700, fontSize: 14 }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="font-semibold">{fullName}</div>
          <div className="k-caption">{provider.profession}</div>
        </div>
        <div className="inline-flex items-center gap-1 text-[13px]" style={{ color: "var(--k-text-primary)", fontWeight: 600 }}>
          <Star className="h-3.5 w-3.5" style={{ color: "var(--k-warning)" }} />
          {provider.rating ? provider.rating.toFixed(1) : "—"}
        </div>
      </div>

      {variant === "summary" && (
        <div className="mt-4">
          {summary.map((row, i) => (
            <div
              key={row.label}
              className="flex justify-between gap-2 py-2.5 text-[13px]"
              style={{
                borderTop: i === 0 ? "1px solid var(--k-border-subtle)" : 0,
                borderBottom: "1px dashed var(--k-border-subtle)",
              }}
            >
              <span className="k-caption" style={{ flexShrink: 0 }}>{row.label}</span>
              <span
                className="text-right"
                style={{
                  fontWeight: row.value ? 600 : 500,
                  color: row.value ? "var(--k-text-primary)" : "var(--k-text-muted)",
                }}
              >
                {row.value ?? "À choisir"}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4">
        <div className="k-overline">À partir de</div>
        <div className="k-price" style={{ fontSize: 22, marginTop: 4, color: "var(--k-primary-hover)" }}>
          {startingPriceFC.toLocaleString("fr-FR")} FC
        </div>
      </div>

      <button
        onClick={onPrimary}
        disabled={primaryDisabled}
        className="k-btn k-btn-primary"
        style={{ width: "100%", height: 48, borderRadius: 12, fontWeight: 700, marginTop: 14, opacity: primaryDisabled ? 0.5 : 1 }}
      >
        {primaryLabel}
      </button>
      {onBack && (
        <button
          onClick={onBack}
          className="k-btn"
          style={{
            width: "100%",
            height: 42,
            borderRadius: 12,
            background: "var(--k-surface)",
            border: "1px solid var(--k-border)",
            fontWeight: 600,
            color: "var(--k-text-body)",
            marginTop: 8,
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
      )}
      <div className="k-caption mt-2.5 inline-flex items-start gap-1.5">
        <ShieldCheck className="h-3 w-3 mt-0.5" style={{ color: "var(--k-success)", flexShrink: 0 }} />
        <span>Paiement en espèces à la fin. Le prix final est convenu avec le pro.</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check** — `pnpm tsc --noEmit` in `apps/web/`. Expected: no new errors.

---

### Task 13: Create `AvailabilityCalendar`

**Files:**
- Create: `apps/web/src/components/booking/AvailabilityCalendar.tsx`

- [ ] **Step 1: Write the file**

```tsx
"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

export type DayStatus = "available" | "off" | "full" | "past";
export interface AvailabilityDay { date: string; status: DayStatus; slots: string[]; }

interface Props {
  days: AvailabilityDay[];               // already covers the visible month range
  selectedDate: string | null;           // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  visibleMonth: Date;                    // first day of month
  onChangeMonth: (offset: -1 | 1) => void;
}

const WEEKDAY_LETTERS = ["L", "M", "M", "J", "V", "S", "D"];

export function AvailabilityCalendar({ days, selectedDate, onSelectDate, visibleMonth, onChangeMonth }: Props) {
  const byDate = useMemo(() => new Map(days.map((d) => [d.date, d])), [days]);

  const first = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const firstWeekday = (first.getDay() + 6) % 7; // make Monday = 0
  const lastDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const cells = Math.ceil((firstWeekday + lastDay) / 7) * 7;

  const monthLabel = visibleMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: "var(--k-r-lg)",
        padding: 14,
      }}
    >
      <div className="mb-2.5 flex items-center justify-between">
        <button
          aria-label="Mois précédent"
          onClick={() => onChangeMonth(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ background: "var(--k-surface-muted)" }}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </button>
        <div style={{ fontWeight: 700, fontSize: 14.5, textTransform: "capitalize" }}>{monthLabel}</div>
        <button
          aria-label="Mois suivant"
          onClick={() => onChangeMonth(1)}
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ background: "var(--k-surface-muted)" }}
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mb-1.5 grid grid-cols-7 gap-0.5">
        {WEEKDAY_LETTERS.map((d, i) => (
          <div key={i} className="k-caption text-center">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: cells }, (_, i) => {
          const dayNum = i - firstWeekday + 1;
          const valid = dayNum >= 1 && dayNum <= lastDay;
          if (!valid) return <div key={i} />;

          const dateObj = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), dayNum);
          const yyyyMmDd = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
          const day = byDate.get(yyyyMmDd);
          const status = day?.status ?? "off";
          const isSelected = selectedDate === yyyyMmDd;
          const tappable = status === "available" || status === "full";

          return (
            <button
              key={i}
              onClick={() => tappable && onSelectDate(yyyyMmDd)}
              disabled={!tappable}
              style={{
                aspectRatio: "1 / 1",
                borderRadius: 8,
                background: isSelected ? "var(--k-primary)" : "transparent",
                color: isSelected ? "#fff" : status === "off" || status === "past" ? "var(--k-text-subtle)" : "var(--k-text-primary)",
                border: 0,
                fontSize: 13,
                fontWeight: isSelected ? 700 : 500,
                position: "relative",
                cursor: tappable ? "pointer" : "default",
              }}
            >
              {dayNum}
              {!isSelected && status === "available" && (
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    bottom: 5,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: "var(--k-success)",
                  }}
                />
              )}
              {!isSelected && status === "full" && (
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    bottom: 5,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 6,
                    height: 1,
                    background: "var(--k-text-subtle)",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-2.5 flex gap-3.5 text-[11px]" style={{ color: "var(--k-text-muted)" }}>
        <span className="inline-flex items-center gap-1.5"><span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--k-success)" }} />Disponible</span>
        <span className="inline-flex items-center gap-1.5"><span style={{ width: 8, height: 1, background: "var(--k-text-subtle)" }} />Complet</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check** — `pnpm tsc --noEmit`. Expected: no new errors.

---

### Task 14: Create `RecapCard`

**Files:**
- Create: `apps/web/src/components/booking/RecapCard.tsx`

- [ ] **Step 1: Write the file**

```tsx
"use client";

import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  icon: LucideIcon;
  onEdit: () => void;
  children: ReactNode;
}

export function RecapCard({ title, icon: Icon, onEdit, children }: Props) {
  return (
    <div
      className="mb-3"
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: "var(--k-r-lg)",
        padding: "14px 16px",
      }}
    >
      <div className="mb-2.5 flex items-center justify-between">
        <div className="k-overline inline-flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5" style={{ color: "var(--k-text-body)" }} />
          {title}
        </div>
        <button
          onClick={onEdit}
          className="text-[12px] font-semibold"
          style={{ color: "var(--k-primary)", background: "none", border: 0, cursor: "pointer" }}
        >
          Modifier
        </button>
      </div>
      <div className="text-[14px]" style={{ color: "var(--k-text-primary)", lineHeight: 1.5 }}>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check** — `pnpm tsc --noEmit`. Expected: no new errors.

---

### Task 15: Create `booking-state.ts` (reducer + persistence hook)

**Files:**
- Create: `apps/web/src/components/booking/booking-state.ts`

- [ ] **Step 1: Write the file**

```ts
"use client";

import { useEffect, useReducer } from "react";

export interface BookingDraft {
  subcategoryId: string | null;
  subcategorySlug: string | null;
  taskKey: string | null;            // canonical task label OR "__custom__"
  taskLabelOverride: string | null;
  durationMin: number | null;
  description: string;

  scheduledDate: string | null;      // YYYY-MM-DD
  scheduledTime: string | null;      // HH:mm

  city: "Kinshasa";
  commune: string | null;
  street: string;
  locationNote: string;
}

export const initialDraft: BookingDraft = {
  subcategoryId: null,
  subcategorySlug: null,
  taskKey: null,
  taskLabelOverride: null,
  durationMin: null,
  description: "",
  scheduledDate: null,
  scheduledTime: null,
  city: "Kinshasa",
  commune: null,
  street: "",
  locationNote: "",
};

export type BookingAction =
  | { type: "SET_SUBCATEGORY"; id: string; slug: string }
  | { type: "SET_TASK"; key: string }
  | { type: "SET_TASK_OVERRIDE"; label: string }
  | { type: "SET_DURATION"; minutes: number | null }
  | { type: "SET_DESCRIPTION"; text: string }
  | { type: "SET_DATE"; date: string }
  | { type: "SET_TIME"; time: string }
  | { type: "SET_COMMUNE"; commune: string }
  | { type: "SET_STREET"; street: string }
  | { type: "SET_LOCATION_NOTE"; note: string }
  | { type: "RESET" };

export function bookingReducer(state: BookingDraft, action: BookingAction): BookingDraft {
  switch (action.type) {
    case "SET_SUBCATEGORY":
      return { ...state, subcategoryId: action.id, subcategorySlug: action.slug, taskKey: null, taskLabelOverride: null };
    case "SET_TASK":
      return { ...state, taskKey: action.key, taskLabelOverride: action.key === "__custom__" ? state.taskLabelOverride : null };
    case "SET_TASK_OVERRIDE":
      return { ...state, taskLabelOverride: action.label };
    case "SET_DURATION":
      return { ...state, durationMin: action.minutes };
    case "SET_DESCRIPTION":
      return { ...state, description: action.text };
    case "SET_DATE":
      return { ...state, scheduledDate: action.date, scheduledTime: null };
    case "SET_TIME":
      return { ...state, scheduledTime: action.time };
    case "SET_COMMUNE":
      return { ...state, commune: action.commune };
    case "SET_STREET":
      return { ...state, street: action.street };
    case "SET_LOCATION_NOTE":
      return { ...state, locationNote: action.note };
    case "RESET":
      return initialDraft;
  }
}

const STORAGE_PREFIX = "kayou:booking-draft:";

export function useBookingDraft(providerId: string) {
  const key = STORAGE_PREFIX + providerId;
  const [state, dispatch] = useReducer(bookingReducer, initialDraft, (init) => {
    if (typeof window === "undefined") return init;
    try {
      const raw = window.sessionStorage.getItem(key);
      if (!raw) return init;
      const parsed = JSON.parse(raw) as BookingDraft;
      return { ...init, ...parsed, city: "Kinshasa" }; // city always pinned
    } catch { return init; }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try { window.sessionStorage.setItem(key, JSON.stringify(state)); } catch { /* ignore */ }
  }, [key, state]);

  function clear() {
    if (typeof window !== "undefined") {
      try { window.sessionStorage.removeItem(key); } catch { /* ignore */ }
    }
    dispatch({ type: "RESET" });
  }

  return { state, dispatch, clear };
}
```

- [ ] **Step 2: Type-check** — `pnpm tsc --noEmit`. Expected: no new errors.

---

## Phase E — Frontend step components

### Task 16: Build `Step1Service`

**Files:**
- Create: `apps/web/src/components/booking/Step1Service.tsx`

- [ ] **Step 1: Write the file**

```tsx
"use client";

import { Check } from "lucide-react";
import { CUSTOM_TASK_KEY, getTasksForSubcategory } from "@kayu/schemas";
import type { BookingDraft, BookingAction } from "./booking-state";

interface Subcategory { id: string; slug: string; name: string; isPrimary?: boolean; }

interface Props {
  subcategories: Subcategory[];
  state: BookingDraft;
  dispatch: (action: BookingAction) => void;
}

const DURATIONS: Array<{ label: string; minutes: number | null }> = [
  { label: "1 h",          minutes: 60  },
  { label: "2 h",          minutes: 120 },
  { label: "Demi-journée", minutes: 240 },
  { label: "Journée",      minutes: 480 },
  { label: "À discuter",   minutes: null },
];

export function Step1Service({ subcategories, state, dispatch }: Props) {
  const showSubChips = subcategories.length > 1;
  const activeSlug = state.subcategorySlug ?? subcategories.find((s) => s.isPrimary)?.slug ?? subcategories[0]?.slug ?? "";
  const tasks = getTasksForSubcategory(activeSlug);

  return (
    <div>
      <h2 className="k-heading mb-4 mt-1" style={{ fontSize: "clamp(20px, 3vw, 26px)" }}>Quel service ?</h2>

      {showSubChips && (
        <>
          <div className="k-overline mb-2">Spécialité</div>
          <div className="mb-4 flex flex-wrap gap-2">
            {subcategories.map((s) => {
              const active = s.slug === activeSlug;
              return (
                <button
                  key={s.id}
                  onClick={() => dispatch({ type: "SET_SUBCATEGORY", id: s.id, slug: s.slug })}
                  className="k-btn"
                  style={{
                    padding: "8px 14px",
                    borderRadius: 999,
                    border: `1px solid ${active ? "var(--k-text-primary)" : "var(--k-border)"}`,
                    background: active ? "var(--k-text-primary)" : "var(--k-surface)",
                    color: active ? "#fff" : "var(--k-text-body)",
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className="k-overline mb-2">Prestation</div>
      <div className="mb-5 grid gap-2 md:grid-cols-2">
        {[...tasks, "__autre__"].map((task, i) => {
          const isCustomRow = task === "__autre__";
          const key = isCustomRow ? CUSTOM_TASK_KEY : task;
          const selected = state.taskKey === key;
          return (
            <label
              key={`${task}-${i}`}
              className="flex cursor-pointer items-center gap-3"
              style={{
                padding: 14,
                background: "var(--k-surface)",
                border: `1px solid ${selected ? "var(--k-primary)" : "var(--k-border)"}`,
                borderRadius: "var(--k-r-md)",
                boxShadow: selected ? "0 0 0 3px rgba(30,74,214,.12)" : "none",
                gridColumn: isCustomRow ? "1 / -1" : undefined,
              }}
            >
              <input
                type="radio"
                name="task"
                checked={selected}
                onChange={() => dispatch({ type: "SET_TASK", key })}
                className="accent-[var(--k-primary)]"
              />
              <span className="flex-1" style={{ fontSize: 14.5, fontWeight: 500, color: isCustomRow ? "var(--k-text-muted)" : undefined }}>
                {isCustomRow ? "Autre (préciser)…" : task}
              </span>
              {selected && <Check className="h-[18px] w-[18px]" style={{ color: "var(--k-primary)" }} />}
            </label>
          );
        })}
      </div>

      {state.taskKey === CUSTOM_TASK_KEY && (
        <input
          autoFocus
          maxLength={60}
          value={state.taskLabelOverride ?? ""}
          onChange={(e) => dispatch({ type: "SET_TASK_OVERRIDE", label: e.target.value })}
          placeholder="Décris la prestation en quelques mots"
          className="k-input mb-5"
        />
      )}

      <div className="k-overline mb-2">Durée estimée</div>
      <div className="mb-5 grid grid-cols-3 gap-2 md:grid-cols-5">
        {DURATIONS.map((d) => {
          const active = state.durationMin === d.minutes && (d.minutes !== null || state.durationMin === null);
          return (
            <button
              key={d.label}
              onClick={() => dispatch({ type: "SET_DURATION", minutes: d.minutes })}
              style={{
                height: 44,
                borderRadius: "var(--k-r-md)",
                border: `1px solid ${active ? "var(--k-primary)" : "var(--k-border)"}`,
                background: active ? "var(--k-primary-subtle)" : "var(--k-surface)",
                color: active ? "var(--k-primary-hover)" : "var(--k-text-body)",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              {d.label}
            </button>
          );
        })}
      </div>

      <div className="k-overline mb-2">Détails (facultatif)</div>
      <textarea
        rows={3}
        value={state.description}
        onChange={(e) => dispatch({ type: "SET_DESCRIPTION", text: e.target.value })}
        placeholder="Précise le style, la longueur, les particularités…"
        className="k-input"
        style={{ resize: "vertical", minHeight: 80 }}
      />
      <div className="k-caption mt-1.5">Plus c'est précis, plus le pro arrive préparé.</div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check** — `pnpm tsc --noEmit`. Expected: no new errors.

---

### Task 17: Build `Step2DateTime`

**Files:**
- Create: `apps/web/src/components/booking/Step2DateTime.tsx`

- [ ] **Step 1: Write the file**

```tsx
"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { providersApi } from "@kayu/api";
import { apiClient } from "@/lib/api";
import { AvailabilityCalendar, AvailabilityDay } from "./AvailabilityCalendar";
import type { BookingDraft, BookingAction } from "./booking-state";

interface Props {
  providerId: string;
  providerFirstName: string;
  state: BookingDraft;
  dispatch: (action: BookingAction) => void;
}

type Period = "all" | "morning" | "afternoon";

export function Step2DateTime({ providerId, providerFirstName, state, dispatch }: Props) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    if (state.scheduledDate) {
      const [y, m] = state.scheduledDate.split("-").map(Number);
      return new Date(y, m - 1, 1);
    }
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [period, setPeriod] = useState<Period>("all");

  const fromYmd = `${visibleMonth.getFullYear()}-${String(visibleMonth.getMonth() + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const toYmd = `${visibleMonth.getFullYear()}-${String(visibleMonth.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const query = useQuery({
    queryKey: ["availability", providerId, fromYmd, toYmd],
    queryFn: () => providersApi(apiClient).availability(providerId, { from: fromYmd, to: toYmd }),
  });

  const days: AvailabilityDay[] = (query.data?.days as AvailabilityDay[]) ?? [];
  const workWindow = query.data?.workWindow ?? null;

  const selectedDay = useMemo(() => days.find((d) => d.date === state.scheduledDate) ?? null, [days, state.scheduledDate]);
  const slotsFiltered = useMemo(() => {
    const slots = selectedDay?.slots ?? [];
    if (period === "morning") return slots.filter((s) => Number(s.split(":")[0]) < 12);
    if (period === "afternoon") return slots.filter((s) => Number(s.split(":")[0]) >= 12);
    return slots;
  }, [selectedDay, period]);

  function jumpToNextAvailable() {
    const next = days.find((d) => d.status === "available" && (!state.scheduledDate || d.date > state.scheduledDate));
    if (next) dispatch({ type: "SET_DATE", date: next.date });
  }

  return (
    <div>
      <h2 className="k-heading mb-4 mt-1" style={{ fontSize: "clamp(20px, 3vw, 26px)" }}>Quand ?</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <AvailabilityCalendar
          days={days}
          selectedDate={state.scheduledDate}
          onSelectDate={(d) => dispatch({ type: "SET_DATE", date: d })}
          visibleMonth={visibleMonth}
          onChangeMonth={(offset) => setVisibleMonth((m) => new Date(m.getFullYear(), m.getMonth() + offset, 1))}
        />

        <div style={{ background: "var(--k-surface)", border: "1px solid var(--k-border)", borderRadius: "var(--k-r-lg)", padding: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }} className="mb-2.5">
            {state.scheduledDate
              ? new Date(state.scheduledDate + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
              : "Choisis un jour"}
          </div>

          {state.scheduledDate && (
            <div className="mb-2.5 flex gap-1.5">
              {(["all", "morning", "afternoon"] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 999,
                    border: `1px solid ${period === p ? "var(--k-text-primary)" : "var(--k-border)"}`,
                    background: period === p ? "var(--k-text-primary)" : "var(--k-surface)",
                    color: period === p ? "#fff" : "var(--k-text-body)",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {p === "all" ? "Tout" : p === "morning" ? "Matin" : "Après-midi"}
                </button>
              ))}
            </div>
          )}

          {!state.scheduledDate && <div className="k-caption">Sélectionne d'abord une date dans le calendrier.</div>}

          {state.scheduledDate && slotsFiltered.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {(selectedDay?.slots ?? []).map((slot) => {
                const visible = slotsFiltered.includes(slot);
                const taken = !visible;
                const active = state.scheduledTime === slot;
                return (
                  <button
                    key={slot}
                    onClick={() => visible && dispatch({ type: "SET_TIME", time: slot })}
                    disabled={taken}
                    style={{
                      height: 42,
                      borderRadius: "var(--k-r-md)",
                      border: `1px solid ${active ? "var(--k-primary)" : "var(--k-border)"}`,
                      background: taken ? "var(--k-surface-muted)" : active ? "var(--k-primary-subtle)" : "var(--k-surface)",
                      color: taken ? "var(--k-text-subtle)" : active ? "var(--k-primary-hover)" : "var(--k-text-primary)",
                      textDecoration: taken ? "line-through" : "none",
                      fontWeight: 600,
                      fontFamily: "var(--k-font-mono)",
                      fontSize: 13,
                      cursor: taken ? "not-allowed" : "pointer",
                    }}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          )}

          {state.scheduledDate && slotsFiltered.length === 0 && (
            <div>
              <div className="k-caption mb-2">Aucun créneau libre ce jour.</div>
              <button
                onClick={jumpToNextAvailable}
                style={{ background: "none", border: 0, color: "var(--k-primary)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
              >
                Voir le prochain disponible →
              </button>
            </div>
          )}

          {workWindow && (
            <div className="k-caption mt-2.5">
              {providerFirstName} travaille de {workWindow.start} à {workWindow.end}, créneaux d'1 h.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check** — `pnpm tsc --noEmit`. Expected: no new errors.

---

### Task 18: Build `Step3Address`

**Files:**
- Create: `apps/web/src/components/booking/Step3Address.tsx`

- [ ] **Step 1: Write the file**

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { MapPin, Lock } from "lucide-react";
import { KIN_COMMUNES, identityApi } from "@kayu/schemas"; // KIN_COMMUNES from schemas
import { apiClient } from "@/lib/api";
import type { BookingDraft, BookingAction } from "./booking-state";

// If `identityApi` lives in `@kayu/api`, fix this import. Match what Task 10 produced.
// import { identityApi } from "@kayu/api";

interface Props {
  state: BookingDraft;
  dispatch: (action: BookingAction) => void;
}

interface RecentAddress {
  commune: string | null;
  street: string | null;
  raw: string;
  lastUsedAt: string;
}

export function Step3Address({ state, dispatch }: Props) {
  const recents = useQuery({
    queryKey: ["recent-addresses"],
    queryFn: () =>
      // adjust the import path / call to whatever Task 10 actually wired:
      (identityApi as any)(apiClient).recentAddresses({ limit: 3 }) as Promise<RecentAddress[]>,
    staleTime: 60_000,
  });

  const recentList = recents.data ?? [];

  return (
    <div>
      <h2 className="k-heading mb-4 mt-1" style={{ fontSize: "clamp(20px, 3vw, 26px)" }}>Où intervenir ?</h2>

      <div
        className="mb-4 inline-flex items-center gap-2"
        style={{ padding: "8px 14px", borderRadius: 999, background: "#F5F2E9", color: "#7a5e2b", fontSize: 13, fontWeight: 600 }}
      >
        <MapPin className="h-3.5 w-3.5" /> Kinshasa <Lock className="h-3 w-3 opacity-70" /> <span style={{ opacity: 0.7 }}>zone v1</span>
      </div>

      {recentList.length > 0 && (
        <>
          <div className="k-overline mb-2">Adresses récentes</div>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {recentList.map((r) => {
              const matches = state.commune === r.commune && state.street === (r.street ?? "");
              return (
                <button
                  key={r.raw}
                  onClick={() => {
                    if (r.commune) dispatch({ type: "SET_COMMUNE", commune: r.commune });
                    dispatch({ type: "SET_STREET", street: r.street ?? "" });
                  }}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: `1px solid ${matches ? "var(--k-primary)" : "var(--k-border)"}`,
                    background: matches ? "var(--k-primary-subtle)" : "var(--k-surface)",
                    color: matches ? "var(--k-primary-hover)" : "var(--k-text-body)",
                    fontSize: 12,
                  }}
                >
                  {(r.street ? `${r.street} · ` : "") + (r.commune ?? "Kinshasa")}
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className="grid gap-4 md:grid-cols-[200px_1fr]">
        <div>
          <div className="k-overline mb-2">Commune</div>
          <select
            value={state.commune ?? ""}
            onChange={(e) => dispatch({ type: "SET_COMMUNE", commune: e.target.value })}
            className="k-input"
            style={{ height: 48 }}
          >
            <option value="" disabled>Choisir une commune</option>
            {KIN_COMMUNES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <div className="k-overline mb-2 flex justify-between">
            <span>Avenue / rue, numéro</span>
            <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 500, color: "var(--k-text-subtle)" }}>facultatif</span>
          </div>
          <input
            value={state.street}
            onChange={(e) => dispatch({ type: "SET_STREET", street: e.target.value })}
            placeholder="Av. de la Justice, n° 42"
            className="k-input"
            style={{ height: 48 }}
          />
        </div>
        <div className="md:col-span-2">
          <div className="k-overline mb-2 flex justify-between">
            <span>Repère pour trouver l'endroit</span>
            <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 500, color: "var(--k-text-subtle)" }}>facultatif</span>
          </div>
          <textarea
            value={state.locationNote}
            onChange={(e) => dispatch({ type: "SET_LOCATION_NOTE", note: e.target.value })}
            placeholder="Ex. en face de la pharmacie Wenge, portail bleu…"
            rows={3}
            className="k-input"
            style={{ minHeight: 70, resize: "vertical" }}
          />
          <div className="k-caption mt-1.5">Plus tu donnes de détails, plus le pro arrive sans appeler.</div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Fix the imports**

The `identityApi` import is a placeholder pointing at the wrong package. Open this file and correct the import to match what Task 10 actually exported. Most likely:

```ts
import { KIN_COMMUNES } from "@kayu/schemas";
import { identityApi } from "@kayu/api";
```

…and remove the `(identityApi as any)` cast in the `queryFn`.

- [ ] **Step 3: Type-check** — `pnpm tsc --noEmit`. Expected: no new errors.

---

### Task 19: Build `Step4Recap`

**Files:**
- Create: `apps/web/src/components/booking/Step4Recap.tsx`

- [ ] **Step 1: Write the file**

```tsx
"use client";

import { Calendar, MapPin, Briefcase, ShieldCheck } from "lucide-react";
import { CUSTOM_TASK_KEY } from "@kayu/schemas";
import { RecapCard } from "./RecapCard";
import type { BookingDraft } from "./booking-state";

interface Props {
  state: BookingDraft;
  subcategoryName: string;
  startingPriceFC: number;
  providerFirstName: string;
  goToStep: (step: 0 | 1 | 2) => void;
}

const DURATION_LABELS: Record<number, string> = {
  60: "1 h",
  120: "2 h",
  240: "Demi-journée",
  480: "Journée",
};

export function Step4Recap({ state, subcategoryName, startingPriceFC, providerFirstName, goToStep }: Props) {
  const taskLabel = state.taskKey === CUSTOM_TASK_KEY ? (state.taskLabelOverride ?? "—") : (state.taskKey ?? "—");
  const durationLabel = state.durationMin == null ? "À discuter" : (DURATION_LABELS[state.durationMin] ?? `${state.durationMin} min`);

  const dateLabel = state.scheduledDate
    ? new Date(state.scheduledDate + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "—";

  return (
    <div>
      <h2 className="k-heading mb-4 mt-1" style={{ fontSize: "clamp(20px, 3vw, 26px)" }}>Tout est bon ?</h2>

      <RecapCard title="Service" icon={Briefcase} onEdit={() => goToStep(0)}>
        <div><strong>{taskLabel}</strong> · {subcategoryName} · durée {durationLabel}</div>
        {state.description && <div className="mt-1 italic" style={{ color: "var(--k-text-muted)" }}>"{state.description}"</div>}
      </RecapCard>

      <RecapCard title="Date & heure" icon={Calendar} onEdit={() => goToStep(1)}>
        <div><strong>{dateLabel}</strong>{state.scheduledTime ? ` · ${state.scheduledTime}` : ""}</div>
      </RecapCard>

      <RecapCard title="Adresse" icon={MapPin} onEdit={() => goToStep(2)}>
        <div><strong>{state.street || "(Adresse à préciser sur place)"}</strong> · {state.commune ?? "Commune à choisir"}, Kinshasa</div>
        {state.locationNote && <div className="mt-1 italic" style={{ color: "var(--k-text-muted)" }}>"{state.locationNote}"</div>}
      </RecapCard>

      <div
        className="md:hidden"
        style={{
          padding: 14,
          background: "var(--k-surface-primary)",
          border: "1px solid #BAE6FD",
          borderRadius: "var(--k-r-lg)",
          marginBottom: 12,
        }}
      >
        <div className="flex justify-between text-[14px]">
          <span style={{ color: "var(--k-text-body)" }}>Prix de départ</span>
          <span className="k-price">{startingPriceFC.toLocaleString("fr-FR")} FC</span>
        </div>
        <div className="mt-1.5 flex justify-between text-[14px]">
          <span style={{ color: "var(--k-text-muted)" }}>Paiement</span>
          <span style={{ color: "var(--k-text-body)" }}>Espèces à la fin</span>
        </div>
        <div style={{ height: 1, background: "#BAE6FD", margin: "12px 0" }} />
        <div className="flex items-baseline justify-between">
          <span className="k-heading" style={{ margin: 0 }}>Prix indicatif</span>
          <span className="k-price" style={{ fontSize: 22, color: "var(--k-primary-hover)" }}>
            ≥ {startingPriceFC.toLocaleString("fr-FR")} FC
          </span>
        </div>
        <div className="k-caption mt-2 inline-flex items-start gap-1.5">
          <ShieldCheck className="h-3 w-3 mt-0.5" style={{ color: "var(--k-success)", flexShrink: 0 }} />
          <span>Le prix final est convenu avec {providerFirstName} avant l'intervention. Aucun paiement en ligne.</span>
        </div>
      </div>

      <div className="k-caption mt-2 text-center md:text-left">
        En confirmant, tu acceptes les{" "}
        <a style={{ color: "var(--k-primary-hover)" }}>conditions générales</a> de Kayou.
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check** — `pnpm tsc --noEmit`. Expected: no new errors.

---

## Phase F — Wire it together

### Task 20: Rewrite `BookingFlowClient.tsx`

**Files:**
- Modify: `apps/web/src/app/book/[providerId]/BookingFlowClient.tsx` (full rewrite)

- [ ] **Step 1: Replace the file end-to-end**

Open `apps/web/src/app/book/[providerId]/BookingFlowClient.tsx`. Delete the entire current contents and replace with:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { bookingsApi } from "@kayu/api";
import { CUSTOM_TASK_KEY } from "@kayu/schemas";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { KayouMoment } from "@kayu/ui/web";
import { Layout } from "@/components/layout";

import { BookingShell } from "@/components/booking/BookingShell";
import { SidebarRail } from "@/components/booking/SidebarRail";
import { MobileStickyBar } from "@/components/booking/MobileStickyBar";
import { Step1Service } from "@/components/booking/Step1Service";
import { Step2DateTime } from "@/components/booking/Step2DateTime";
import { Step3Address } from "@/components/booking/Step3Address";
import { Step4Recap } from "@/components/booking/Step4Recap";
import { useBookingDraft } from "@/components/booking/booking-state";

interface ProviderMini {
  id: string;
  firstName: string;
  lastName: string;
  profession: string;
  hourlyRate: number;
  rating: number;
  totalReviews: number;
  avatarUrl: string | null;
  city: string;
  verified: boolean;
  subcategories: Array<{ id: string; slug: string; name: string; isPrimary?: boolean }>;
}

const STEPS = [
  { label: "Service",         shortLabel: "Service" },
  { label: "Date & heure",    shortLabel: "Date" },
  { label: "Adresse",         shortLabel: "Adresse" },
  { label: "Récapitulatif",   shortLabel: "Récap" },
];

export function BookingFlowClient({ provider }: { provider: ProviderMini }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { state, dispatch, clear } = useBookingDraft(provider.id);
  const [step, setStep] = useState(0);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [conflictBanner, setConflictBanner] = useState(false);

  const startingPrice = provider.hourlyRate || 0;
  const fullName = `${provider.firstName} ${provider.lastName}`.trim();

  const createBooking = useMutation({
    mutationFn: (payload: Parameters<ReturnType<typeof bookingsApi>["create"]>[0]) => bookingsApi(apiClient).create(payload),
    onSuccess: (result) => {
      setCreatedBookingId(result.booking.id);
      clear();
      setStep(4);
    },
    onError: (err: any) => {
      if (typeof err?.message === "string" && /SLOT_TAKEN/.test(err.message)) {
        setConflictBanner(true);
        setStep(1);
        dispatch({ type: "SET_TIME", time: "" });
        return;
      }
      alert(err?.message || "Erreur lors de la réservation");
    },
  });

  function handleConfirm() {
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }
    if (!state.scheduledDate || !state.scheduledTime) return;
    const [h, m] = state.scheduledTime.split(":").map(Number);
    const [yy, mm, dd] = state.scheduledDate.split("-").map(Number);
    const scheduled = new Date(yy, mm - 1, dd, h, m, 0, 0);

    const taskLabel = state.taskKey === CUSTOM_TASK_KEY ? (state.taskLabelOverride ?? "Autre") : (state.taskKey ?? "Service");
    const addressParts = [state.street.trim(), state.commune ?? "", "Kinshasa"].filter(Boolean);
    const address = addressParts.join(", ");
    const clientNotes = [state.description.trim(), state.locationNote.trim() ? `Repère: ${state.locationNote.trim()}` : ""].filter(Boolean).join("\n");

    createBooking.mutate({
      providerId: provider.id,
      title: taskLabel,
      description: state.description || undefined,
      address,
      city: "Kinshasa",
      scheduledDate: scheduled,
      duration: state.durationMin ?? undefined,
      price: startingPrice,
      clientNotes: clientNotes || undefined,
      subcategoryId: state.subcategoryId ?? undefined,
      commune: state.commune ?? undefined,
    } as any);
  }

  // Step 4 == celebrate after success
  if (step === 4 && createdBookingId) {
    const dateLabel = state.scheduledDate && state.scheduledTime
      ? new Date(`${state.scheduledDate}T${state.scheduledTime}:00`).toLocaleDateString("fr-FR", {
          weekday: "short", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
        })
      : "";
    return (
      <Layout>
        <KayouMoment
          provider={{ firstName: provider.firstName, initials: `${provider.firstName[0]}${provider.lastName[0]}`.toUpperCase(), response: "15 min" }}
          dateLabel={dateLabel.replace(",", " ·")}
          onMessage={() => router.push("/messages")}
          onViewBooking={() => router.replace(`/bookings/${createdBookingId}`)}
        />
      </Layout>
    );
  }

  // Validation per step
  const canAdvance =
    step === 0
      ? !!state.taskKey && (state.taskKey !== CUSTOM_TASK_KEY || (state.taskLabelOverride ?? "").trim().length >= 3)
      : step === 1
        ? !!state.scheduledDate && !!state.scheduledTime
        : step === 2
          ? !!state.commune
          : true;

  const summary = [
    {
      label: "Service",
      value: state.taskKey
        ? `${state.taskKey === CUSTOM_TASK_KEY ? state.taskLabelOverride ?? "Autre" : state.taskKey}${state.durationMin ? ` · ${state.durationMin === 60 ? "1 h" : state.durationMin === 120 ? "2 h" : state.durationMin === 240 ? "Demi-j." : "Journée"}` : ""}`
        : null,
    },
    {
      label: "Date",
      value: state.scheduledDate && state.scheduledTime
        ? `${new Date(state.scheduledDate + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })} · ${state.scheduledTime}`
        : null,
    },
    {
      label: "Adresse",
      value: state.commune ? `${state.street ? state.street + ", " : ""}${state.commune}` : null,
    },
  ];

  const isStep4 = step === 3;
  const primaryLabel = isStep4 ? "Confirmer la réservation" : "Continuer";
  const primaryAction = isStep4 ? handleConfirm : () => setStep((s) => s + 1);

  return (
    <BookingShell
      title={`Réserver avec ${provider.firstName}`}
      steps={STEPS}
      currentStep={step}
      onBack={() => (step === 0 ? router.push(`/providers/${provider.id}`) : setStep((s) => s - 1))}
      main={
        <>
          {conflictBanner && (
            <div
              role="alert"
              className="mb-3 p-3"
              style={{ background: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: "var(--k-r-md)", color: "#92400E", fontSize: 13 }}
            >
              Ce créneau vient d'être pris. Choisis un autre horaire.
            </div>
          )}
          {/* Mobile-only provider card on top, hidden on desktop where the rail handles it */}
          <div className="mb-4 md:hidden">
            <div className="flex items-center gap-3 p-3.5" style={{ background: "var(--k-surface)", border: "1px solid var(--k-border)", borderRadius: "var(--k-r-md)" }}>
              <div className="h-11 w-11 rounded-full" style={{ background: "#F5F2E9", color: "#7a5e2b", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                {provider.firstName[0]}{provider.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{fullName}</div>
                <div className="k-caption">{provider.profession}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>★ {provider.rating ? provider.rating.toFixed(1) : "—"}</div>
            </div>
          </div>

          {step === 0 && <Step1Service subcategories={provider.subcategories} state={state} dispatch={dispatch} />}
          {step === 1 && <Step2DateTime providerId={provider.id} providerFirstName={provider.firstName} state={state} dispatch={dispatch} />}
          {step === 2 && <Step3Address state={state} dispatch={dispatch} />}
          {step === 3 && (
            <Step4Recap
              state={state}
              subcategoryName={provider.subcategories.find((s) => s.id === state.subcategoryId)?.name ?? provider.profession}
              startingPriceFC={startingPrice}
              providerFirstName={provider.firstName}
              goToStep={(s) => setStep(s)}
            />
          )}
        </>
      }
      aside={
        <SidebarRail
          provider={{ firstName: provider.firstName, lastName: provider.lastName, profession: provider.profession, avatarUrl: provider.avatarUrl, rating: provider.rating }}
          summary={summary}
          startingPriceFC={startingPrice}
          primaryLabel={primaryLabel}
          primaryDisabled={!canAdvance || createBooking.isPending}
          onPrimary={primaryAction}
          onBack={step === 0 ? undefined : () => setStep((s) => s - 1)}
          variant={isStep4 ? "confirm" : "summary"}
        />
      }
      bottomBar={
        <MobileStickyBar
          canGoBack={step > 0}
          onBack={() => setStep((s) => s - 1)}
          onPrimary={primaryAction}
          primaryDisabled={!canAdvance || createBooking.isPending}
          primaryLabel={createBooking.isPending ? "Envoi…" : primaryLabel}
          variant={isStep4 ? "confirm" : "continue"}
        />
      }
    />
  );
}
```

- [ ] **Step 2: Update `page.tsx` to fetch subcategories**

Open `apps/web/src/app/book/[providerId]/page.tsx`. Find where it builds the `provider` object passed to `<BookingFlowClient />`. Make sure `subcategories: [{ id, slug, name, isPrimary? }]` is included. The provider DTO already exposes `subcategories` — wire them through. If the existing `ProviderMini` shape doesn't have it, extend it to match the interface in `BookingFlowClient.tsx`.

- [ ] **Step 3: Type-check**

```bash
cd apps/web && pnpm tsc --noEmit
```

Expected: no new errors. Fix any import/type mismatches surfaced.

---

### Task 21: Manual UAT against the spec's acceptance criteria

This task does not produce code. Walk through the acceptance criteria from §11 of the spec.

- [ ] **Boot dev**

```bash
# in one shell
cd apps/backend && pnpm dev
# in another shell
cd apps/web && pnpm dev
```

Open http://localhost:3000 (or whatever port the web app uses).

- [ ] **AC 1 & 2: Multi- vs single-subcategory**

- Find a provider in the seed with **2+ subcategories** (e.g. a beauty provider who has Coiffure + Esthétique). Navigate to `/book/<id>`. Confirm subcategory chips appear. Switch chips and confirm the task list updates.
- Find a provider with **1 subcategory** (most). Confirm chips are hidden and the task list is the right one.

- [ ] **AC 3: Provider with no AvailabilitySchedule**

In Prisma Studio, find a provider and delete all their `AvailabilitySchedule` rows. Visit Step 2 — confirm every day shows `off` and the empty-state copy appears. (Spec mentions a "Demander un créneau" fallback CTA — this is not implemented in v1 inside Step 2; the task list catches it. If you want the fallback CTA, add a pending follow-up note.)

- [ ] **AC 4: Custom task**

Choose "Autre (préciser)…", type `Test custom`, complete the flow, confirm the booking lands with `title = "Test custom"` (check Prisma Studio).

- [ ] **AC 5: Each duration option**

Manually pick each of the 5 durations and confirm a booking. Verify `Booking.duration` in DB matches: 60 / 120 / 240 / 480 / null.

- [ ] **AC 6: Each commune**

Spot-check 3 communes (Gombe, Limete, Mont Ngafula). Confirm submitted booking has `commune` column populated and `address` ends with `, <Commune>, Kinshasa`.

- [ ] **AC 7: 409 race**

Hardest to reproduce. Easiest path: open two browsers (different clients), both pick the same slot, submit one, then submit the other. The second should show the yellow "Ce créneau vient d'être pris" banner and bounce back to Step 2.

- [ ] **AC 8: KayouMoment renders**

Already covered by any successful confirmation. Just observe.

- [ ] **AC 9: Mobile + desktop layouts**

Open DevTools, toggle device toolbar. Test 375 px (iPhone SE), 414 px (iPhone Plus), 1280 px (desktop), 1440 px (desktop). Confirm:
- No horizontal overflow at any width.
- Mobile shows the sticky bottom bar; desktop hides it.
- Desktop shows the sticky right rail; mobile hides it.

- [ ] **AC 10: sessionStorage refresh**

Get to Step 3 with form filled in. Hit browser refresh. Confirm the draft is restored.

- [ ] **AC 11: Backend tests**

```bash
cd apps/backend && \
  node --test -r ts-node/register \
    src/modules/providers/providers-availability.service.spec.ts \
    src/modules/identity/recent-addresses.service.spec.ts \
    src/modules/bookings/bookings.service.spec.ts
```

Expected: all tests pass.

- [ ] **Note any AC failures**

If any criterion fails, **do not advance to Task 22**. Fix and re-verify.

---

### Task 22: Final commit

- [ ] **Step 1: Review the full diff**

```bash
git status
git diff --stat
```

Confirm only the expected files changed.

- [ ] **Step 2: Stage everything**

```bash
git add \
  apps/backend/prisma/schema.prisma \
  apps/backend/prisma/migrations \
  apps/backend/src/modules/providers/providers-availability.service.ts \
  apps/backend/src/modules/providers/providers-availability.service.spec.ts \
  apps/backend/src/modules/providers/providers.controller.ts \
  apps/backend/src/modules/providers/providers.module.ts \
  apps/backend/src/modules/identity/recent-addresses.service.ts \
  apps/backend/src/modules/identity/recent-addresses.service.spec.ts \
  apps/backend/src/modules/identity/identity.controller.ts \
  apps/backend/src/modules/identity/identity.module.ts \
  apps/backend/src/modules/bookings/bookings.service.ts \
  apps/backend/src/modules/bookings/bookings.service.spec.ts \
  packages/schemas/src \
  packages/api/src/endpoints.ts \
  apps/web/src/components/booking \
  apps/web/src/app/book/[providerId]
```

- [ ] **Step 3: Commit with a focused message**

```bash
git commit -m "$(cat <<'EOF'
Rebuild booking flow around real availability

4-step flow (Service · Date · Adresse · Récap) on /book/[providerId]:
- Subcategory-aware task taxonomy in @kayu/schemas
- Real provider availability via new GET /providers/:id/availability
- Slot-conflict 409 on POST /bookings + recovery banner
- Structured Kinshasa address (commune dropdown + free-text street)
- New Booking columns: subcategoryId, commune
- Recent-addresses endpoint for returning clients
- Mobile sticky bar + desktop sticky rail (md breakpoint)
- Draft persists to sessionStorage per provider
EOF
)"
```

- [ ] **Step 4: Verify**

```bash
git log -1 --stat
```

Expected: one commit with all the listed paths.

---

## Self-review

Walking the spec section-by-section against tasks:

- §"Page composition" → Tasks 11, 12, 20 (BookingShell + SidebarRail + Client wire-up).
- §"Client state" → Task 15 (booking-state.ts with reducer + sessionStorage).
- §"Submit payload" → Task 20, Step 1 (`handleConfirm`).
- §1 Step 1 (subcategory chips, tasks, duration, description) → Task 16.
- §2 Step 2 (calendar + period + slots + work window + empty state + auto-pick next) → Tasks 13 + 17.
- §3 Step 3 (city pill, recents, commune, street, repère) → Task 18.
- §4 Step 4 (recap cards, price, modifier, confirm) → Tasks 14 + 19 + 20.
- §5 Shared task taxonomy → Task 1.
- §6.1 Booking columns → Task 4.
- §6.2 Availability endpoint → Tasks 5 + 6 + 7.
- §6.3 Slot conflict on create → Task 8.
- §6.4 Recent addresses endpoint → Task 9.
- §6.5 DTO updates → Tasks 2 + 3 + 10.
- §7 Component breakdown → covered by Tasks 11–19.
- §8 Mobile vs desktop → covered by component implementations + UAT in Task 21.
- §9 Edge cases — provider with no schedule, 0 subcategories, slot overflow, description cap, unauth, past date, no internet → mostly covered by the implementations in Tasks 16–20; the description 500-char cap is implicit (set `maxLength={500}` on the textarea — adjust in Task 16 if reviewer wants explicit). The "no schedule" fallback CTA from §9 is intentionally deferred to UAT note in Task 21.
- §10 Icon mapping → applied in step components (Tasks 16–19) and recap (Task 19 uses Lucide).
- §11 Acceptance criteria → walked in Task 21.

**Placeholder scan:** the `(identityApi as any)(...)` cast in Task 18 Step 1 is intentionally flagged for resolution in Step 2 of the same task. No other placeholders.

**Type consistency:** `BookingDraft` shape used identically across Tasks 15, 16, 17, 18, 19, 20. `AvailabilityDay` shape matches between backend (Task 5), DTO (Task 3), and frontend component (Task 13). `subcategoryId` + `commune` flow consistently through DTO (Task 3), service (Task 8 Step 4), and submit payload (Task 20 Step 1).
