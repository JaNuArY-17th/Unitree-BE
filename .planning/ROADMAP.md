# ROADMAP

## Milestone v1

### Phase 1 - All-Module Endpoint Completion and Hardening

- Build endpoint inventory for all active modules under `src/features`.
- Close missing endpoint and contract gaps in wave order: auth/users/devices/tokens -> wifi-sessions/points/trees -> chat/remaining modules.
- Standardize DTO validation, response envelopes, and error semantics across modules.
- Ensure auth/token/session protections are consistently enforced where required.

### Phase 2 - Service Production Readiness

- Harden business logic for negative paths and external dependency failures.
- Improve logging and exception mapping for operational debugging.
- Address high-priority concerns from `.planning/codebase/CONCERNS.md`.

### Phase 3 - Documentation and Frontend Handoff

- Ensure OpenAPI docs are complete and up to date for all modules.
- Export and validate Swagger JSON for frontend usage.
- Provide endpoint integration notes where contracts are sensitive.

### Phase 4 - Final Verification and Release Readiness

- Execute regression checks for critical flows.
- Confirm no blocker-level issues remain.
- Produce release checklist and sign-off notes.

## Routing

After new-project setup, continue with `/gsd-plan-phase 1`.
