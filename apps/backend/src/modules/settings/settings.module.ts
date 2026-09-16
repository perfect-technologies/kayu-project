import { Global, Module } from "@nestjs/common";
import { SettingsController } from "./settings.controller";
import { SiteSettingsService } from "./site-settings.service";

@Global()
@Module({
  controllers: [SettingsController],
  providers: [SiteSettingsService],
  exports: [SiteSettingsService],
})
export class SettingsModule {}
