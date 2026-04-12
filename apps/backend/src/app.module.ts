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
  ],
  controllers: [AppController],
})
export class AppModule {}
