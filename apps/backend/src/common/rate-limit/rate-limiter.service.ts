import { HttpStatus, Injectable } from "@nestjs/common";
import { createHash } from "node:crypto";
import { apiError } from "../http/errors";

type Window = { count: number; resetAt: number };

const MAX_KEYS = 10_000;

@Injectable()
export class RateLimiterService {
  private readonly windows = new Map<string, Window>();
  now = () => Date.now();

  consume(bucket: string, identifier: string, limit: number, windowMs: number): void {
    const now = this.now();
    const key = `${bucket}:${createHash("sha256").update(identifier).digest("hex")}`;
    const current = this.windows.get(key);

    if (!current || current.resetAt <= now) {
      if (!current && this.windows.size >= MAX_KEYS) this.prune(now);
      this.windows.set(key, { count: 1, resetAt: now + windowMs });
      return;
    }

    if (current.count >= limit) {
      const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
      throw apiError(
        HttpStatus.TOO_MANY_REQUESTS,
        "RATE_LIMITED",
        "Trop de demandes. Veuillez réessayer plus tard.",
        { retryAfter },
      );
    }

    current.count += 1;
  }

  private prune(now: number) {
    for (const [key, window] of this.windows) {
      if (window.resetAt <= now) this.windows.delete(key);
    }
    if (this.windows.size >= MAX_KEYS) {
      const oldest = this.windows.keys().next().value;
      if (oldest) this.windows.delete(oldest);
    }
  }
}
