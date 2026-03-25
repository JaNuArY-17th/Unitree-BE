# Codebase Concerns

**Analysis Date:** 2026-03-25

## Tech Debt

**[CRITICAL] Authentication flow does not verify password on login paths:**

- Issue: Login endpoints require `password` in DTOs but service-level authentication only matches by email; password is never validated.
- Files: `src/features/auth/auth.service.ts`, `src/features/auth/dto/login.dto.ts`, `src/features/auth/dto/login-with-device.dto.ts`, `src/features/auth/strategies/local.strategy.ts`
- Impact: Any actor who knows a valid user email can obtain JWT tokens, leading to account takeover.
- Fix approach: Enforce password hash verification in `AuthService.login` and `AuthService.loginWithDevice` (or explicitly remove password-based auth and switch to a clearly documented OTP-only flow).

**[HIGH] Token revocation logic exists but is not enforced in request authentication:**

- Issue: Token revocation is implemented in Redis, but JWT request validation path does not call access-token revocation checks.
- Files: `src/features/tokens/tokens.service.ts`, `src/features/auth/strategies/jwt.strategy.ts`, `src/features/devices/devices.service.ts`
- Impact: Logout/single-device logout can mark tokens revoked in cache, but previously issued access tokens may remain usable until expiry.
- Fix approach: Validate bearer tokens against Redis revocation state in the JWT strategy/guard path (reuse `TokensService.verifyAccessToken`).

**[HIGH] Infrastructure services are provided in multiple modules, creating multiple client instances:**

- Issue: `CacheService` and `EmailService` are declared in several feature modules and in root providers; `CacheService` creates a Redis connection in constructor.
- Files: `src/app.module.ts`, `src/services/cache.service.ts`, `src/features/tokens/tokens.module.ts`, `src/features/wifi-sessions/wifi-sessions.module.ts`, `src/features/minigames/minigames.module.ts`, `src/features/auth/auth.module.ts`, `src/features/devices/devices.module.ts`
- Impact: Excess Redis/SMTP client instances, unnecessary connection churn, harder lifecycle management under load.
- Fix approach: Introduce dedicated global/shared infrastructure modules (singletons) and import/export them instead of re-providing service classes.

**[MEDIUM] Dual ORM configuration without clear runtime boundary:**

- Issue: Project keeps active TypeORM and Prisma configuration, but source code primarily uses TypeORM repositories/entities.
- Files: `package.json`, `prisma.config.ts`, `prisma/schema.prisma`, `typeorm.config.ts`, `src/**/*.ts`
- Impact: Schema drift risk, duplicate migration paths, team confusion about source of truth for data model.
- Fix approach: Define one ORM as canonical for runtime and migrations; archive or isolate the secondary stack with explicit governance.

## Known Bugs

**[CRITICAL] E2E smoke test targets route that is not implemented in current app shape:**

- Symptoms: E2E test expects `GET /` -> `Hello World!`, but active controllers are feature-scoped under prefixed routes.
- Files: `test/app.e2e-spec.ts`, `src/main.ts`, `src/features/*/*.controller.ts`
- Trigger: Run `npm run test:e2e`.
- Workaround: Update e2e spec to existing API routes and prefix behavior.

**[HIGH] Device verification request binds `userId` from raw body instead of validated DTO field:**

- Symptoms: Request may pass structural validation while `userId` is untyped/outside DTO contract.
- Files: `src/features/auth/auth.controller.ts`, `src/features/auth/dto/verify-device.dto.ts`
- Trigger: Call `POST /auth/verify-device` with body variants.
- Workaround: Add `userId` to DTO and consume validated DTO only.

## Security Considerations

**[CRITICAL] Insecure fallback secrets/credentials are hardcoded in config:**

- Risk: Application can boot with weak default secrets and default database credentials when env vars are missing.
- Files: `src/config/jwt.config.ts`, `src/config/database.config.ts`, `src/features/auth/strategies/jwt.strategy.ts`
- Current mitigation: Environment variable support exists.
- Recommendations: Fail fast on missing `JWT_SECRET`/DB credentials; remove all insecure default values.

**[HIGH] Chat WebSocket gateway is open with wildcard CORS and no auth handshake:**

- Risk: Any origin/client can connect and emit events; real-time channel can be abused for spam/probing.
- Files: `src/features/chat/chat.gateway.ts`
- Current mitigation: None detected in gateway.
- Recommendations: Add JWT-based socket auth, namespace-level guards, and strict allowed origins.

**[MEDIUM] Access control inconsistency for user profile reads:**

- Risk: Authenticated users can request other users via `GET /users/:id`; privacy expectations may be violated if not intended.
- Files: `src/features/users/users.controller.ts`, `src/features/users/users.service.ts`
- Current mitigation: Endpoint requires JWT, but not role guard.
- Recommendations: Restrict non-admin reads or shape response for public-safe fields only.

## Performance Bottlenecks

**[HIGH] Redis pattern deletion uses `KEYS`, which is blocking at scale:**

