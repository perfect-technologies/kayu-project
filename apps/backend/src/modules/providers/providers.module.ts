import { Global, Module } from "@nestjs/common";
import { JevModule } from "../jev/jev.module";
import { ProviderEditorService } from "./provider-editor.service";
import { ProvidersAvailabilityService } from "./providers-availability.service";
import { ProvidersController } from "./providers.controller";
import { ProvidersService } from "./providers.service";

@Global()
@Module({
  imports: [JevModule],
  controllers: [ProvidersController],
  providers: [ProvidersAvailabilityService, ProvidersService, ProviderEditorService],
  exports: [ProvidersAvailabilityService, ProvidersService, ProviderEditorService],
})
export class ProvidersModule {}
