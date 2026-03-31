# PROJECT

## Project Identity

- Name: Unitree Backend
- Type: Brownfield enhancement
- Primary domain: Sustainability gamification backend (auth, wifi sessions, points, trees, chat)
- Repository: Unitree-BE

## Mission

Deliver a production-ready backend where critical APIs and services are complete, stable, and auditable, with priority on authentication reliability (including Google login), token lifecycle control in Redis, and clear API documentation for frontend integration.

## Problem Statement

Current implementation has broad feature coverage but still needs hardening to ensure endpoints are consistently complete, service behavior is production-grade (not only happy-path), and API contracts are documented enough for frontend teams to integrate confidently.

## Objectives (Current Milestone)

1. Ensure key API endpoints are complete and consistent across modules.
2. Raise service quality to production-ready standards (validation, errors, security, observability, resilience).
3. Guarantee robust auth/token behavior, especially for Google login and Redis-backed token/session handling.
4. Publish and maintain complete API docs for frontend consumption.

## Constraints

- Deadline: 4 days.
- Must stay within current stack (NestJS + TypeORM + Redis + JWT + Firebase).
- Security and correctness are prioritized over feature breadth.

## Success Criteria

- Critical auth and user-facing flows pass UAT and negative-path checks.
- Token issuance, rotation, and revocation behavior are deterministic and test-backed.
- Frontend has complete, current OpenAPI docs and can integrate without backend ambiguity.
- No known P0/P1 auth or API contract gaps remain at release cut.

## Non-Goals (This Milestone)

- Large-scale architecture rewrite.
- Migration from TypeORM to Prisma.
- New major feature domains unrelated to endpoint completeness and production hardening.

## References

- Existing codebase map under `.planning/codebase/`.
