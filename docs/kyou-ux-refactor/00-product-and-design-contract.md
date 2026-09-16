# 00 - Product and Design Contract

Status: **Done** (frozen 2026-09-16). Change it only through a logged decision in `PROGRESS.md`.

## 1. Product truth in one paragraph

KAYOU connects clients in the DRC and Congo-Brazzaville with local service providers. A client searches by service and place, opens a provider profile, contacts the provider by in-app message, phone or WhatsApp, and can reserve a time slot from the provider's real schedule. The provider confirms or cancels, does the job, marks it completed, and optionally records the agreed cash price. The client leaves one rating and one comment. Providers can rate clients back. Admins verify providers, moderate content, curate places and lists, and edit public copy. Nothing is paid through the platform.

## 2. Roles

| Role | How obtained | Can |
| --- | --- | --- |
| Anonymous | — | Browse home, search, services, provider profiles without contacts, legal pages, contact form, campaign pages. |
| CLIENT | Default after phone OTP sign-up | Everything anonymous can, plus: message providers, call/WhatsApp when contacts are visible, book, cancel own bookings, review completed bookings, address book, notifications, report and block, delete account. |
| PROVIDER | Client who completes the 4-step provider wizard | Everything a client can as a client, plus: provider profile and media, schedule, receive and act on bookings, rate clients, earnings screen, verification documents. |
| ADMIN | Set in the database only | Admin console. Admins are never demoted, suspended or deleted through the UI. |

Rules:

- A user has exactly one role. CLIENT → PROVIDER upgrade is always allowed through the wizard. There is no downgrade in the UI.
- Providers see the provider space (`/mon-espace`) and are redirected away from client-only screens (`/mes-reservations`, `/avis`, `/adresses`). Clients are redirected away from provider-only screens. This mirrors K-YOU's `RequireRole`.
- Suspended users get a full-screen suspended notice on every route and every API call returns 403.
- Every role check is enforced on the server. Web guards are a convenience.

## 3. Booking lifecycle

```
PENDING ──confirm (provider)──▶ CONFIRMED ──complete (provider)──▶ COMPLETED
   │                                │
   └──cancel (client/provider/admin)┴──cancel (client/provider/admin)──▶ CANCELLED
```

- A booking is a provider, a client, a `scheduledAt` timestamp, a slot duration and buffer snapshotted from the provider's schedule, a timezone, the client's phone, and optional notes.
- Slots come only from the provider's schedule minus exceptions minus existing PENDING/CONFIRMED bookings. Creation locks the provider row and re-checks in a transaction.
- `IN_PROGRESS` is removed. `COMPLETED` is reachable from `CONFIRMED` only.
- On completion the provider may record `agreedPrice` (integer CDF). When present, `commissionPct` (10), `commissionAmt` and `providerNetAmt` are computed server-side and a `Transaction` of type `EARNING` is written. This feeds the earnings screen. Nothing else about money exists.
- Cancelling requires a reason from providers, optional from clients.
- One review per completed booking, from the client. One client review per completed booking, from the provider.

## 4. Contact rules

- In-app messaging is always available to signed-in users, subject to blocks.
- Phone, WhatsApp and email on a profile are visible to signed-in users unless the site setting `contacts_require_premium` is on and the provider tier is `FREE`. Anonymous users see a login wall.
- Blocking is symmetric for messaging and booking. Reports are admin-only reads.

## 5. Provider profile

Fields, in the order the wizard collects them:

1. Identity: display name, phone, WhatsApp, profile photo.
2. Services: category › subcategory › sub-subcategory (deepest chosen node is stored, ancestors derived), years of experience, skill references plus free-text skills, description.
3. Location: place reference chain (country › province › city › commune › quartier) with "my place is missing" suggestion, street address, GPS point.
4. Public profile: languages, intervention modes, optional indicative price (amount, currency, unit), weekly schedule, media (up to 12 images, up to 12 videos as YouTube links or uploads ≤ 25 MB), social links, terms acceptance.

Providers publish immediately with `verificationStatus = PENDING`. The verified badge comes from admin review of KYC documents (kept from KAYOU). Premium tier is a stored enum `FREE | VERIFIED | BOOSTED | ELITE` plus `premiumUntil`; there is no purchase flow, admins set it.

## 6. Taxonomy and references

