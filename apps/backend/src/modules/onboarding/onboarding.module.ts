import { Module } from "@nestjs/common";
import { ProvidersModule } from "../providers/providers.module";
import { OnboardingController } from "./onboarding.controller";
import { OnboardingService } from "./onboarding.service";

@Module({
  imports: [ProvidersModule],
  controllers: [OnboardingController],
  providers: [OnboardingService],
  exports: [OnboardingService],
})
export class OnboardingModule {}
