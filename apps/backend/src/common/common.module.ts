import { Global, Module } from "@nestjs/common";
import { SupabaseJwtService } from "./auth/supabase-jwt.service";
import { ActorGuard } from "./guards/actor.guard";
import { RolesGuard } from "./guards/roles.guard";
import { SupabaseGuard } from "./guards/supabase.guard";

@Global()
@Module({
  providers: [SupabaseJwtService, SupabaseGuard, ActorGuard, RolesGuard],
  exports: [SupabaseJwtService, SupabaseGuard, ActorGuard, RolesGuard],
})
export class CommonModule {}
