# 01 — Monorepo Scaffold & Infrastructure

## Goal

Create the project foundation: directory structure, pnpm workspace, Turborepo pipeline, TypeScript base config, Docker Compose for PostgreSQL, and empty scaffolds for all apps and packages.

## Why It Matters

Every subsequent chunk depends on this structure existing. Without the monorepo scaffold, there is nowhere to put shared schemas, backend modules, or frontend apps. Getting the foundation right avoids restructuring later.

## Scope

### In Scope
- Root `package.json` with workspace scripts
- `pnpm-workspace.yaml` defining `apps/*` and `packages/*`
- `turbo.json` with build/dev/lint/type-check task pipeline
- `tsconfig.base.json` with shared compiler options
- `compose.yaml` with PostgreSQL 16
- `.gitignore` at root level
- Empty app scaffolds: `apps/backend/`, `apps/web/`, `apps/mobile/`
- Empty package scaffolds: `packages/schemas/`, `packages/api/`, `packages/ui/`, `packages/utils/`
- Each scaffold has its own `package.json` and `tsconfig.json`
- Git initialization

### Out Of Scope
- Business logic in any app or package
- NestJS module setup (chunk 03)
- Next.js page setup (chunk 10)
- Expo configuration (chunk 11)
- Schema definitions (chunk 02)
- CI/CD configuration

## Project Structure

```
kayu-project/
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   └── main.ts           # placeholder
│   │   ├── package.json          # @kayu/backend
│   │   └── tsconfig.json
│   ├── web/
│   │   ├── src/
│   │   │   └── app/
│   │   │       └── page.tsx      # placeholder
│   │   ├── package.json          # @kayu/web
│   │   ├── tsconfig.json
│   │   └── next.config.ts
│   └── mobile/
│       ├── App.tsx               # placeholder
│       ├── package.json          # @kayu/mobile
│       └── tsconfig.json
├── packages/
│   ├── schemas/
│   │   ├── src/
│   │   │   └── index.ts          # placeholder export
│   │   ├── package.json          # @kayu/schemas
│   │   └── tsconfig.json
│   ├── api/
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json          # @kayu/api
│   │   └── tsconfig.json
│   ├── ui/
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json          # @kayu/ui
│   │   └── tsconfig.json
│   └── utils/
│       ├── src/
│       │   └── index.ts
│       ├── package.json          # @kayu/utils
│       └── tsconfig.json
├── docs/
│   └── implementation-plan/      # this plan
├── compose.yaml
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── package.json
├── .gitignore
└── README.md
```

## Key Configuration Details

### `pnpm-workspace.yaml`
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### `turbo.json`
```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "type-check": {
      "dependsOn": ["^build"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

### `tsconfig.base.json`
- Target: ES2022
- Module: ESNext
- Module resolution: bundler
- Strict mode: true
- Composite: true
- Skip lib check: true

### `compose.yaml`
- PostgreSQL 16 Alpine
- Port: 5433:5432 (avoid conflicts)
- Volume: `kayu-postgres-data`
- Database: `kayu`
- User/Password: `postgres`/`postgres`

### Package naming convention
- Apps: `@kayu/backend`, `@kayu/web`, `@kayu/mobile`
- Packages: `@kayu/schemas`, `@kayu/api`, `@kayu/ui`, `@kayu/utils`
- All use `"private": true`
- Internal dependencies use `"workspace:*"` protocol

### Root package.json scripts
```json
{
  "dev": "turbo run dev",
  "dev:web": "turbo run dev --filter=@kayu/web --filter=@kayu/backend",
  "dev:mobile": "turbo run dev --filter=@kayu/mobile --filter=@kayu/backend",
  "dev:backend": "turbo run dev --filter=@kayu/backend",
  "build": "turbo run build",
  "lint": "turbo run lint",
  "type-check": "turbo run type-check",
  "clean": "turbo run clean",
  "db:up": "docker compose up -d",
  "db:down": "docker compose down"
}
```

## Dependencies

None — this is the first chunk.

## Acceptance Criteria

1. `pnpm install` completes without errors
2. `turbo run type-check` passes for all packages (placeholder files)
3. `docker compose up -d` starts PostgreSQL and it accepts connections
4. All packages resolve internal `workspace:*` dependencies
5. Git repository initialized with `.gitignore`

## Suggested Implementation Steps

1. Create root directory structure (`apps/`, `packages/`, `docs/`)
2. Write root config files (`package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `.gitignore`)
3. Write `compose.yaml` for PostgreSQL
4. Create each package scaffold (`packages/schemas`, `packages/api`, `packages/ui`, `packages/utils`) with `package.json`, `tsconfig.json`, placeholder `src/index.ts`
5. Create backend scaffold (`apps/backend`) with `package.json`, `tsconfig.json`, placeholder `src/main.ts`
6. Create web scaffold (`apps/web`) with `package.json`, `tsconfig.json`, placeholder Next.js config and page
7. Create mobile scaffold (`apps/mobile`) with `package.json`, `tsconfig.json`, placeholder `App.tsx`
8. Run `pnpm install` and verify workspace resolution
9. Run `turbo run type-check` and verify all pass
10. Initialize git and make initial commit

## QA / Validation Checklist

- [ ] `pnpm install` succeeds
- [ ] `turbo run type-check` passes
- [ ] `docker compose up -d` starts PostgreSQL
- [ ] `docker compose exec postgres psql -U postgres -d kayu -c 'SELECT 1'` returns 1
- [ ] Each package's `package.json` has correct `name` field
- [ ] Internal dependencies resolve (e.g., `@kayu/api` can import from `@kayu/schemas`)
- [ ] `.gitignore` covers `node_modules`, `.next`, `dist`, `.env`, `*.db`
