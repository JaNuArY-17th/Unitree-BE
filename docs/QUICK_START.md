# Unitree Backend Rebuild - Quick Start Guide

## 🎯 Tổng Quan Nhanh

Hệ thống **Unitree** là ứng dụng gamification khuyến khích sinh viên sử dụng WiFi trường để tích điểm, trồng cây ảo và đổi cây thật.

### Rebuild Goals
✅ Migrate MongoDB → PostgreSQL  
✅ Add real-time chat (1-1 & group)  
✅ Security enhancements  
✅ Performance optimization (N+1, caching)  
✅ Modular architecture  
✅ Full API documentation  
✅ Redis integration  

---

## 📚 Documents Created

### ✅ Completed (5/11)

1. **[README.md](./README.md)** - Document index and table of contents
2. **[REBUILD_PLAN_OVERVIEW.md](./REBUILD_PLAN_OVERVIEW.md)** - Master plan overview
3. **[DATABASE_MIGRATION_PLAN.md](./DATABASE_MIGRATION_PLAN.md)** - PostgreSQL migration
4. **[CHAT_FEATURE_PLAN.md](./CHAT_FEATURE_PLAN.md)** - Real-time chat feature
5. **[CODE_CONVENTIONS.md](./CODE_CONVENTIONS.md)** - Code style guide
6. **[SECURITY_IMPLEMENTATION.md](./SECURITY_IMPLEMENTATION.md)** - Security guide

### ⏳ To Be Created (5/11)

7. **API_SPECIFICATIONS.md** - Full Swagger/OpenAPI specs
8. **REDIS_CACHING_STRATEGY.md** - Caching patterns & strategies
9. **PERFORMANCE_OPTIMIZATION.md** - N+1 solutions & optimization
10. **TESTING_STRATEGY.md** - Unit/Integration/E2E testing
11. **DEPLOYMENT_GUIDE.md** - Production deployment

---

## 🗂️ Core Architecture

### Tech Stack
```
Runtime:      Node.js 18+ LTS
Framework:    Express.js 4.x
Database:     PostgreSQL 15+ (Sequelize ORM)
Cache:        Redis 7+
Real-time:    Socket.IO 4+
Push:         Firebase Cloud Messaging
API Docs:     Swagger/OpenAPI 3.0
Validation:   Joi
Testing:      Jest + Supertest
```

### Folder Structure
```
server/
├── src/
│   ├── config/              # Database, Redis, Firebase configs
│   ├── shared/              # Middleware, utils, constants
│   │   ├── middleware/      # auth, rbac, validation, rateLimit
│   │   └── utils/           # logger, errors, validators
│   ├── features/            # Feature modules (modular)
│   │   ├── auth/
│   │   ├── users/
│   │   ├── wifi-sessions/
│   │   ├── points/
│   │   ├── trees/
│   │   ├── chat/            # NEW
│   │   ├── notifications/
│   │   ├── admin/
│   │   └── statistics/
│   ├── database/
│   │   ├── models/          # Sequelize models
│   │   ├── migrations/
│   │   └── seeders/
│   └── services/            # Global services
│       ├── cache.service.js
│       ├── fcm.service.js
│       ├── socket.service.js
│       └── cron.service.js
└── docs/                    # This folder
```

---

## 🗄️ Database Schema (PostgreSQL)

### Core Tables
- **users** - User accounts
- **admins** - Admin accounts
- **user_sessions** - JWT sessions
- **wifi_sessions** - WiFi tracking
- **points** - Point transactions
- **tree_types** - Tree species config
- **trees** - Virtual trees
- **tree_milestones** - Tree growth history
- **real_trees** - Real tree redemptions

### Chat Tables (NEW)
- **conversations** - Chat conversations
- **conversation_participants** - Members
- **messages** - Chat messages
- **message_read_receipts** - Read status

---

## 🔐 Key Security Features

### SQL Injection Prevention
✅ Sequelize parameterized queries  
✅ Joi input validation  
✅ No raw SQL with user input  

### Authentication
✅ JWT access token (15 min)  
✅ Refresh token rotation (30 days)  
✅ Bcrypt password hashing  
✅ Session management  
✅ **NO userId in headers** - extract from token  

### Authorization
✅ Role-based access control (RBAC)  
✅ Permission middleware  
✅ Resource ownership validation  

### Rate Limiting
✅ Redis-based rate limiter  
✅ Auth endpoints: 5 req/15min  
✅ API endpoints: 100 req/15min  
✅ Upload endpoints: 20 req/hour  

### HTTP Security
✅ Helmet.js (security headers)  
✅ CORS strict configuration  
✅ File upload validation  
✅ XSS prevention  

---

## ⚡ Performance Optimizations

### N+1 Query Prevention
```javascript
// ❌ Bad: N+1 problem
const users = await User.findAll();
for (const user of users) {
  user.trees = await Tree.findAll({ where: { user_id: user.id } });
}

// ✅ Good: Eager loading
const users = await User.findAll({
  include: [{ model: Tree, as: 'trees' }]
});
```

### Redis Caching
```javascript
// Cache keys structure
user:{userId}:profile           // TTL: 5 min
leaderboard:alltime:{page}      // TTL: 1 hour
wifi_session:{userId}:active    // TTL: session
tree_types:all                  // TTL: 24 hours
```

### Database Indexing
- Primary keys & foreign keys
- Frequently queried columns
- Composite indexes for common queries

---

## 📝 API Standards

### Response Format
```javascript
// Success response
{
  "success": true,
  "data": { /* payload */ },
  "message": "Operation successful"
}

// Error response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [...]
  }
}

// Paginated response
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "size": 20,
      "total": 100,
      "total_pages": 5
    }
  }
}
```

