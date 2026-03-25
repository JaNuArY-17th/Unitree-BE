# External Integrations

**Analysis Date:** 2026-03-25

## APIs & External Services

**Media Storage & Asset Delivery:**

- Cloudinary - Uploads and deletes image assets.
  - SDK/Client: `cloudinary`
  - Auth: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, optional `CLOUDINARY_FOLDER`
  - Evidence: `src/config/cloudinary.config.ts`, `src/services/storage.service.ts`

**Identity/Notifications (Google/Firebase):**

- Firebase Admin - Verifies Google ID tokens and sends push notifications.
  - SDK/Client: `firebase-admin`
  - Auth: `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_DATABASE_URL`
  - Evidence: `src/config/firebase.config.ts`, `src/services/firebase.service.ts`, `src/features/auth/auth.service.ts`

**Email Delivery:**

- SMTP provider via Nodemailer transport (provider-agnostic; default host suggests Gmail SMTP fallback).
  - SDK/Client: `nodemailer`
  - Auth: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM_NAME`, `EMAIL_FROM_ADDRESS`
  - Evidence: `src/config/email.config.ts`, `src/services/email.service.ts`

## Data Storage

**Databases:**

- PostgreSQL (primary operational datastore).
  - Connection: `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`, `DB_SSL`
  - Client: TypeORM (`@nestjs/typeorm` + `typeorm` + `pg`)
  - Evidence: `src/config/database.config.ts`, `src/app.module.ts`, `typeorm.config.ts`, `src/database/entities/*.entity.ts`
- Prisma schema/config also present for PostgreSQL modeling/tooling.
  - Connection: `DATABASE_URL` (Prisma config)
  - Client: `@prisma/client` / Prisma CLI
  - Evidence: `prisma.config.ts`, `prisma/schema.prisma`, `package.json`

**File Storage:**

- Cloudinary (primary media upload/delete path).
  - Evidence: `src/services/storage.service.ts`
- Firebase Storage handle available through Admin SDK wrapper.
  - Evidence: `src/services/firebase.service.ts`

**Caching:**

- Redis for cache, token/session state, key-prefix namespacing.
  - Connection: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB`, `REDIS_KEY_PREFIX`, `REDIS_TTL`
  - Client: `ioredis`
  - Evidence: `src/config/redis.config.ts`, `src/services/cache.service.ts`, `src/features/tokens/tokens.service.ts`

## Authentication & Identity

**Auth Provider:**

- Custom JWT auth for API sessions.
  - Implementation: Nest Passport strategies (`passport-jwt`, `passport-local`) with Redis-backed token revocation/state.
  - Env: `JWT_SECRET`, `JWT_ACCESS_TOKEN_EXPIRY`, `JWT_REFRESH_TOKEN_EXPIRY`
  - Evidence: `src/features/auth/strategies/jwt.strategy.ts`, `src/features/auth/strategies/local.strategy.ts`, `src/features/tokens/tokens.service.ts`, `src/config/jwt.config.ts`
- Federated login path: Google sign-in through Firebase ID token verification.
  - Evidence: `src/features/auth/auth.service.ts`, `src/services/firebase.service.ts`

## Monitoring & Observability

**Error Tracking:**

- Dedicated external error tracking service not detected (e.g., Sentry/New Relic).

**Logs:**

- Application logging via custom logger utility and Nest logger patterns.
  - Evidence: `src/shared/utils/logger.util.ts`, usage in `src/main.ts`, `src/services/*.service.ts`

## CI/CD & Deployment

**Hosting:**

- Platform-specific host target not detected in repository manifests.
- Containerized local dependencies provided through Docker Compose for PostgreSQL/Redis.
  - Evidence: `docker-compose.yml`

**CI Pipeline:**

- GitHub Actions workflows not detected in `.github/workflows`.

## Environment Configuration

**Required env vars:**

- Core runtime: `NODE_ENV`, `PORT`, `API_PREFIX`, `CORS_ORIGINS`
- Database: `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`, `DB_SSL`
- Redis: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB`, `REDIS_KEY_PREFIX`, `REDIS_TTL`
- JWT: `JWT_SECRET`, `JWT_ACCESS_TOKEN_EXPIRY`, `JWT_REFRESH_TOKEN_EXPIRY`
- Firebase: `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_DATABASE_URL`
- Cloudinary: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_FOLDER`
- Email: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM_NAME`, `EMAIL_FROM_ADDRESS`
- Prisma tooling path: `DATABASE_URL`
- Evidence: `src/config/*.config.ts`, `prisma.config.ts`

**Secrets location:**

- `.env` present at repository root; values are loaded through `dotenv/config` and Nest config modules.
  - Evidence: `.env` (existence only), `src/app.module.ts`, `typeorm.config.ts`, `prisma.config.ts`

## Webhooks & Callbacks

**Incoming:**

- HTTP webhook endpoints not detected in current codebase scan.

**Outgoing:**

- SMTP email sends, Firebase push messages, and Cloudinary upload/delete API calls.
  - Evidence: `src/services/email.service.ts`, `src/services/firebase.service.ts`, `src/services/storage.service.ts`

---

_Integration audit: 2026-03-25_
