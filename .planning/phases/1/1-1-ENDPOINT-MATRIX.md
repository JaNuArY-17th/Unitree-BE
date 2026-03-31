# Phase 1 Endpoint Inventory and Acceptance Matrix

## Active Module Coverage

| Module        | Controller                  | Endpoint Count | Status   | Priority Gaps                                        |
| ------------- | --------------------------- | -------------: | -------- | ---------------------------------------------------- |
| auth          | auth.controller.ts          |             10 | complete | no remaining P0/P1 endpoint contract gap             |
| users         | users.controller.ts         |              4 | complete | no remaining P0/P1 endpoint contract gap             |
| devices       | devices.controller.ts       |              4 | complete | no P0/P1 gaps found in controller contract           |
| tokens        | (none, service module only) |              0 | complete | internal service module, no public endpoint required |
| wifi-sessions | wifi-sessions.controller.ts |              6 | complete | no remaining P0/P1 endpoint contract gap             |
| points        | points.controller.ts        |              1 | complete | no remaining P0/P1 endpoint contract gap             |
| trees         | trees.controller.ts         |              8 | complete | no remaining P0/P1 endpoint contract gap             |
| chat          | chat.controller.ts          |              1 | complete | no immediate contract gap in current HTTP surface    |

## Production Readiness Checklist

| Module        | Auth | DTO Validation | Param Validation | Response Envelope | Swagger Parity | Tests |
| ------------- | ---- | -------------- | ---------------- | ----------------- | -------------- | ----- |
| auth          | pass | pass           | pass             | pass              | pass           | fail  |
| users         | pass | pass           | pass             | pass              | pass           | fail  |
| devices       | pass | pass           | pass             | pass              | pass           | fail  |
| tokens        | pass | pass           | n/a              | n/a               | n/a            | fail  |
| wifi-sessions | pass | pass           | pass             | pass              | pass           | fail  |
| points        | pass | pass           | n/a              | pass              | pass           | fail  |
| trees         | pass | pass           | pass             | pass              | pass           | fail  |
| chat          | pass | n/a            | n/a              | pass              | pass           | fail  |

## Task Mapping

- T2 (Wave A):
  - Fix `auth` verify-device contract to align DTO/runtime/Swagger.
  - Add strict UUID param validation in `users` endpoint.
- T3 (Wave B):
  - Add strict UUID validation for `wifi-sessions` and `trees` ID routes.
  - Normalize `points` pagination to shared `PaginationDto` validation pattern.
- T4 (Wave C):
  - Confirm `chat` and residual modules parity; no new endpoint additions required.
  - Confirm all active modules now have endpoint status `complete`.
- T5:
  - Add focused unit tests for critical negative paths in new validation contracts.
- T6:
  - Add OpenAPI export artifact and run final verification gates.
