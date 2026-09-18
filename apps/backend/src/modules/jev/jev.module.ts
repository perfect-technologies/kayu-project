import { Module } from "@nestjs/common";
import { TypeSafeClient } from "@typesafe-ai/sdk";
import { Agent, fetch as undiciFetch } from "undici";
import { CategoriesModule } from "../categories/categories.module";
import { SEARCH_INTENT_MODEL } from "./search-intent";
import { JEV_CLIENT, SearchIntentService } from "./search-intent.service";

// Node's default fetch drops idle connections after 4 s, so a quiet search bar paid a cold TLS handshake
// (700–960 ms against 280 ms warm, measured 2026-09-19), over the search budget. TypeSafe's Envoy keeps them far longer.
const keepAlive = new Agent({ keepAliveTimeout: 5 * 60_000, keepAliveMaxTimeout: 10 * 60_000 });

@Module({
  imports: [CategoriesModule],
  providers: [
    {
      provide: JEV_CLIENT,
      useFactory: () => {
        const apiKey = process.env.TYPESAFE_API_KEY?.trim();
        if (!apiKey) return null;
        const client = new TypeSafeClient({
          apiKey,
          defaultModel: SEARCH_INTENT_MODEL,
          logLevel: "warn",
          fetch: ((url: string, init?: RequestInit) => undiciFetch(url, { ...(init as object), dispatcher: keepAlive })) as never,
        });
        client.models.list().catch(() => undefined);
        return client;
      },
    },
    SearchIntentService,
  ],
  exports: [SearchIntentService],
})
export class JevModule {}