- Categories: 19 top-level categories from K-YOU's `shared/taxonomy.json`, each with subcategories and, where present, sub-subcategories. Stored in `Category` and `Subcategory` where `Subcategory` nests one level via `parentId`. Admin CRUD kept. Launch leads keep referencing `Subcategory`.
- Places: `Place` rows with `kind` (COUNTRY, PROVINCE, CITY, TERRITORY, COMMUNE, SECTOR, CHIEFDOM, QUARTIER, VILLAGE), `parentId`, `aliases`, `active`, `mergedIntoId`, `source`. Seeded with the 26 DRC provinces and capitals, the 24 Kinshasa communes, the 10 Gombe quartiers, Congo-Brazzaville and Brazzaville. Users can suggest a missing place; suggestions never appear publicly before an admin approves.
- Lists: `ReferenceItem` rows with `type` (LANGUAGE, INTERVENTION_MODE, CURRENCY, PRICE_UNIT, SKILL), `label`, `aliases`, `active`, `mergedIntoId`, optional `parentId` (skills may hang under a Category). Admin CRUD plus merge.

## 7. Screen map: K-YOU route → KAYOU route

Every K-YOU screen is rebuilt. The KAYOU route is the canonical URL after the refactor. Old KAYOU paths listed in the last column get a permanent redirect for one release, then disappear.

| K-YOU screen | KAYOU route | Audience | Replaces (old KAYOU) |
| --- | --- | --- | --- |
| Home | `/` | public | `/` |
| Rechercher | `/rechercher` | public | `/services` |
| Prestataire (profile) | `/prestataire/[id]` | public, contact gated | `/providers/[id]` |
| Tous les services | `/services` | public | `/categories/[slug]` (category pages fold into search with `?category=`) |
| Premium | `/premium` | public | — |
| Contact | `/contact` | public | — |
| CGU | `/cgu` | public | — |
| Confidentialité | `/confidentialite` (+ `/delete-account` alias) | public | `/launch/confidentialite` stays for the campaign |
| Bienvenue (carousel) | `/bienvenue` | public, no shell | — |
| Login | `/login` | public, no shell | `/auth` |
| Register | `/register` | public, no shell | `/auth?mode=signup` |
| Devenir prestataire (wizard) | `/prestataire/nouveau` | signed in | `/pro/onboarding` |
| Modifier mon profil | `/prestataire/[id]/modifier` | owner or admin | `/pro/profile/*`, `/dashboard/settings` pro sections |
| Mon espace (provider dashboard) | `/mon-espace` | PROVIDER | `/pro`, `/dashboard/provider` |
| Mes réservations (client) | `/mes-reservations` | CLIENT | `/bookings`, `/dashboard/client` |
| Réservation détail | `/reservation/[id]` | participant | `/bookings/[id]` |
| Messagerie | `/messagerie` | signed in | `/messages` |
| Revenus | `/revenus` | PROVIDER | `/pro/earnings` |
| Avis | `/avis` | CLIENT | `/review/[providerId]` (review form moves onto the profile page) |
| Notifications | `/notifications` | signed in | — |
| Aide | `/aide` | signed in | — |
| Adresses | `/adresses` | CLIENT | — |
| Compte | `/compte` | signed in | `/dashboard/settings` |
| Vérification (KYC, kept) | `/verification` | PROVIDER | `/pro/verify` |
| Admin | `/admin?tab=…` | ADMIN | `/dashboard/admin*`, `/admin` |
| Campaign | `/launch`, `/launch/clients`, `/launch/providers`, `/launch/confidentialite` | public | unchanged paths |
| Agent concierge | — | — | not on `main`; lives on `feat/agent-concierge-phase-1`, out of scope |
| 404 | `*` | public | — |

Removed without replacement: `/book/[providerId]` (booking form lives on the profile page as in K-YOU), `/quotes/[id]`, `/pro/requests`, `/pro/devis/new`, `/design`, `/design-system`, `/dashboard`, `/dashboard/provider`.

## 8. Global shell

- **Desktop Navbar**: sticky, white 85% with blur, logo left, pill links centre (role-dependent set from K-YOU §Navbar), avatar + Connexion/Déconnexion right. No hamburger.
- **Mobile dock**: fixed bottom, 4 or 5 tabs by role, gold underline pill under the active tab with a spring shared-layout animation, safe-area padding. Tabs from K-YOU §MobileNav. Labels are shown (this overrides the old KAYOU "no labels on tab bar" rule).
- **Footer**: compact, three links (Contact, Confidentialité, Conditions). Shown only on `/`, `/services`, `/contact`, `/cgu`, `/confidentialite`. Never in signed-in journeys.
- **Auth canvas**: `/login`, `/register`, `/premium`, `/bienvenue` render outside the shell on the mint/cream radial canvas with a centred 480 px card. On mobile the card loses border and shadow.
- **Admin**: renders inside the shell with a 230 px left rail on `lg`, a scrolling top tab bar below.
- One `Layout` component. `AppShell`, the admin ops bar and the seven bespoke chromes are deleted.

## 9. Design tokens (replace `packages/ui/src/tokens.ts` values)

Colours (HSL for CSS variables, hex for reference):

