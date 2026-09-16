import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { resolve } from "node:path";
import { AppController } from "./app.controller";
import { featureModules } from "./app.modules";
import { CommonModule } from "./common/common.module";
import { validateEnv } from "./config/env.validation";
import { DatabaseModule } from "./database/database.module";
import { SupabaseModule } from "./modules/supabase/supabase.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        resolve(process.cwd(), ".env"),
        resolve(process.cwd(), "apps/backend/.env"),
      ],
      validate: validateEnv,
    }),
    DatabaseModule,
    SupabaseModule,
    CommonModule,
    ...featureModules,
  ],
  controllers: [AppController],
})
export class AppModule {}
