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
  expiresAt: number;
  count: number;
};

type ExpiryEntry = {
  key: string;
  expiresAt: number;
};

export class LaunchRateLimitException extends HttpException {
  constructor(readonly retryAfterSeconds: number) {
    super(
      "Trop de demandes. Veuillez réessayer plus tard.",
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

@Injectable()
export class LaunchIntakeProtectionService {
  private readonly buckets = new Map<string, RateBucket>();
  private readonly expiryHeap: ExpiryEntry[] = [];
  private now = () => Date.now();

  constructor(private readonly config: ConfigService) {}

  checkRequest(request: IntakeRequest): void {
    if (!this.isEnabled()) {
      throw new ServiceUnavailableException(
        "La collecte des demandes est temporairement indisponible.",
      );
    }

    this.checkBodySize(request);

    this.consume(
      "ip",
      request.ip ?? request.socket?.remoteAddress ?? "unknown",
      this.getNumber("LAUNCH_INTAKE_IP_LIMIT", 20),
    );
  }

  checkContact(phoneE164: string): void {
    this.consume(
      "contact",
      phoneE164,
      this.getNumber("LAUNCH_INTAKE_CONTACT_LIMIT", 5),
    );
  }

  checkFunnelRequest(request: IntakeRequest): void {
    if (!this.isFunnelEnabled()) {
      throw new ServiceUnavailableException(
        "La collecte des événements est temporairement indisponible.",
      );
    }

    this.checkBodySize(request);
    this.consume(
      "funnel-ip",
      request.ip ?? request.socket?.remoteAddress ?? "unknown",
      this.getNumber("LAUNCH_FUNNEL_EVENT_IP_LIMIT", 120),
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
    scope: "ip" | "contact" | "funnel-ip",
    identifier: string,
    limit: number,
  ): void {
    const now = this.now();
    const windowMs =
      this.getNumber("LAUNCH_INTAKE_RATE_WINDOW_SECONDS", 900) * 1_000;
    this.pruneExpiredBuckets(now);

    const hash = this.hashIdentifier(identifier);
    if (!hash) {
      throw new ServiceUnavailableException(
        "La collecte des demandes est temporairement indisponible.",
      );
    }
    const key = `${scope}:${hash}`;
    const current = this.buckets.get(key);

    if (!current) {
      this.ensureCapacity(now);
      const bucket = { expiresAt: now + windowMs, count: 1 };
      this.buckets.set(key, bucket);
      this.pushExpiry({ key, expiresAt: bucket.expiresAt });
      return;
    }

    if (current.count >= limit) {
      throw new LaunchRateLimitException(
        Math.max(1, Math.ceil((current.expiresAt - now) / 1_000)),
      );
    }

    current.count += 1;
  }

  private pruneExpiredBuckets(now: number): void {
    while (this.expiryHeap[0]?.expiresAt <= now) {
      const expired = this.popExpiry();
      if (!expired) break;
      const current = this.buckets.get(expired.key);
      if (current?.expiresAt === expired.expiresAt) {
        this.buckets.delete(expired.key);
      }
    }
  }

  private ensureCapacity(now: number): void {
    const capacity = this.getNumber(
      "LAUNCH_INTAKE_RATE_BUCKET_CAPACITY",
      10_000,
    );
    if (this.buckets.size < capacity) {
      return;
    }

    const earliestExpiry = this.expiryHeap[0]?.expiresAt ?? now + 1_000;
    throw new LaunchRateLimitException(
      Math.max(1, Math.ceil((earliestExpiry - now) / 1_000)),
    );
  }

  private pushExpiry(entry: ExpiryEntry): void {
    this.expiryHeap.push(entry);
    let index = this.expiryHeap.length - 1;
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.expiryHeap[parent]!.expiresAt <= entry.expiresAt) break;
      this.expiryHeap[index] = this.expiryHeap[parent]!;
      index = parent;
    }
    this.expiryHeap[index] = entry;
  }

  private popExpiry(): ExpiryEntry | undefined {
    const first = this.expiryHeap[0];
    const last = this.expiryHeap.pop();
    if (!first || !last || this.expiryHeap.length === 0) {
      return first;
    }

    let index = 0;
    while (true) {
      const left = index * 2 + 1;
      const right = left + 1;
      if (left >= this.expiryHeap.length) break;
      const child =
        right < this.expiryHeap.length &&
        this.expiryHeap[right]!.expiresAt <
          this.expiryHeap[left]!.expiresAt
          ? right
          : left;
      if (this.expiryHeap[child]!.expiresAt >= last.expiresAt) break;
      this.expiryHeap[index] = this.expiryHeap[child]!;
      index = child;
    }
    this.expiryHeap[index] = last;
    return first;
  }

  private isFunnelEnabled(): boolean {
    const value = this.config.get<string | boolean>(
      "LAUNCH_FUNNEL_EVENTS_ENABLED",
    );
    return value === true || value === "true";
  }

  private checkBodySize(request: IntakeRequest): void {
    const maxBodyBytes = this.getNumber("LAUNCH_INTAKE_MAX_BODY_BYTES", 16_384);
    const contentLength = this.readContentLength(
      request.headers?.["content-length"],
    );
    const parsedBodyBytes = this.measureBody(request.body);

    if (
      (contentLength !== null && contentLength > maxBodyBytes) ||
      parsedBodyBytes > maxBodyBytes
    ) {
      throw new PayloadTooLargeException(
        "Le formulaire envoyé est trop volumineux.",
      );
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
