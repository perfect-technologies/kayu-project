import { z } from "zod";

const noPlaceholder = (v: string) => !v.includes("<");

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1).refine(noPlaceholder, "DATABASE_URL is not configured"),
  DIRECT_URL: z.string().min(1).refine(noPlaceholder, "DIRECT_URL is not configured").optional(),
  SUPABASE_URL: z.string().url().refine(noPlaceholder, "SUPABASE_URL is not configured"),
  SUPABASE_JWT_ISSUER: z
    .string()
    .url()
    .refine(noPlaceholder, "SUPABASE_JWT_ISSUER is not configured"),
  SUPABASE_SERVICE_KEY: z
    .string()
    .min(1)
    .refine(noPlaceholder, "SUPABASE_SERVICE_KEY is not configured"),
  CORS_ORIGINS: z.string().default("http://localhost:3000"),
  STORAGE_ENV_PREFIX: z.string().optional(),
  SEED_SUPABASE_USERS: z.enum(["true", "false"]).default("false"),
  E2E_TEST_MODE: z.enum(["true", "false"]).default("false"),
  E2E_SEED_PASSWORD: z.string().optional(),
  LAUNCH_PUBLIC_INTAKE_ENABLED: z.enum(["true", "false"]).default("false"),
  LAUNCH_FUNNEL_EVENTS_ENABLED: z.enum(["true", "false"]).default("false"),
  LAUNCH_PRIVACY_NOTICE_VERSION: z.string().default(""),
  LAUNCH_RATE_LIMIT_HASH_KEY: z.string().default(""),
  LAUNCH_INTAKE_IP_LIMIT: z.coerce.number().int().min(1).max(10_000).default(20),
  LAUNCH_FUNNEL_EVENT_IP_LIMIT: z.coerce
    .number()
    .int()
    .min(1)
    .max(100_000)
    .default(120),
  LAUNCH_INTAKE_CONTACT_LIMIT: z.coerce
    .number()
    .int()
    .min(1)
    .max(1_000)
    .default(5),
  LAUNCH_INTAKE_RATE_WINDOW_SECONDS: z.coerce
    .number()
    .int()
    .min(60)
    .max(86_400)
    .default(900),
  LAUNCH_INTAKE_MAX_BODY_BYTES: z.coerce
    .number()
    .int()
    .min(1_024)
    .max(65_536)
    .default(16_384),
  LAUNCH_INTAKE_RATE_BUCKET_CAPACITY: z.coerce
    .number()
    .int()
    .min(100)
    .max(100_000)
    .default(10_000),
}).superRefine((config, ctx) => {
  if (config.E2E_TEST_MODE === "true" && config.NODE_ENV === "production") {
    ctx.addIssue({
      code: "custom",
      path: ["E2E_TEST_MODE"],
      message: "must never be enabled in production",
    });
  }

  if (config.E2E_TEST_MODE === "true" && !config.E2E_SEED_PASSWORD?.trim()) {
    ctx.addIssue({
      code: "custom",
      path: ["E2E_SEED_PASSWORD"],
      message: "must be configured when E2E_TEST_MODE is enabled",
    });
  }

  if (
    config.LAUNCH_PUBLIC_INTAKE_ENABLED === "true" &&
    !config.LAUNCH_PRIVACY_NOTICE_VERSION.trim()
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["LAUNCH_PRIVACY_NOTICE_VERSION"],
      message: "must be configured when public launch intake is enabled",
    });
  }

  if (
    (config.LAUNCH_PUBLIC_INTAKE_ENABLED === "true" ||
      config.LAUNCH_FUNNEL_EVENTS_ENABLED === "true") &&
    config.LAUNCH_RATE_LIMIT_HASH_KEY.length < 32
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["LAUNCH_RATE_LIMIT_HASH_KEY"],
      message:
        "must be at least 32 characters when public launch collection is enabled",
    });
  }
});

export type Env = z.infer<typeof schema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = schema.safeParse(config);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  const env = { ...result.data, DIRECT_URL: result.data.DIRECT_URL ?? result.data.DATABASE_URL };
  // Prisma CLI reads directUrl from process.env; one DATABASE_URL keeps local Docker and CI working.
  process.env.DIRECT_URL ??= env.DIRECT_URL;
  return env;
}
