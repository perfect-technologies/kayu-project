import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_CLIENT } from "../storage/storage.service";

@Global()
@Module({
  providers: [
    {
      provide: SUPABASE_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>("SUPABASE_URL");
        const key = config.get<string>("SUPABASE_SERVICE_KEY");
        if (!url || !key || url.includes("<project-ref>")) {
          throw new Error("SUPABASE_URL / SUPABASE_SERVICE_KEY are not configured");
        }
        return createClient(url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
      },
    },
  ],
  exports: [SUPABASE_CLIENT],
})
export class SupabaseModule {}
