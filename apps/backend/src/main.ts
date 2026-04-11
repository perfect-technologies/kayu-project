import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

function getCorsOrigins(): string[] {
  return (process.env.CORS_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.enableCors({
    origin: getCorsOrigins(),
    credentials: true,
  });

  app.setGlobalPrefix("api");

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  console.log(`KAYOU API running on http://localhost:${port}/api`);
}

void bootstrap();
