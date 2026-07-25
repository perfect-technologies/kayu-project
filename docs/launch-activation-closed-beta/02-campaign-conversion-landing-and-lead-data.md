# 02 — Campaign Conversion, Landing Page, And Lead Data

## Outcome

Ship an honest, French-first, exceptionally short mobile campaign that converts real provider and client interest into dedicated lead records without creating accounts, and gives a non-marketing team a practical way to learn which acquisition channels create useful traction.

This workstream owns both conversion design/measurement and the technical intake contract. A fast endpoint with a confusing or long form is not done.

## Conversion Principles

1. **French first.** French is the default campaign language and all critical comprehension, validation, consent, and success copy works without a second language. A short Lingala clarification may be tested later where operators see a real comprehension need.
2. **Phone first.** Design at 320–430px before desktop. The experience must remain fully responsive through tablet and large desktop widths.
3. **One immediate choice.** The first meaningful action is a clear choice between `Je suis prestataire` and `Je cherche un prestataire`.
4. **One short form per path.** Show only fields required to contact and triage the lead. Collect richer profile/job data after contact or after a post-beta invitation.
5. **Progressive disclosure.** Optional details stay collapsed or appear only after the relevant choice; never show a long marketplace-onboarding form during campaign.
6. **No account vocabulary.** Use `Rejoindre la liste` / `Être recontacté`, not `Créer mon compte`.
7. **Fast and resilient.** Optimize for low-to-mid-range phones and variable Kinshasa mobile networks.
8. **Quality over vanity.** Optimize completed, valid, contactable, qualified/eligible leads—not raw clicks or unverified form submits.

## Public Experience

In `CAMPAIGN` phase:

- `/` is the canonical campaign landing page in production.
- It explains that KAYOU is preparing a limited Kinshasa beta.
- The primary choices are “Je suis prestataire” and “Je cherche un prestataire.”
- Existing public marketplace discovery/profile/booking routes must redirect to the campaign experience or return a clear not-yet-open state unless explicitly allowed for staff QA.
- No seeded provider, booking, review, count, testimonial, or “available now” claim appears as real campaign evidence.
- Existing marketplace components can remain in the repository; they are not deleted merely to hide them.
- Both role paths and their primary CTAs are visible without requiring precise scrolling or reading a long page.
- Category selectors show the full active KAYOU hierarchy; they do not introduce a home-services umbrella or hide non-priority categories.
- Provider and `J’ai besoin d’un service` client-demand forms launch together from day one; a provider-readiness target cannot hide or defer the client form.

In `CLOSED_BETA`:

- The public landing page may continue collecting leads.
- Only authenticated, entitled beta participants may cross into protected marketplace flows.

Follow [`../design-direction/index.html`](../design-direction/index.html) and [`../DESIGN_SYSTEM.md`](../DESIGN_SYSTEM.md): French-first copy, mobile-first layout, one primary action, no fake imagery/data, no gradient surfaces beyond the permitted brand headline treatment, and accessible form controls.

## Recommended Page Shape

Keep the page compact:

1. Hero: what KAYOU is preparing, where, and that the beta is limited.
2. Two unmistakable paths: provider and client.
3. Three short reassurance points: how selection works, no account yet, cash-first if a beta job happens.
4. The selected short form.
5. Privacy/withdrawal and a compact FAQ only for genuine objections.

Avoid long feature grids, app screenshots, fake social proof, generic testimonials, and repeated CTA sections. On mobile, a visitor should understand the offer and start the correct form within one screen and a short scroll.

## Minimum Form Contract

Provider required fields:

- First name.
- Phone number.
- Primary service/subcategory.
- Home or main service commune.
- Experience band: `STARTING`, `ONE_TO_THREE_YEARS`, `FOUR_PLUS_YEARS`.
- Operational contact/privacy consent.

Client required fields:

- First name.
- Phone number.
- Needed service/subcategory.
- Commune.
- Timing: within 7 days, within 30 days, later/exploring.
- Operational contact/privacy consent.

Optional, progressively disclosed fields:

- Email.
- One or two additional service categories.
- Other service communes.
- WhatsApp/preferred contact.
- Short summary, capped at 300 characters.
- Marketing consent, separate and unchecked.

Do not require last name, exact address, full service zones, long biography, portfolio, documents, detailed job description, password, OTP, or account/profile information on the campaign form.

Aim for one visible form screen or at most two short steps with a persistent progress cue. Never require more than one field per piece of information, and preserve values across validation/retry.

## Copy Contract

Required ideas:

- “KAYOU prépare un bêta-test privé à Kinshasa.”
- Submitting expresses interest; it does not create an account or guarantee admission.
- Selected participants will be contacted for the closed beta.
- Providers do not receive guaranteed work or income.
- Clients are not promised an immediately available provider.
- Payment remains cash directly between client and provider if a beta job occurs.
- Privacy/consent purpose and withdrawal route are visible.

Avoid:

- “Créez votre compte” during campaign.
- “Inscription réussie” when only a lead was captured.
- “Rejoignez le marketplace maintenant.”
- Live-provider or booking counts derived from seed/demo data.
- Payment-protection, escrow, payout, or mobile-money claims.
- Marketing jargon, long paragraphs, or abstract promises that do not explain the next step.

Example CTA labels:

- Provider: `Je suis prestataire — être recontacté`
- Client: `Je cherche un prestataire — rejoindre la liste`
- Submit: `Envoyer ma demande`

Final copy must be reviewed on a phone by a fluent French speaker familiar with the Kinshasa audience.

## Practical Traction And Acquisition Plan

The first goal is not maximum reach. It is finding repeatable sources of contactable, relevant provider supply and client demand in the selected categories/communes.

### Channel hypotheses

Provider supply:

- Direct outreach by the operations team in selected trades/communes.
- WhatsApp trade/community groups and shareable referral links.
- Referrals from qualified providers.
- Partnerships with small training centers, associations, shops, or local service networks.
- Small, category-specific Meta tests only after the organic/direct message is understood.

Client demand:

- WhatsApp/community sharing around specific service needs.
- Category-specific Meta ads targeted to pilot geography.
- Local community pages or partner referrals.
- Invite/referral links from trusted early participants.

Do not launch every channel at once. Give every channel/creative a stable attributed link and named owner.

### Iterative cadence

Cycle 0:

- Validate French copy and both forms with 5–8 target users on phones.
- Confirm attribution and lead-quality reporting.

Cycle 1:

- Run direct/organic outreach in one or two home-services priority groups while keeping all campaign categories lead-capable.
- Learn objections, misunderstood fields, and contactability before paying for reach.

Cycle 2:

- Test a small number of paid/community creatives, one audience/message change at a time.
- Use a predefined spend/time cap.

Each following cycle:

- Review source → completed lead → valid/contactable → qualified/eligible yield.
- Stop sources with spam/irrelevant leads even if click conversion looks good.
- Double down only where operators can explain why the message/channel works.
- Record copy, audience, channel, dates, spend, and outcome in an experiment log.

### Primary acquisition decisions

For every source, answer:

- Did people choose the intended provider/client path?
- Did they complete the short form?
- Were they contactable?
- Did they fit category/commune scope?
- Did home-priority outreach create the provider density needed for the 200-provider matching gate?
- What did a valid and qualified/eligible lead cost in money and operator time?

Raw impressions, clicks, and follower counts are diagnostic only.

## Routes And API Boundary

Suggested public routes:

- `GET /` — campaign landing.
- `GET /launch/providers` — provider interest form, or an anchored section on `/`.
- `GET /launch/clients` — client interest form, or an anchored section on `/`.
- `POST /api/launch/provider-leads` — unauthenticated lead intake.
- `POST /api/launch/client-leads` — unauthenticated lead intake.

The Next.js app has no API routes today; keep NestJS as the authoritative API unless a later decision explicitly changes architecture.

Public responses must be enumeration-safe:

```json
{
  "accepted": true,
  "message": "Merci. Votre intérêt a bien été reçu."
}
```

Return the same accepted response for a new lead and an idempotent duplicate. Do not reveal lead ID, qualification state, whether contact already exists, or account existence.

## Shared DTO Contract

### Provider Lead Request

```ts
type CreateProviderLeadDto = {
  firstName: string;                 // 2–80, trimmed
  phone: string;                     // normalized server-side to E.164
  email?: string;                    // optional, normalized lowercase
  primarySubcategoryId: string;      // active taxonomy ID
  additionalSubcategoryIds?: string[]; // max 2, distinct
  experienceBand: "STARTING" | "ONE_TO_THREE_YEARS" | "FOUR_PLUS_YEARS";
  homeCommune: string;               // controlled pilot-compatible value
  serviceCommunes?: string[];        // optional; max 5 controlled values
  hasWhatsApp?: boolean;
  summary?: string;                  // optional, max 300; treat as untrusted
  operationalConsent: true;
  marketingConsent?: boolean;        // default false
  privacyNoticeVersion: string;      // server validates current accepted version
  attribution?: LeadAttributionDto;
  website?: string;                  // honeypot; valid human submission leaves blank
};
```

