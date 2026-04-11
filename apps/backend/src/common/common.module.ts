import { Global, Module } from "@nestjs/common";
import { SupabaseJwtService } from "./auth/supabase-jwt.service";
import { RolesGuard } from "./guards/roles.guard";
import { SupabaseGuard } from "./guards/supabase.guard";

@Global()
@Module({
  providers: [SupabaseJwtService, SupabaseGuard, RolesGuard],
  exports: [SupabaseJwtService, SupabaseGuard, RolesGuard],
})
export class CommonModule {}