| Token | Value |
| --- | --- |
| background | `48 20% 97%` ivory `#F8F8F3` |
| foreground | `172 60% 12%` forest ink |
| card / popover | `0 0% 100%` |
| primary | `165 74% 14%` `#0A3D36` |
| primary-foreground | `60 14% 97%` |
| secondary (mint surface) | `150 14% 95%` `#E9F0EB` |
| muted | `150 14% 94%`; muted-foreground `165 10% 40%` |
| accent (gold) | `43 100% 57%` `#FFBD25`; accent-foreground = primary |
| destructive | `0 72% 45%` |
| border | `155 21% 88%` `#DCE5DF`; input `150 14% 92%`; ring = primary |
| admin canvas | `#F4F6F3`; auth canvas `#F8FAF7` (mobile `#F8F8F3`) |

Semantic status colours: confirmed/verified emerald-50/700/200; pending/boosted amber-50/700/200; cancelled red-50/700/200; completed neutral muted; elite violet-50/600; messages blue-50/600. Stars always amber-400.

Category colours: one Tailwind colour per category as listed in K-YOU `src/lib/taxonomy.jsx`, stored on `Category.color`.

Typography: headings **Sora** (variable), body **Plus Jakarta Sans** (variable), mono system stack. Loaded through `next/font/google`. JetBrains Mono and Inter are removed.

Scale: page H1 `text-2xl sm:text-3xl font-extrabold tracking-tight`; hero `text-3xl sm:text-4xl md:text-5xl leading-[1.15]`; section H2 `text-base sm:text-lg font-extrabold`; body `text-sm`; captions `text-xs` / `text-[11px]`; eyebrow `10px / 800 / tracking .19em`.

Radii: `--radius 1.25rem`. Pills and all primary actions `rounded-full`; cards `rounded-2xl` / `rounded-3xl`; hero image `rounded-[2rem]`; fields and secondary actions 14 px.

Shadows: `soft 0 4px 24px -8px rgba(15,23,42,.12)`, `soft-lg 0 16px 48px -12px rgba(15,23,42,.18)`, `brand 0 16px 40px -12px hsl(primary-glow/.5)`. Cards use shadow, inputs use border.

Containers: marketing and search `max-w-7xl`; profile, messaging, services, contact `max-w-5xl`; dashboards `max-w-4xl`; utility pages `max-w-3xl`; auth card `max-w-md`; admin `max-w-[1500px]`. Padding `px-4 sm:px-6`.

## 10. Motion contract

From K-YOU `MOTION.md`:

- Screen enter: 240 ms opacity .45→1 and 7 px rise, re-keyed on pathname.
- Press: `:active { scale: .975 }` on buttons, pills, dock links; dock icons scale .87.
- Touch pulse: a 38 px gold ring at pointer-down, 420 ms, max 6 live, no React state.
- Dock indicator: shared-layout spring (stiffness 450, damping 34).
- Skeleton cards with a 1.4 s sheen while searching. **Skeletons, never spinners, on content.**
- Bottom sheets: spring (damping 28, stiffness 280) from y 100%; backdrop black/40; Escape closes; focus trapped.
- Wizards: `AnimatePresence mode="wait"`, x ±24, 0.28 s.
- `prefers-reduced-motion` disables all of the above.
- Focus visible: 3 px gold outline, 4 px offset.

## 11. Hard rules (replace the 2026-05 design-direction rules)

1. Lucide icons only. No emoji in product UI, including overlines.
2. Gradients are allowed only where K-YOU uses them: hero headline last two words, the emerald premium panel, the emerald→teal square icon tiles, the mesh background on marketing and auth canvases. Never on cards or list rows.
3. One primary action per screen region, gold or deep green pill.
4. Status is a pill; metadata is plain text.
5. Photography on category and hero tiles; medallion icons for the remaining categories.
6. Long text gets a "Voir plus / Voir moins" expander at 180 characters (profiles) or 3 lines (cards). Review comments capped at 500 characters with a counter.
7. Every list has an empty state with a dashed `rounded-3xl` card, an icon and one CTA.
8. Every form field has a visible label, 44 px minimum touch target, 12 px minimum text.
9. No spinners on content. Full-page loading only during the auth bootstrap.
10. 320 px must not overflow horizontally. Tested in workstream 10.

Superseded documents: `docs/DESIGN_SYSTEM.md` sections on colour, typography, radii, elevation and §16 "Don't list"; `docs/design-direction/index.html` in full. Both stay in the repo as history with a banner pointing here.

## 12. Copy and language

French only. All user-facing strings live in `apps/web/src/copy/*.ts` keyed modules per route group, not inline. This is the seam for a future locale layer. Site content editable by admins (hero title, subtitle, CTA, how-it-works blocks, premium block, maintenance banner, feature flags) is read from `SystemSetting` rows through `GET /settings/public` and overrides the module default when non-empty.
