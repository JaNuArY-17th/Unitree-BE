# Phase 1 Plan: All-Module Endpoint Completion and Hardening

## Goal
Within 4 days, complete and harden endpoints across all active modules so contracts are stable, validation is strict, auth/authorization is consistent, and APIs are production-ready for frontend integration.

## Why This Phase Matters
The project outcome is not auth-only. Production readiness depends on every module being complete and reliable, with predictable behavior and documented contracts.

## Scope

### In Scope
- Endpoint inventory and gap closure for all active modules under `src/features/*`.
- Contract hardening: DTO validation, response envelope consistency, error semantics.
- Security and policy consistency: auth guard behavior, role checks, token/session handling where applicable.
- Test expansion for critical endpoints across modules.
- Swagger/OpenAPI alignment and export for frontend.

### Out of Scope
- New domain features outside current module responsibilities.
- Major architecture rewrite or ORM migration.

## Module Waves

### Wave A (Day 1)
- auth, users, devices, tokens
- Reason: cross-cutting and identity-critical flows affect most endpoints.

### Wave B (Day 2)
- wifi-sessions, points, trees
- Reason: core business flows with state transitions and reward logic.

### Wave C (Day 3)
- chat and remaining active feature modules
- Reason: real-time + residual endpoint parity closure.

### Wave D (Day 4)
- docs parity, full verification, release-readiness stabilization.

## Deliverables
1. Endpoint inventory matrix covering all active modules and route status (complete/missing/partial).
2. Hardened endpoint implementations for identified gaps.
3. Standardized request/response/error contract behavior across modules.
4. Unit + e2e test coverage for critical success/failure paths by module.
5. Updated OpenAPI docs and exported JSON artifact for frontend.
6. Phase verification report with executed commands and outcomes.

## Task Breakdown (Implementation-Oriented)

### Dependency Graph
- T1 starts first and drives all downstream work.
- T2/T3/T4 execute in wave order with overlap only after T1 baseline exists.
- T5 depends on implementation completion from T2/T3/T4.
- T6 depends on T5.

```text
T1 (Inventory + acceptance matrix)
  -> T2 (Wave A implementation)
  -> T3 (Wave B implementation)
  -> T4 (Wave C implementation)
  -> T5 (Cross-module tests + fixes)
  -> T6 (OpenAPI export + final verification)
```

### T1 - Endpoint Inventory and Acceptance Matrix
- Targets:
  - `src/features/**/**.controller.ts`
  - `src/features/**/dto/*.ts`
  - `docs/` and `.planning/codebase/*`
- Actions:
  - Enumerate all current endpoints by module.
  - Classify each endpoint: complete, partial, missing production guards, missing docs, missing tests.
  - Define module-level acceptance checklist for production readiness.
- Verification:
  - Matrix reviewed and mapped to all active modules.
- Done when:
  - No active module is missing from inventory.

### T2 - Wave A Completion and Hardening (auth/users/devices/tokens)
- Actions:
  - Close endpoint/contract gaps.
  - Enforce password/token/session policies and consistent unauthorized/error behavior.
  - Ensure DTO validators and Swagger metadata reflect runtime behavior.
- Verification:
  - Targeted module tests + lint/build.
- Done when:
  - Wave A endpoints are complete, test-backed, and documented.

### T3 - Wave B Completion and Hardening (wifi-sessions/points/trees)
- Actions:
  - Close endpoint and business-rule gaps.
  - Normalize pagination/filtering/validation patterns.
  - Ensure state transitions are protected and deterministic.
- Verification:
  - Targeted tests + regression checks on reward/session flows.
- Done when:
  - Wave B endpoints are production-ready with negative-path handling.

### T4 - Wave C Completion and Hardening (chat + remaining modules)
- Actions:
  - Close remaining endpoint gaps and contract inconsistencies.
  - Validate websocket-related auth/room/message constraints where applicable.
  - Align docs for residual modules.
- Verification:
  - Targeted tests for chat and residual module coverage.
- Done when:
  - No endpoint category remains in partial/missing state.

### T5 - Cross-Module Test and Regression Gate
- Targets:
  - `src/features/**/*.spec.ts`
  - `test/features/**/*.e2e-spec.ts`
- Actions:
  - Add/expand unit and e2e tests for critical paths in each module.
  - Focus on negative cases: invalid DTO, unauthorized, forbidden, not found, conflict, external dependency failures.
  - Fix discovered regressions.
- Verification:
  - `npm run test`
  - `npm run test:e2e`
  - `npm run test:cov`
- Done when:
  - Critical multi-module flows are covered and passing.

### T6 - OpenAPI Parity and Release Verification
- Actions:
  - Validate Swagger schemas for all module endpoints.
  - Export OpenAPI JSON and shareable artifact for frontend.
  - Run final quality gates and record outcomes.
- Verification:
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm run build`
  - OpenAPI export command succeeds.
- Done when:
  - Docs/runtime parity is confirmed and release checklist passes.

## 4-Day Schedule

### Day 1
- Execute T1 and T2.
- Checkpoint: inventory complete, Wave A hardened.

### Day 2
- Execute T3.
- Checkpoint: Wave B hardened.

### Day 3
- Execute T4 and start T5.
- Checkpoint: all modules covered, most regressions addressed.

### Day 4
- Finish T5 and execute T6.
- Checkpoint: docs export complete and final verification done.

## Phase-Level Verification Plan
1. Inventory gate:
   - Every active module has endpoint matrix and status.
2. Quality gate:
   - `npm run lint`
   - `npx tsc --noEmit`
3. Build gate:
   - `npm run build`
4. Test gate:
   - `npm run test`
   - `npm run test:e2e`
5. Contract gate:
   - Swagger docs match runtime responses for all modules.
   - OpenAPI JSON export artifact exists and is FE-ready.

## Risks and Mitigations
1. Risk: scope is wide for 4 days.
- Mitigation: strict wave prioritization + freeze non-critical additions.

2. Risk: inconsistent conventions across modules.
- Mitigation: enforce common checklist per module (DTO, response envelope, errors, docs, tests).

3. Risk: hidden regressions from cross-module changes.
- Mitigation: continuous test gate after each wave, not only at end.

4. Risk: docs drift from code.
- Mitigation: require Swagger parity check as exit condition for each wave.

## Exit Criteria
Phase 1 is complete only when all are true:
1. All active modules have endpoint inventory and zero unresolved P0/P1 endpoint gaps.
2. Endpoint contracts are validated, consistent, and documented.
3. Critical module flows have both success and negative-path test coverage.
4. Lint/typecheck/build/test gates pass.
5. Exported OpenAPI artifact is complete and usable by frontend.
