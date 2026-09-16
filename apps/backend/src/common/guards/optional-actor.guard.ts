import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ActorGuard } from "./actor.guard";
import { SupabaseGuard } from "./supabase.guard";

// Public endpoints that adapt to the viewer (contact gating, block exclusion): an absent or
// invalid token means anonymous, while a suspended account is still refused.
@Injectable()
export class OptionalActorGuard implements CanActivate {
  constructor(
    private readonly supabase: SupabaseGuard,
    private readonly actor: ActorGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await this.supabase.canActivate(context);
    } catch (error) {
      if (error instanceof UnauthorizedException) return true;
      throw error;
    }
    await this.actor.canActivate(context);
    return true;
  }
}
