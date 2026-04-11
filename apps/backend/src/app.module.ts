import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { resolve } from "node:path";
import { AppController } from "./app.controller";
import { CommonModule } from "./common/common.module";
import { DatabaseModule } from "./database/database.module";
import { IdentityModule } from "./modules/identity/identity.module";

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
  ],
  controllers: [AppController],
})
export class AppModule {}
