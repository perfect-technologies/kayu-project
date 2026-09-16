# 01 - Domain and Schema Reset

## Objective

Replace the marketplace half of `apps/backend/prisma/schema.prisma` with a schema that carries exactly the K-YOU product model, keeps the launch-lead and campaign tables byte-for-byte, and ships as a single new baseline migration.

## Severity

P0. Every other workstream builds on this schema.

## Owns

- `apps/backend/prisma/schema.prisma`
- `apps/backend/prisma/migrations/**` (squash)
- `apps/backend/prisma/seed.ts`, `seed-categories.ts`, `seed-demo.ts`, new `seed-places.ts`, `seed-references.ts`, `seed-settings.ts`
- `apps/backend/src/modules/launch-leads/launch-leads.migration-integrity.spec.ts` (re-pin)
- `apps/backend/src/database/*` (unchanged unless needed)

## In scope

- Remove models, enums and relations for the dropped domains.
- Add the models below.
- Regenerate one `0_init` baseline. Delete the six existing migration folders. Keep `migration_lock.toml`.
- Re-pin the protected-migration checksum test to the new baseline so the launch-leads integrity spec still guards its tables.
- Rewrite the seeds against the new models.

## Out of scope

- Any service or controller change (workstream 02).
- Data preservation. Full reset is the agreed policy.

## Removed models and enums

| Removed | Reason |
| --- | --- |
| `JobRequest`, `JobRequestMatch`, `JobRequestStatus` | Quote marketplace dropped |
| `Quote`, `QuoteLineItem`, `QuoteStatus` | Quote marketplace dropped |
| `FinalOffer`, `FinalOfferStatus` | Agreed price folded into `Booking` |
| `Payout`, `PayoutOperator`, `PayoutStatus` | No payouts |
| `TrustScore`, `TrustLevel`, `ProviderBadge`, `BadgeType` | Replaced by `verificationStatus` + `premiumTier` |
| `Dispute`, `DisputeEvidence`, `DisputeStatus`, `DisputeSeverity`, `DisputeOrigin` | Replaced by `Report` + `Block` + admin moderation |
| `Favorite` | Not in the K-YOU UX |
| `VisibilitySettings`, `VisibilityLevel` | Contact gating is a site setting + premium tier |
| `Subscription` | Premium is an admin-set tier on `Provider` |
| `Certification`, `CertificationDoc`, `DocType` | KYC documents cover identity; diplomas are not shown |
| `PortfolioItem`, `PortfolioProject`, `PortfolioImage`, `PortfolioImageType` | Replaced by `ProviderMedia` |
| `Skill` | Replaced by `ProviderSkill` (reference) + `Provider.freeSkills` |
| `ServiceZone` | Replaced by `ProviderPlace` |
| `AvailabilitySchedule` | Replaced by `AvailabilityRule` (multi-range) |
| `ClientTrustLevel`, `User.clientScore`, `User.clientTrustLevel` | Client reputation becomes a computed average from `ClientReview` |
| `User.onboardingStep`, `User.onboardingDraft` | The wizard keeps its draft in the browser (sessionStorage) as K-YOU does; nothing server-side until publish |
| `NotificationType` members `PAYMENT_RECEIVED`, `CERTIFICATION_VERIFIED`, `BADGE_EARNED`, `JOB_REQUEST_*`, `QUOTE_*`, `FINAL_OFFER_*`, `BOOKING_STARTED` | Domains gone |
| `BookingStatus.IN_PROGRESS` | Not in the K-YOU flow |
| `TransactionType.PAYOUT`, `REFUND` | Ledger keeps `EARNING` and `BONUS` only |

## Kept unchanged

`ProviderLead`, `ClientWaitlistLead`, `LeadSubmissionEvent`, `CampaignFunnelEvent`, `LeadTaxonomySnapshotOrphan`, `ProviderLeadAdditionalSubcategory`, `ClientWaitlistLeadSubcategory` and all their enums. `SystemSetting`. `ActivityLog`. `Notification` (type enum trimmed).

