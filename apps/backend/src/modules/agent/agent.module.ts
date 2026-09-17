import { Module } from "@nestjs/common";
import { AddressesModule } from "../addresses/addresses.module";
import { CategoriesModule } from "../categories/categories.module";
import { PlacesModule } from "../places/places.module";
import { ProvidersModule } from "../providers/providers.module";
import { SettingsModule } from "../settings/settings.module";
import { AgentController } from "./agent.controller";
import { AgentService } from "./agent.service";

@Module({
  imports: [PlacesModule, ProvidersModule, CategoriesModule, SettingsModule, AddressesModule],
  controllers: [AgentController],
  providers: [AgentService],
})
export class AgentModule {}
