# Production Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **COMMIT POLICY (overrides skill default):** The user's standing instruction is **no intermediate commits** — implement every task end-to-end and let the user review the full diff before anything ships. Therefore tasks below have **no per-task commit step**; each task ends with a verification step instead. Do **not** `git commit` or `git push` at any point unless the user explicitly asks. The spec doc and this plan are also left uncommitted pending the user's review.

**Goal:** Make the Kayou monorepo deployable to Render across two environments (dev + prod) with a green CI gate, reproducible Prisma migrations, a hardened backend/web surface, and infrastructure-as-code.

**Architecture:** One committed `render.yaml` Blueprint defines four native Node services (`kayou-{backend,web}-{dev,prod}`) + two Render Postgres instances; one shared Supabase project provides auth/storage/JWT for both envs. GitHub Actions runs the CI gate and, only on green, triggers Render deploys via per-service deploy hooks (`main` → dev, `v*` tag/Release → prod). Prisma moves from `db push` to a baselined migration history with `migrate deploy` as the backend pre-deploy command.

**Tech Stack:** pnpm workspaces + Turbo, NestJS 11 + Prisma 6 (Postgres), Next.js 16, Zod, `node:test`, GitHub Actions, Render Blueprint.

**Spec:** `docs/superpowers/specs/2026-05-17-production-readiness-design.md` (locked decisions there are authoritative).

**Conventions:**
- Backend tests use `node:test` + hand-rolled fakes. Run one spec from `apps/backend/`: `node --test -r ts-node/register src/modules/<m>/<f>.spec.ts`.
- Package names for pnpm/turbo filters are `@kayu/backend`, `@kayu/web` (the Render *service* names use the brand spelling "kayou").
- Default branch is `main`; no feature branch unless the user asks (per CLAUDE.md).
- Zero comments unless a non-obvious WHY (per user preference).

---

## Phase 1 — Green CI gate (unblocks everything)

### Task 1: Diagnose and fix the failing launch-critical harness spec

**REQUIRED SUB-SKILL:** Use superpowers:systematic-debugging. The root cause is not yet known — do not guess a fix; find it.

**Files:**
- Investigate/modify: `apps/backend/src/test/launch/launch-critical.harness.spec.ts`
- Possibly modify: whichever controller/service/guard the diagnosis implicates

**Known facts (already established, do not re-derive):**
- `npx tsc -p tsconfig.json --noEmit` from `apps/backend/` exits 0 — **the whole backend type-checks clean**, so this is NOT a TypeScript error.
- A normal spec runs fine: `node --test -r ts-node/register src/modules/reviews/reviews.service.spec.ts` → `tests 4 / pass 4`.
- The harness, run solo from `apps/backend/`, reports `tests 1 / fail 1`, failing test `at src/test/launch/launch-critical.harness.spec.ts:1:1` with message `'test failed'` and **no stack** under both the default and `spec` reporters. The file declares 8 top-level `test(...)` calls (lines 1205–1710) yet only 1 "test" is seen — i.e. the child process aborts at the file level (top-level throw / unhandled rejection / abnormal exit), not a normal assertion failure.
- Each test calls `await app.close()` in `finally`; the harness builds a Nest app via `NestFactory.create(HarnessModule, { logger: false })` and `app.listen(0, "127.0.0.1")`.

- [ ] **Step 1: Reproduce and surface the true error**

From `apps/backend/`, run each of these until one prints the underlying error/stack:

```bash
node --test --test-reporter=tap -r ts-node/register src/test/launch/launch-critical.harness.spec.ts 2>&1 | tail -60
node --test-reporter=tap --test-name-pattern="role selection" -r ts-node/register --test src/test/launch/launch-critical.harness.spec.ts 2>&1 | tail -60
NODE_OPTIONS="--unhandled-rejections=strict" node -r ts-node/register --test src/test/launch/launch-critical.harness.spec.ts 2>&1 | tail -60
```

If still opaque, temporarily prepend the spec with instrumentation to force the error to print:

```ts
process.on("unhandledRejection", (e) => { console.error("UNHANDLED REJECTION:", e); });
process.on("uncaughtException", (e) => { console.error("UNCAUGHT:", e); });
```

Expected: a concrete error (e.g. a Nest DI resolution failure, a missing provider, a guard constructor throwing, an open handle, or an unhandled rejection from one of the faked services).

- [ ] **Step 2: Form and verify a single hypothesis**

Write down the smallest hypothesis that explains "file aborts before subtests are counted." Bisect by commenting out all but the first `test(...)` block and re-running; then re-add blocks until the abort returns. Confirm the offending block and the exact line.

- [ ] **Step 3: Apply the minimal root-cause fix**