### Client Lead Request

```ts
type CreateClientLeadDto = {
  firstName: string;                 // 2–80
  phone: string;
  email?: string;
  commune: string;
  neededSubcategoryIds: string[];    // 1–3 active taxonomy IDs
  timing: "WITHIN_7_DAYS" | "WITHIN_30_DAYS" | "LATER" | "EXPLORING";
  needSummary?: string;              // max 300; no exact address prompt
  preferredContact?: "PHONE" | "WHATSAPP";
  operationalConsent: true;
  marketingConsent?: boolean;
  privacyNoticeVersion: string;
  attribution?: LeadAttributionDto;
  website?: string;
};
```

### Attribution

```ts
type LeadAttributionDto = {
  source?: string;   // allowlisted/normalized, e.g. facebook, instagram, referral
  medium?: string;   // allowlisted/normalized
  campaign?: string; // max 100
  content?: string;  // max 100
  referrerHost?: string; // hostname only, not full URL/query
};
```

Never accept status, qualification fields, admin notes, linked user IDs, beta membership, or invite state from a public DTO.

The server derives any home-services `priorityGroupKey` from the reviewed taxonomy mapping in `01`; the browser cannot declare a lead priority. A valid active non-priority category remains acceptable.

## Conversion Measurement Contract

Measure separately for provider and client paths:

- Landing views.
- Path selections.
- Form starts.
- Validation failures by field/error code.
- Completed lead submissions.
- Valid leads.
- Contactable leads.
- Qualified provider / eligible client leads.
- Source, medium, campaign, content, device class, and cohort.
- Optional paid spend and operator time by campaign/source.

Core formulas:

- `landing conversion = completed leads / eligible landing views`
- `form completion = completed leads / form starts`
- `valid lead rate = valid leads / completed leads`
- `contactable rate = contacted leads / reviewed completed leads`
- `quality yield = qualified or eligible leads / reviewed completed leads`
- `cost per completed lead = attributed spend / completed leads`
- `cost per qualified/eligible lead = attributed spend / qualified or eligible leads`

Initial diagnostic targets:

- At least 70% form completion from form start on mobile.
- Median completion time at most 90 seconds.
- At least 80% valid/contactable rate after the first 25 completed leads per path.
- Mobile Core Web Vitals at the 75th percentile: LCP at most 2.5s, INP at most 200ms, CLS at most 0.1.
- Zero required field that operations cannot explain as necessary for first contact/triage.

Landing conversion has no universal target at the start because intent varies heavily by channel. Establish the baseline by source, then improve without reducing lead quality.

Event payloads follow `01`; event receipt must not be required for form submission success.

## Persistence Contract

### `ProviderLead`

Required fields:

- `id`, `createdAt`, `updatedAt`, `submittedAt`.
- Normalized contact fields: `phoneE164`, optional `emailNormalized`.
- Form fields above.
- `status` using the provider lifecycle in `00`, default `SUBMITTED`.
- `consentAt`, `consentVersion`, `operationalConsent`, `marketingConsent`.
- Normalized attribution columns and `campaignKey`.
- Conversion timestamps sufficient to calculate submission latency in privacy-safe duration buckets.
- `isTest` default false; only trusted server/admin path may set true.
- `firstReviewedAt`, `lastContactedAt`, `qualifiedAt`, `rejectedAt`, `withdrawnAt`.
- `assignedAdminUserId`, decision reason code, private notes.
- After valid activation only: `activatedUserId`, `activatedProviderId`, `activatedAt`.

### `ClientWaitlistLead`

Equivalent audit/contact/consent/attribution fields plus:

- `commune`, `neededSubcategoryIds`, `timing`, optional need summary.
- Client lifecycle status, default `SUBMITTED`.
- After valid activation only: `activatedUserId`, `activatedAt`.

### Deduplication

- Unique provider lead identity is normalized phone within provider leads.
- Unique client lead identity is normalized phone within client leads.
- A person may intentionally exist in both lead types; do not merge roles automatically.
- Re-submission is idempotent: update safe participant-owned fields, refresh `updatedAt`, preserve the strongest lifecycle state, and append an audit/submission event.
- Re-submission must never reset `QUALIFIED`, `REJECTED`, `WITHDRAWN`, `INVITED`, or `ACTIVATED` without an authorized admin action.
- A new marketing-consent `true` may be recorded with timestamp/version; never infer it from prior operational consent.

