# Testing Patterns

**Analysis Date:** 2026-03-25

## Test Framework

**Runner:**

- Jest `^30.0.0` with `ts-jest` in `package.json`.
- Unit/integration config is embedded under `jest` in `package.json` (rootDir `src`, regex `.*\.spec\.ts$`).
- E2E config is in `test/jest-e2e.json` (regex `.e2e-spec.ts$`).

**Assertion Library:**

- Jest built-in assertions (`expect(...)`).
- HTTP assertions via Supertest in E2E tests.

**Run Commands:**

```bash
npm run test          # Jest using package.json config
npm run test:watch    # Jest watch mode
npm run test:cov      # Jest coverage report
npm run test:e2e      # Jest with test/jest-e2e.json
npm run test:debug    # In-band debug execution with ts-node + tsconfig-paths
```

## Test File Organization

**Location:**

- E2E tests are under `test/`.
- Unit tests in `src/**/*.spec.ts` are expected by config but currently not present.

**Naming:**

- E2E naming pattern: `*.e2e-spec.ts`.
- Unit naming pattern expected: `*.spec.ts`.

**Current Structure:**

```text
test/
  app.e2e-spec.ts
  jest-e2e.json
  features/            # currently empty
  prisma-test/         # test DB schema/config support files
```

## Test Structure

**Suite Organization (current pattern):**

```typescript
describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
```

- Source: `test/app.e2e-spec.ts`.

**Patterns:**

- Setup per-test using `beforeEach` and full app bootstrap.
- Request-driven endpoint verification with Supertest.
- Minimal teardown pattern; explicit `afterEach`/`afterAll` cleanup is not present in current E2E example.

## Mocking

**Framework:**

- Jest mocking is available but not demonstrated in current repository tests.

**Current State:**

- No in-repo `jest.mock(...)` usage detected in active test files.
- No unit test double patterns currently established in `src/**/*.spec.ts` (none found).

## Fixtures and Factories

**Test Data Pattern:**

- No shared factories/fixtures detected for Jest tests.
- `test/prisma-test/prisma/schema.prisma` and `test/prisma-test/prisma.config.ts` indicate planned/auxiliary test database setup.

**Location:**

- Candidate location exists: `test/prisma-test/`.
- Dedicated fixture directories for Jest are not detected.

## Coverage

**Requirements:**

- `npm run test:cov` exists.
- No coverage thresholds are configured in `package.json` Jest settings.

**Collection Config:**

- `collectCoverageFrom: ["**/*.(t|j)s"]`
- `coverageDirectory: "../coverage"` (relative to Jest rootDir `src`).

**View Coverage:**

```bash
npm run test:cov
```

## Test Types

**Unit Tests:**

- Expected by config (`src/**/*.spec.ts`) but not currently implemented.

**Integration Tests:**

- No dedicated integration suite detected.

**E2E Tests:**

- Present with Jest + Supertest via `test/app.e2e-spec.ts` and `test/jest-e2e.json`.
- Coverage is currently only a smoke-level root endpoint check.

## Coverage Gaps (Current)

- Core feature services are untested (`src/features/auth/auth.service.ts`, `src/features/users/users.service.ts`, `src/features/wifi-sessions/wifi-sessions.service.ts`, `src/features/trees/trees.service.ts`, `src/features/pvp/pvp.service.ts`).
- Controller contract behavior is largely untested (`src/features/*/*.controller.ts`).
- Shared cross-cutting logic lacks direct tests (`src/shared/filters/http-exception.filter.ts`, `src/shared/interceptors/transform.interceptor.ts`, `src/shared/repositories/base.repository.ts`).
- DTO validation rules have no direct validation tests (examples in `src/features/auth/dto/register.dto.ts`, `src/shared/dto/pagination.dto.ts`).

## Prescriptive Testing Guidance for New Work

- Add service unit tests as co-located specs under feature folders (e.g., `src/features/users/users.service.spec.ts`) to satisfy existing Jest config.
- Keep E2E tests under `test/` with `*.e2e-spec.ts` naming.
- Use `@nestjs/testing` module compilation for dependency-injected units.
- Assert response shape compatibility with `ResponseUtil` and global interceptors.
- Add negative-path tests for exception-heavy services and validation failures.

---

_Testing analysis: 2026-03-25_