`AgentConversation` and `AgentMessage` are **not** on `main` (they exist only on `feat/agent-concierge-phase-1`) and are not part of this baseline. When that branch is rebased later, it adds its own migration on top of `0_init`.

## Target schema (marketplace half)

Field names are camelCase Prisma; the API exposes the same names. Money is integer CDF. Times of day are `"HH:mm"` strings. Dates are `timestamptz`.

```prisma
model User {
  id              String    @id @default(cuid())
  authUserId      String    @unique
  email           String?   @unique
  phone           String?   @unique
  firstName       String?
  lastName        String?
  avatar          String?
  role            UserRole  @default(CLIENT)
  roleSelectedAt  DateTime?
  bio             String?
  gender          String?
  birthdate       DateTime?
  placeId         String?
  place           Place?    @relation(fields: [placeId], references: [id], onDelete: SetNull)
  country         String    @default("RDC")
  isActive        Boolean   @default(true)     // false = suspended
  suspendedAt     DateTime?
  suspendedReason String?
  emailVerifiedAt DateTime?
  phoneVerifiedAt DateTime?
  lastLoginAt     DateTime?
  termsAcceptedAt DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  provider              Provider?
  bookingsAsClient      Booking[]      @relation("ClientBookings")
  reviewsGiven          Review[]
  clientReviewsReceived ClientReview[]
  conversationsAsClient Conversation[] @relation("ClientConversations")
  messages              Message[]
  notifications         Notification[]
  addresses             Address[]
  reportsFiled          Report[]       @relation("ReportsFiled")
  blocksGiven           Block[]        @relation("BlocksGiven")
  blocksReceived        Block[]        @relation("BlocksReceived")
  suggestions           PlaceSuggestion[]
  activityLogs          ActivityLog[]
  agentConversations    AgentConversation[]

  @@index([role])
  @@index([placeId])
  @@index([isActive])
  @@index([createdAt])
}

enum UserRole { CLIENT PROVIDER ADMIN }

model Provider {
  id                 String   @id @default(cuid())
  userId             String   @unique
  user               User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  displayName        String
  description        String?
  yearsExperience    Int?
  phone              String?
  whatsapp           String?
  email              String?
  profilePhoto       String?
  subcategoryId      String                          // deepest chosen taxonomy node
  subcategory        Subcategory @relation(fields: [subcategoryId], references: [id], onDelete: Restrict)
  placeId            String?                         // deepest chosen place
  place              Place?   @relation(fields: [placeId], references: [id], onDelete: SetNull)
  addressLine        String?
  latitude           Float?
  longitude          Float?
  freeSkills         String[] @default([])
  pricingAmount      Int?
  pricingCurrencyId  String?                         // ReferenceItem CURRENCY
  pricingUnitId      String?                         // ReferenceItem PRICE_UNIT
  timezone           String   @default("Africa/Kinshasa")
  slotDurationMin    Int      @default(60)
  slotBufferMin      Int      @default(0)
  youtubeUrl         String?
  instagramUrl       String?
  tiktokUrl          String?
  facebookUrl        String?
  isAvailable        Boolean  @default(true)
  hidden             Boolean  @default(false)       // admin unpublish
  verificationStatus VerificationStatus @default(PENDING)
  premiumTier        PremiumTier @default(FREE)
  premiumUntil       DateTime?
  ratingAvg          Decimal  @default(0) @db.Decimal(2, 1)
  ratingCount        Int      @default(0)
  completedJobs      Int      @default(0)
  publishedAt        DateTime @default(now())
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  skills           ProviderSkill[]
  languages        ProviderReference[] @relation("ProviderLanguages")
  interventionModes ProviderReference[] @relation("ProviderModes")
  media            ProviderMedia[]
  availabilityRules AvailabilityRule[]
  availabilityExceptions AvailabilityException[]
  bookings         Booking[]
  reviews          Review[]
  clientReviewsGiven ClientReview[]
  conversations    Conversation[]
  transactions     Transaction[]
  verificationDocs VerificationDoc[]

  @@index([subcategoryId])
  @@index([placeId])
  @@index([hidden, isAvailable])
  @@index([verificationStatus])
  @@index([premiumTier])
  @@index([ratingAvg])
}

enum VerificationStatus { PENDING UNDER_REVIEW VERIFIED REJECTED }
enum PremiumTier { FREE VERIFIED BOOSTED ELITE }
```

