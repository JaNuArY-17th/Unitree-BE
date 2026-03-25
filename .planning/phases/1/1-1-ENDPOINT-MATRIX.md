# Phase 1 Endpoint Inventory and Acceptance Matrix

## Active Module Coverage

| Module | Controller | Endpoint Count | Status | Priority Gaps |
| --- | --- | ---: | --- | --- |
| auth | auth.controller.ts | 10 | partial | verify-device request contract mismatch (`userId` used at runtime but missing in DTO); missing UUID validation on device param |
| users | users.controller.ts | 4 | partial | missing UUID param validation on `:id` route |
| devices | devices.controller.ts | 4 | complete | no P0/P1 gaps found in controller contract |
| tokens | (none, service module only) | 0 | complete | internal service module, no public endpoint required |
| wifi-sessions | wifi-sessions.controller.ts | 6 | partial | missing UUID param validation on `:id` routes; Swagger example not UUID |
| points | points.controller.ts | 1 | partial | pagination contract uses raw query params instead of shared validated DTO |
| trees | trees.controller.ts | 8 | partial | missing UUID param validation on all `:id` routes |
| chat | chat.controller.ts | 1 | complete | no immediate contract gap in current HTTP surface |

## Production Readiness Checklist

| Module | Auth | DTO Validation | Param Validation | Response Envelope | Swagger Parity | Tests |
| --- | --- | --- | --- | --- | --- | --- |
| auth | pass | pass | fail | pass | fail | fail |
| users | pass | pass | fail | pass | pass | fail |
| devices | pass | pass | pass | pass | pass | fail |
| tokens | pass | pass | n/a | n/a | n/a | fail |
| wifi-sessions | pass | pass | fail | pass | fail | fail |
| points | pass | partial | n/a | pass | partial | fail |
| trees | pass | pass | fail | pass | pass | fail |
| chat | pass | n/a | n/a | pass | pass | fail |

## Task Mapping

- T2 (Wave A):
  - Fix `auth` verify-device contract to align DTO/runtime/Swagger.
  - Add strict UUID param validation in `users` endpoint.
- T3 (Wave B):
  - Add strict UUID validation for `wifi-sessions` and `trees` ID routes.
  - Normalize `points` pagination to shared `PaginationDto` validation pattern.
- T4 (Wave C):
  - Confirm `chat` and residual modules parity; no new endpoint additions required.
- T5:
  - Add focused unit tests for critical negative paths in new validation contracts.
- T6:
  - Add OpenAPI export artifact and run final verification gates.
