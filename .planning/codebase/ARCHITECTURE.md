# Architecture

**Analysis Date:** 2026-03-25

## Pattern Overview

**Overall:** Modular monolith using NestJS module boundaries with layered HTTP/WebSocket entry points over shared infrastructure services.

**Key Characteristics:**
- Root composition in `src/app.module.ts` wires global cross-cutting concerns and mounts feature modules.
- Feature-first organization under `src/features/*` with `*.controller.ts` (transport), `*.service.ts` (business logic), and optional `*.gateway.ts` (real-time).
- TypeORM repository pattern over PostgreSQL, with Redis-backed cache/session/token state.

## Layers

**Bootstrap Layer:**
- Purpose: Initialize Nest application, global middleware/pipes/docs/server.
- Location: `src/main.ts`
- Contains: Global prefix setup, CORS setup, global `ValidationPipe`, Swagger bootstrap, server listen.
- Depends on: `AppModule`, `ConfigService`, Nest core APIs.
- Used by: Runtime process entry (`npm run start*`).

**Composition Layer (Application Root):**
- Purpose: Declare runtime module graph and global providers.
- Location: `src/app.module.ts`
- Contains: Config module loading (`src/config/*.config.ts`), TypeORM root connection, throttling, scheduling, feature module imports, global guard/filter/interceptors.
- Depends on: Config, TypeORM, shared guard/filter/interceptor classes, feature modules.
- Used by: `src/main.ts` via `NestFactory.create(AppModule)`.

**Feature Layer:**
- Purpose: Domain-specific API and use-case orchestration.
- Location: `src/features/*`
- Contains: Controllers (`auth`, `users`, `wifi-sessions`, `chat`, etc.), services, DTOs, strategies, gateways.
- Depends on: Entities (`src/database/entities/*`), shared decorators/guards/utils, infrastructure services (`src/services/*`).
- Used by: App root module imports and external clients.

**Infrastructure/Platform Services Layer:**
- Purpose: Provide reusable integrations (cache, email, firebase, storage, socket support).
- Location: `src/services/*`, `src/config/*`
- Contains: `CacheService`, `EmailService`, `FirebaseService`, `StorageService`, `SocketService` and configuration factories.
- Depends on: External SDKs/libraries and environment-backed config.
- Used by: Feature services/modules and auth/token/device flows.

**Persistence Layer:**
- Purpose: Database schema mapping and migrations.
- Location: `src/database/entities/*`, `src/database/migrations/*`
- Contains: TypeORM entities (extending `src/database/entities/base.entity.ts`) and migration history.
- Depends on: TypeORM decorators/runtime.
- Used by: Feature services through `@InjectRepository` and query builder.

**Shared Cross-Cutting Layer:**
- Purpose: Consistent auth, response, exception, utility, and repository behavior across features.
- Location: `src/shared/*`
- Contains: Guards (`jwt-auth.guard.ts`, `roles.guard.ts`), decorators (`public.decorator.ts`, `current-user.decorator.ts`), interceptors, filter, constants, repositories, response/logging utilities.
- Depends on: Nest core, class-transformer, TypeORM helpers.
- Used by: Nearly all controllers/services.

## Data Flow

**HTTP Request Flow (authenticated endpoints):**

1. Request enters controller route (example: `src/features/wifi-sessions/wifi-sessions.controller.ts`).
2. Global JWT guard in `src/app.module.ts` (`JwtAuthGuard`) enforces auth unless `@Public()` metadata is present (`src/shared/decorators/public.decorator.ts`).
3. Controller delegates to feature service (`src/features/*/*.service.ts`) and service reads/writes via TypeORM repositories.
4. Service may call cross-module services (example: `WifiSessionsService` calls `PointsService` in `src/features/wifi-sessions/wifi-sessions.service.ts`).
5. Response is shaped with `ResponseUtil` (`src/shared/utils/response.util.ts`) and normalized by `TransformInterceptor` (`src/shared/interceptors/transform.interceptor.ts`).

**Auth + Device + Token Flow:**

1. `AuthController` (`src/features/auth/auth.controller.ts`) receives login/device requests.
2. `AuthService` (`src/features/auth/auth.service.ts`) loads user/student with TypeORM and delegates device policy to `DevicesService`.
3. `DevicesService` (`src/features/devices/devices.service.ts`) validates known device / OTP flow and revokes old tokens for single-device behavior.
4. `TokensService` (`src/features/tokens/tokens.service.ts`) issues JWTs and persists token/session metadata in Redis through `CacheService` (`src/services/cache.service.ts`).

**Scheduled Session Finalization Flow:**

1. `@Cron` in `src/features/wifi-sessions/wifi-sessions.service.ts` scans stale active sessions.
2. Timed-out sessions are completed and points are logged via `PointsService`.
3. Active-session cache keys are invalidated in Redis.