Taxonomy (three levels; `Subcategory.parentId` nests level 3 under level 2):

```prisma
model Category {
  id          String  @id @default(cuid())
  name        String
  slug        String  @unique
  description String?
  icon        String?          // Lucide name
  image       String?
  color       String?          // Tailwind class from K-YOU taxonomy.jsx
  order       Int     @default(0)
  isActive    Boolean @default(true)
  createdAt   DateTime @default(now())
  subcategories Subcategory[]
  skills        ReferenceItem[]   // SKILL items scoped to a category
}

model Subcategory {
  id          String   @id @default(cuid())
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  parentId    String?                      // null = level 2, set = level 3
  parent      Subcategory?  @relation("SubcategoryTree", fields: [parentId], references: [id], onDelete: Cascade)
  children    Subcategory[] @relation("SubcategoryTree")
  name        String
  slug        String   @unique
  description String?
  icon        String?
  order       Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  providers   Provider[]
  bookings    Booking[]
  // launch-lead relations unchanged
  @@index([categoryId])
  @@index([parentId])
  @@index([isActive, order])
}
```

Places and reference lists:

```prisma
enum PlaceKind { COUNTRY PROVINCE CITY TERRITORY COMMUNE SECTOR CHIEFDOM QUARTIER VILLAGE }

model Place {
  id           String    @id @default(cuid())
  kind         PlaceKind
  label        String
  slug         String    @unique
  parentId     String?
  parent       Place?    @relation("PlaceTree", fields: [parentId], references: [id], onDelete: Restrict)
  children     Place[]   @relation("PlaceTree")
  aliases      String[]  @default([])
  source       String?
  latitude     Float?
  longitude    Float?
  active       Boolean   @default(true)
  mergedIntoId String?
  mergedInto   Place?    @relation("PlaceMerge", fields: [mergedIntoId], references: [id], onDelete: SetNull)
  mergedFrom   Place[]   @relation("PlaceMerge")
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  users        User[]
  providers    Provider[]
  addresses    Address[]
  bookings     Booking[]
  suggestions  PlaceSuggestion[]
  @@unique([parentId, kind, label])
  @@index([kind, active])
  @@index([parentId, kind])
}

enum SuggestionStatus { PENDING APPROVED REJECTED }

model PlaceSuggestion {
  id        String  @id @default(cuid())
  userId    String
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  kind      PlaceKind
  label     String
  parentId  String?
  parent    Place?  @relation(fields: [parentId], references: [id], onDelete: SetNull)
  status    SuggestionStatus @default(PENDING)
  resolvedPlaceId String?
  createdAt DateTime @default(now())
  resolvedAt DateTime?
  @@index([status, createdAt])
}

enum ReferenceType { LANGUAGE INTERVENTION_MODE CURRENCY PRICE_UNIT SKILL }

model ReferenceItem {
  id           String   @id @default(cuid())
  type         ReferenceType
  label        String
  slug         String   @unique
  aliases      String[] @default([])
  categoryId   String?                          // SKILL scope
  category     Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  order        Int      @default(0)
  active       Boolean  @default(true)
  suggested    Boolean  @default(true)          // shown in forms
  mergedIntoId String?
  source       String?
  createdAt    DateTime @default(now())
  providerSkills ProviderSkill[]
  providerRefs   ProviderReference[]
  @@index([type, active, order])
}

model ProviderSkill {
  providerId String
  provider   Provider @relation(fields: [providerId], references: [id], onDelete: Cascade)
  itemId     String
  item       ReferenceItem @relation(fields: [itemId], references: [id], onDelete: Cascade)
  @@id([providerId, itemId])
}

model ProviderReference {                          // languages and intervention modes
  providerId String
  itemId     String
  kind       ReferenceType                        // LANGUAGE or INTERVENTION_MODE
  provider   Provider @relation(fields: [providerId], references: [id], onDelete: Cascade)
  item       ReferenceItem @relation(fields: [itemId], references: [id], onDelete: Cascade)
  @@id([providerId, itemId])
  @@index([providerId, kind])
}
```

