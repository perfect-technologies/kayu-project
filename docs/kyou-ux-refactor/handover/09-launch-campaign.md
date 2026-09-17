# 09 → 10: launch campaign restyle and campaign-mode smoke

Workstream 09 moved `/launch`, `/launch/clients`, `/launch/providers` and `/launch/confidentialite` onto the K-YOU tokens with zero behaviour change. Decisions are logged in `PROGRESS.md` (rows prefixed "(09)"). This file is what 10 needs to re-run the campaign evidence before the release.

## What changed

- `app/launch/CampaignLanding.tsx`, `CampaignForm.tsx`, `confidentialite/page.tsx`: class names only, plus `.field` wrappers around inputs, selects and the textarea. No handler, state, event or copy line changed (the diff moves those lines only by indentation).
- `app/launch/CampaignHeader.tsx` (new): logo link (04's `Logo`) plus a right-hand slot, shared by the landing and the privacy notice.
- `globals.css`: one `.k-campaign` rule (the auth-canvas radial wash) next to the auth canvas; the reduced-motion `.k-campaign` block is unchanged.
- Unchanged: `page.tsx`, `clients/page.tsx`, `providers/page.tsx`, `campaign-data.ts`, every `src/lib/campaign-*` file, `proxy.ts`, `AppProviders.tsx`, the backend.

## Invariants the campaign tests read from source

`campaign-copy.test.mjs` and `campaign-routing.test.mjs` read the campaign files as text. Keep, literally:

- `className="k-campaign …"` on the root of `CampaignLanding.tsx` and `confidentialite/page.tsx`;
- `className="k-campaign-spinner …animate-spin"` on the submit spinner in `CampaignForm.tsx`;
- the French copy inline in those files (`KAYOU arrive bientôt à`, `href="/launch/confidentialite"`, `Version {privacyNoticeVersion}`, …);
- the reduced-motion `.k-campaign .k-campaign-spinner` and `.k-campaign :is(button, a, input, select, textarea, summary, [role="button"])` rules and `html { scroll-behavior: auto !important }` in `globals.css`.

## Re-running the smoke

`apps/web/scripts/campaign-smoke.mjs` records, for 17 form states (landing, both roles × step 1 / errors / step 2 / errors / filled / accepted, the role switch from the success card, a duplicate provider, the privacy notice, categories unavailable), the `[id],[name]` inventory, the aria/role/data attributes, the keyboard tab order and the funnel events (dataLayer pushes and `POST /api/launch/funnel-events` bodies). `--checks` adds overflow at 320/390/1440 on every route and on step 2, a visible focus indicator on every tab stop, and no transition or animation under `prefers-reduced-motion`.

```sh
# 1. disposable database (never the dev one)
docker exec kayu-postgres psql -U postgres -c "CREATE DATABASE kayu_09_campaign"
DATABASE_URL=…/kayu_09_campaign?schema=public npx prisma migrate deploy        # apps/backend
docker exec kayu-postgres sh -c 'pg_dump -U postgres --data-only -t "\"Category\"" -t "\"Subcategory\"" kayu_05_verify | psql -q -U postgres -d kayu_09_campaign'

# 2. backend with the launch flags (apps/backend, compiled dist)
DATABASE_URL=…/kayu_09_campaign?schema=public PORT=3011 \
  LAUNCH_PUBLIC_INTAKE_ENABLED=true LAUNCH_FUNNEL_EVENTS_ENABLED=true \
  LAUNCH_PRIVACY_NOTICE_VERSION=campaign-2026-07-25 LAUNCH_RATE_LIMIT_HASH_KEY=<32+ chars> \
  LAUNCH_INTAKE_IP_LIMIT=500 LAUNCH_FUNNEL_EVENT_IP_LIMIT=5000 node dist/main

# 3. web: rewrites bake BACKEND_URL at build time; the mode is read at runtime (apps/web)
BACKEND_URL=http://localhost:3011 NODE_ENV=production pnpm build
KAYOU_PUBLIC_WEB_MODE=campaign BACKEND_URL=http://localhost:3011 npx next start -p 3009
KAYOU_PUBLIC_WEB_MODE=campaign BACKEND_URL=http://localhost:1    npx next start -p 3019

# 4. record, compare with the 09 recording, then rebuild with the normal .env
PW_CHANNEL=chrome node scripts/campaign-smoke.mjs --base http://localhost:3009 --failure-base http://localhost:3019 \
  --out after.json --phones <9 digits> <9 digits> --checks --shots <dir>
node scripts/campaign-smoke.mjs --compare ../../docs/kyou-ux-refactor/handover/09-campaign-inventory-after.json after.json
```

Phones are the 9 national digits (`8…` or `9…`); use new ones per run because the intake limits repeated contacts. Truncate the lead tables first when row counts matter.

`09-campaign-inventory-before.json` (pre-restyle build) and `09-campaign-inventory-after.json` (final build) are the recordings behind the PROGRESS evidence. Their only difference is the removed `<img data-nimg>` of the old logo in every state (decorative; the logo is now an inline `aria-hidden` SVG).

## Expected results

- Five campaign test files: 28/28.
- Redirects in campaign mode: `/services`, `/rechercher`, `/prestataire/*`, `/login`, `/register` → `/launch` (query kept; `/login` and `/register` keep only attribution keys); `/providers/x` and `/auth` reach `/launch` in two hops through the `next.config.ts` rows. `/` stays 200 (marketplace home), as on `main`.
- Database after one provider, one client and one duplicate provider: 1 `ProviderLead`, 1 `ClientWaitlistLead`, 3 `LeadSubmissionEvent` (`PROVIDER CREATED`, `CLIENT CREATED`, `PROVIDER DUPLICATE_REVIEW_REQUIRED`), 0 `User`, 0 `Provider`.
- Events per journey, in order: `launch_landing_viewed`, `launch_role_selected`, `launch_form_started`, one `launch_form_validation_failed` per missing field, `launch_lead_submitted`; the collector maps `subcategoryId` to `primarySubcategoryId` / `neededSubcategoryIds` and `commune` to `homeCommune` for providers.

## Gotcha found on the way

`scripts/overflow-check.mjs` (04) compares `scrollWidth` with `window.innerWidth`. With Playwright `isMobile: true`, Chrome widens the layout viewport to fit overflowing content, so an 11 px overflow at 320 reads as `331 === 331` and passes. `campaign-smoke.mjs` compares with the requested width instead. See the open note in `PROGRESS.md`.
