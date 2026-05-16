import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient } from "@supabase/supabase-js";
import { StorageService, SUPABASE_CLIENT } from "./storage.service";
import { MediaController } from "./media.controller";

@Global()
@Module({
  controllers: [MediaController],
  providers: [
    {
      provide: SUPABASE_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>("SUPABASE_URL");
        const key = config.get<string>("SUPABASE_SERVICE_KEY");
        if (!url || !key || url.includes("<project-ref>")) {
          throw new Error(
            "SUPABASE_URL / SUPABASE_SERVICE_KEY are not configured",
          );
        }
        return createClient(url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
      },
    },
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule {}
