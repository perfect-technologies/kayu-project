-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CLIENT', 'PROVIDER', 'ADMIN');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PremiumTier" AS ENUM ('FREE', 'VERIFIED', 'BOOSTED', 'ELITE');

-- CreateEnum
CREATE TYPE "ProviderLeadStatus" AS ENUM ('SUBMITTED', 'IN_REVIEW', 'NEEDS_INFO', 'QUALIFIED', 'REJECTED', 'WITHDRAWN', 'INVITED', 'ACTIVATED');

-- CreateEnum
CREATE TYPE "ClientLeadStatus" AS ENUM ('SUBMITTED', 'ELIGIBLE', 'PAUSED', 'DECLINED', 'WITHDRAWN', 'INVITED', 'ACTIVATED');

-- CreateEnum
CREATE TYPE "ProviderLeadExperienceBand" AS ENUM ('STARTING', 'ONE_TO_THREE_YEARS', 'FOUR_PLUS_YEARS');

-- CreateEnum
CREATE TYPE "ClientLeadTiming" AS ENUM ('WITHIN_7_DAYS', 'WITHIN_30_DAYS', 'LATER', 'EXPLORING');

-- CreateEnum
CREATE TYPE "LeadPreferredContact" AS ENUM ('PHONE', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "LeadType" AS ENUM ('PROVIDER', 'CLIENT');

-- CreateEnum
CREATE TYPE "LeadSubmissionOutcome" AS ENUM ('CREATED', 'DUPLICATE_REVIEW_REQUIRED');

-- CreateEnum
CREATE TYPE "LeadFormDurationBucket" AS ENUM ('UNDER_3_SECONDS', 'FROM_3_TO_30_SECONDS', 'FROM_31_TO_90_SECONDS', 'FROM_91_TO_180_SECONDS', 'OVER_180_SECONDS', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "LeadTaxonomySnapshotRelation" AS ENUM ('PROVIDER_PRIMARY', 'PROVIDER_ADDITIONAL', 'CLIENT_NEEDED');

-- CreateEnum
CREATE TYPE "LaunchFunnelEventName" AS ENUM ('LANDING_VIEWED', 'ROLE_SELECTED', 'FORM_STARTED', 'FORM_VALIDATION_FAILED', 'LEAD_SUBMITTED');

-- CreateEnum
CREATE TYPE "LaunchFunnelDeviceClass" AS ENUM ('MOBILE', 'TABLET', 'DESKTOP', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "PlaceKind" AS ENUM ('COUNTRY', 'PROVINCE', 'CITY', 'TERRITORY', 'COMMUNE', 'SECTOR', 'CHIEFDOM', 'QUARTIER', 'VILLAGE');

-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReferenceType" AS ENUM ('LANGUAGE', 'INTERVENTION_MODE', 'CURRENCY', 'PRICE_UNIT', 'SKILL');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('IMAGE', 'VIDEO_UPLOAD', 'VIDEO_YOUTUBE');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('EARNING', 'BONUS');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ReportTargetKind" AS ENUM ('USER', 'PROVIDER', 'REVIEW', 'MESSAGE', 'CONVERSATION');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('NEW', 'READ', 'REPLIED', 'CLOSED');

-- CreateEnum
CREATE TYPE "AddressLabel" AS ENUM ('HOME', 'WORK', 'OTHER');

-- CreateEnum
CREATE TYPE "VerificationDocKind" AS ENUM ('ID_FRONT', 'ID_BACK', 'SELFIE', 'ADDRESS', 'CERT_OPTIONAL');

-- CreateEnum
CREATE TYPE "VerificationDecision" AS ENUM ('APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('BOOKING_NEW', 'BOOKING_CONFIRMED', 'BOOKING_COMPLETED', 'BOOKING_CANCELLED', 'NEW_MESSAGE', 'NEW_REVIEW', 'NEW_CLIENT_REVIEW', 'VERIFICATION_UPDATED', 'PLACE_SUGGESTION_RESOLVED', 'SYSTEM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "authUserId" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "avatar" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CLIENT',
    "roleSelectedAt" TIMESTAMP(3),
    "bio" TEXT,
    "gender" TEXT,
    "birthdate" TIMESTAMP(3),
    "placeId" TEXT,
    "country" TEXT NOT NULL DEFAULT 'RDC',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "suspendedAt" TIMESTAMP(3),
    "suspendedReason" TEXT,
    "emailVerifiedAt" TIMESTAMP(3),
    "phoneVerifiedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "termsAcceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Provider" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "yearsExperience" INTEGER,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "profilePhoto" TEXT,
    "subcategoryId" TEXT NOT NULL,
    "placeId" TEXT,
    "addressLine" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "freeSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pricingAmount" INTEGER,
    "pricingCurrencyId" TEXT,
    "pricingUnitId" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Kinshasa',
    "slotDurationMin" INTEGER NOT NULL DEFAULT 60,
    "slotBufferMin" INTEGER NOT NULL DEFAULT 0,
    "youtubeUrl" TEXT,
    "instagramUrl" TEXT,
    "tiktokUrl" TEXT,
    "facebookUrl" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "premiumTier" "PremiumTier" NOT NULL DEFAULT 'FREE',
    "premiumUntil" TIMESTAMP(3),
    "ratingAvg" DECIMAL(2,1) NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "completedJobs" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "image" TEXT,
    "color" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subcategory" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subcategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderLead" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSubmittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstName" TEXT NOT NULL,
    "phoneE164" TEXT NOT NULL,
    "emailNormalized" TEXT,
    "primarySubcategoryId" TEXT,
    "additionalSubcategoryIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "experienceBand" "ProviderLeadExperienceBand" NOT NULL,
    "homeCommune" TEXT NOT NULL,
    "serviceCommunes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hasWhatsApp" BOOLEAN,
    "summary" TEXT,
    "status" "ProviderLeadStatus" NOT NULL DEFAULT 'SUBMITTED',
    "consentAt" TIMESTAMP(3) NOT NULL,
    "consentVersion" TEXT NOT NULL,
    "operationalConsent" BOOLEAN NOT NULL DEFAULT true,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "marketingConsentAt" TIMESTAMP(3),
    "marketingConsentVersion" TEXT,
    "attributionSource" TEXT NOT NULL,
    "attributionMedium" TEXT,
    "attributionCampaign" TEXT,
    "attributionContent" TEXT,
    "attributionReferrerHost" TEXT,
    "campaignKey" TEXT NOT NULL,
    "lastFormDurationBucket" "LeadFormDurationBucket" NOT NULL DEFAULT 'UNKNOWN',
    "isTest" BOOLEAN NOT NULL DEFAULT false,
    "firstReviewedAt" TIMESTAMP(3),
    "lastContactedAt" TIMESTAMP(3),
    "qualifiedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "assignedAdminUserId" TEXT,
    "decisionReasonCode" TEXT,
    "privateNotes" TEXT,
    "activatedUserId" TEXT,
    "activatedProviderId" TEXT,
    "activatedAt" TIMESTAMP(3),

    CONSTRAINT "ProviderLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientWaitlistLead" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSubmittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstName" TEXT NOT NULL,
    "phoneE164" TEXT NOT NULL,
    "emailNormalized" TEXT,
    "commune" TEXT NOT NULL,
    "neededSubcategoryIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "timing" "ClientLeadTiming" NOT NULL,
    "needSummary" TEXT,
    "preferredContact" "LeadPreferredContact",
    "status" "ClientLeadStatus" NOT NULL DEFAULT 'SUBMITTED',
    "consentAt" TIMESTAMP(3) NOT NULL,
    "consentVersion" TEXT NOT NULL,
    "operationalConsent" BOOLEAN NOT NULL DEFAULT true,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "marketingConsentAt" TIMESTAMP(3),
    "marketingConsentVersion" TEXT,
    "attributionSource" TEXT NOT NULL,
    "attributionMedium" TEXT,
    "attributionCampaign" TEXT,
    "attributionContent" TEXT,
    "attributionReferrerHost" TEXT,
    "campaignKey" TEXT NOT NULL,
    "lastFormDurationBucket" "LeadFormDurationBucket" NOT NULL DEFAULT 'UNKNOWN',
    "isTest" BOOLEAN NOT NULL DEFAULT false,
    "firstReviewedAt" TIMESTAMP(3),
    "lastContactedAt" TIMESTAMP(3),
    "eligibleAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "assignedAdminUserId" TEXT,
    "decisionReasonCode" TEXT,
    "privateNotes" TEXT,
    "activatedUserId" TEXT,
    "activatedAt" TIMESTAMP(3),

    CONSTRAINT "ClientWaitlistLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadSubmissionEvent" (
    "id" TEXT NOT NULL,
    "leadType" "LeadType" NOT NULL,
    "providerLeadId" TEXT,
    "clientLeadId" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRefresh" BOOLEAN NOT NULL DEFAULT false,
    "consentVersion" TEXT NOT NULL,
    "operationalConsent" BOOLEAN NOT NULL,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "attributionSource" TEXT NOT NULL,
    "attributionMedium" TEXT,
    "campaign" TEXT,
    "content" TEXT,
    "referrerHost" TEXT,
    "campaignKey" TEXT NOT NULL,
    "formDurationBucket" "LeadFormDurationBucket" NOT NULL DEFAULT 'UNKNOWN',
    "ipHash" TEXT,
    "contactHash" TEXT NOT NULL,
    "outcome" "LeadSubmissionOutcome" NOT NULL,

    CONSTRAINT "LeadSubmissionEvent_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "LeadSubmissionEvent_exactly_one_lead_check" CHECK (
      (
        "leadType" = 'PROVIDER'
        AND "providerLeadId" IS NOT NULL
        AND "clientLeadId" IS NULL
      )
      OR
      (
        "leadType" = 'CLIENT'
        AND "providerLeadId" IS NULL
        AND "clientLeadId" IS NOT NULL
      )
    )
);

-- CreateTable
CREATE TABLE "CampaignFunnelEvent" (
    "id" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "eventName" "LaunchFunnelEventName" NOT NULL,
    "route" TEXT NOT NULL,
    "deviceClass" "LaunchFunnelDeviceClass" NOT NULL,
    "leadType" "LeadType",
    "validationField" TEXT,
    "validationErrorCode" TEXT,
    "attributionSource" TEXT NOT NULL,
    "attributionMedium" TEXT,
    "attributionCampaign" TEXT,
    "attributionContent" TEXT,
    "attributionReferrerHost" TEXT,
    "campaignKey" TEXT NOT NULL,

    CONSTRAINT "CampaignFunnelEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadTaxonomySnapshotOrphan" (
    "id" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leadType" "LeadType" NOT NULL,
    "leadId" TEXT NOT NULL,
    "relationKind" "LeadTaxonomySnapshotRelation" NOT NULL,
    "subcategoryId" TEXT NOT NULL,

    CONSTRAINT "LeadTaxonomySnapshotOrphan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderLeadAdditionalSubcategory" (
    "providerLeadId" TEXT NOT NULL,
    "subcategoryId" TEXT NOT NULL,

    CONSTRAINT "ProviderLeadAdditionalSubcategory_pkey" PRIMARY KEY ("providerLeadId","subcategoryId")
);

-- CreateTable
CREATE TABLE "ClientWaitlistLeadSubcategory" (
    "clientLeadId" TEXT NOT NULL,
    "subcategoryId" TEXT NOT NULL,

    CONSTRAINT "ClientWaitlistLeadSubcategory_pkey" PRIMARY KEY ("clientLeadId","subcategoryId")
);

-- CreateTable
CREATE TABLE "Place" (
    "id" TEXT NOT NULL,
    "kind" "PlaceKind" NOT NULL,
    "label" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parentId" TEXT,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "source" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "mergedIntoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaceSuggestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "PlaceKind" NOT NULL,
    "label" TEXT NOT NULL,
    "parentId" TEXT,
    "status" "SuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "resolvedPlaceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "PlaceSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferenceItem" (
    "id" TEXT NOT NULL,
    "type" "ReferenceType" NOT NULL,
    "label" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "categoryId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "suggested" BOOLEAN NOT NULL DEFAULT true,
    "mergedIntoId" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferenceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderSkill" (
    "providerId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,

    CONSTRAINT "ProviderSkill_pkey" PRIMARY KEY ("providerId","itemId")
);

-- CreateTable
CREATE TABLE "ProviderReference" (
    "providerId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "kind" "ReferenceType" NOT NULL,

    CONSTRAINT "ProviderReference_pkey" PRIMARY KEY ("providerId","itemId")
);

-- CreateTable
CREATE TABLE "ProviderMedia" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "kind" "MediaKind" NOT NULL,
    "url" TEXT NOT NULL,
    "storagePath" TEXT,
    "youtubeId" TEXT,
    "title" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityRule" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AvailabilityRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityException" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT false,
    "startTime" TEXT,
    "endTime" TEXT,
    "reason" TEXT,

    CONSTRAINT "AvailabilityException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "bufferMin" INTEGER NOT NULL,
    "timezone" TEXT NOT NULL,
    "subcategoryId" TEXT,
    "clientPhone" TEXT NOT NULL,
    "clientNotes" TEXT,
    "providerNotes" TEXT,
    "placeId" TEXT,
    "addressLine" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "agreedPrice" INTEGER,
    "commissionPct" INTEGER NOT NULL DEFAULT 10,
    "commissionAmt" INTEGER NOT NULL DEFAULT 0,
    "providerNetAmt" INTEGER NOT NULL DEFAULT 0,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelledById" TEXT,
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "reply" TEXT,
    "repliedAt" TIMESTAMP(3),
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientReview" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "bookingId" TEXT,
    "type" "TransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "feeAmt" INTEGER NOT NULL DEFAULT 0,
    "netAmt" INTEGER NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "subject" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastPreview" TEXT,
    "clientUnread" INTEGER NOT NULL DEFAULT 0,
    "providerUnread" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT,
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetKind" "ReportTargetKind" NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Block" (
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("blockerId","blockedId")
);

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "ContactStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" "AddressLabel" NOT NULL DEFAULT 'HOME',
    "recipient" TEXT,
    "addressLine" TEXT NOT NULL,
    "placeId" TEXT,
    "country" TEXT NOT NULL DEFAULT 'RDC',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationDoc" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "kind" "VerificationDocKind" NOT NULL,
    "storagePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "decision" "VerificationDecision",
    "rejectionReason" TEXT,

    CONSTRAINT "VerificationDoc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_authUserId_key" ON "User"("authUserId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_placeId_idx" ON "User"("placeId");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Provider_userId_key" ON "Provider"("userId");

-- CreateIndex
CREATE INDEX "Provider_subcategoryId_idx" ON "Provider"("subcategoryId");

-- CreateIndex
CREATE INDEX "Provider_placeId_idx" ON "Provider"("placeId");

-- CreateIndex
CREATE INDEX "Provider_hidden_isAvailable_idx" ON "Provider"("hidden", "isAvailable");

-- CreateIndex
CREATE INDEX "Provider_verificationStatus_idx" ON "Provider"("verificationStatus");

-- CreateIndex
CREATE INDEX "Provider_premiumTier_idx" ON "Provider"("premiumTier");

-- CreateIndex
CREATE INDEX "Provider_ratingAvg_idx" ON "Provider"("ratingAvg");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Subcategory_slug_key" ON "Subcategory"("slug");

-- CreateIndex
CREATE INDEX "Subcategory_categoryId_idx" ON "Subcategory"("categoryId");

-- CreateIndex
CREATE INDEX "Subcategory_parentId_idx" ON "Subcategory"("parentId");

-- CreateIndex
CREATE INDEX "Subcategory_isActive_order_idx" ON "Subcategory"("isActive", "order");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderLead_phoneE164_key" ON "ProviderLead"("phoneE164");

-- CreateIndex
CREATE INDEX "ProviderLead_status_submittedAt_idx" ON "ProviderLead"("status", "submittedAt");

-- CreateIndex
CREATE INDEX "ProviderLead_primarySubcategoryId_status_idx" ON "ProviderLead"("primarySubcategoryId", "status");

-- CreateIndex
CREATE INDEX "ProviderLead_homeCommune_status_idx" ON "ProviderLead"("homeCommune", "status");

-- CreateIndex
CREATE INDEX "ProviderLead_attributionSource_campaignKey_idx" ON "ProviderLead"("attributionSource", "campaignKey");

-- CreateIndex
CREATE INDEX "ProviderLead_isTest_status_idx" ON "ProviderLead"("isTest", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ClientWaitlistLead_phoneE164_key" ON "ClientWaitlistLead"("phoneE164");

-- CreateIndex
CREATE INDEX "ClientWaitlistLead_status_submittedAt_idx" ON "ClientWaitlistLead"("status", "submittedAt");

-- CreateIndex
CREATE INDEX "ClientWaitlistLead_commune_status_idx" ON "ClientWaitlistLead"("commune", "status");

-- CreateIndex
CREATE INDEX "ClientWaitlistLead_attributionSource_campaignKey_idx" ON "ClientWaitlistLead"("attributionSource", "campaignKey");

-- CreateIndex
CREATE INDEX "ClientWaitlistLead_isTest_status_idx" ON "ClientWaitlistLead"("isTest", "status");

-- CreateIndex
CREATE INDEX "LeadSubmissionEvent_providerLeadId_submittedAt_idx" ON "LeadSubmissionEvent"("providerLeadId", "submittedAt");

-- CreateIndex
CREATE INDEX "LeadSubmissionEvent_clientLeadId_submittedAt_idx" ON "LeadSubmissionEvent"("clientLeadId", "submittedAt");

-- CreateIndex
CREATE INDEX "LeadSubmissionEvent_contactHash_submittedAt_idx" ON "LeadSubmissionEvent"("contactHash", "submittedAt");

-- CreateIndex
CREATE INDEX "LeadSubmissionEvent_ipHash_submittedAt_idx" ON "LeadSubmissionEvent"("ipHash", "submittedAt");

-- CreateIndex
CREATE INDEX "LeadSubmissionEvent_attribution_idx" ON "LeadSubmissionEvent"("leadType", "attributionSource", "campaignKey", "submittedAt");

-- CreateIndex
CREATE INDEX "CampaignFunnelEvent_eventName_receivedAt_idx" ON "CampaignFunnelEvent"("eventName", "receivedAt");

-- CreateIndex
CREATE INDEX "CampaignFunnelEvent_leadType_eventName_receivedAt_idx" ON "CampaignFunnelEvent"("leadType", "eventName", "receivedAt");

-- CreateIndex
CREATE INDEX "CampaignFunnelEvent_attribution_idx" ON "CampaignFunnelEvent"("attributionSource", "campaignKey", "receivedAt");

-- CreateIndex
CREATE INDEX "LeadTaxonomySnapshotOrphan_relationKind_detectedAt_idx" ON "LeadTaxonomySnapshotOrphan"("relationKind", "detectedAt");

-- CreateIndex
CREATE INDEX "LeadTaxonomySnapshotOrphan_subcategoryId_idx" ON "LeadTaxonomySnapshotOrphan"("subcategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadTaxonomySnapshotOrphan_leadType_leadId_relationKind_sub_key" ON "LeadTaxonomySnapshotOrphan"("leadType", "leadId", "relationKind", "subcategoryId");

-- CreateIndex
CREATE INDEX "ProviderLeadAdditionalSubcategory_subcategoryId_idx" ON "ProviderLeadAdditionalSubcategory"("subcategoryId");

-- CreateIndex
CREATE INDEX "ClientWaitlistLeadSubcategory_subcategoryId_idx" ON "ClientWaitlistLeadSubcategory"("subcategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Place_slug_key" ON "Place"("slug");

-- CreateIndex
CREATE INDEX "Place_kind_active_idx" ON "Place"("kind", "active");

-- CreateIndex
CREATE INDEX "Place_parentId_kind_idx" ON "Place"("parentId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "Place_parentId_kind_label_key" ON "Place"("parentId", "kind", "label");

-- CreateIndex
CREATE INDEX "PlaceSuggestion_status_createdAt_idx" ON "PlaceSuggestion"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReferenceItem_slug_key" ON "ReferenceItem"("slug");

-- CreateIndex
CREATE INDEX "ReferenceItem_type_active_order_idx" ON "ReferenceItem"("type", "active", "order");

-- CreateIndex
CREATE INDEX "ProviderReference_providerId_kind_idx" ON "ProviderReference"("providerId", "kind");

-- CreateIndex
CREATE INDEX "ProviderMedia_providerId_kind_order_idx" ON "ProviderMedia"("providerId", "kind", "order");

-- CreateIndex
CREATE INDEX "AvailabilityRule_providerId_idx" ON "AvailabilityRule"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityRule_providerId_dayOfWeek_order_key" ON "AvailabilityRule"("providerId", "dayOfWeek", "order");

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityException_providerId_date_key" ON "AvailabilityException"("providerId", "date");

-- CreateIndex
CREATE INDEX "Booking_providerId_status_scheduledAt_idx" ON "Booking"("providerId", "status", "scheduledAt");

-- CreateIndex
CREATE INDEX "Booking_clientId_status_idx" ON "Booking"("clientId", "status");

-- CreateIndex
CREATE INDEX "Booking_scheduledAt_idx" ON "Booking"("scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "Review_bookingId_key" ON "Review"("bookingId");

-- CreateIndex
CREATE INDEX "Review_providerId_createdAt_idx" ON "Review"("providerId", "createdAt");

-- CreateIndex
CREATE INDEX "Review_clientId_idx" ON "Review"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientReview_bookingId_key" ON "ClientReview"("bookingId");

-- CreateIndex
CREATE INDEX "ClientReview_clientId_idx" ON "ClientReview"("clientId");

-- CreateIndex
CREATE INDEX "Transaction_providerId_occurredAt_idx" ON "Transaction"("providerId", "occurredAt");

-- CreateIndex
CREATE INDEX "Conversation_clientId_lastMessageAt_idx" ON "Conversation"("clientId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "Conversation_providerId_lastMessageAt_idx" ON "Conversation"("providerId", "lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_clientId_providerId_key" ON "Conversation"("clientId", "providerId");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Report_targetKind_targetId_idx" ON "Report"("targetKind", "targetId");

-- CreateIndex
CREATE INDEX "Block_blockedId_idx" ON "Block"("blockedId");

-- CreateIndex
CREATE INDEX "ContactMessage_status_createdAt_idx" ON "ContactMessage"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Address_userId_isDefault_idx" ON "Address"("userId", "isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationDoc_providerId_kind_key" ON "VerificationDoc"("providerId", "kind");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_entityType_entityId_idx" ON "ActivityLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Provider" ADD CONSTRAINT "Provider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Provider" ADD CONSTRAINT "Provider_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Provider" ADD CONSTRAINT "Provider_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subcategory" ADD CONSTRAINT "Subcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subcategory" ADD CONSTRAINT "Subcategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Subcategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Launch-lead tables reproduce the final state of the squashed 20260725*
-- chain exactly, including NOT VALID on these two constraints, so a restored
-- production lead export lands in a catalog identical to the one it left.
-- PostgreSQL still enforces both on every new write.
ALTER TABLE "ProviderLead" ADD CONSTRAINT "ProviderLead_primarySubcategoryId_required" CHECK ("primarySubcategoryId" IS NOT NULL) NOT VALID;

-- AddForeignKey
ALTER TABLE "ProviderLead" ADD CONSTRAINT "ProviderLead_primarySubcategoryId_fkey" FOREIGN KEY ("primarySubcategoryId") REFERENCES "Subcategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "LeadSubmissionEvent" ADD CONSTRAINT "LeadSubmissionEvent_providerLeadId_fkey" FOREIGN KEY ("providerLeadId") REFERENCES "ProviderLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadSubmissionEvent" ADD CONSTRAINT "LeadSubmissionEvent_clientLeadId_fkey" FOREIGN KEY ("clientLeadId") REFERENCES "ClientWaitlistLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderLeadAdditionalSubcategory" ADD CONSTRAINT "ProviderLeadAdditionalSubcategory_providerLeadId_fkey" FOREIGN KEY ("providerLeadId") REFERENCES "ProviderLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderLeadAdditionalSubcategory" ADD CONSTRAINT "ProviderLeadAdditionalSubcategory_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientWaitlistLeadSubcategory" ADD CONSTRAINT "ClientWaitlistLeadSubcategory_clientLeadId_fkey" FOREIGN KEY ("clientLeadId") REFERENCES "ClientWaitlistLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientWaitlistLeadSubcategory" ADD CONSTRAINT "ClientWaitlistLeadSubcategory_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Place" ADD CONSTRAINT "Place_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Place"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Place" ADD CONSTRAINT "Place_mergedIntoId_fkey" FOREIGN KEY ("mergedIntoId") REFERENCES "Place"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaceSuggestion" ADD CONSTRAINT "PlaceSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaceSuggestion" ADD CONSTRAINT "PlaceSuggestion_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Place"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferenceItem" ADD CONSTRAINT "ReferenceItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderSkill" ADD CONSTRAINT "ProviderSkill_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderSkill" ADD CONSTRAINT "ProviderSkill_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ReferenceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderReference" ADD CONSTRAINT "ProviderReference_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderReference" ADD CONSTRAINT "ProviderReference_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ReferenceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderMedia" ADD CONSTRAINT "ProviderMedia_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityRule" ADD CONSTRAINT "AvailabilityRule_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityException" ADD CONSTRAINT "AvailabilityException_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientReview" ADD CONSTRAINT "ClientReview_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientReview" ADD CONSTRAINT "ClientReview_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientReview" ADD CONSTRAINT "ClientReview_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationDoc" ADD CONSTRAINT "VerificationDoc_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Prisma cannot express partial unique indexes. At most one active booking
-- may hold a provider slot; cancelled and completed rows free it.
CREATE UNIQUE INDEX booking_active_slot_unique
  ON "Booking" ("providerId", "scheduledAt")
  WHERE status IN ('PENDING', 'CONFIRMED');