Fix the actual cause (e.g. correct the fake's shape to match the current controller/service contract, add a missing provider to `HarnessModule`, await a previously-floating promise, or ensure `app.close()` runs on the failing path). Remove any temporary instrumentation added in Step 1. Do not weaken assertions to make it pass.

- [ ] **Step 4: Verify the harness passes solo**

Run: `node --test -r ts-node/register src/test/launch/launch-critical.harness.spec.ts` (from `apps/backend/`)
Expected: `tests 8` (or more if subtests), `pass` equals total, `fail 0`.

- [ ] **Step 5: Verify the project launch suite passes**

Run from repo root: `pnpm test:launch`
Expected: exits 0; all schema/api type-check + build steps succeed, backend specs pass, backend + mobile type-check pass.

---

### Task 2: Add a full backend test script (all 18 specs)

**Files:**
- Modify: `apps/backend/package.json` (scripts)

CLAUDE.md / CI scope require the gate to run **all** backend specs, not the launch subset. The 18 spec files are:
`admin`, `bookings`, `dashboard.service.client`, `dashboard.service.provider`, `identity`, `recent-addresses`, `job-requests`, `messaging`, `onboarding`, `provider-strength`, `providers-availability`, `providers`, `quotes`, `reviews`, `stats`, `storage`, `verification` (under `src/modules/...`), plus `src/test/launch/launch-critical.harness.spec.ts`.

- [ ] **Step 1: Add a `test` script that globs every spec**

In `apps/backend/package.json` `scripts`, add immediately after the `test:launch` line:

```json
    "test": "node --test -r ts-node/register \"src/**/*.spec.ts\"",
```

(`node --test` supports glob patterns. This runs all 18 spec files in separate child processes.)

- [ ] **Step 2: Verify the full suite passes**

Run from `apps/backend/`: `pnpm test`
Expected: every spec file passes; final summary `fail 0`. If a previously-unrun spec fails, fix it the same way as Task 1 (systematic-debugging) before proceeding — the gate must be green.

- [ ] **Step 3: Verify the run is deterministic**

Run `pnpm test` a second time. Expected: identical green result (no flakiness from shared ports/state).

---

### Task 3: Pin Node, expand the CI workflow into a real gate

**Files:**
- Create: `.nvmrc`
- Modify: `package.json` (root — add `engines`), `apps/backend/package.json` (add `engines`), `apps/web/package.json` (add `engines`)
- Modify: `README.md:23`
- Replace: `.github/workflows/launch-harness.yml` → rename to `.github/workflows/ci.yml`

- [ ] **Step 1: Pin the Node version**

Create `.nvmrc` at repo root with exactly:

```
22
```

In root `package.json`, add a top-level `"engines"` block (after `"packageManager"`):

```json
  "engines": {
    "node": ">=22 <23",
    "pnpm": ">=10.18.0"
  }
```

Add to `apps/backend/package.json` and `apps/web/package.json` (top level, after `"private": true,`):

```json
  "engines": {
    "node": ">=22 <23"
  },
```

In `README.md` line 23, change `- Node.js 20+` to `- Node.js 22`.

- [ ] **Step 2: Replace the workflow with a full CI gate**

Delete `.github/workflows/launch-harness.yml` and create `.github/workflows/ci.yml`:

```yaml
name: ci

on:
  pull_request:
  push:
    branches:
      - main

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10.18.0

      - uses: actions/setup-node@v4
        with:
          node-version-file: ".nvmrc"
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - name: Build shared packages
        run: pnpm turbo run build --filter=@kayu/schemas --filter=@kayu/api --filter=@kayu/utils --filter=@kayu/ui

      - name: Backend full test suite
        run: pnpm --filter @kayu/backend test

      - name: Repo-wide type-check
        run: pnpm turbo run type-check

      - name: Web production build
        run: pnpm --filter @kayu/web build
        env:
          BACKEND_URL: http://localhost:3001
          NEXT_PUBLIC_APP_URL: http://localhost:3000
          NEXT_PUBLIC_SUPABASE_URL: https://example.supabase.co
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ci-anon-key
```

(The web build needs the now-required env vars from Task 10/12; CI supplies dummy-but-valid values. `turbo run type-check` already depends on `^build`, so packages are built first.)

- [ ] **Step 3: Verify the gate locally**

Run from repo root, in order, and confirm each exits 0:

```bash
pnpm install --frozen-lockfile
pnpm turbo run build --filter=@kayu/schemas --filter=@kayu/api --filter=@kayu/utils --filter=@kayu/ui
pnpm --filter @kayu/backend test
pnpm turbo run type-check
BACKEND_URL=http://localhost:3001 NEXT_PUBLIC_APP_URL=http://localhost:3000 NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=ci-anon-key pnpm --filter @kayu/web build
```

Expected: all green. (The web build step depends on Tasks 10 & 12 being done — if running Phase 1 in isolation, expect the web build to still succeed with the current `next.config.ts`; it will be re-verified after Phase 2.)

---

## Phase 2 — Backend hardening + web fixes (code only, no infra)

### Task 4: Fail-fast environment validation (backend)

**Files:**
- Create: `apps/backend/src/config/env.validation.ts`
- Create: `apps/backend/src/config/env.validation.spec.ts`
- Modify: `apps/backend/src/app.module.ts:29-35`

- [ ] **Step 1: Write the failing test**

Create `apps/backend/src/config/env.validation.spec.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { validateEnv } from "./env.validation";

const base = {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db?schema=public",
  SUPABASE_URL: "https://proj.supabase.co",
  SUPABASE_JWT_ISSUER: "https://proj.supabase.co/auth/v1/.well-known/jwks.json",
  SUPABASE_SERVICE_KEY: "service-key",
};

test("accepts a complete environment and applies defaults", () => {
  const parsed = validateEnv({ ...base });
  assert.equal(parsed.PORT, 3001);
  assert.equal(parsed.NODE_ENV, "development");
  assert.equal(parsed.DATABASE_URL, base.DATABASE_URL);
});

test("throws when a required secret is missing", () => {
  const { DATABASE_URL, ...withoutDb } = base;
  assert.throws(() => validateEnv(withoutDb), /DATABASE_URL/);
});

test("rejects an unconfigured Supabase placeholder", () => {
  assert.throws(
    () => validateEnv({ ...base, SUPABASE_URL: "https://<project-ref>.supabase.co" }),
    /SUPABASE_URL/,
  );
});
```

- [ ] **Step 2: Run it, verify it fails**

Run from `apps/backend/`: `node --test -r ts-node/register src/config/env.validation.spec.ts`
Expected: FAIL — `Cannot find module './env.validation'`.

- [ ] **Step 3: Implement the validator**

Create `apps/backend/src/config/env.validation.ts`:

```ts
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
```

- [ ] **Step 4: Wire it into ConfigModule**

In `apps/backend/src/app.module.ts`, change the `ConfigModule.forRoot({...})` call (lines 29–35) to:

```ts
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        resolve(process.cwd(), ".env"),
        resolve(process.cwd(), "apps/backend/.env"),
      ],
      validate: validateEnv,
    }),
```

Add the import at the top of `app.module.ts` (with the other local imports):

```ts
import { validateEnv } from "./config/env.validation";
```

- [ ] **Step 5: Verify**

Run from `apps/backend/`: `node --test -r ts-node/register src/config/env.validation.spec.ts` → all pass.
Run: `npx tsc -p tsconfig.json --noEmit` → exits 0.

---

### Task 5: Real `/api/health` endpoint with DB check

**Files:**
- Create: `apps/backend/src/modules/health/health.controller.ts`
- Create: `apps/backend/src/modules/health/health.module.ts`
- Create: `apps/backend/src/modules/health/health.controller.spec.ts`
- Modify: `apps/backend/src/app.module.ts` (register `HealthModule`)
- Modify: `apps/backend/src/app.controller.ts` (leave root as-is; health moves to dedicated controller)

- [ ] **Step 1: Write the failing test**

Create `apps/backend/src/modules/health/health.controller.spec.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { ServiceUnavailableException } from "@nestjs/common";
import { HealthController } from "./health.controller";

test("returns ok when the database responds", async () => {
  const prisma = { $queryRaw: async () => [{ "?column?": 1 }] };
  const controller = new HealthController(prisma as never);
  const result = await controller.health();
  assert.equal(result.status, "ok");
  assert.equal(typeof result.uptime, "number");
});

test("throws 503 when the database is unreachable", async () => {
  const prisma = {
    $queryRaw: async () => {
      throw new Error("connection refused");
    },
  };
  const controller = new HealthController(prisma as never);
  await assert.rejects(() => controller.health(), ServiceUnavailableException);
});
```

- [ ] **Step 2: Run it, verify it fails**

Run from `apps/backend/`: `node --test -r ts-node/register src/modules/health/health.controller.spec.ts`
Expected: FAIL — `Cannot find module './health.controller'`.

- [ ] **Step 3: Implement the controller and module**

Create `apps/backend/src/modules/health/health.controller.ts`:

```ts
import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async health() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException("database unreachable");
    }
    return { status: "ok", uptime: process.uptime() };
  }
}
```

Create `apps/backend/src/modules/health/health.module.ts`:

```ts
import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
```

In `apps/backend/src/app.module.ts`, add the import and register `HealthModule` in `imports` (place it right after `DatabaseModule` so Prisma is available; `DatabaseModule` is global per the existing structure):

```ts
import { HealthModule } from "./modules/health/health.module";
```

and add `HealthModule,` to the `imports` array.

- [ ] **Step 4: Verify the unit test passes**

Run from `apps/backend/`: `node --test -r ts-node/register src/modules/health/health.controller.spec.ts` → both tests pass.

- [ ] **Step 5: Verify the route end-to-end**

Run from `apps/backend/`: `npx tsc -p tsconfig.json --noEmit` → exits 0.
With a local DB up (`pnpm db:up` from root if needed) and `.env` present, run `pnpm --filter @kayu/backend build && node apps/backend/dist/main.js` from repo root, then in another shell: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health` → `200`. Stop the server.

---

### Task 6: Global exception filter (no stack-trace leakage in prod)

**Files:**
- Create: `apps/backend/src/common/filters/all-exceptions.filter.ts`
- Create: `apps/backend/src/common/filters/all-exceptions.filter.spec.ts`
- Modify: `apps/backend/src/main.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/backend/src/common/filters/all-exceptions.filter.spec.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { BadRequestException } from "@nestjs/common";
import { AllExceptionsFilter } from "./all-exceptions.filter";

function mockHost(captured: { status?: number; body?: unknown }) {
  const res = {
    status(code: number) {
      captured.status = code;
      return res;
    },
    json(payload: unknown) {
      captured.body = payload;
      return res;
    },
  };
  return {
    switchToHttp: () => ({
      getResponse: () => res,
      getRequest: () => ({ url: "/api/x", method: "GET" }),
    }),
  } as never;
}

test("passes through HttpException status and message", () => {
  const filter = new AllExceptionsFilter("production");
  const captured: { status?: number; body?: any } = {};
  filter.catch(new BadRequestException("bad input"), mockHost(captured));
  assert.equal(captured.status, 400);
  assert.equal(captured.body.message, "bad input");
});

test("masks unknown errors as generic 500 in production", () => {
  const filter = new AllExceptionsFilter("production");
  const captured: { status?: number; body?: any } = {};
  filter.catch(new Error("DB password is hunter2"), mockHost(captured));
  assert.equal(captured.status, 500);
  assert.equal(captured.body.message, "Internal server error");
  assert.equal(JSON.stringify(captured.body).includes("hunter2"), false);
});

test("includes the error message for unknown errors outside production", () => {
  const filter = new AllExceptionsFilter("development");
  const captured: { status?: number; body?: any } = {};
  filter.catch(new Error("explain me"), mockHost(captured));
  assert.equal(captured.status, 500);
  assert.equal(captured.body.message, "explain me");
});
```

- [ ] **Step 2: Run it, verify it fails**

Run from `apps/backend/`: `node --test -r ts-node/register src/common/filters/all-exceptions.filter.spec.ts`
Expected: FAIL — `Cannot find module './all-exceptions.filter'`.

- [ ] **Step 3: Implement the filter**

Create `apps/backend/src/common/filters/all-exceptions.filter.ts`:

```ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from "@nestjs/common";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger("Exception");

  constructor(private readonly nodeEnv = process.env.NODE_ENV ?? "development") {}

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const res = http.getResponse<{ status: (c: number) => { json: (b: unknown) => unknown } }>();
    const req = http.getRequest<{ url: string; method: string }>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      res.status(status).json(
        typeof body === "string" ? { statusCode: status, message: body } : body,
      );
      return;
    }

    const message = exception instanceof Error ? exception.message : String(exception);
    this.logger.error(`${req.method} ${req.url} -> ${message}`);
    res.status(500).json({
      statusCode: 500,
      message: this.nodeEnv === "production" ? "Internal server error" : message,
    });
  }
}
```

- [ ] **Step 4: Register it globally**

In `apps/backend/src/main.ts`, add the import and register the filter (full hardened file is produced in Task 7 — for now just add the filter so the test of registration holds):

```ts
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
```

and after `app.setGlobalPrefix("api");` add:

```ts
  app.useGlobalFilters(new AllExceptionsFilter());
