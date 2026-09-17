import { randomBytes } from "node:crypto";
import { BadRequestException, Inject, Injectable, InternalServerErrorException, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const DEMO_DOMAINS = ["@kayou.cd", "@email.cd"];
export const TEST_SESSION_AUTH = "TEST_SESSION_AUTH";

export type TestSession = {
  access_token: string;
  refresh_token: string;
  expires_at: number | undefined;
  expires_in: number;
  token_type: string;
  user: { id: string; email: string | undefined; phone: string | undefined };
};

type AuthClient = Pick<SupabaseClient["auth"], "signInWithPassword" | "admin">;

@Injectable()
export class TestSessionService {
  private readonly auth: AuthClient;
  private readonly seedPassword: string;

  constructor(config: ConfigService, @Optional() @Inject(TEST_SESSION_AUTH) auth?: AuthClient) {
    this.seedPassword = config.get<string>("E2E_SEED_PASSWORD") ?? "";
    // A dedicated client: signInWithPassword stores a session on the client it runs on.
    this.auth =
      auth ??
      createClient(config.getOrThrow<string>("SUPABASE_URL"), config.getOrThrow<string>("SUPABASE_SERVICE_KEY"), {
        auth: { persistSession: false, autoRefreshToken: false },
      }).auth;
  }

  async forEmail(email: string): Promise<TestSession> {
    if (!DEMO_DOMAINS.some((domain) => email.endsWith(domain))) {
      throw new BadRequestException(`email must end with ${DEMO_DOMAINS.join(" or ")}`);
    }
    const { data, error } = await this.auth.signInWithPassword({ email, password: this.seedPassword });
    if (error || !data.session) {
      throw new BadRequestException(`sign-in failed for ${email}: ${error?.message ?? "no session"}`);
    }
    return toSession(data.session);
  }

  async forPhone(phone: string): Promise<TestSession> {
    const password = randomBytes(32).toString("base64url");
    const created = await this.auth.admin.createUser({ phone, phone_confirm: true, password });
    if (created.error) {
      if (!/already|exists|registered/i.test(created.error.message)) {
        throw new InternalServerErrorException(`createUser failed: ${created.error.message}`);
      }
      const existing = await this.findByPhone(phone);
      if (!existing) throw new InternalServerErrorException(`user ${phone} exists but was not found`);
      const updated = await this.auth.admin.updateUserById(existing, { password, phone_confirm: true });
      if (updated.error) throw new InternalServerErrorException(`updateUserById failed: ${updated.error.message}`);
    }
    const { data, error } = await this.auth.signInWithPassword({ phone, password });
    if (error || !data.session) {
      throw new InternalServerErrorException(`sign-in failed for ${phone}: ${error?.message ?? "no session"}`);
    }
    return toSession(data.session);
  }

  private async findByPhone(phone: string): Promise<string | null> {
    const digits = phone.replace(/^\+/, "");
    for (let page = 1; page <= 20; page += 1) {
      const { data, error } = await this.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw new InternalServerErrorException(`listUsers failed: ${error.message}`);
      const match = data.users.find((user) => user.phone === digits || user.phone === phone);
      if (match) return match.id;
      if (data.users.length < 1000) return null;
    }
    return null;
  }
}

function toSession(session: {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  expires_in: number;
  token_type: string;
  user: { id: string; email?: string; phone?: string };
}): TestSession {
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    expires_in: session.expires_in,
    token_type: session.token_type,
    user: { id: session.user.id, email: session.user.email, phone: session.user.phone },
  };
}