Media and schedule:

```prisma
enum MediaKind { IMAGE VIDEO_UPLOAD VIDEO_YOUTUBE }

model ProviderMedia {
  id          String    @id @default(cuid())
  providerId  String
  provider    Provider  @relation(fields: [providerId], references: [id], onDelete: Cascade)
  kind        MediaKind
  url         String                            // storage public URL or YouTube watch URL
  storagePath String?                           // set for uploads, used for deletion
  youtubeId   String?
  title       String?
  order       Int       @default(0)
  createdAt   DateTime  @default(now())
  @@index([providerId, kind, order])
}

model AvailabilityRule {
  id         String   @id @default(cuid())
  providerId String
  provider   Provider @relation(fields: [providerId], references: [id], onDelete: Cascade)
  dayOfWeek  Int                                  // 0 Sunday .. 6 Saturday
  startTime  String                               // "08:00"
  endTime    String                               // "12:30"
  order      Int      @default(0)                 // 0..3, max 4 ranges per day
  @@unique([providerId, dayOfWeek, order])
  @@index([providerId])
}

model AvailabilityException {
  id         String   @id @default(cuid())
  providerId String
  provider   Provider @relation(fields: [providerId], references: [id], onDelete: Cascade)
  date       DateTime @db.Date
  isOpen     Boolean  @default(false)             // false = closed all day; true = custom range
  startTime  String?
  endTime    String?
  reason     String?
  @@unique([providerId, date])
}
```

Bookings, reviews, ledger:

```prisma
enum BookingStatus { PENDING CONFIRMED COMPLETED CANCELLED }

model Booking {
  id              String   @id @default(cuid())
  clientId        String
  client          User     @relation("ClientBookings", fields: [clientId], references: [id])
  providerId      String
  provider        Provider @relation(fields: [providerId], references: [id])
  status          BookingStatus @default(PENDING)
  scheduledAt     DateTime                         // UTC instant of slot start
  durationMin     Int                              // snapshot
  bufferMin       Int                              // snapshot
  timezone        String                           // snapshot
  subcategoryId   String?
  subcategory     Subcategory? @relation(fields: [subcategoryId], references: [id])
  clientPhone     String
  clientNotes     String?
  providerNotes   String?
  placeId         String?
  place           Place?   @relation(fields: [placeId], references: [id], onDelete: SetNull)
  addressLine     String?
  latitude        Float?
  longitude       Float?
  agreedPrice     Int?                             // CDF, set by provider at completion
  commissionPct   Int      @default(10)
  commissionAmt   Int      @default(0)
  providerNetAmt  Int      @default(0)
  isPaid          Boolean  @default(false)
  paidAt          DateTime?
  confirmedAt     DateTime?
  completedAt     DateTime?
  cancelledAt     DateTime?
  cancelledById   String?
  cancelReason    String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  review          Review?
  clientReview    ClientReview?
  transactions    Transaction[]
  @@index([providerId, status, scheduledAt])
  @@index([clientId, status])
  @@index([scheduledAt])
}
```

Add in the baseline SQL, after Prisma's generated DDL, a partial unique index Prisma cannot express:

```sql
CREATE UNIQUE INDEX booking_active_slot_unique
  ON "Booking" ("providerId", "scheduledAt")
  WHERE status IN ('PENDING', 'CONFIRMED');
```