```

- [ ] **Step 5: Verify**

Run from `apps/backend/`: `node --test -r ts-node/register src/common/filters/all-exceptions.filter.spec.ts` → all pass.
Run: `npx tsc -p tsconfig.json --noEmit` → exits 0.

---

### Task 7: Harden `main.ts` (bind, shutdown, helmet, proxy, JSON logs)

**Files:**
- Modify: `apps/backend/src/main.ts`
- Create: `apps/backend/src/common/logger/json.logger.ts`
- Modify: `apps/backend/package.json` (add `helmet` dependency)

- [ ] **Step 1: Add the helmet dependency**

Run from repo root: `pnpm --filter @kayu/backend add helmet`
Expected: `helmet` appears in `apps/backend/package.json` dependencies; `pnpm-lock.yaml` updated.

- [ ] **Step 2: Add a JSON logger for production**

Create `apps/backend/src/common/logger/json.logger.ts`:

```ts
import { ConsoleLogger, LoggerService } from "@nestjs/common";

class JsonLogger extends ConsoleLogger {
  private emit(level: string, message: unknown, context?: string) {
    process.stdout.write(
      `${JSON.stringify({
        level,
        time: new Date().toISOString(),
        context: context ?? this.context,
        message: typeof message === "string" ? message : JSON.stringify(message),
      })}\n`,
    );
  }
  log(m: unknown, c?: string) { this.emit("info", m, c); }
  error(m: unknown, _stack?: string, c?: string) { this.emit("error", m, c); }
  warn(m: unknown, c?: string) { this.emit("warn", m, c); }
  debug(m: unknown, c?: string) { this.emit("debug", m, c); }
  verbose(m: unknown, c?: string) { this.emit("verbose", m, c); }
}

