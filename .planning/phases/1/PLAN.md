# Phase 1 Plan: Auth Hardening and Token Lifecycle

## Goal
Within 4 days, harden authentication flows and token lifecycle so local and Google login are secure, deterministic, Redis-enforced, and contract-accurate in Swagger/OpenAPI.

## Why This Phase Matters
Auth and token control are the highest-risk production path. This phase removes known security gaps (password validation, revocation enforcement), adds regression tests, and ensures API contracts are reliable for frontend integration.

## Scope

### In Scope
- Complete and harden auth endpoints under `src/features/auth/` (local + Google login paths).
- Enforce Redis-backed token policy in runtime auth checks (`issue`, `refresh`, `revoke`, `logout`).
- Add/upgrade unit + e2e tests for success/failure and edge cases.
- Align auth DTO/response Swagger docs with runtime behavior.

### Out of Scope
- Feature-module endpoint parity outside auth/tokens/devices.
- Broad architecture refactor beyond auth/token-critical boundaries.
- ORM migration decisions (TypeORM vs Prisma).

## Deliverables
1. Hardened auth service/controller/strategy implementation for local + Google paths.
2. Redis-backed access token revocation enforcement in request authentication path.
3. Auth/token lifecycle test suite (unit + e2e) covering positive/negative scenarios.
4. Updated Swagger contracts and exported OpenAPI JSON for auth endpoints.
5. Verification note (commands + outcomes) recorded in phase summary.

## Task Breakdown (Implementation-Oriented)

### Dependency Graph
- T1 and T2 can start in parallel.
- T3 depends on T1.
- T4 depends on T2 and T3.
- T5 depends on T1, T2, T3, T4.
- T6 depends on T5.

```text
T1 (Auth endpoint/logic hardening) ----\
                                        > T3 (Token revocation enforcement) --\
T2 (Contract inventory + DTO response) -/                                      \
                                                                                 > T4 (Refresh/logout policy completion) --> T5 (Tests) --> T6 (Docs export + phase verify)
```

### Tasks

#### T1 - Local + Google Auth Flow Hardening
- Targets:
  - `src/features/auth/auth.service.ts`
  - `src/features/auth/auth.controller.ts`
  - `src/features/auth/strategies/local.strategy.ts`
  - `src/features/auth/dto/login.dto.ts`
  - `src/features/auth/dto/login-with-device.dto.ts`
- Actions:
  - Enforce password hash verification for local login paths.
  - Keep Google login path strictly ID-token validated via Firebase service.
  - Normalize unauthorized/invalid credential responses.
  - Ensure device verification flow consumes validated DTO fields only.
- Verification:
  - `npm run test -- src/features/auth`
  - `npm run lint`
- Done when:
  - Invalid local password cannot issue tokens.
  - Google invalid token is rejected consistently.
  - Response shape for auth failures is stable and documented.

#### T2 - Auth Contract and Swagger Alignment
- Targets:
  - `src/features/auth/dto/*.ts`
  - `src/features/auth/auth.controller.ts`
  - `src/main.ts` (swagger setup only if needed)
- Actions:
  - Audit auth endpoint request/response contracts against real behavior.
  - Add/adjust `@ApiProperty`, `@ApiOperation`, `@ApiResponse` metadata.
  - Ensure DTO validators match expected runtime constraints.
- Verification:
  - `npm run build`
  - Manually inspect Swagger UI `/api/docs` for auth endpoints.
- Done when:
  - Auth endpoints show accurate schema + status code variants.
  - DTOs reject out-of-contract payloads.

#### T3 - Enforce Redis Revocation During JWT Validation
- Targets:
  - `src/features/auth/strategies/jwt.strategy.ts`
  - `src/features/tokens/tokens.service.ts`
  - `src/shared/guards/jwt-auth.guard.ts` (if integration point required)
- Actions:
  - Wire token validation path to Redis revocation checks on every authenticated request.
  - Ensure revoked access token fails before expiry.
  - Keep behavior consistent with existing key-prefix and TTL policy.
- Verification:
  - `npm run test -- src/features/tokens`
  - Add/execute targeted tests for revoked-token request rejection.
- Done when:
  - Revoked token receives unauthorized response on protected endpoint.
  - Non-revoked token still works until policy expiry.

