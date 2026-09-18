import { Module } from "@nestjs/common";
import { AddressesModule } from "../addresses/addresses.module";
import { BookingsModule } from "../bookings/bookings.module";
import { CategoriesModule } from "../categories/categories.module";
import { MessagingModule } from "../messaging/messaging.module";
import { PlacesModule } from "../places/places.module";
import { ProvidersModule } from "../providers/providers.module";
import { ReviewsModule } from "../reviews/reviews.module";
import { SettingsModule } from "../settings/settings.module";
import { AgentController } from "./agent.controller";
import { AgentService } from "./agent.service";

@Module({
  imports: [
    PlacesModule,
    ProvidersModule,
    CategoriesModule,
    SettingsModule,
    AddressesModule,
    BookingsModule,
    MessagingModule,
    ReviewsModule,
  ],
  controllers: [AgentController],
  providers: [AgentService],
})
export class AgentModule {}