export function createLogger(): LoggerService {
  return process.env.NODE_ENV === "production"
    ? new JsonLogger()
    : new ConsoleLogger();
}
```

- [ ] **Step 3: Rewrite `main.ts` with all hardening**

Replace the entire contents of `apps/backend/src/main.ts` with:

```ts
import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { createLogger } from "./common/logger/json.logger";

function getCorsOrigins(): string[] {
  return (process.env.CORS_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: createLogger() });

  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: getCorsOrigins(),
    credentials: true,
  });

  app.getHttpAdapter().getInstance().set("trust proxy", 1);
  app.setGlobalPrefix("api");
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port, "0.0.0.0");
}

void bootstrap();
```

- [ ] **Step 4: Verify it builds and boots**

Run from repo root: `pnpm --filter @kayu/backend build`
Expected: exits 0, `apps/backend/dist/main.js` exists.

With local DB up and `.env` present: `NODE_ENV=production node apps/backend/dist/main.js` (briefly). Expected: process starts with no plaintext startup string; logs are single-line JSON. `curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health` → `200`. Stop the server.

- [ ] **Step 5: Verify the backend suite still passes**

Run from `apps/backend/`: `pnpm test`
Expected: `fail 0` (the harness uses its own `{ logger: false }` and is unaffected).

---

### Task 8: Backend `build` runs `prisma generate`

**Files:**
- Modify: `apps/backend/package.json:11`

- [ ] **Step 1: Make prisma generation part of the build**

In `apps/backend/package.json`, change:

```json
    "build": "nest build",
```

to:

```json
    "build": "prisma generate && nest build",
