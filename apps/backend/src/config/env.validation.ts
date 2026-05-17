import { z } from "zod";

const noPlaceholder = (v: string) => !v.includes("<");

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1).refine(noPlaceholder, "DATABASE_URL is not configured"),
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
  return result.data;
}