**State Management:**
- Primary persistent state: PostgreSQL via TypeORM (`src/config/database.config.ts`, entities in `src/database/entities/*`).
- Ephemeral/session state: Redis via `CacheService` (`src/services/cache.service.ts`) for tokens, active session keys, and leaderboard-like primitives.
- Transport-level state: JWT claims + request-scoped user context via Passport strategy/guard.

## Key Abstractions

**Nest Feature Module Boundary:**
- Purpose: Encapsulate domain endpoints and providers.
- Examples: `src/features/auth/auth.module.ts`, `src/features/users/users.module.ts`, `src/features/chat/chat.module.ts`.
- Pattern: `TypeOrmModule.forFeature([...])` + controllers + providers + exports.

**Shared Response Contract:**
- Purpose: Uniform API response envelopes.
- Examples: `src/shared/utils/response.util.ts`, `src/shared/interceptors/transform.interceptor.ts`, `src/shared/filters/http-exception.filter.ts`.
- Pattern: Success/error wrappers with optional metadata and global interceptor normalization.

**Entity Base Inheritance:**
- Purpose: Standardized identity and audit fields.
- Examples: `src/database/entities/base.entity.ts` extended by entities in `src/database/entities/*`.
- Pattern: UUID PK + created/updated/deleted timestamps.

**Repository Utilities:**
- Purpose: Standard CRUD/pagination and DB exception mapping.
- Examples: `src/shared/repositories/base.repository.ts`, `src/shared/repositories/pagination.repository.ts`, `src/shared/exceptions/database-exception.mapper.ts`.
- Pattern: Shared wrappers over TypeORM repositories.

## Entry Points

**HTTP/Process Bootstrap:**
- Location: `src/main.ts`
- Triggers: Node process start (`npm run start`, `npm run start:dev`, `npm run start:prod`).
- Responsibilities: App creation, global setup, docs exposure, server start.

**Root Module Composition:**
- Location: `src/app.module.ts`
- Triggers: Imported by bootstrap.
- Responsibilities: System module graph, infrastructure setup, global guard/filter/interceptor registration.

**WebSocket Entry Point:**
- Location: `src/features/chat/chat.gateway.ts`
- Triggers: Socket.IO connection events and subscribed message events.
- Responsibilities: Connection lifecycle logging and message event handling.

## Error Handling

**Strategy:** Centralized global exception filter with structured JSON response and request-path logging.

**Patterns:**
- Global catch-all filter in `src/shared/filters/http-exception.filter.ts` formats consistent error payload.
- Service-level domain errors via Nest exceptions (`NotFoundException`, `BadRequestException`, `UnauthorizedException`) in feature services.

## Cross-Cutting Concerns

**Logging:**
- Request timing in `src/shared/interceptors/logging.interceptor.ts`.
- Application/domain logging through `src/shared/utils/logger.util.ts` and Nest `Logger` usage in services.

**Validation:**
- Global `ValidationPipe` in `src/main.ts` with whitelist/transform/non-whitelisted rejection.
- DTO validation decorators in feature DTOs under `src/features/*/dto/*`.

**Authentication/Authorization:**
- Global JWT guard (`src/shared/guards/jwt-auth.guard.ts`) with `@Public()` bypass.
- Role checks implemented via `RolesGuard` (`src/shared/guards/roles.guard.ts`) and `@Roles()` decorator where needed.

## Notable Architectural Decisions and Risks

**Decision: Global auth-by-default model.**
- Evidence: `APP_GUARD` registration for `JwtAuthGuard` in `src/app.module.ts` and `@Public()` metadata in `src/shared/decorators/public.decorator.ts`.
- Benefit: Secure-by-default endpoints.
- Risk: Missing `@Public()` on intended public routes causes accidental access breakage.

**Decision: Redis-backed token revocation/session model.**
- Evidence: `src/features/tokens/tokens.service.ts` and `src/services/cache.service.ts`.
- Benefit: Supports revocation and device/session invalidation.
- Risk: Multiple module-level `CacheService` providers (`src/features/auth/auth.module.ts`, `src/features/tokens/tokens.module.ts`, `src/features/wifi-sessions/wifi-sessions.module.ts`) can instantiate multiple Redis clients, increasing connection overhead.

**Risk: Partially mounted feature graph.**
- Evidence: `src/features/pvp/pvp.module.ts` and `src/features/minigames/minigames.module.ts` exist but are not imported in `src/app.module.ts`.
- Impact: Implemented modules/controllers are unreachable at runtime.

**Risk: Dual ORM footprint without active Prisma runtime usage.**
- Evidence: Prisma files/deps (`prisma/schema.prisma`, `prisma.config.ts`, `@prisma/client` in `package.json`) while runtime code uses TypeORM (`src/config/database.config.ts`, `@InjectRepository` across services).
- Impact: Cognitive overhead, tooling drift, migration ambiguity.

---

*Architecture analysis: 2026-03-25*
