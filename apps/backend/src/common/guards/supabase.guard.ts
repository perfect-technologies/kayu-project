import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { SupabaseJwtService } from "../auth/supabase-jwt.service";
import type { AuthContextUser, AuthenticatedRequest } from "../auth/types";

@Injectable()
export class SupabaseGuard implements CanActivate {
  constructor(private readonly jwt: SupabaseJwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(req);

    if (!token) {
      throw new UnauthorizedException("Missing authentication token");
    }

    const claims = await this.jwt.verify(token).catch(() => null);

    if (!claims?.sub) {
      throw new UnauthorizedException("Invalid token");
    }

    const user: AuthContextUser = {
      authUserId: claims.sub,
      email: this.normalizeClaim(claims.email),
      phone: this.normalizeClaim(claims.phone),
      claims,
    };

    req.user = user;
    return true;
  }

  private normalizeClaim(value: unknown): string | undefined {
    if (typeof value !== "string") return undefined;

    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }

  private extractToken(req: AuthenticatedRequest): string | null {
    const auth = req.headers.authorization;

    if (auth?.startsWith("Bearer ")) {
      const token = auth.slice("Bearer ".length).trim();
      if (token) return token;
    }

    return this.extractCookieToken(req);
  }

  private extractCookieToken(req: AuthenticatedRequest): string | null {
    const cookies = req.cookies as Record<string, unknown> | undefined;
    if (!cookies) return null;

    const preferredKeys = [
      "access_token",
      "sb-access-token",
      "supabase-access-token",
      "supabase.auth.token",
    ];

    for (const key of preferredKeys) {
      const token = this.readTokenCandidate(cookies[key]);
      if (token) return token;
    }

    for (const [key, value] of Object.entries(cookies)) {
      if (!/^sb-.*-auth-token/.test(key)) continue;

      const token = this.readTokenCandidate(value);
      if (token) return token;
    }

    return null;
  }

  private readTokenCandidate(value: unknown): string | null {
    if (typeof value !== "string" || !value) return null;

    const decoded = this.decodeCookieValue(value);
    const directToken = this.findJwt(decoded);
    if (directToken) return directToken;

    try {
      const parsed = JSON.parse(decoded) as unknown;
      return this.findTokenInJson(parsed);
    } catch {
      return null;
    }
  }

  private decodeCookieValue(value: string): string {
    let uriDecoded = value;

    try {
      uriDecoded = decodeURIComponent(value);
    } catch {
      return value;
    }

    if (!uriDecoded.startsWith("base64-")) {
      return uriDecoded;
    }

    return Buffer.from(uriDecoded.slice("base64-".length), "base64").toString(
      "utf8",
    );
  }

  private findJwt(value: string): string | null {
    const match = value.match(
      /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/,
    );
    return match?.[0] ?? null;
  }

  private findTokenInJson(value: unknown): string | null {
    if (typeof value === "string") return this.findJwt(value);

    if (Array.isArray(value)) {
      for (const item of value) {
        const token = this.findTokenInJson(item);
        if (token) return token;
      }
    }

    if (value && typeof value === "object") {
      const record = value as Record<string, unknown>;
      const accessToken = record.access_token;
      if (typeof accessToken === "string" && accessToken) return accessToken;

      for (const item of Object.values(record)) {
        const token = this.findTokenInJson(item);
        if (token) return token;
      }
    }

    return null;
  }
}