If detailed campaign history is needed, use a small `LeadSubmissionEvent`/audit record rather than duplicating lead rows.

## Abuse And Safety

- Apply per-IP and per-normalized-contact rate limits to both endpoints.
- Honeypot and minimum-form-time checks may reduce automated spam but must not be the only control.
- Validate body size and reject unknown/oversized free text.
- Normalize and validate phone/category/commune server-side.
- Do not log request bodies.
- Use generic error responses for duplicates and known contacts.
- Add a kill switch for public intake independent from beta access.
- Define alert thresholds for sustained error rate, spam spike, and database failure.

Rate limiting was previously deferred in the production-readiness work; public campaign endpoints make focused intake rate limiting a requirement for this phase.

## Implementation Boundaries

Likely shared/backend files:

- `packages/schemas/src/` for DTOs, enums, and response schemas.
- `apps/backend/prisma/schema.prisma` plus a forward-only migration.
- New focused launch/leads module under `apps/backend/src/modules/`.
- `packages/api/src/endpoints.ts` for typed public submit methods.

Likely web files:

- `apps/web/src/app/page.tsx`.
- A focused `apps/web/src/app/launch/` route/component area.
- Server-owned phase retrieval and route gating.
- `apps/web/src/lib/launch-flags.ts` only for presentation; not authorization.

Do not entangle campaign form persistence with `IdentityService.getOrCreateUser`, provider onboarding, or Supabase service-role account creation.

## Conversion And Usability QA

Before public spend:

- Five to eight target users complete the correct path on their own phone without coaching.
- Observe time-to-path, completion time, hesitation, errors, and comprehension of “lead only/no account.”
- Test 320px, 360px, 390px, 430px, tablet, and desktop widths.
- Test slow mobile network, disabled analytics, API retry, and browser back/refresh.
- Verify autofill, phone keyboard, large tap targets, visible labels, focus order, and no layout shift when errors appear.
- Review actual campaign URLs and attribution in the production report.

The team may change copy/layout within the contract based on evidence. Changes to fields, consent, lifecycle, or claims require contract review.

## Tests

Automated:

- DTO field limits, taxonomy/commune validation, E.164 normalization.
- New lead persistence.
- Idempotent duplicate behavior and generic response.
- Status cannot be set/reset publicly.
- No `User` or `Provider` row is created.
- No Supabase admin/auth method is called.
- Consent version and timestamps persist.
- Rate limit, honeypot, oversized body, and unsafe attribution behavior.
- Analytics payload excludes PII.
- Campaign route mode does not expose marketplace data.
- Provider/client category selectors match the complete active taxonomy and contain no synthetic home-services umbrella.
- Funnel events fire once with correct role/source and no PII.
- Form success does not depend on analytics availability.
- Responsive and mobile performance targets are measured.

Manual:

- 320–430px phone, tablet, and desktop form usability.
- French copy and validation.
- Keyboard, focus, labels, error summary, contrast, reduced motion.
- Slow/failed request and safe retry.
- Production-like submission visible only to authorized admin operations.

## Acceptance Criteria

- Both campaign paths store dedicated lead records and nothing in auth/marketplace identity tables.
- Both provider and client-demand paths are public from G1/day one even though client marketplace invitations and matching remain gated.
- French copy is concise, locally reviewed, and clearly distinguishes provider/client paths.
- At 320–430px, path selection and form completion require no horizontal scrolling and no desktop-only interaction.
- Each path uses only the minimum required fields listed above; optional details use progressive disclosure.
- A target user can normally complete either form in 90 seconds or less.
- Mobile form-start-to-completed-lead conversion, valid/contactable yield, and source quality are reported separately by path.
- Attribution survives the full form flow and distinguishes each active channel/creative.
- The initial traction experiment has a named channel, attributed link, owner, time/spend cap, and post-cycle decision.
- Mobile Core Web Vitals meet the stated p75 targets before scaling paid acquisition.
- A database/auth diff test proves no Supabase user, local `User`, or `Provider` is created.
- The public campaign has no fake providers, reviews, bookings, availability, or counts.
- All active categories remain selectable and lead-capable; home-services priority is measured as an operational segment rather than a public-category restriction.
- Duplicate submissions are safe and non-enumerating.
- Admin-only fields cannot be set through public payloads.
- Required consent is explicit; marketing consent is separate and optional.
- Public intake has focused abuse protection and a kill switch.
- Campaign and marketplace access phases are server-enforced.
- Relevant build, type-check, backend tests, and manual accessibility smoke pass.
