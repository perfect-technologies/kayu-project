import { Module } from "@nestjs/common";
import { ProvidersController } from "./providers.controller";
import { ProvidersService } from "./providers.service";
import { ProvidersAvailabilityService } from "./providers-availability.service";

@Module({
  controllers: [ProvidersController],
  providers: [ProvidersService, ProvidersAvailabilityService],
  exports: [ProvidersService, ProvidersAvailabilityService],
})
export class ProvidersModule {}
