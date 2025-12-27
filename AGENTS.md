# Unitree Backend - Developer Guide

## Project Overview

**Unitree Backend** is a NestJS-based REST API for an environmental sustainability application that gamifies WiFi usage tracking and tree planting.

### Core Technologies
- **Framework**: NestJS v11 (Node.js/TypeScript)
- **Language**: TypeScript 5.7
- **Database**: PostgreSQL with TypeORM 0.3
- **Cache**: Redis (ioredis)
- **Authentication**: JWT with Passport (passport-jwt, passport-local)
- **Real-time**: Socket.IO for WebSockets
- **Storage**: Cloudinary (images) + Firebase Storage
- **Push Notifications**: Firebase Admin SDK
- **Email**: Nodemailer
- **API Documentation**: Swagger/OpenAPI
- **Validation**: class-validator + class-transformer
- **Testing**: Jest

### Key Features
- User authentication with JWT and device management
- WiFi session tracking with point rewards
- Virtual tree growing system
- Real tree planting redemption
- Chat/messaging system with WebSockets
- Points and referral system
- Role-based access control (RBAC)
- Push notifications
- Admin panel functionality

---

## Project Structure

### Directory Organization

```
src/
├── config/              # Configuration modules (database, redis, jwt, firebase, etc.)
├── database/
│   ├── entities/       # TypeORM entities (User, Tree, Message, etc.)
│   ├── migrations/     # Database migration files
│   └── seeders/        # Database seed files
├── features/           # Feature modules (auth, chat, points, trees, users, wifi-sessions, admin)
│   └── [feature]/
│       ├── *.controller.ts    # HTTP endpoints
│       ├── *.service.ts       # Business logic
│       ├── *.gateway.ts       # WebSocket gateways
│       ├── *.module.ts        # Feature module
│       ├── dto/              # Data Transfer Objects
│       ├── services/         # Sub-services
│       └── strategies/       # Passport strategies
├── services/           # Global services (cache, email, firebase, storage, socket)
├── shared/             # Shared utilities and patterns
│   ├── constants/      # Enums, roles, permissions
│   ├── decorators/     # Custom decorators (@CurrentUser, @Public, @Roles)
│   ├── dto/           # Shared DTOs (pagination)
│   ├── exceptions/     # Exception mappers
│   ├── filters/        # Exception filters
│   ├── guards/         # Auth guards (JWT, Roles)
│   ├── interceptors/   # Request/response interceptors
│   ├── middleware/     # Custom middleware
│   ├── repositories/   # Base repository patterns
│   └── utils/          # Helper utilities
├── app.module.ts       # Root application module
└── main.ts            # Application bootstrap

docs/                   # Comprehensive documentation
test/                   # E2E tests
```

---

## Naming Conventions

### Files and Directories
- **Feature modules**: `feature-name.controller.ts`, `feature-name.service.ts`, `feature-name.module.ts`
- **Entities**: `entity-name.entity.ts` (PascalCase class names)
- **DTOs**: `action-name.dto.ts` (e.g., `register.dto.ts`, `update-user.dto.ts`)
- **Utilities**: `purpose.util.ts` (e.g., `logger.util.ts`, `crypto.util.ts`)
- **Constants**: `category.constant.ts` (e.g., `roles.constant.ts`, `enums.constant.ts`)

