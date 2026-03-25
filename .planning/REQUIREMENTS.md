# REQUIREMENTS

## Goal

Within 4 days, bring backend API coverage and service quality to production-ready level, with complete frontend-consumable API docs.

## Functional Requirements

1. All existing feature modules must expose complete required endpoints for production usage (not just happy-path).
2. Endpoints across modules must enforce validated DTO input and consistent response/error contracts.
3. Cross-cutting concerns (auth, authorization, token lifecycle, caching, pagination, error mapping) must be applied consistently where relevant.
4. Swagger/OpenAPI docs must reflect actual runtime contracts for every module and be exportable for frontend.

## Non-Functional Requirements

1. Security: strict input validation, auth-by-default behavior, safe token handling, and clear unauthorized responses.
2. Reliability: deterministic service behavior under invalid input and external dependency failure.
3. Observability: meaningful logs for critical auth/token and error paths.
4. Maintainability: code follows existing conventions and module boundaries.

## Acceptance Criteria

1. Module coverage: users, auth, devices, tokens, wifi-sessions, points, trees, chat (and other active modules in `src/features`) have endpoint inventory completed and gaps closed.
2. Production behavior: each critical endpoint has success and negative-path verification (validation, auth, forbidden/not-found/conflict, and dependency-failure where applicable).
3. API contracts: endpoint request/response schemas are documented and match runtime behavior.
4. Frontend handoff: exported OpenAPI JSON is generated and validated by FE team.

## Out of Scope

1. New unrelated domain features.
2. ORM migration or large refactor of architecture.

## Risks

1. Hidden endpoint gaps across many modules increase coordination cost.
2. Inconsistent cross-module patterns (error handling, DTO validation, pagination, authorization) can cause integration regressions.
3. Redis/auth dependency issues may still impact session-sensitive modules.
4. Time pressure (4-day deadline) requires wave-based prioritization and strict cut lines.