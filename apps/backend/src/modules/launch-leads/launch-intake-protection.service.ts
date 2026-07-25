import {
  HttpException,
  HttpStatus,
  Injectable,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac } from "node:crypto";

type IntakeRequest = {
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
  ip?: string;
  socket?: { remoteAddress?: string | null };
};

type RateBucket = {
  startedAt: number;
  count: number;
};

@Injectable()
export class LaunchIntakeProtectionService {
  private readonly ipBuckets = new Map<string, RateBucket>();
  private readonly contactBuckets = new Map<string, RateBucket>();

  constructor(private readonly config: ConfigService) {}

  checkRequest(request: IntakeRequest): void {
    if (!this.isEnabled()) {
      throw new ServiceUnavailableException(
        "La collecte des demandes est temporairement indisponible.",
      );
    }

    const maxBodyBytes = this.getNumber("LAUNCH_INTAKE_MAX_BODY_BYTES", 16_384);
    const contentLength = this.readContentLength(request.headers?.["content-length"]);
    const parsedBodyBytes = this.measureBody(request.body);

    if (
      (contentLength !== null && contentLength > maxBodyBytes) ||
      parsedBodyBytes > maxBodyBytes
    ) {
      throw new PayloadTooLargeException("Le formulaire envoyé est trop volumineux.");
    }

    this.consume(
      this.ipBuckets,
      request.ip ?? request.socket?.remoteAddress ?? "unknown",
      this.getNumber("LAUNCH_INTAKE_IP_LIMIT", 20),
    );
  }

  checkContact(phoneE164: string): void {
    this.consume(
      this.contactBuckets,
      phoneE164,
      this.getNumber("LAUNCH_INTAKE_CONTACT_LIMIT", 5),
    );
  }

  hashIdentifier(value: string | undefined): string | null {
    if (!value) {
      return null;
    }

    const key = this.config.get<string>("LAUNCH_RATE_LIMIT_HASH_KEY") ?? "";
    if (key.length < 32) {
      throw new ServiceUnavailableException(
        "La collecte des demandes est temporairement indisponible.",
      );
    }

    return createHmac("sha256", key).update(value).digest("hex");
  }

  private isEnabled(): boolean {
    const value = this.config.get<string | boolean>(
      "LAUNCH_PUBLIC_INTAKE_ENABLED",
    );
    return value === true || value === "true";
  }

  private consume(
    buckets: Map<string, RateBucket>,
    key: string,
    limit: number,
  ): void {
    const now = Date.now();
    const windowMs =
      this.getNumber("LAUNCH_INTAKE_RATE_WINDOW_SECONDS", 900) * 1_000;
    const current = buckets.get(key);

    if (!current || now - current.startedAt >= windowMs) {
      buckets.set(key, { startedAt: now, count: 1 });
      this.pruneExpiredBuckets(buckets, now, windowMs);
      return;
    }

    if (current.count >= limit) {
      throw new HttpException(
        "Trop de demandes. Veuillez réessayer plus tard.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    current.count += 1;
  }

  private pruneExpiredBuckets(
    buckets: Map<string, RateBucket>,
    now: number,
    windowMs: number,
  ): void {
    if (buckets.size < 1_000) {
      return;
    }

    for (const [key, bucket] of buckets) {
      if (now - bucket.startedAt >= windowMs) {
        buckets.delete(key);
      }
    }
  }

  private getNumber(key: string, fallback: number): number {
    const value = this.config.get<number | string>(key);
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  private readContentLength(
    value: string | string[] | undefined,
  ): number | null {
    const raw = Array.isArray(value) ? value[0] : value;
    if (!raw) {
      return null;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  }

  private measureBody(body: unknown): number {
    if (body === undefined) {
      return 0;
    }

    try {
      return Buffer.byteLength(JSON.stringify(body), "utf8");
    } catch {
      return Number.POSITIVE_INFINITY;
    }
  }
}