- Problem: `delPattern` calls `redis.keys(pattern)` then deletes results.
- Files: `src/services/cache.service.ts`
- Cause: `KEYS` scans full keyspace synchronously.
- Improvement path: Use `SCAN` cursor iteration with batched deletes.

**[MEDIUM] Scheduler-based upgrade/session processors perform broad reads and serial per-item writes:**

- Problem: Cron jobs query potentially large sets then loop sequentially with multiple DB operations.
- Files: `src/features/trees/trees.service.ts`, `src/features/wifi-sessions/wifi-sessions.service.ts`
- Cause: Full-list reads plus per-record saves/log writes.
- Improvement path: Batch updates, chunk processing, and add instance-safe locking for scheduled jobs.

**[MEDIUM] PVP transaction path performs many queries/locks per request:**

- Problem: Raid/attack flow reads and writes multiple resources with pessimistic locks and repeated repository operations.
- Files: `src/features/pvp/pvp.service.ts`
- Cause: High query count inside transaction and lock contention under concurrency.
- Improvement path: Consolidate lookups, minimize lock scope, and add targeted indexes for resource lookups.

## Fragile Areas

**[HIGH] PVP service contains mixed typing and string-based repository lookups:**

- Files: `src/features/pvp/pvp.service.ts`
- Why fragile: Use of `Promise<any>`, non-null assertions, and `manager.getRepository('Resource')` with `as any` reduces compile-time guarantees.
- Safe modification: Replace string repository access with typed entity repository and remove `any`/non-null assertions before extending combat logic.
- Test coverage: No dedicated tests detected for raid/attack flows.

**[MEDIUM] Large multi-responsibility service classes:**

- Files: `src/features/auth/auth.service.ts`, `src/features/devices/devices.service.ts`, `src/features/wifi-sessions/wifi-sessions.service.ts`, `src/features/trees/trees.service.ts`, `src/features/pvp/pvp.service.ts`
- Why fragile: Auth, device management, token flow, and transactional game logic are bundled in long files, increasing change blast radius.
- Safe modification: Extract domain sub-services (validation, orchestration, persistence) before adding features.
- Test coverage: Sparse to none for these high-complexity paths.

## Scaling Limits

**[HIGH] Socket presence tracking is in-memory and single-instance only:**

- Current capacity: One process memory map for online sockets.
- Limit: Multi-instance deployment loses global user presence and cross-instance emits.
- Scaling path: Add Socket.IO Redis adapter and shared presence store.
- Files: `src/services/socket.service.ts`

**[MEDIUM] Scheduled jobs do not show distributed coordination:**

- Current capacity: Works reliably on one app instance.
- Limit: Multiple replicas can process same cron workloads concurrently.
- Scaling path: Add leader election/distributed lock for cron handlers.
- Files: `src/features/trees/trees.service.ts`, `src/features/wifi-sessions/wifi-sessions.service.ts`

## Dependencies at Risk

**[MEDIUM] Runtime import of `uuid` without explicit dependency declaration:**

- Risk: `uuid` is imported but not declared in direct dependencies.
- Impact: Install/build inconsistency across environments/package managers.
- Migration plan: Add `uuid` (and types if needed) explicitly to `dependencies`.
- Files: `src/features/tokens/tokens.service.ts`, `package.json`

**[LOW] Type looseness is intentionally permitted by lint/ts config:**

- Risk: `any` usage and reduced strictness can hide defects in critical auth/game paths.
- Impact: Runtime failures and security regressions can bypass compile-time checks.
- Migration plan: Incrementally tighten rules (`no-explicit-any`, `noImplicitAny`, stricter unsafe rules) per module.
- Files: `eslint.config.mjs`, `tsconfig.json`, `src/**/*.ts`

## Missing Critical Features

**[HIGH] No CI pipeline detected for mandatory lint/test/type-check gates:**

- Problem: No repository automation detected to enforce quality/security checks before merge.
- Blocks: Reliable governance for regressions in auth, token, and game economy logic.

**[HIGH] Core integrity field not implemented in tree unlock flow:**

- Problem: Tree checksum is set to empty string with TODO in write path.
- Blocks: Tamper-detection or integrity verification workflows for user-tree state.
- Files: `src/features/trees/trees.service.ts`

## Test Coverage Gaps

**[HIGH] No unit/integration test files detected for feature services/controllers:**

- What's not tested: Auth, token revocation, device OTP flow, PVP transactions, WiFi session lifecycle, tree upgrade scheduler.
- Files: `src/features/auth/**/*.ts`, `src/features/tokens/**/*.ts`, `src/features/devices/**/*.ts`, `src/features/pvp/**/*.ts`, `src/features/wifi-sessions/**/*.ts`, `src/features/trees/**/*.ts`
- Risk: High-risk regressions can ship undetected.
- Priority: High

**[MEDIUM] Test directory scaffolding exists but feature test folder is empty:**

- What's not tested: Feature-level end-to-end or integration scenarios under `test/features`.
- Files: `test/features`, `test/jest-e2e.json`
- Risk: Operational behavior (auth/session/transaction interactions) lacks executable verification.
- Priority: Medium

---

_Concerns audit: 2026-03-25_
