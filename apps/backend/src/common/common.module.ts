import { Global, Module } from "@nestjs/common";
import { SupabaseJwtService } from "./auth/supabase-jwt.service";
import { RolesGuard } from "./guards/roles.guard";
import { SupabaseGuard } from "./guards/supabase.guard";
import { RateLimiterService } from "./rate-limit/rate-limiter.service";

@Global()
@Module({
  providers: [SupabaseJwtService, SupabaseGuard, RolesGuard, RateLimiterService],
  exports: [SupabaseJwtService, SupabaseGuard, RolesGuard, RateLimiterService],
})
export class CommonModule {}