```prisma
model Review {
  id         String   @id @default(cuid())
  bookingId  String   @unique
  booking    Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  clientId   String
  client     User     @relation(fields: [clientId], references: [id])
  providerId String
  provider   Provider @relation(fields: [providerId], references: [id])
  rating     Int                                   // 1..5
  comment    String?                               // ≤ 500 chars
  reply      String?
  repliedAt  DateTime?
  isPublic   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  @@index([providerId, createdAt])
  @@index([clientId])
}

model ClientReview {
  id         String   @id @default(cuid())
  bookingId  String   @unique
  booking    Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  providerId String
  provider   Provider @relation(fields: [providerId], references: [id])
  clientId   String
  client     User     @relation(fields: [clientId], references: [id])
  rating     Int
  comment    String?
  createdAt  DateTime @default(now())
  @@index([clientId])
}

enum TransactionType { EARNING BONUS }
enum TransactionStatus { PENDING COMPLETED }

model Transaction {
  id         String   @id @default(cuid())
  providerId String
  provider   Provider @relation(fields: [providerId], references: [id], onDelete: Cascade)
  bookingId  String?
  booking    Booking? @relation(fields: [bookingId], references: [id], onDelete: SetNull)
  type       TransactionType
  amount     Int                                   // gross CDF
  feeAmt     Int      @default(0)
  netAmt     Int
  status     TransactionStatus @default(PENDING)
  note       String?
  occurredAt DateTime @default(now())
  @@index([providerId, occurredAt])
}
```

Messaging, safety, misc:

```prisma
model Conversation {
  id             String   @id @default(cuid())
  clientId       String
  client         User     @relation("ClientConversations", fields: [clientId], references: [id], onDelete: Cascade)
  providerId     String
  provider       Provider @relation(fields: [providerId], references: [id], onDelete: Cascade)
  subject        String?
  lastMessageAt  DateTime @default(now())
  lastPreview    String?
  clientUnread   Int      @default(0)
  providerUnread Int      @default(0)
  createdAt      DateTime @default(now())
  messages       Message[]
  @@unique([clientId, providerId])
  @@index([clientId, lastMessageAt])
  @@index([providerId, lastMessageAt])
}

model Message {
  id             String       @id @default(cuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  senderId       String
  sender         User         @relation(fields: [senderId], references: [id])
  body           String?                            // ≤ 4000
  attachments    Json         @default("[]")        // [{kind:"image"|"audio", path, mime, bytes}]
  createdAt      DateTime     @default(now())
  deletedAt      DateTime?
  @@index([conversationId, createdAt])
}

enum ReportTargetKind { USER PROVIDER REVIEW MESSAGE CONVERSATION }
enum ReportStatus { OPEN RESOLVED }

model Report {
  id           String   @id @default(cuid())
  reporterId   String
  reporter     User     @relation("ReportsFiled", fields: [reporterId], references: [id], onDelete: Cascade)
  targetKind   ReportTargetKind
  targetId     String
  reason       String
  status       ReportStatus @default(OPEN)
  resolution   String?
  resolvedById String?
  resolvedAt   DateTime?
  createdAt    DateTime @default(now())
  @@index([status, createdAt])
  @@index([targetKind, targetId])
}

model Block {
  blockerId String
  blocker   User   @relation("BlocksGiven", fields: [blockerId], references: [id], onDelete: Cascade)
  blockedId String
  blocked   User   @relation("BlocksReceived", fields: [blockedId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  @@id([blockerId, blockedId])
  @@index([blockedId])
}

enum ContactStatus { NEW READ REPLIED CLOSED }

model ContactMessage {
  id        String   @id @default(cuid())
  name      String
  email     String
  phone     String?
  subject   String
  message   String
  status    ContactStatus @default(NEW)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([status, createdAt])
}

enum AddressLabel { HOME WORK OTHER }

model Address {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  label       AddressLabel @default(HOME)
  recipient   String?
  addressLine String
  placeId     String?
  place       Place?   @relation(fields: [placeId], references: [id], onDelete: SetNull)
  country     String   @default("RDC")
  latitude    Float?
  longitude   Float?
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@index([userId, isDefault])
}

enum VerificationDocKind { ID_FRONT ID_BACK SELFIE ADDRESS CERT_OPTIONAL }
enum VerificationDecision { APPROVED REJECTED }

model VerificationDoc {                             // kept, plus the missing unique
  id              String @id @default(cuid())
  providerId      String
  provider        Provider @relation(fields: [providerId], references: [id], onDelete: Cascade)
  kind            VerificationDocKind
  storagePath     String
  fileName        String
  mime            String
  bytes           Int
  uploadedAt      DateTime @default(now())
  reviewedAt      DateTime?
  reviewedById    String?
  decision        VerificationDecision?
  rejectionReason String?
  @@unique([providerId, kind])
}

enum NotificationType {
  BOOKING_NEW BOOKING_CONFIRMED BOOKING_COMPLETED BOOKING_CANCELLED
  NEW_MESSAGE NEW_REVIEW NEW_CLIENT_REVIEW
  VERIFICATION_UPDATED PLACE_SUGGESTION_RESOLVED SYSTEM
}
```