#### T4 - Refresh and Logout Lifecycle Completion
- Targets:
  - `src/features/tokens/tokens.service.ts`
  - `src/features/auth/auth.service.ts`
  - `src/features/devices/devices.service.ts`
- Actions:
  - Validate refresh-token rotation semantics and replay protection.
  - Confirm single-device/session invalidation policy behavior.
  - Ensure logout invalidates active token set in Redis deterministically.
- Verification:
  - `npm run test -- src/features/auth src/features/devices src/features/tokens`
- Done when:
  - Refresh rotates as designed.
  - Old/replayed refresh tokens fail.
  - Logout invalidates active session tokens.

#### T5 - Auth/Token Test Coverage Expansion
- Targets:
  - `src/features/auth/**/*.spec.ts`
  - `src/features/tokens/**/*.spec.ts`
  - `test/features/auth-token-lifecycle.e2e-spec.ts`
- Actions:
  - Add unit tests for service-level negative paths.
  - Add e2e scenario coverage for: local login success/failure, Google login failure, refresh rotation, revoke/logout enforcement.
  - Update base e2e assumptions away from non-existent root route behavior where needed.
- Verification:
  - `npm run test`
  - `npm run test:e2e`
  - `npm run test:cov`
- Done when:
  - Critical auth/token scenarios are test-backed.
  - No known auth P0/P1 regressions remain untested.

#### T6 - OpenAPI Export and Final Phase Verification
- Targets:
  - `docs/` (generated auth contract export note)
  - Optional script/config location if export helper is needed
- Actions:
  - Export OpenAPI JSON from current runtime config.
  - Validate exported auth contract with frontend-facing expectations.
  - Record verification command outputs and known limitations.
- Verification:
  - `npm run build`
  - `npm run lint`
  - `npx tsc --noEmit`
  - OpenAPI export command succeeds and artifact is generated.
- Done when:
  - Exported OpenAPI artifact is available and reflects implemented auth behavior.
  - Phase verification checklist passes.

## 4-Day Execution Schedule

### Day 1
- Execute T1 + T2 in parallel.
- Deliverable checkpoint: secure login behavior and contract baseline established.

### Day 2
- Execute T3.
- Start T4 once revocation path is integrated.
- Deliverable checkpoint: runtime revocation and lifecycle core wired.

### Day 3
- Finish T4.
- Execute T5 (unit + e2e).
- Deliverable checkpoint: auth/token regressions captured by tests.

### Day 4
- Execute T6.
- Run full verification suite and stabilize issues.
- Deliverable checkpoint: docs exported, phase exit criteria validated.

## Verification Plan (Phase-Level)
1. Static quality gate:
   - `npm run lint`
   - `npx tsc --noEmit`
2. Build gate:
   - `npm run build`
3. Test gate:
   - `npm run test`
   - `npm run test:e2e`
4. Behavior gate:
   - revoked access token rejected on protected route.
   - invalid local credentials rejected.
   - invalid Google ID token rejected.
   - refresh replay rejected after rotation.
5. Contract gate:
   - Swagger `/api/docs` auth schemas align with runtime responses.
   - OpenAPI JSON export generated and validated.

## Risks and Mitigations

1. Risk: hidden coupling between auth/devices/tokens services delays fixes.
- Mitigation: keep T1/T3/T4 sequence strict; avoid broad refactor, touch only auth-token boundaries.

2. Risk: Redis availability or key-shape mismatch causes false negatives.
- Mitigation: add integration-like tests around revocation keys and fallback error handling.

3. Risk: 4-day deadline compresses testing depth.
- Mitigation: prioritize P0/P1 auth scenarios first (credential checks, revocation, refresh replay), then extend coverage if time remains.

4. Risk: Swagger mismatch persists after code changes.
- Mitigation: tie T2 + T6 to explicit schema verification and OpenAPI export validation.

## Exit Criteria
Phase 1 is complete only when all are true:
1. Local login validates password hash; invalid credentials never issue tokens.
2. Google login strictly validates ID token and rejects invalid/expired token input.
3. Redis-backed revocation is enforced during authenticated request validation.
4. Refresh rotation and logout invalidation are deterministic and tested.
5. Auth/token tests (unit + e2e) pass in CI-equivalent local commands.
6. Swagger/OpenAPI auth contracts match runtime behavior and export artifact exists.
7. No open blocker/high-severity auth hardening item remains from phase 1 scope.
