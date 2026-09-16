import { Global, Module } from "@nestjs/common";
import { ProviderEditorService } from "./provider-editor.service";
import { ProvidersAvailabilityService } from "./providers-availability.service";
import { ProvidersController } from "./providers.controller";
import { ProvidersService } from "./providers.service";

@Global()
@Module({
  controllers: [ProvidersController],
  providers: [ProvidersAvailabilityService, ProvidersService, ProviderEditorService],
  exports: [ProvidersAvailabilityService, ProvidersService, ProviderEditorService],
})
export class ProvidersModule {}
