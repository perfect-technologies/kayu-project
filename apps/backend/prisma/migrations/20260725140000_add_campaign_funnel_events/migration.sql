-- CreateEnum
CREATE TYPE "LaunchFunnelEventName" AS ENUM ('LANDING_VIEWED', 'ROLE_SELECTED', 'FORM_STARTED', 'FORM_VALIDATION_FAILED', 'LEAD_SUBMITTED');

-- CreateEnum
CREATE TYPE "LaunchFunnelDeviceClass" AS ENUM ('MOBILE', 'TABLET', 'DESKTOP', 'UNKNOWN');

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

-- CreateIndex
CREATE INDEX "CampaignFunnelEvent_eventName_receivedAt_idx" ON "CampaignFunnelEvent"("eventName", "receivedAt");

-- CreateIndex
CREATE INDEX "CampaignFunnelEvent_leadType_eventName_receivedAt_idx" ON "CampaignFunnelEvent"("leadType", "eventName", "receivedAt");

-- CreateIndex
CREATE INDEX "CampaignFunnelEvent_attribution_idx" ON "CampaignFunnelEvent"("attributionSource", "campaignKey", "receivedAt");