`Notification`, `ActivityLog`, `SystemSetting`, agent models and all launch-lead models stay as they are today.

## System settings keys (seeded)

| Key | Type | Default |
| --- | --- | --- |
| `hero_title`, `hero_subtitle`, `hero_cta`, `tagline` | string | empty (module copy applies) |
| `how1_title` … `how3_desc` | string | empty |
| `premium_title`, `premium_subtitle` | string | empty |
| `feat_booking`, `feat_reviews`, `feat_whatsapp` | boolean | true |
| `contacts_require_premium` | boolean | false |
| `maintenance_mode` | boolean | false |
| `maintenance_message` | string | empty |
| `contact_phone`, `contact_email`, `contact_website` | string | current footer values |

## Migration strategy

1. On the integration branch, delete the six existing folders under `apps/backend/prisma/migrations/*` (`0_init` and the five `20260725*` launch-lead migrations), keeping `migration_lock.toml`.
2. Write the schema. Run `pnpm --filter @kayu/backend exec prisma migrate dev --name init --create-only` against a disposable database. Rename the folder to `0_init`.
3. Append the partial unique index SQL to `0_init/migration.sql`.
4. Update `launch-leads.migration-integrity.spec.ts`: it currently pins checksums of `20260725120000_add_launch_leads` and its successors. Re-pin it to `0_init` and keep the assertions that the lead tables, enums and indexes exist with the expected columns. The intent of that test survives, the file list changes.
5. `prisma migrate reset --force` locally, run seeds, run `test:launch`.
6. Render dev and prod databases are reset in workstream 10 with an explicit runbook step. `preDeployCommand` (`migrate deploy`) will fail on a database that has the old history; the runbook drops and recreates the database before the first deploy of the branch.

## Seeds

- `seed-categories.ts`: import the tree from K-YOU `shared/taxonomy.json` (19 categories, ~106 level-2, level-3 where present). Keep `slug` values from K-YOU so search URLs match the reference. Attach `color` and `icon` from K-YOU `src/lib/taxonomy.jsx`. Keep the existing "protect when referenced by leads" behaviour in admin.
- `seed-places.ts`: port `server/reference-seed.mjs` from K-YOU: RDC + 26 provinces + 26 capitals, Kinshasa's 24 communes, Gombe's 10 quartiers, Congo + Brazzaville. Source strings as in K-YOU `STRUCTURED-FORMS.md`.
- `seed-references.ts`: languages (Français, Lingala, Swahili, Kikongo, Tshiluba, Anglais), intervention modes (À domicile, En atelier, À distance, Sur chantier), currencies (CDF, USD, XAF), price units (par heure, par jour, par prestation, par m², forfait), and the K-YOU skill list scoped by category.
- `seed-settings.ts`: the keys above.
- `seed-demo.ts`: 15 providers and 13 clients as today, remapped to the new taxonomy, places, schedules (2 ranges per weekday, 60 min slots, 15 min buffer), media, bookings in each status with snapshots, reviews, client reviews, conversations, notifications, one open report, one block, three contact messages. Keep `assertSeedAllowed()`.

## Acceptance criteria

- `prisma validate` and `prisma generate` pass.
- One migration folder `0_init` applies on an empty Postgres 16 and 18.
- `launch-leads.migration-integrity.spec.ts` and `launch-leads.concurrency.spec.ts` pass against the new baseline.
- `pnpm db:reset` seeds without error and prints counts for every model.
- No model or enum from the removed list remains in the schema, the generated client, or `packages/schemas`.

## Verification commands

```sh
pnpm --filter @kayu/backend exec prisma validate
pnpm db:up && pnpm db:reset
pnpm --filter @kayu/backend test:launch-leads:ci
```
