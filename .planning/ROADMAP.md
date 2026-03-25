# ROADMAP

## Milestone v1

### Phase 1 - Auth Hardening and Token Lifecycle

- Audit and complete auth endpoints with emphasis on Google login behavior.
- Verify Redis-backed token storage, refresh, and invalidation semantics.
- Add/strengthen tests for auth success/failure and token edge cases.
- Align Swagger schemas for auth responses.

### Phase 2 - Endpoint Completeness by Feature Module

- Inventory required endpoints per core module (users, wifi-sessions, points, trees, chat, devices, tokens).
- Fill missing endpoints or contract gaps.
- Standardize DTO validation and response envelopes.

### Phase 3 - Service Production Readiness

- Harden business logic for negative paths and external dependency failures.
- Improve logging and exception mapping for operational debugging.
- Address high-priority concerns from `.planning/codebase/CONCERNS.md`.

### Phase 4 - Documentation and Frontend Handoff

- Ensure OpenAPI docs are complete and up to date.
- Export and validate Swagger JSON for frontend usage.
- Provide endpoint integration notes where contracts are sensitive.

### Phase 5 - Final Verification and Release Readiness

- Execute regression checks for critical flows.
- Confirm no blocker-level issues remain.
- Produce release checklist and sign-off notes.

## Routing

After new-project setup, continue with `/gsd-plan-phase 1`.