```

- [ ] **Step 2: Verify a clean build generates the client**

Run from repo root:

```bash
rm -rf apps/backend/dist node_modules/.pnpm/@prisma+client* 2>/dev/null; pnpm install --frozen-lockfile && pnpm --filter @kayu/backend build
```

Expected: build logs include Prisma client generation, exits 0, `apps/backend/dist/main.js` exists.

---

### Task 9: Namespace Supabase storage objects by environment

**Files:**
- Modify: `apps/backend/src/modules/storage/storage.service.ts:34-71`
- Modify: `apps/backend/src/modules/storage/storage.service.spec.ts`

Design: a new optional `STORAGE_ENV_PREFIX` (set to `dev` / `prod` in Render env groups). When unset/empty → **no prefix** (preserves current behavior and all existing tests + any existing local objects). When set → object paths and the ownership check are prefixed with `<prefix>/`.

- [ ] **Step 1: Add the failing tests**

Append to `apps/backend/src/modules/storage/storage.service.spec.ts`:

```ts
test("prefixes object paths with STORAGE_ENV_PREFIX when set", () => {
  const prev = process.env.STORAGE_ENV_PREFIX;
  process.env.STORAGE_ENV_PREFIX = "prod";
  try {
    const s = new StorageService(fakeSupabase({ signedUrl: "x", token: "t", path: "p" }) as never);
    const path = s.buildObjectPath("avatar", "user_1", "pic.png");
    assert.match(path, /^prod\/avatar\/user_1\//);
    assert.equal(s.assertOwnedPath("avatar", "user_1", path), true);
    assert.throws(() => s.assertOwnedPath("avatar", "user_1", "avatar/user_1/x.png"));
  } finally {
    process.env.STORAGE_ENV_PREFIX = prev;
  }
});

test("no prefix is applied when STORAGE_ENV_PREFIX is empty", () => {
  const prev = process.env.STORAGE_ENV_PREFIX;
  delete process.env.STORAGE_ENV_PREFIX;
  try {
    const s = new StorageService(fakeSupabase({ signedUrl: "x", token: "t", path: "p" }) as never);
    assert.match(s.buildObjectPath("avatar", "user_1", "p.png"), /^avatar\/user_1\//);
    assert.equal(s.assertOwnedPath("avatar", "user_1", "avatar/user_1/abc-x.jpg"), true);
  } finally {
    if (prev === undefined) delete process.env.STORAGE_ENV_PREFIX;
    else process.env.STORAGE_ENV_PREFIX = prev;
  }
});
```

- [ ] **Step 2: Run it, verify the new tests fail**

Run from `apps/backend/`: `node --test -r ts-node/register src/modules/storage/storage.service.spec.ts`
Expected: the two new tests FAIL (path has no `prod/` prefix), the original 6 still pass.

- [ ] **Step 3: Implement the prefix**

In `apps/backend/src/modules/storage/storage.service.ts`, add a private helper to the class and use it in `buildObjectPath` and `assertOwnedPath`. Add this method inside the `StorageService` class (e.g. after the constructor):

```ts
  private envPrefix(): string {
    const p = process.env.STORAGE_ENV_PREFIX?.trim();
    return p ? `${p}/` : "";
  }
```

Change the `return` of `buildObjectPath` (currently `return \`${purpose}/${actorId}/${suffix}-${safe}\`;`) to:

```ts
    return `${this.envPrefix()}${purpose}/${actorId}/${suffix}-${safe}`;
```

Change the `prefix` line in `assertOwnedPath` (currently `const prefix = \`${purpose}/${actorId}/\`;`) to:

```ts
    const prefix = `${this.envPrefix()}${purpose}/${actorId}/`;
```

- [ ] **Step 4: Verify all storage tests pass**

Run from `apps/backend/`: `node --test -r ts-node/register src/modules/storage/storage.service.spec.ts`
Expected: all 8 tests pass. Run `npx tsc -p tsconfig.json --noEmit` → exits 0.

---

### Task 10: Web — require `BACKEND_URL`, allowlist OSM tiles

**Files:**
- Modify: `apps/web/next.config.ts`

- [ ] **Step 1: Rewrite `next.config.ts`**

Replace the entire contents of `apps/web/next.config.ts` with:

```ts
import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL;
if (!backendUrl) {
  throw new Error(
    "BACKEND_URL is required (no localhost fallback). Set it in the environment before building.",
  );
}

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
  transpilePackages: ["@kayu/ui"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "via.placeholder.com", pathname: "/**" },
      { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
      { protocol: "https", hostname: "ui-avatars.com", pathname: "/**" },
      { protocol: "https", hostname: "*.tile.openstreetmap.org", pathname: "/**" },
      { protocol: "https", hostname: "tile.openstreetmap.org", pathname: "/**" },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
```

- [ ] **Step 2: Verify the build fails without `BACKEND_URL`**

Run from repo root: `pnpm --filter @kayu/web build` (with `BACKEND_URL` unset)
Expected: build FAILS fast with the "BACKEND_URL is required" message.

- [ ] **Step 3: Verify the build succeeds with env set**

Run:

```bash
BACKEND_URL=http://localhost:3001 NEXT_PUBLIC_APP_URL=http://localhost:3000 NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=ci-anon-key pnpm --filter @kayu/web build
```

Expected: exits 0.

---

### Task 11: Web — env-drive OpenGraph/canonical URL

**Files:**
- Modify: `apps/web/src/app/layout.tsx:29-50`

- [ ] **Step 1: Make metadata read `NEXT_PUBLIC_APP_URL`**

In `apps/web/src/app/layout.tsx`, replace the `export const metadata: Metadata = { ... }` block (lines 29–50) with:

```ts
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "KAYOU - Un service a portee de main",
  description:
    "KAYOU connecte les prestataires de services qualifies avec les clients en RDC et Congo-Brazzaville. Trouvez facilement des professionnels pour tous vos besoins: plomberie, electricite, menage, et plus encore.",
  keywords: ["KAYOU", "services", "Kinshasa", "Brazzaville", "RDC", "Congo", "plomberie", "electricite", "menage", "prestataires", "Afrique"],
  authors: [{ name: "KAYOU Team" }],
  icons: {
    icon: "/kayou-logo.png",
  },
  openGraph: {
    title: "KAYOU - Un service a portee de main",
    description: "Trouvez des prestataires de services qualifies a Kinshasa et Brazzaville",
    url: appUrl,
    siteName: "KAYOU",
    type: "website",
    locale: "fr_CD",
  },
  twitter: {
    card: "summary_large_image",
    title: "KAYOU - Un service a portee de main",
    description: "Trouvez des prestataires de services qualifies a Kinshasa et Brazzaville",
  },
};
```

- [ ] **Step 2: Verify**

Run: `BACKEND_URL=http://localhost:3001 NEXT_PUBLIC_APP_URL=https://kayou-web-prod.onrender.com NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=ci pnpm --filter @kayu/web build`
Expected: exits 0. Run `pnpm --filter @kayu/web type-check` → exits 0.

---

### Task 12: Web — validate required public env at build

**Files:**
- Create: `apps/web/src/lib/env.ts`
- Modify: `apps/web/src/lib/supabase.ts`
- Modify: `apps/web/src/lib/supabase-server.ts`

- [ ] **Step 1: Create a validated env accessor**

Create `apps/web/src/lib/env.ts`:

```ts
function required(name: string): string {
  const value = process.env[name];
  if (!value || value.includes("<")) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const publicEnv = {
  supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
};
```

- [ ] **Step 2: Use it in the Supabase clients**

In `apps/web/src/lib/supabase.ts`, replace the body with:

```ts
import { createBrowserClient } from '@supabase/ssr'
import { publicEnv } from './env'

export function createClient() {
  return createBrowserClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey)
}
```

In `apps/web/src/lib/supabase-server.ts`, change the import block to add:

```ts
import { publicEnv } from './env';
```

and replace `process.env.NEXT_PUBLIC_SUPABASE_URL!` with `publicEnv.supabaseUrl` and `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!` with `publicEnv.supabaseAnonKey`.

- [ ] **Step 3: Verify**

Run with the vars **missing** (only BACKEND_URL set): `BACKEND_URL=http://localhost:3001 pnpm --filter @kayu/web build`
Expected: build FAILS with `Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL`.

Run with all vars set (the Task 10 Step 3 command). Expected: exits 0. Run `pnpm --filter @kayu/web type-check` → exits 0.

---

## Phase 3 — Prisma migration baseline & seed safety

### Task 13: Baseline an initial migration; switch to `migrate deploy`

**Files:**
- Create: `apps/backend/prisma/migrations/0_init/migration.sql`
- Create: `apps/backend/prisma/migrations/migration_lock.toml`
- Modify: `apps/backend/package.json` (scripts)
- Modify: root `package.json` (`db:push` / add `db:migrate`)

- [ ] **Step 1: Generate the baseline migration SQL from the current schema**

Run from `apps/backend/`:

```bash
mkdir -p prisma/migrations/0_init
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/0_init/migration.sql
```

Create `apps/backend/prisma/migrations/migration_lock.toml`:

```toml
# Please do not edit this file manually
provider = "postgresql"
```

Expected: `migration.sql` is non-empty and contains `CREATE TABLE "User"` (and the other models).

- [ ] **Step 2: Baseline the existing dev database as already-applied**

The local/dev DB was built with `prisma db push`, so its schema already matches `0_init`. Mark it applied (does NOT run the SQL):

```bash
npx prisma migrate resolve --applied 0_init
```

Expected: `Migration 0_init marked as applied.` Then `npx prisma migrate status` → "Database schema is up to date!".

> If `migrate status` reports drift (dev DB diverged from `schema.prisma` via an un-pushed change), STOP and reconcile: run `pnpm db:push` to sync the dev DB to the schema first, then re-run `migrate resolve --applied 0_init`. Never run `migrate deploy`/`reset` against a database with data you need.

- [ ] **Step 3: Replace push-based scripts with migration scripts**

In `apps/backend/package.json` `scripts`, replace:

```json
    "prisma:push": "prisma db push",
    "prisma:reset": "prisma db push --force-reset && pnpm run db:seed",
```

with:

```json
    "prisma:migrate:dev": "prisma migrate dev",
    "prisma:migrate:deploy": "prisma migrate deploy",
    "prisma:reset": "prisma migrate reset --force && pnpm run db:seed",
```

In root `package.json` `scripts`, replace the `db:push` line:

```json
    "db:push": "pnpm --filter @kayu/backend run prisma:push",
```

with:

```json
    "db:migrate": "pnpm --filter @kayu/backend run prisma:migrate:dev",
    "db:deploy": "pnpm --filter @kayu/backend run prisma:migrate:deploy",
```

Update the root `setup` script (currently ends `... && pnpm db:push && pnpm db:seed`) to use `pnpm db:deploy` instead of `pnpm db:push`.

- [ ] **Step 4: Verify deploy works against a fresh database**

Spin a throwaway DB and apply migrations from zero:

```bash
docker run --rm -d --name kayu_mig_test -e POSTGRES_PASSWORD=postgres -p 5499:5432 postgres:16
sleep 5
cd apps/backend && DATABASE_URL="postgresql://postgres:postgres@localhost:5499/postgres?schema=public" npx prisma migrate deploy
```

Expected: `1 migration found` / `Applying migration 0_init` / `All migrations have been applied`. Then:

```bash
docker rm -f kayu_mig_test
```

---

### Task 14: Make the seed refuse to run in production

**Files:**
- Create: `apps/backend/prisma/seed.guard.spec.ts`
- Modify: `apps/backend/prisma/seed.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/backend/prisma/seed.guard.spec.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { assertSeedAllowed } from "./seed";

test("throws when NODE_ENV is production", () => {
  assert.throws(() => assertSeedAllowed("production"), /refusing to seed/i);
});

test("allows non-production environments", () => {
  assert.doesNotThrow(() => assertSeedAllowed("development"));
  assert.doesNotThrow(() => assertSeedAllowed(undefined));
});
```

- [ ] **Step 2: Run it, verify it fails**

Run from `apps/backend/`: `node --test -r ts-node/register prisma/seed.guard.spec.ts`
Expected: FAIL — `assertSeedAllowed` is not exported.

- [ ] **Step 3: Add the guard and call it before any destructive work**

In `apps/backend/prisma/seed.ts`, add an exported guard near the top (after the `DEFAULT_PASSWORD` const):

```ts
export function assertSeedAllowed(nodeEnv = process.env.NODE_ENV): void {
  if (nodeEnv === "production") {
    throw new Error("Refusing to seed: NODE_ENV=production. Seeding is destructive.");
  }
}
```

In `main()`, make it the very first statement (before `clearDatabase()`):

```ts
async function main() {
  assertSeedAllowed();
  console.log("KAYOU seed starting...");
  await clearDatabase();
  // ...unchanged...
}
```

- [ ] **Step 4: Verify the guard**

Run from `apps/backend/`: `node --test -r ts-node/register prisma/seed.guard.spec.ts` → both pass.

Run: `NODE_ENV=production pnpm --filter @kayu/backend run db:seed`
Expected: exits non-zero with `Refusing to seed: NODE_ENV=production`.

- [ ] **Step 5: Confirm seeding is absent from every deploy path**

Grep the repo for any deploy-time seed invocation:

```bash
grep -rnE 'db:seed|prisma db seed|prisma:reset' .github render.yaml apps/backend/package.json 2>/dev/null
```

Expected: matches appear only in `package.json` scripts and (later) docs — **never** in `render.yaml` `preDeployCommand`/`buildCommand` or in any workflow. If found in infra, remove it.

---

## Phase 4 — Render Blueprint & environment templates

### Task 15: Create `render.yaml`

**Files:**
- Create: `render.yaml` (repo root)

- [ ] **Step 1: Write the Blueprint**

Create `render.yaml` at the repo root:

```yaml
envVarGroups:
  - name: kayou-supabase-shared
    envVars:
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_JWT_ISSUER
        sync: false
      - key: SUPABASE_SERVICE_KEY
        sync: false
      - key: NEXT_PUBLIC_SUPABASE_URL
        sync: false
      - key: NEXT_PUBLIC_SUPABASE_ANON_KEY
        sync: false

databases:
  - name: kayou-db-dev
    plan: basic-256mb
    region: frankfurt
  - name: kayou-db-prod
    plan: basic-1gb
    region: frankfurt

services:
  # ---------- DEV ----------
  - type: web
    name: kayou-backend-dev
    runtime: node
    region: frankfurt
    plan: starter
    branch: main
    autoDeploy: false
    buildCommand: pnpm install --frozen-lockfile && pnpm turbo run build --filter=@kayu/backend
    preDeployCommand: pnpm --filter @kayu/backend exec prisma migrate deploy
    startCommand: node apps/backend/dist/main.js
    healthCheckPath: /api/health
    envVars:
      - fromGroup: kayou-supabase-shared
      - key: NODE_ENV
        value: production
      - key: STORAGE_ENV_PREFIX
        value: dev
      - key: SEED_SUPABASE_USERS
        value: "false"
      - key: DATABASE_URL
        fromDatabase:
          name: kayou-db-dev
          property: connectionString
      - key: CORS_ORIGINS
        sync: false
      - key: PORT
        value: "10000"

  - type: web
    name: kayou-web-dev
    runtime: node
    region: frankfurt
    plan: starter
    branch: main
    autoDeploy: false
    buildCommand: pnpm install --frozen-lockfile && pnpm turbo run build --filter=@kayu/web
    startCommand: pnpm --filter @kayu/web start
    healthCheckPath: /
    envVars:
      - fromGroup: kayou-supabase-shared
      - key: NODE_ENV
        value: production
      - key: BACKEND_URL
        fromService:
          type: web
          name: kayou-backend-dev
          property: hostport
      - key: NEXT_PUBLIC_APP_URL
        sync: false

  # ---------- PROD ----------
  - type: web
    name: kayou-backend-prod
    runtime: node
    region: frankfurt
    plan: standard
    branch: main
    autoDeploy: false
    buildCommand: pnpm install --frozen-lockfile && pnpm turbo run build --filter=@kayu/backend
    preDeployCommand: pnpm --filter @kayu/backend exec prisma migrate deploy
    startCommand: node apps/backend/dist/main.js
    healthCheckPath: /api/health
    envVars:
      - fromGroup: kayou-supabase-shared
      - key: NODE_ENV
        value: production
      - key: STORAGE_ENV_PREFIX
        value: prod
      - key: SEED_SUPABASE_USERS
        value: "false"
      - key: DATABASE_URL
        fromDatabase:
          name: kayou-db-prod
          property: connectionString
      - key: CORS_ORIGINS
        sync: false
      - key: PORT
        value: "10000"

  - type: web
    name: kayou-web-prod
    runtime: node
    region: frankfurt
    plan: standard
    branch: main
    autoDeploy: false
    buildCommand: pnpm install --frozen-lockfile && pnpm turbo run build --filter=@kayu/web
    startCommand: pnpm --filter @kayu/web start
    healthCheckPath: /
    envVars:
      - fromGroup: kayou-supabase-shared
      - key: NODE_ENV
        value: production
      - key: BACKEND_URL
        fromService:
          type: web
          name: kayou-backend-prod
          property: hostport
      - key: NEXT_PUBLIC_APP_URL
        sync: false
```

> Notes for the human operator (do not encode as code): `pnpm turbo run build --filter=@kayu/backend` builds upstream workspace deps first (Turbo `^build`) and backend `build` now runs `prisma generate` (Task 8). `branch: main` is set for all four services but `autoDeploy: false` means Render never deploys on its own — GitHub Actions (Phase 5) triggers every deploy via deploy hooks, including prod on tag. `connection_limit`/`pool_timeout` tuning is appended to each `DATABASE_URL` in the Render dashboard per plan size (documented in Task 18). Plan sizes are starting points; adjust in the dashboard.

- [ ] **Step 2: Validate the YAML**

Run from repo root: `python3 -c "import yaml,sys; yaml.safe_load(open('render.yaml')); print('render.yaml OK')"`
Expected: `render.yaml OK`.

- [ ] **Step 3: Sanity-check the build/start commands locally**

Run from repo root:

```bash
pnpm install --frozen-lockfile && pnpm turbo run build --filter=@kayu/backend && test -f apps/backend/dist/main.js && echo "backend build OK"
BACKEND_URL=http://localhost:3001 NEXT_PUBLIC_APP_URL=http://localhost:3000 NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=ci pnpm turbo run build --filter=@kayu/web && echo "web build OK"
```

Expected: both print their `OK` line.

---

### Task 16: Complete and annotate `.env.example` files

**Files:**
- Modify: `apps/backend/.env.example`
- Modify: `apps/web/.env.example`

- [ ] **Step 1: Rewrite the backend template**

Replace `apps/backend/.env.example` with:

```bash
# --- Required secrets ---
# App database (Render Postgres connection string in prod; local Postgres in dev)
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/kayu?schema=public
# Shared Supabase project (same for dev and prod)
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_JWT_ISSUER=https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json
SUPABASE_SERVICE_KEY=<service-role-key>

# --- Config (non-secret) ---
NODE_ENV=development
PORT=3001
CORS_ORIGINS=http://localhost:3000,http://localhost:8081
# Per-environment storage namespace in the shared Supabase bucket: dev | prod (empty = no prefix)
STORAGE_ENV_PREFIX=
# Local-only demo seeding into shared Supabase auth. Keep false everywhere except a local seed run.
SEED_SUPABASE_USERS=false
```

- [ ] **Step 2: Rewrite the web template**

Replace `apps/web/.env.example` with:

```bash
# --- Required ---
# Backend origin the Next.js server proxies /api/* to (no localhost fallback exists)
BACKEND_URL=http://localhost:3001
# Public site URL (used for OpenGraph / metadataBase)
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Shared Supabase project (anon key is public/safe to expose)
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>

# --- Feature flags (non-secret) ---
NEXT_PUBLIC_ENABLE_JOB_REQUESTS=false
NEXT_PUBLIC_ENABLE_QUOTE_MARKETPLACE=false
```

- [ ] **Step 3: Verify no real secrets and templates stay gitignored-safe**

Run from repo root:

```bash
git check-ignore apps/backend/.env apps/web/.env && grep -L 'sb_secret\|service_role' apps/backend/.env.example apps/web/.env.example
```

Expected: both `.env` paths print (ignored) and the templates contain no real secret values (only `<...>` placeholders).

---

## Phase 5 — Deploy workflows & documentation

### Task 17: CI-gated deploy workflows (dev on `main`, prod on tag)

**Files:**
- Create: `.github/workflows/deploy-dev.yml`
- Create: `.github/workflows/deploy-prod.yml`

GitHub repo secrets the operator must add (documented in Task 18): `RENDER_DEPLOY_HOOK_BACKEND_DEV`, `RENDER_DEPLOY_HOOK_WEB_DEV`, `RENDER_DEPLOY_HOOK_BACKEND_PROD`, `RENDER_DEPLOY_HOOK_WEB_PROD` (each is the full Render deploy-hook URL).

- [ ] **Step 1: Dev deploy after CI passes on `main`**

Create `.github/workflows/deploy-dev.yml`:

```yaml
name: deploy-dev

on:
  workflow_run:
    workflows: ["ci"]
    types: [completed]
    branches: [main]

jobs:
  deploy-dev:
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    runs-on: ubuntu-latest
    steps:
      - name: Trigger backend-dev deploy
        run: curl -fsS -X POST "${{ secrets.RENDER_DEPLOY_HOOK_BACKEND_DEV }}"
      - name: Trigger web-dev deploy
        run: curl -fsS -X POST "${{ secrets.RENDER_DEPLOY_HOOK_WEB_DEV }}"
```

- [ ] **Step 2: Prod deploy on a version tag, gated by a fresh CI run**

Create `.github/workflows/deploy-prod.yml`:

```yaml
name: deploy-prod

on:
  push:
    tags:
      - "v*"

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10.18.0
      - uses: actions/setup-node@v4
        with:
          node-version-file: ".nvmrc"
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo run build --filter=@kayu/schemas --filter=@kayu/api --filter=@kayu/utils --filter=@kayu/ui
      - run: pnpm --filter @kayu/backend test
      - run: pnpm turbo run type-check
      - run: pnpm --filter @kayu/web build
        env:
          BACKEND_URL: http://localhost:3001
          NEXT_PUBLIC_APP_URL: http://localhost:3000
          NEXT_PUBLIC_SUPABASE_URL: https://example.supabase.co
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ci-anon-key

  deploy-prod:
    needs: ci
    runs-on: ubuntu-latest
    steps:
      - name: Trigger backend-prod deploy
        run: curl -fsS -X POST "${{ secrets.RENDER_DEPLOY_HOOK_BACKEND_PROD }}"
      - name: Trigger web-prod deploy
        run: curl -fsS -X POST "${{ secrets.RENDER_DEPLOY_HOOK_WEB_PROD }}"
```

- [ ] **Step 3: Validate workflow YAML**

Run from repo root:

```bash
python3 -c "import yaml; [yaml.safe_load(open(f)) for f in ['.github/workflows/ci.yml','.github/workflows/deploy-dev.yml','.github/workflows/deploy-prod.yml']]; print('workflows OK')"
```

Expected: `workflows OK`.

---

### Task 18: Deployment runbook

**Files:**
- Create: `docs/DEPLOYMENT.md`

- [ ] **Step 1: Write the runbook**

Create `docs/DEPLOYMENT.md` covering, with exact commands/values:

1. **Overview** — topology table (4 services + 2 DBs, shared Supabase), the locked decisions, link to the spec.
2. **One-time Render setup** — create Blueprint from `render.yaml`; create the `kayou-supabase-shared` env-var group and fill `SUPABASE_*` / `NEXT_PUBLIC_SUPABASE_*` from the single shared Supabase project; set per-service `sync:false` vars: dev → `CORS_ORIGINS=https://kayou-web-dev.onrender.com`, `NEXT_PUBLIC_APP_URL=https://kayou-web-dev.onrender.com`; prod → the prod onrender URLs; append `?connection_limit=5&pool_timeout=20` to each `DATABASE_URL` (sized per plan).
3. **GitHub secrets** — add the four `RENDER_DEPLOY_HOOK_*` URLs (Render → each service → Settings → Deploy Hook).
4. **Deploy flow** — push/merge to `main` → `ci` runs → on green, `deploy-dev` fires both dev hooks. Cut prod: `git tag vX.Y.Z && git push origin vX.Y.Z` (or a GitHub Release) → `deploy-prod` re-runs CI then fires both prod hooks. Backend `preDeployCommand` runs `prisma migrate deploy` automatically before each release.
5. **Database runbook** — new migration locally: `pnpm db:migrate` (writes to `prisma/migrations/`, commit it). Never run seed against prod (guarded; `SEED_SUPABASE_USERS=false`, `NODE_ENV=production` refuses). Baseline procedure (reference Task 13). Rollback: deploy the previous tag; for schema rollback, add a new corrective migration (never edit applied migrations).
6. **Shared-Supabase caveats** — dev and prod share `auth.users` and the storage bucket; storage objects are isolated by `STORAGE_ENV_PREFIX` (`dev/` vs `prod/`); a signup in dev is also a prod user (accepted tradeoff).
7. **Secret hygiene** — the local `apps/backend/.env` Supabase service key was never committed (gitignored); rotate it in Supabase only if the dev machine is untrusted.
8. **Custom domain (later)** — set `NEXT_PUBLIC_APP_URL` + `CORS_ORIGINS` + Render custom domain + Supabase redirect/allowed URLs; no code change required.

- [ ] **Step 2: Verify it has no placeholders**

Run from repo root: `grep -nE 'TODO|TBD|FIXME|\.\.\.' docs/DEPLOYMENT.md` → expected: no output (no unfilled markers).

---

### Task 19: Final full-gate verification

**Files:** none (verification only)

- [ ] **Step 1: Run the complete local gate**

From repo root, run in order; every command must exit 0:

```bash
pnpm install --frozen-lockfile
pnpm turbo run build --filter=@kayu/schemas --filter=@kayu/api --filter=@kayu/utils --filter=@kayu/ui
pnpm --filter @kayu/backend test
pnpm turbo run type-check
BACKEND_URL=http://localhost:3001 NEXT_PUBLIC_APP_URL=http://localhost:3000 NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=ci-anon-key pnpm --filter @kayu/web build
python3 -c "import yaml; [yaml.safe_load(open(f)) for f in ['render.yaml','.github/workflows/ci.yml','.github/workflows/deploy-dev.yml','.github/workflows/deploy-prod.yml']]; print('infra YAML OK')"
```

- [ ] **Step 2: Check every acceptance criterion from the spec**

Walk the spec's §6 Acceptance Criteria list and confirm each is satisfied by the work above. Note any gap explicitly; do not claim done if any command above failed.

- [ ] **Step 3: Present the full diff for review**

Run `git status` and `git --no-pager diff --stat`. Summarize the changes by phase. **Do not commit.** Hand back to the user for review (per the commit policy in the header).

---

## Self-Review (completed by plan author)

**Spec coverage:** §4.1 topology → Task 15; §4.2 migrations/seed/pooling → Tasks 13, 14, 18; §4.3 backend hardening → Tasks 4–9; §4.4 web fixes → Tasks 10–12; §4.5 render.yaml → Task 15; §4.6 CI/CD → Tasks 1–3, 17; §4.7 secrets/docs → Tasks 16, 18; §5 sequencing → phase order; §6 acceptance → Task 19. Locked decision "no ESLint" respected (no lint tasks). "Rate limiting deferred" respected (absent). Node 22 standardized (Task 3).

**Placeholder scan:** Task 1 is intentionally a diagnose-then-fix task (root cause unknowable in advance) with concrete repro commands, a hard done-condition, and the systematic-debugging skill — not a hand-waved implementation. All other tasks contain literal file contents and exact commands with expected output. No "TODO/TBD/similar to Task N".

**Type/name consistency:** `validateEnv`/`Env` (Task 4) reused in `app.module.ts`; `AllExceptionsFilter` (Task 6) imported in `main.ts` (Task 7); `createLogger` (Task 7) used in `main.ts`; `STORAGE_ENV_PREFIX` consistent across Tasks 4, 9, 15, 16, 18; `HealthController` constructor `(prisma)` matches its spec; pnpm filters `@kayu/*` vs Render service names `kayou-*` disambiguated in the conventions block; health path `/api/health` consistent in Task 5, 7, 15.
