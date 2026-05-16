# Header Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the global header consistent across guests/clients/providers — one logo, three correct nav items, with `Devenir pro` hidden for logged-in providers.

**Architecture:** All changes are in one component, `apps/web/src/components/layout/Header.tsx`. The static module-level `navigation` constant is replaced by an auth-derived list computed inside the component (it needs `user`); both the desktop bar and the mobile drawer already `.map()` over `navigation`, so deriving it once fixes both surfaces with no further wiring. The duplicate text wordmark is deleted; the logo image is enlarged.

**Tech Stack:** Next.js App Router, React client component, `next/image`, existing `useAuth()` context. No web component test harness exists in this repo (web verification is `npm run type-check` + manual visual check; only the backend uses `node:test`). TDD is therefore adapted: `type-check` is the automated gate and behavior is verified via an explicit manual checklist. No per-task commits — the full diff is delivered for review in one piece (project owner preference).

**Spec:** `docs/superpowers/specs/2026-05-16-header-consistency-design.md`

---

### Task 1: Derive nav from auth, remove duplicate wordmark, enlarge logo

**Files:**
- Modify: `apps/web/src/components/layout/Header.tsx`

- [ ] **Step 1: Delete the static module-level `navigation` constant**

Remove this block (currently lines ~28–33), including the trailing blank line before `export function Header()`:

```tsx
const navigation = [
  { name: "Trouver un pro", href: "/services" },
  { name: "Catégories", href: "/services" },
  { name: "Comment ça marche", href: "/#how-it-works" },
  { name: "Devenir pro", href: "/services" },
];
```

- [ ] **Step 2: Compute the nav list from auth state inside the component**

Immediately after the existing line `const { user, isAuthenticated, logout } = useAuth();` (inside `Header()`), add:

```tsx
  const isProvider = user?.role === "PROVIDER";
  const navigation = [
    { name: "Trouver un pro", href: "/services" },
    { name: "Comment ça marche", href: "/#how-it-works" },
    ...(isProvider ? [] : [{ name: "Devenir pro", href: "/auth?mode=signup" }]),
  ];
```

No change is needed at the two `navigation.map(...)` call sites (desktop `<nav>` and the mobile drawer) — they already iterate this variable. `Catégories` is gone because it is no longer in the array; `Devenir pro` now points at `/auth?mode=signup` and is omitted entirely for providers.

- [ ] **Step 3: Remove the duplicate text wordmark and enlarge the logo image**

Replace the brand `<Link href="/">` block (currently lines ~68–88):

```tsx
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <Image
              src="/kayou-logo-transparent.png"
              alt="KAYOU"
              width={30}
              height={30}
              className="h-[30px] w-auto"
              priority
            />
            <span
              style={{
                fontFamily: "var(--k-font-display)",
                fontWeight: 800,
                fontSize: 22,
                letterSpacing: "-0.02em",
                color: "var(--k-text-primary)",
              }}
            >
              KAYOU
            </span>
          </Link>
```

with:

```tsx
          <Link href="/" className="flex shrink-0 items-center">
            <Image
              src="/kayou-logo-transparent.png"
              alt="KAYOU"
              width={216}
              height={90}
              className="h-9 w-auto"
              priority
            />
          </Link>
```

Notes: `h-9` = 36px rendered height (was 30px). `width={216} height={90}` preserves the asset's ~2.4:1 aspect ratio at ~2.5× the rendered size so Next.js serves a sharp image. The `gap-2.5` is dropped since there is no longer a second element to space.

- [ ] **Step 4: Type-check**

Run: `cd apps/web && npx tsc -p tsconfig.json --noEmit`
Expected: exits 0, no errors. (If `user?.role` typing complains, confirm the literal `"PROVIDER"` matches the role union from `useAuth()`/`AuthContext`; it is the same literal already used elsewhere in this file for `dashboardHref`.)

---

### Task 2: Update DESIGN_SYSTEM.md nav list to match

**Files:**
- Modify: `docs/DESIGN_SYSTEM.md` (§9.1, line ~638)

- [ ] **Step 1: Update the documented web header nav list**

In §9.1 → "Web (1024+)", replace this text in item 1:

```
1. **Sticky translucent header** (backdrop blur, 1px border-bottom on scroll) — logo, nav links (Trouver un pro · Catégories · Comment ça marche · Devenir pro), Se connecter / S'inscrire
```

with:

```
1. **Sticky translucent header** (backdrop blur, 1px border-bottom on scroll) — logo (image wordmark only, no separate text), nav links (Trouver un pro · Comment ça marche · Devenir pro — `Devenir pro` hidden for logged-in providers), Se connecter / S'inscrire for guests / avatar menu when logged in
```

- [ ] **Step 2: Sanity-check the edit**

Run: `grep -n "Trouver un pro" docs/DESIGN_SYSTEM.md`
Expected: the §9.1 line no longer contains `Catégories`; no other occurrences changed.

---

### Task 3: Manual verification across all audiences

**Files:** none (verification only)

- [ ] **Step 1: Start the web app**

Run: `cd apps/web && npm run dev`
Open `http://localhost:3000`.

- [ ] **Step 2: Verify logo + guest nav (desktop)**

Confirm:
- The header shows the `kayou` logo image exactly once, with **no** "KAYOU" text beside it, at ~36px height and sharp (not blurry/stretched).
- Desktop nav (widen window to ≥1024px) shows exactly: `Trouver un pro`, `Comment ça marche`, `Devenir pro`. No `Catégories`.
- `Trouver un pro` → `/services`; `Comment ça marche` → `/#how-it-works`; `Devenir pro` → `/auth?mode=signup`.
- Right side shows `Se connecter` + `S'inscrire`.

- [ ] **Step 3: Verify guest nav (mobile)**

Narrow the window to ~360px (or device emulation). Open the hamburger drawer. Confirm the same 3 items appear (`Trouver un pro`, `Comment ça marche`, `Devenir pro`) plus `Se connecter` / `S'inscrire`. Logo image still single, no text.

- [ ] **Step 4: Verify client (logged-in non-provider)**

Log in as a CLIENT account. Confirm desktop + mobile drawer still show all 3 nav items including `Devenir pro`, and the right side shows the avatar control (not login buttons).

- [ ] **Step 5: Verify provider**

Log in as a PROVIDER account. Confirm desktop **and** mobile drawer show only `Trouver un pro` and `Comment ça marche` — `Devenir pro` is absent. Avatar control present.

- [ ] **Step 6: Final type-check**

Run: `cd apps/web && npx tsc -p tsconfig.json --noEmit`
Expected: exits 0.

---

## Delivery

No commits are made during execution. After Task 3 passes, stop and present the complete diff (`Header.tsx` + `DESIGN_SYSTEM.md`) for the project owner to review in one piece, per their standing "review the full diff before anything ships" preference.

## Self-Review

- **Spec coverage:** Logo dedupe → Task 1 Step 3. Nav 3-item + correct hrefs → Task 1 Steps 1–2. Provider exception → Task 1 Step 2 (`isProvider` spread). Identical desktop/mobile → unchanged shared `navigation.map`, confirmed in Task 3 Steps 3/5. `DESIGN_SYSTEM.md` §9.1 update → Task 2. Acceptance criteria (`type-check` passes, per-audience states) → Task 1 Step 4, Task 3. All spec sections covered.
- **Placeholder scan:** No TBD/TODO/"handle edge cases"; every code step shows full code.
- **Type consistency:** `navigation` keeps the same `{ name, href }` shape the existing `.map()` call sites expect; `user?.role === "PROVIDER"` reuses the exact literal already present in this file for `dashboardHref`.