### Code Conventions
- **Classes**: PascalCase (`UserService`, `AuthController`)
- **Functions/Methods**: camelCase (`getUserById`, `createSession`)
- **Variables**: camelCase (`userName`, `isActive`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`, `JWT_EXPIRE_TIME`)
- **Database columns**: snake_case (`user_id`, `created_at`, `full_name`)
- **Private methods**: Prefix with underscore (`_findUserById`, `_validateToken`)
- **Enum values**: lowercase with underscores (`wifi`, `daily_check_in`, `admin_adjustment`)

### TypeScript Patterns
- Use explicit types for function parameters and return values
- Leverage TypeORM decorators for entity definitions
- Use class-validator decorators for DTO validation
- Prefer interfaces for type definitions
- Use enums for fixed value sets

---

## Database Design

### Entity Patterns
- **Base Entity**: All entities extend `BaseEntity` which provides:
  - `id`: UUID primary key
  - `createdAt`: Automatic timestamp
  - `updatedAt`: Automatic timestamp
  - `deletedAt`: Soft delete support

### Key Entities
- `User`: User accounts with authentication, points, referrals
- `WifiSession`: WiFi usage tracking sessions
- `Point`: Point transaction history
- `Tree`: Virtual trees owned by users
- `RealTree`: Physical trees planted
- `Conversation`: Chat conversations (direct/group)
- `Message`: Chat messages
- `ConversationParticipant`: Many-to-many relationship
- `UserSession`: Active user sessions
- `UserDevice`: Device registration for single-device login
- `Otp`: OTP codes for verification

### Database Conventions
- Use snake_case for column names
- Use UUID for primary keys
- Include timestamps (created_at, updated_at)
- Support soft deletes (deleted_at)
- Add indexes on frequently queried fields (email, phone_number, referral_code)
- Use enums for status fields
- Foreign keys follow pattern: `related_entity_id`

---

## Authentication & Authorization

### Authentication Flow
1. **Registration**: Email/phone + password, optional referral code
2. **Login**: Email/password with device tracking
3. **JWT Tokens**: Access token (15m) + Refresh token (7d)
4. **Device Management**: Single device login enforcement
5. **OTP Verification**: For device verification and password reset

### Guards and Decorators
- `@Public()`: Skip JWT authentication for public endpoints
- `@Roles(UserRole.ADMIN)`: Restrict access by role
- `@CurrentUser()`: Inject current user into route handler
- `JwtAuthGuard`: Global guard, checks JWT tokens
- `RolesGuard`: Validates user roles

### Security Features
- Password hashing with bcrypt
- JWT token rotation
- Device fingerprinting
- Rate limiting with Throttler
- CORS configuration
- Input validation and sanitization

---

## API Development Guidelines

### Controller Patterns
```typescript
@Controller('feature')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeatureController {
  constructor(private readonly featureService: FeatureService) {}

  @Get()
  @Public() // If endpoint is public
  async findAll(@Query() paginationDto: PaginationDto) {
    const result = await this.featureService.findAll(paginationDto);
    return ResponseUtil.success(result);
  }

  @Post()
  @Roles(UserRole.ADMIN) // If admin-only
  async create(@Body() dto: CreateDto, @CurrentUser() user) {
    const result = await this.featureService.create(dto, user.id);
    return ResponseUtil.success(result, 'Created successfully');
  }
}
```

### Service Patterns
```typescript
@Injectable()
export class FeatureService {
  constructor(
    @InjectRepository(Entity)
    private readonly repository: Repository<Entity>,
    private readonly cacheService: CacheService,
  ) {}

  async findOne(id: string): Promise<Entity> {
    // Check cache first
    const cached = await this.cacheService.get(`entity:${id}`);
    if (cached) return cached;

    // Query database
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('Entity not found');
    }

    // Cache result
    await this.cacheService.set(`entity:${id}`, entity, 3600);
    return entity;
  }
}
```

### Repository Patterns
- Extend `BaseRepository` for standardized CRUD operations
- Use `BaseRepository.createEntity()` for automatic error mapping
- Use `BaseRepository.paginateEntities()` for pagination support
- Handle database exceptions with `DatabaseExceptionMapper`

### DTO Validation
```typescript
export class CreateDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsEnum(StatusEnum)
  status: StatusEnum;
}
```

### Response Format
All API responses follow a standard format using `ResponseUtil`:
```typescript
{
  success: true,
  data: { ... },
  message: "Operation successful",
  meta: { // For paginated responses
    page: 1,
    limit: 10,
    total: 100,
    totalPages: 10
  }
}
```

---

## WebSocket Development

### Gateway Patterns
```typescript
@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly socketService: SocketService) {}

  async handleConnection(client: Socket) {
    // Authenticate and track connection
    const userId = await this.socketService.authenticateSocket(client);
    await this.socketService.trackConnection(userId, client.id);
  }

  @SubscribeMessage('send_message')
  async handleMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    // Handle message
    this.server.to(roomId).emit('new_message', message);
  }
}
```

---

## Caching Strategy

### Redis Usage
- Cache frequently accessed data (user profiles, tree data)
- Default TTL: 3600 seconds (configurable)
- Key prefix: `unitree:` (configurable)
- Cache invalidation on updates/deletes

### Cache Patterns
```typescript
// Get with cache
const data = await this.cacheService.get(key);
if (!data) {
  data = await this.fetchFromDatabase();
  await this.cacheService.set(key, data, ttl);
}

// Invalidate cache
await this.cacheService.del(key);

