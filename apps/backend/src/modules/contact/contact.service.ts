import { Injectable } from "@nestjs/common";
import type { CreateContactMessageInput } from "../../common/contract";
import { RateLimiterService } from "../../common/rate-limit/rate-limiter.service";
import { PrismaService } from "../../database/prisma.service";

const CONTACT_PER_WINDOW = 5;
const CONTACT_WINDOW_MS = 15 * 60 * 1000;

@Injectable()
export class ContactService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly limiter: RateLimiterService,
  ) {}

  async create(input: CreateContactMessageInput, ip: string | undefined) {
    this.limiter.consume("contact", ip || "unknown", CONTACT_PER_WINDOW, CONTACT_WINDOW_MS);
    await this.prisma.contactMessage.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone || null,
        subject: input.subject,
        message: input.message,
      },
    });
    return { ok: true as const };
  }
}
