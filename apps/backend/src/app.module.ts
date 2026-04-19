import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { resolve } from "node:path";
import { AppController } from "./app.controller";
import { CommonModule } from "./common/common.module";
import { DatabaseModule } from "./database/database.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { IdentityModule } from "./modules/identity/identity.module";
import { BookingsModule } from "./modules/bookings/bookings.module";
import { ProvidersModule } from "./modules/providers/providers.module";
import { ReviewsModule } from "./modules/reviews/reviews.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { MessagingModule } from "./modules/messaging/messaging.module";
import { FavoritesModule } from "./modules/favorites/favorites.module";
import { AdminModule } from "./modules/admin/admin.module";
import { SettingsModule } from "./modules/settings/settings.module";
import { StatsModule } from "./modules/stats/stats.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { EarningsModule } from "./modules/earnings/earnings.module";
import { GeoModule } from "./modules/geo/geo.module";
import { JobRequestsModule } from "./modules/job-requests/job-requests.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        resolve(process.cwd(), ".env"),
        resolve(process.cwd(), "apps/backend/.env"),
      ],
    }),
    DatabaseModule,
    CommonModule,
    IdentityModule,
    CategoriesModule,
    ProvidersModule,
    BookingsModule,
    ReviewsModule,
    NotificationsModule,
    MessagingModule,
    FavoritesModule,
    AdminModule,
    SettingsModule,
    StatsModule,
    DashboardModule,
    EarningsModule,
    GeoModule,
    JobRequestsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
