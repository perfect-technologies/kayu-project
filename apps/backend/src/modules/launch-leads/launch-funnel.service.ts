import { BadRequestException, Injectable } from "@nestjs/common";
import type {
  LaunchFunnelDeviceClass,
  LaunchFunnelEventName,
} from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { normalizeAttribution } from "./launch-leads.service";
import type { CreateLaunchFunnelEventInput } from "./launch-leads.types";

const EVENT_NAMES: Record<
  CreateLaunchFunnelEventInput["eventName"],
  LaunchFunnelEventName
> = {
  launch_landing_viewed: "LANDING_VIEWED",
  launch_role_selected: "ROLE_SELECTED",
  launch_form_started: "FORM_STARTED",
  launch_form_validation_failed: "FORM_VALIDATION_FAILED",
  launch_lead_submitted: "LEAD_SUBMITTED",
};

const DEVICE_CLASSES: Record<
  CreateLaunchFunnelEventInput["deviceClass"],
  LaunchFunnelDeviceClass
> = {
  mobile: "MOBILE",
  tablet: "TABLET",
  desktop: "DESKTOP",
  unknown: "UNKNOWN",
};

const MAX_EVENT_AGE_MS = 7 * 24 * 60 * 60 * 1_000;
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1_000;

@Injectable()
export class LaunchFunnelService {
  constructor(private readonly prisma: PrismaService) {}

  async createEvent(input: CreateLaunchFunnelEventInput) {
    const occurredAt = new Date(input.occurredAt);
    const now = Date.now();
    if (
      occurredAt.getTime() < now - MAX_EVENT_AGE_MS ||
      occurredAt.getTime() > now + MAX_FUTURE_SKEW_MS
    ) {
      throw new BadRequestException(
        "La date de l’événement est hors de la fenêtre acceptée.",
      );
    }

    const attribution = normalizeAttribution(input.attribution);
    await this.prisma.campaignFunnelEvent.create({
      data: {
        occurredAt,
        schemaVersion: input.schemaVersion,
        eventName: EVENT_NAMES[input.eventName],
        route: input.route,
        deviceClass: DEVICE_CLASSES[input.deviceClass],
        leadType: input.leadType ?? null,
        validationField: input.validationField ?? null,
        validationErrorCode: input.validationErrorCode ?? null,
        attributionSource: attribution.source,
        attributionMedium: attribution.medium,
        attributionCampaign: attribution.campaign,
        attributionContent: attribution.content,
        attributionReferrerHost: attribution.referrerHost,
        campaignKey: attribution.campaignKey,
      },
      select: { id: true },
    });

    return { accepted: true as const };
  }
}
