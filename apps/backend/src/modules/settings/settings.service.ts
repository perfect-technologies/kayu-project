import { Injectable } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import { PrismaService } from "../../database/prisma.service";

type UpdateVisibilityBody = {
  profileVisible?: "PUBLIC" | "REGISTERED" | "CLIENTS_ONLY" | "PRIVATE";
  showEmail?: boolean;
  showPhone?: boolean;
  showExactLocation?: boolean;
  showHourlyRate?: boolean;
  showPastWork?: boolean;
  showReviews?: boolean;
  showAvailability?: boolean;
  showCertifications?: boolean;
  showClientHistory?: boolean;
  showClientReviews?: boolean;
  allowDirectContact?: boolean;
  allowMessages?: boolean;
  appearInSearch?: boolean;
  appearInCategory?: boolean;
};

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getVisibility(actor: Actor) {
    const settings = await this.prisma.visibilitySettings.upsert({
      where: { userId: actor.id },
      update: {},
      create: this.defaultSettings(actor.id),
    });

    return {
      success: true as const,
      settings: this.mapVisibility(settings),
    };
  }

  async updateVisibility(actor: Actor, body: UpdateVisibilityBody) {
    const settings = await this.prisma.visibilitySettings.upsert({
      where: { userId: actor.id },
      update: body,
      create: {
        ...this.defaultSettings(actor.id),
        ...body,
      },
    });

    return {
      success: true as const,
      settings: this.mapVisibility(settings),
    };
  }

  private defaultSettings(userId: string) {
    return {
      userId,
      profileVisible: "PUBLIC" as const,
      showEmail: false,
      showPhone: false,
      showExactLocation: false,
      showHourlyRate: true,
      showPastWork: true,
      showReviews: true,
      showAvailability: true,
      showCertifications: true,
      showClientHistory: true,
      showClientReviews: true,
      allowDirectContact: true,
      allowMessages: true,
      appearInSearch: true,
      appearInCategory: true,
    };
  }

  private mapVisibility(settings: Awaited<ReturnType<PrismaService["visibilitySettings"]["upsert"]>>) {
    return {
      id: settings.id,
      userId: settings.userId,
      profileVisible: settings.profileVisible,
      showEmail: settings.showEmail,
      showPhone: settings.showPhone,
      showExactLocation: settings.showExactLocation,
      showHourlyRate: settings.showHourlyRate,
      showPastWork: settings.showPastWork,
      showReviews: settings.showReviews,
      showAvailability: settings.showAvailability,
      showCertifications: settings.showCertifications,
      showClientHistory: settings.showClientHistory,
      showClientReviews: settings.showClientReviews,
      allowDirectContact: settings.allowDirectContact,
      allowMessages: settings.allowMessages,
      appearInSearch: settings.appearInSearch,
      appearInCategory: settings.appearInCategory,
      updatedAt: settings.updatedAt,
    };
  }
}
