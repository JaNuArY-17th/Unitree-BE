# Technology Stack

**Analysis Date:** 2026-03-25

## Languages

**Primary:**

- TypeScript 5.7.x - Main application language for backend APIs and services (`package.json`, `src/**/*.ts`).

**Secondary:**

- JavaScript (CommonJS config) - TypeORM CLI datasource bootstrap (`typeorm.config.ts`).
- SQL (via migration/query execution) - Database schema evolution through TypeORM migrations (`src/database/migrations/*.ts`).

## Runtime

**Environment:**

- Node.js runtime (NestJS server entrypoint in `src/main.ts`; production start script `node dist/main` in `package.json`).

**Package Manager:**

- npm (lockfile present: `package-lock.json`).
- Install flow and scripts are npm-based (`package.json` scripts).

## Frameworks

**Core:**

- NestJS v11 (`@nestjs/*`) - Modular API framework, DI, guards, filters, interceptors (`src/app.module.ts`, `src/main.ts`).
- TypeORM 0.3.x - Primary ORM and migration system (`@nestjs/typeorm`, `typeorm`, `src/database/entities`, `src/database/migrations`).

**Testing:**

- Jest 30 + ts-jest - Unit/integration/e2e test execution (`package.json` scripts, `jest` config block, `test/jest-e2e.json`).
- Supertest - HTTP e2e assertions (`package.json` devDependencies).

**Build/Dev:**

- Nest CLI - Build/run workflows (`package.json` scripts: `build`, `start:*`).
- TypeScript compiler - Type checking and transpilation (`typescript` in `package.json`, `tsconfig.json`, `tsconfig.build.json`).
- ESLint 9 + Prettier 3 - Static analysis/formatting (`eslint.config.mjs`, `.prettierrc`).
- Prisma CLI/Client present for schema tooling (`prisma.config.ts`, `prisma/schema.prisma`, `@prisma/client` in `package.json`).

## Key Dependencies

**Critical:**

- `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express` - HTTP app lifecycle and DI (`src/main.ts`, `src/app.module.ts`).
- `@nestjs/config` + `joi` - Env-driven configuration loading/validation pattern (`src/config/*.config.ts`, `src/app.module.ts`).
- `@nestjs/typeorm`, `typeorm`, `pg` - PostgreSQL data layer and repositories (`src/config/database.config.ts`, `src/features/**/**.service.ts`).
- `@nestjs/jwt`, `passport`, `passport-jwt`, `passport-local` - Token issuance and auth strategies (`src/features/tokens/tokens.service.ts`, `src/features/auth/strategies/*.ts`).

**Infrastructure:**

- `ioredis` - Cache/session/token storage (`src/services/cache.service.ts`, `src/features/tokens/tokens.service.ts`).
- `firebase-admin` - FCM push and Google ID token verification (`src/services/firebase.service.ts`, `src/features/auth/auth.service.ts`).
- `cloudinary` - Media upload/delete (`src/services/storage.service.ts`, `src/config/cloudinary.config.ts`).
- `nodemailer` - SMTP email delivery (`src/services/email.service.ts`, `src/config/email.config.ts`).
- `socket.io`, `@nestjs/websockets` - Realtime chat/socket support (`src/features/chat/chat.gateway.ts`, `src/services/socket.service.ts`).
- `@nestjs/swagger`, `swagger-ui-express` - OpenAPI generation for non-production (`src/main.ts`).
- `@nestjs/throttler` - API rate limiting (`src/app.module.ts`, `src/config/app.config.ts`).
- `@nestjs/schedule` - Cron/scheduled jobs (`src/app.module.ts`, `src/features/trees/trees.service.ts`, `src/features/wifi-sessions/wifi-sessions.service.ts`).

## Configuration

**Environment:**

- Runtime config is loaded globally through `ConfigModule.forRoot` with named config modules (`src/app.module.ts`, `src/config/*.config.ts`).
- `.env` file is present in repository root (`.env` exists). Contents were not inspected.
- Core config domains: app, database, redis, firebase, jwt, cloudinary, email (`src/config/*.config.ts`).

**Build:**

- TypeScript compiler configs: `tsconfig.json`, `tsconfig.build.json`.
- Nest build orchestration: `nest-cli.json` and `npm run build`.
- Prisma config is present but separate from TypeORM runtime path (`prisma.config.ts`).

## Platform Requirements

**Development:**

- Node.js + npm.
- PostgreSQL 15 compatible database (local container definition uses `postgres:15-alpine` in `docker-compose.yml`).
- Redis 7 compatible cache (`redis:7-alpine` in `docker-compose.yml`).
- Environment variables for DB/Redis/JWT/external services (`src/config/*.config.ts`).

**Production:**

- Built Node.js service executing `dist/main` (`package.json`).
- External PostgreSQL and Redis endpoints expected via env vars (`src/config/database.config.ts`, `src/config/redis.config.ts`).
- SSL-capable DB connections via `DB_SSL` toggle (`src/config/database.config.ts`, `typeorm.config.ts`).
- No explicit cloud deployment manifest detected in repository (`.github/workflows` not detected).

---

_Stack analysis: 2026-03-25_