### Pagination & Search
All list endpoints:
- **Required**: `page` (default: 1), `size` (default: 20)
- **Optional**: `search` for full-text search

---

## 🔌 Real-time Chat (Socket.IO)

### Features
✅ 1-1 direct messages  
✅ Group chat  
✅ Text, image, video messages  
✅ Typing indicators  
✅ Online/offline status  
✅ Read receipts  
✅ Push notifications  

### Socket Events
```javascript
// Client → Server
'conversation:join'
'message:send'
'message:typing'
'message:read'

// Server → Client
'message:new'
'message:typing'
'message:read_receipt'
'user:status'
```

---

## 🧪 Testing Requirements

### Coverage Goals
- Unit tests: 80%+
- Integration tests: 70%+
- E2E tests: Critical flows

### Test Structure (AAA Pattern)
```javascript
it('should create user successfully', async () => {
  // Arrange
  const userData = { /* test data */ };

  // Act
  const user = await userService.createUser(userData);

  // Assert
  expect(user).toBeDefined();
  expect(user.email).toBe(userData.email);
});
```

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation (2 weeks)
- [ ] Project structure setup
- [ ] PostgreSQL schema & models
- [ ] Authentication system
- [ ] Redis integration
- [ ] Error handling & logging

### Phase 2: Core Features (3 weeks)
- [ ] User management
- [ ] WiFi session tracking
- [ ] Points system
- [ ] Trees management
- [ ] Admin features

### Phase 3: Chat Feature (2 weeks)
- [ ] Socket.IO setup
- [ ] Chat APIs
- [ ] Real-time features
- [ ] Media upload

### Phase 4: Optimization (1 week)
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Caching strategies

### Phase 5: Documentation & Testing (1 week)
- [ ] Swagger docs
- [ ] Unit tests
- [ ] Integration tests

### Phase 6: Migration & Deployment (1 week)
- [ ] Data migration
- [ ] Production setup
- [ ] Go live

**Total: 10 weeks**

---

## 📋 Quick Commands

### Development
```bash
# Install dependencies
npm install

# Setup database
npm run db:migrate

# Seed data
npm run db:seed

# Start development server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format
```

### Database
```bash
# Create migration
npx sequelize migration:create --name migration-name

# Run migrations
npx sequelize db:migrate

# Rollback migration
npx sequelize db:migrate:undo

# Create seeder
npx sequelize seed:create --name seed-name

# Run seeders
npx sequelize db:seed:all
```

---

## 🔗 Key Resources

### Documentation
- [REBUILD_PLAN_OVERVIEW.md](./REBUILD_PLAN_OVERVIEW.md) - Start here
- [DATABASE_MIGRATION_PLAN.md](./DATABASE_MIGRATION_PLAN.md) - Database design
- [CHAT_FEATURE_PLAN.md](./CHAT_FEATURE_PLAN.md) - Chat implementation
- [CODE_CONVENTIONS.md](./CODE_CONVENTIONS.md) - Code style
- [SECURITY_IMPLEMENTATION.md](./SECURITY_IMPLEMENTATION.md) - Security

### External Links
- [Sequelize Docs](https://sequelize.org/)
- [Socket.IO Docs](https://socket.io/docs/)
- [Express.js Docs](https://expressjs.com/)
- [Redis Docs](https://redis.io/docs/)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

---

## 💡 Best Practices

### Always Do
✅ Use parameterized queries  
✅ Validate all inputs  
✅ Hash passwords with bcrypt  
✅ Extract userId from JWT token  
✅ Use transactions for multiple DB operations  
✅ Log all critical operations  
✅ Write tests for new features  
✅ Follow code conventions  
✅ Document complex logic  

### Never Do
❌ Raw SQL with user input  
❌ Store plain text passwords  
❌ Accept userId from request headers  
❌ Ignore error handling  
❌ Skip input validation  
❌ Commit secrets to git  
❌ Deploy without testing  
❌ Skip code review  

---

## 🆘 Need Help?

1. **Read the docs** - Start with REBUILD_PLAN_OVERVIEW.md
2. **Check examples** - Each document has code examples
3. **Review conventions** - Follow CODE_CONVENTIONS.md
4. **Security first** - Refer to SECURITY_IMPLEMENTATION.md
5. **Test everything** - Follow TESTING_STRATEGY.md (when created)

---

## 📈 Success Metrics

### Performance
- API response time < 200ms (p95)
- Database query time < 50ms (p95)
- Real-time message delivery < 100ms

### Quality
- Test coverage > 80%
- Zero SQL injection vulnerabilities
- Zero N+1 query issues
- API documentation: 100% complete

### Reliability
- Uptime: 99.9%
- Error rate < 0.1%
- Zero data loss

---

## 📞 Next Steps

1. **Read all documentation** in order
2. **Setup development environment**
3. **Create PostgreSQL database**
4. **Install dependencies**
5. **Start coding** following the conventions
6. **Write tests** as you go
7. **Deploy to staging** first
8. **Test thoroughly**
9. **Migrate data**
10. **Go live!**

---

**Version:** 1.0  
**Created:** December 24, 2025  
**Documents Completed:** 6/11 (55%)  
**Estimated Timeline:** 10 weeks  
**Status:** Planning Phase Complete - Ready for Implementation

---

## 🎉 Summary

Bạn đã có:
- ✅ **Master plan đầy đủ** với architecture, tech stack, folder structure
- ✅ **Database schema chi tiết** với Sequelize models và migration scripts
- ✅ **Chat feature thiết kế hoàn chỉnh** với Socket.IO và API specs
- ✅ **Code conventions nhất quán** cho toàn bộ team
- ✅ **Security implementation guide** với best practices
- ⏳ **5 documents còn lại** sẽ tạo khi cần (API specs, caching, performance, testing, deployment)

**Ready to start coding!** 🚀
