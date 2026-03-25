# Codebase Structure

**Analysis Date:** 2026-03-25

## Directory Layout

```text
Unitree-BE/
├── src/                    # Application source (NestJS modules, entities, shared infra)
├── test/                   # E2E test harness and test Prisma workspace
├── docs/                   # Project docs/specs and implementation guides
├── prisma/                 # Prisma schema artifacts (not primary runtime ORM)
├── feat/                   # Auxiliary feature artifacts/plans
├── project-specs/          # Project specification files
├── project-tasks/          # Task planning artifacts
├── .planning/codebase/     # Generated mapper outputs (this analysis target)
├── package.json            # Scripts, dependencies, Jest config
├── eslint.config.mjs       # Lint configuration
├── tsconfig.json           # TypeScript compiler base config
├── typeorm.config.ts       # TypeORM CLI migration config
└── prisma.config.ts        # Prisma config
```

## Directory Purposes

**`src/config`:**
- Purpose: Environment-backed configuration factories.
- Contains: `app.config.ts`, `database.config.ts`, `redis.config.ts`, `jwt.config.ts`, `firebase.config.ts`, `email.config.ts`, `cloudinary.config.ts`.
- Key files: `src/config/app.config.ts`, `src/config/database.config.ts`, `src/config/redis.config.ts`.

**`src/database/entities`:**
- Purpose: TypeORM data model and relational mapping.
- Contains: Domain entities and shared `BaseEntity`.
- Key files: `src/database/entities/base.entity.ts`, `src/database/entities/user.entity.ts`, `src/database/entities/wifi-session.entity.ts`.

**`src/database/migrations`:**
- Purpose: Schema evolution history.
- Contains: Timestamped TypeORM migrations.
- Key files: `src/database/migrations/1772815511714-init-schema.ts`.

**`src/features`:**
- Purpose: Domain modules with transport + business logic.
- Contains: `auth`, `users`, `devices`, `tokens`, `wifi-sessions`, `points`, `trees`, `chat`, `pvp`, `minigames`.
- Key files: `src/features/auth/auth.module.ts`, `src/features/users/users.controller.ts`, `src/features/wifi-sessions/wifi-sessions.service.ts`, `src/features/chat/chat.gateway.ts`.

**`src/services`:**
- Purpose: Cross-feature infrastructure services.
- Contains: Redis cache, email, firebase, storage, socket support services.
- Key files: `src/services/cache.service.ts`, `src/services/email.service.ts`, `src/services/firebase.service.ts`.

**`src/shared`:**
- Purpose: Reusable cross-cutting components.
- Contains: `constants`, `decorators`, `guards`, `filters`, `interceptors`, `repositories`, `utils`.
- Key files: `src/shared/guards/jwt-auth.guard.ts`, `src/shared/filters/http-exception.filter.ts`, `src/shared/utils/response.util.ts`.

**`test`:**
- Purpose: E2E execution and test-side infra.
- Contains: `app.e2e-spec.ts`, `jest-e2e.json`, `prisma-test/`.
- Key files: `test/app.e2e-spec.ts`, `test/jest-e2e.json`, `test/prisma-test/prisma.config.ts`.

## Key File Locations

**Entry Points:**
- `src/main.ts`: Process bootstrap and global HTTP setup.
- `src/app.module.ts`: Root module graph and global providers.

**Configuration:**
- `src/config/*.config.ts`: Runtime config factories consumed by `ConfigModule`.
- `eslint.config.mjs`: Linting rules.
- `tsconfig.json`: TypeScript compile targets and path settings.
- `typeorm.config.ts`: CLI migration connection settings.

**Core Logic:**
- `src/features/*/*.controller.ts`: HTTP route definitions and request mapping.
- `src/features/*/*.service.ts`: Business logic and repository interaction.
- `src/features/chat/chat.gateway.ts`: Socket.IO event entry for chat.

**Testing:**
- `test/app.e2e-spec.ts`: Base e2e suite entry.
- `test/jest-e2e.json`: E2E Jest configuration.

## Naming Conventions

**Files:**
- Module unit pattern: `feature-name.controller.ts`, `feature-name.service.ts`, `feature-name.module.ts`.
- DTO pattern: action/object-focused names under feature DTO folders (example `src/features/auth/dto/login.dto.ts`, `src/features/users/dto/user-info.dto.ts`).
- Shared cross-cutting pattern: explicit suffix by role (example `*.guard.ts`, `*.interceptor.ts`, `*.filter.ts`, `*.decorator.ts`).

**Directories:**
- Feature-first by bounded context under `src/features/<feature>/`.
- Horizontal shared utilities under `src/shared/<category>/`.
- Persistence split under `src/database/entities` and `src/database/migrations`.

## Where to Add New Code

**New Feature:**
- Primary code: create `src/features/<new-feature>/` with at minimum `<new-feature>.module.ts`, `<new-feature>.controller.ts`, `<new-feature>.service.ts`, and `dto/` as needed.
- Root wiring: import module in `src/app.module.ts` so endpoints are reachable.
- Entity additions: place in `src/database/entities/` and create migration in `src/database/migrations/`.
- Tests: add or extend e2e coverage in `test/` (currently centralized e2e style).

**New Component/Module:**
- Cross-cutting guards/decorators/interceptors/filters: `src/shared/guards`, `src/shared/decorators`, `src/shared/interceptors`, `src/shared/filters`.
- External-integration helper services: `src/services/`.

**Utilities:**
- Stateless reusable helpers: `src/shared/utils/`.
- Shared repository patterns: `src/shared/repositories/`.

## Structural Conventions and Module Boundaries

- Keep transport concerns in controllers/gateways only; keep persistence/business orchestration in services.
- Keep database access behind injected TypeORM repositories in services (`@InjectRepository` pattern).
- Keep shared auth/response/error behavior in `src/shared/*` and register globally from `src/app.module.ts` when it applies system-wide.
- Keep feature modules explicitly exported only when consumed by other modules.

## Special Directories

**`dist/`:**
- Purpose: Build output.
- Generated: Yes.
- Committed: No (build artifact).

**`.planning/codebase/`:**
- Purpose: Generated architecture/stack/testing mapping docs used by GSD workflow.
- Generated: Yes.
- Committed: Yes (project workflow artifact directory is present in repo).

**`node_modules/`:**
- Purpose: Installed dependencies.
- Generated: Yes.
- Committed: No.

## Notable Structural Risks

- `src/features/pvp/` and `src/features/minigames/` contain complete module/controller/service files but are not wired in `src/app.module.ts`; this creates dead/hidden functionality until root import is added.
- Both TypeORM (`src/database/*`) and Prisma (`prisma/schema.prisma`, `prisma.config.ts`) structures coexist; keep new persistence work aligned to one active path to avoid split conventions.
- `test/features/` currently exists but is empty, so tests are not co-located with feature modules; this can reduce discoverability as test surface grows.

---

*Structure analysis: 2026-03-25*
