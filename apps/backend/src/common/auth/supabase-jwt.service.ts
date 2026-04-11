import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { SupabaseJwtClaims } from "./types";

type JoseModule = {
  createRemoteJWKSet: (url: URL) => unknown;
  jwtVerify: (
    token: string,
    key: unknown,
  ) => Promise<{ payload: Record<string, unknown> }>;
};

@Injectable()
export class SupabaseJwtService {
  private jose?: Promise<JoseModule>;
  private jwks?: unknown;

  constructor(private readonly config: ConfigService) {}

  async verify(token: string): Promise<SupabaseJwtClaims> {
    const jose = await this.loadJose();
    const { payload } = await jose.jwtVerify(token, await this.getJwks());
    return payload as SupabaseJwtClaims;
  }

  private loadJose(): Promise<JoseModule> {
    this.jose ??= import("jose").then((jose) => jose as unknown as JoseModule);
    return this.jose;
  }

  private async getJwks(): Promise<unknown> {
    if (this.jwks) return this.jwks;

    const jwksUrl = this.config.get<string>("SUPABASE_JWT_ISSUER");
    if (!jwksUrl || jwksUrl.includes("<project-ref>")) {
      throw new UnauthorizedException("SUPABASE_JWT_ISSUER is not configured");
    }

    const jose = await this.loadJose();
    this.jwks = jose.createRemoteJWKSet(new URL(jwksUrl));
    return this.jwks;
  }
}