// Cache with pattern deletion
await this.cacheService.deletePattern('user:*');
```

---

## Error Handling

### Exception Hierarchy
- Use NestJS built-in exceptions (`NotFoundException`, `BadRequestException`, etc.)
- `DatabaseExceptionMapper` automatically maps TypeORM errors
- Global `HttpExceptionFilter` formats error responses

### Error Response Format
```typescript
{
  success: false,
  message: "Error description",
  errors: [
    { field: "email", message: "Email already exists" }
  ]
}
```

---

## Testing Guidelines

### Test Structure
```typescript
describe('FeatureService', () => {
  let service: FeatureService;
  let repository: Repository<Entity>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        FeatureService,
        { provide: getRepositoryToken(Entity), useClass: MockRepository },
      ],
    }).compile();

    service = module.get<FeatureService>(FeatureService);
  });

  it('should create entity', async () => {
    const dto = { name: 'Test' };
    const result = await service.create(dto);
    expect(result).toBeDefined();
  });
});
```

### Testing Commands
```bash
npm run test              # Run unit tests
npm run test:watch        # Watch mode
npm run test:cov         # With coverage
npm run test:e2e         # E2E tests
```

---

## Environment Configuration

### Required Environment Variables
See `.env.example` for complete list. Key variables:
- `NODE_ENV`: development | production
- `PORT`: Server port (default: 3000)
- `DB_*`: PostgreSQL connection details
- `REDIS_*`: Redis connection details
- `JWT_SECRET`: JWT signing secret (min 32 chars)
- `FIREBASE_*`: Firebase admin credentials
- `CLOUDINARY_*`: Cloudinary storage credentials
- `EMAIL_*`: SMTP email configuration

### Configuration Modules
- `src/config/*.config.ts`: Centralized config with validation
- Use `ConfigService` to access configuration
- Validate env variables on startup using Joi schemas

---

## Development Workflow

### Setup
```bash
npm install                # Install dependencies
cp .env.example .env       # Configure environment
npm run start:dev          # Start in watch mode
```

### Available Scripts
```bash
npm run start              # Start application
npm run start:dev          # Development mode with hot reload
npm run start:debug        # Debug mode
npm run start:prod         # Production mode
npm run build              # Build for production
npm run format             # Format code with Prettier
npm run lint               # Lint and fix with ESLint
```

### API Documentation
- Swagger UI available at: `http://localhost:3000/api/docs` (non-production only)
- Auto-generated from controller decorators and DTOs

---

## Code Quality Standards

### Linting and Formatting
- **ESLint**: Configured with TypeScript ESLint + Prettier integration
- **Prettier**: Code formatting with project-specific rules
- Run `npm run lint` before committing
- Run `npm run format` to auto-format code

### Best Practices
- Always use TypeScript strict mode features
- Validate all user inputs with class-validator
- Use dependency injection for all services
- Implement proper error handling
- Write unit tests for business logic
- Use transactions for multi-step database operations
- Implement proper logging with `Logger.util`
- Cache frequently accessed data
- Use pagination for list endpoints
- Document complex logic with comments
- Follow DRY (Don't Repeat Yourself) principle

### Performance Guidelines
- Avoid N+1 queries (use eager loading with relations)
- Implement pagination for large datasets
- Use Redis caching for expensive operations
- Use database indexes strategically
- Implement rate limiting for public endpoints
- Optimize database queries with proper WHERE clauses
- Use connection pooling for database connections

---

## Module Development Checklist

When creating a new feature module:
- [ ] Create entity in `src/database/entities/`
- [ ] Create DTOs in `feature/dto/`
- [ ] Create service with business logic
- [ ] Create controller with endpoints
- [ ] Add Swagger documentation decorators
- [ ] Implement validation in DTOs
- [ ] Add proper error handling
- [ ] Implement caching if needed
- [ ] Add role-based access control
- [ ] Write unit tests
- [ ] Update module imports in `app.module.ts`
- [ ] Document API endpoints
- [ ] Test with Swagger UI

---

## Common Patterns and Utilities

### Available Utilities
- `crypto.util.ts`: Hashing, encryption utilities
- `date.util.ts`: Date manipulation helpers
- `format.util.ts`: Data formatting functions
- `logger.util.ts`: Structured logging
- `otp.util.ts`: OTP generation and validation
- `response.util.ts`: Standard API response formatting
- `validators.util.ts`: Custom validation functions

### Global Services
- `CacheService`: Redis caching abstraction
- `EmailService`: Email sending with templates
- `FirebaseService`: Push notifications
- `StorageService`: File upload to Cloudinary
- `SocketService`: WebSocket connection management

---

## Troubleshooting

### Common Issues
1. **Database connection fails**: Check PostgreSQL is running and credentials in `.env`
2. **Redis connection fails**: Ensure Redis is running on specified port
3. **JWT errors**: Verify `JWT_SECRET` is set and at least 32 characters
4. **Firebase errors**: Validate Firebase credentials and project configuration
5. **Port already in use**: Change `PORT` in `.env` or kill existing process

### Debug Mode
```bash
npm run start:debug
# Then attach debugger to port 9229
```

---

## Documentation Resources

See `docs/` directory for detailed documentation:
- `QUICK_START.md`: Setup and getting started guide
- `SRS.md`: Software Requirements Specification
- `CODE_CONVENTIONS.md`: Detailed coding standards
- `DATABASE_DESIGN_ANALYSIS.md`: Database schema analysis
- `SECURITY_IMPLEMENTATION.md`: Security features and practices
- `CHAT_FEATURE_PLAN.md`: Chat system architecture
- `SINGLE_DEVICE_LOGIN_GUIDE.md`: Device management implementation

---

## Key Architectural Decisions

### Why NestJS?
- Enterprise-grade TypeScript framework
- Built-in dependency injection
- Excellent TypeORM integration
- Native WebSocket support
- Comprehensive testing utilities
- Strong TypeScript support

### Why TypeORM?
- Active Record and Repository patterns
- Migration support
- Excellent TypeScript integration
- Relation handling
- Query builder

### Why Redis?
- Fast in-memory caching
- Session management
- Real-time features support
- Pub/Sub for WebSockets

### Soft Deletes
- All entities support soft deletion via `deletedAt` field
- Preserves data for audit trails
- Allows data recovery
- Use `withDeleted()` to query soft-deleted records

---

## Contributing Guidelines

### Before Committing
1. Run `npm run lint` and fix all issues
2. Run `npm run format` to format code
3. Run `npm run test` to ensure tests pass
4. Update documentation if needed
5. Follow commit message conventions

### Code Review Checklist
- [ ] Code follows naming conventions
- [ ] DTOs have proper validation
- [ ] Error handling is implemented
- [ ] Services use dependency injection
- [ ] Database queries are optimized
- [ ] Sensitive data is not logged
- [ ] API responses use ResponseUtil
- [ ] Swagger documentation is added
- [ ] Tests are written/updated
- [ ] No console.log statements (use Logger)

---

## Production Considerations

### Before Deployment
- Set `NODE_ENV=production`
- Use strong `JWT_SECRET` (min 32 chars, random)
- Enable database SSL (`DB_SSL=true`)
- Configure proper CORS origins
- Set up database backups
- Configure proper logging
- Set up monitoring and alerting
- Review rate limiting settings
- Enable HTTPS
- Secure environment variables

### Performance Optimization
- Enable Redis caching
- Use database connection pooling
- Implement CDN for static assets
- Enable gzip compression
- Optimize database indexes
- Use PM2 or similar for process management
- Set up load balancing if needed

---

## Quick Reference

### Import Paths
```typescript
// Entities
import { User } from './database/entities/user.entity';

// DTOs
import { RegisterDto } from './features/auth/dto/register.dto';

// Services
import { CacheService } from './services/cache.service';

// Guards
import { JwtAuthGuard } from './shared/guards/jwt-auth.guard';

// Decorators
import { CurrentUser } from './shared/decorators/current-user.decorator';
import { Public } from './shared/decorators/public.decorator';
import { Roles } from './shared/decorators/roles.decorator';

// Constants
import { UserRole } from './shared/constants/roles.constant';
import { PointTransactionType } from './shared/constants/enums.constant';

// Utils
import { ResponseUtil } from './shared/utils/response.util';
import { Logger } from './shared/utils/logger.util';
```

### Useful Commands
```bash
# Development
npm run start:dev         # Start with hot reload
npm run build            # Build for production

# Code Quality
npm run lint             # Lint code
npm run format           # Format code
npm run test             # Run tests
npm run test:cov        # Test with coverage

# Database (when migrations are set up)
npm run migration:generate -- <name>
npm run migration:run
npm run migration:revert
```

---

## Contact and Support

For questions or issues:
- Check documentation in `docs/` directory
- Review code conventions in `docs/CODE_CONVENTIONS.md`
- Check NestJS documentation: https://docs.nestjs.com
- Review TypeORM documentation: https://typeorm.io

---

*This guide is maintained by the development team. Last updated: December 2025*
