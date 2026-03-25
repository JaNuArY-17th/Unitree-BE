# Coding Conventions

**Analysis Date:** 2026-03-25

## Naming Patterns

**Files:**

- Use kebab-case filenames for modules and DTOs: `src/features/users/users.controller.ts`, `src/features/auth/dto/login-with-device.dto.ts`, `src/shared/utils/response.util.ts`.
- Keep NestJS suffixes explicit: `*.controller.ts`, `*.service.ts`, `*.module.ts`, `*.guard.ts`, `*.interceptor.ts`, `*.filter.ts`, `*.entity.ts`, `*.dto.ts`.

**Functions/Methods:**

- Use camelCase for methods and variables: `findById`, `updateCurrentUser`, `generateReferralCode` in `src/features/users/users.service.ts`.
- Use async methods with explicit Promise returns in services.

**Variables:**

- Use camelCase for local values and injected dependencies: `configService`, `userRepository`, `paginationDto`.
- Use descriptive names for request-level data: `ipAddress`, `userAgent` in `src/features/auth/auth.controller.ts`.

**Types/Classes:**

- Use PascalCase for classes/interfaces/enums: `UsersService`, `RegisterDto`, `PaginationDto`, `UserRole`.
- Keep DTO classes singular and feature-scoped in `src/features/*/dto/`.

## Code Style

**Formatting:**

- Tool: Prettier via `npm run format` in `package.json`.
- Config from `.prettierrc`:
  - `singleQuote: true`
  - `trailingComma: all`
- Format command targets only `src/**/*.ts` and `test/**/*.ts`.

**Linting:**

- Tool: ESLint flat config in `eslint.config.mjs`.
- Command: `npm run lint` runs `eslint "{src,apps,libs,test}/**/*.ts" --fix`.
- Config uses `typescript-eslint` recommended type-checked rules and `eslint-plugin-prettier/recommended`.
- Current notable rule posture in `eslint.config.mjs`:
  - `@typescript-eslint/no-explicit-any`: off
  - `@typescript-eslint/no-floating-promises`: warn
  - `@typescript-eslint/no-unsafe-argument`: warn

## Typecheck Practice

- TypeScript version is `^5.7.3` in `package.json`.
- There is no dedicated `typecheck` script in `package.json`.
- Compiler settings are partially strict in `tsconfig.json`:
  - `strictNullChecks: true`
  - `noImplicitAny: false`
  - `strictBindCallApply: false`
  - `skipLibCheck: true`
- Use `npx tsc --noEmit` for explicit type verification in CI/local quality gates.

## Import Organization

**Observed Order Pattern:**

1. Nest/framework imports
2. Third-party imports
3. Project imports (feature/shared/config)

**Evidence:**

- `src/features/users/users.controller.ts`
- `src/features/auth/auth.controller.ts`
- `src/app.module.ts` (uses section-grouped imports with comments for Config/Guards/Filters/Interceptors/Services/Feature Modules)

**Path Aliases:**

- Not detected; imports are relative paths (`../../shared/...`, `./dto/...`).

## DTO and Validation Patterns

- Validate request payloads with `class-validator` decorators in DTO classes (`src/features/auth/dto/register.dto.ts`, `src/shared/dto/pagination.dto.ts`).
- Document DTO schema with Swagger decorators (`@ApiProperty`) for endpoint contracts (`src/features/users/dto/update-user.dto.ts`, `src/features/auth/dto/login.dto.ts`).
- Global validation is enforced in `src/main.ts` via `ValidationPipe` with:
  - `whitelist: true`
  - `forbidNonWhitelisted: true`
  - `transform: true`
  - `enableImplicitConversion: true`
- For query number parsing, use `@Type(() => Number)` plus numeric validators (`src/shared/dto/pagination.dto.ts`).
- Use transformation DTOs for response shaping with `class-transformer` (`@Exclude`, `@Expose`, `@Transform`) in `src/features/users/dto/user-info.dto.ts`.

## Error Handling

**Patterns:**

- Throw NestJS HTTP exceptions in services for business/domain failures (`NotFoundException`, `BadRequestException`, `UnauthorizedException`) across:
  - `src/features/users/users.service.ts`
  - `src/features/auth/auth.service.ts`
  - `src/features/wifi-sessions/wifi-sessions.service.ts`
  - `src/features/trees/trees.service.ts`
- Map database engine codes centrally with `DatabaseExceptionMapper.map(...)` in `src/shared/exceptions/database-exception.mapper.ts`.
- Reuse database mapping through `BaseRepository` try/catch wrappers in `src/shared/repositories/base.repository.ts`.
- Global exception shaping uses `HttpExceptionFilter` registered as `APP_FILTER` in `src/app.module.ts`, implementation in `src/shared/filters/http-exception.filter.ts`.

## Response and Logging Conventions

- Controllers typically return `ResponseUtil.success(...)` from `src/shared/utils/response.util.ts`.
- Global `TransformInterceptor` (`src/shared/interceptors/transform.interceptor.ts`) enforces `{ success, message, data, code }` if response is not already wrapped.
- Request timing logs are emitted by `LoggingInterceptor` in `src/shared/interceptors/logging.interceptor.ts`.
- Shared logger wrapper is `src/shared/utils/logger.util.ts`; some services also use Nest `Logger` directly (`src/features/auth/auth.service.ts`).

## Comments

- Existing code includes sparse comments, mainly for section headers and domain notes.
- Non-English comments/messages are present (Vietnamese + English), e.g. in `src/features/users/users.service.ts` and `src/features/auth/auth.controller.ts`.
- Use comments for intent and business constraints, not line-by-line narration.

## Function and Module Design

**Function Design:**

- Controllers remain thin and delegate to services (`src/features/users/users.controller.ts`).
- Services centralize business logic and repository access (`src/features/users/users.service.ts`, `src/features/auth/auth.service.ts`).
- Prefer DTO output mapping with `plainToInstance(...)` where response fields are curated.

**Module Design:**

- Register cross-cutting concerns globally in `src/app.module.ts`:
  - guard: `JwtAuthGuard`
  - filter: `HttpExceptionFilter`
  - interceptors: `TransformInterceptor`, `LoggingInterceptor`
- Keep feature modules isolated under `src/features/<feature>/` with controller/service/dto.

---

_Convention analysis: 2026-03-25_
