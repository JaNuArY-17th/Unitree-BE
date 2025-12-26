# Unitree Backend Rebuild - Overview & Master Plan

## 📋 Tổng Quan Hệ Thống Hiện Tại

### Mục Đích Hệ Thống
**Unitree** là một ứng dụng gamification khuyến khích sinh viên sử dụng WiFi tại trường đại học để tích điểm và trồng cây ảo, có thể quy đổi ra cây thật.

### Các Chức Năng Chính Hiện Tại

#### 1. **Authentication & User Management**
- Đăng ký/đăng nhập sinh viên với email + mật khẩu
- Xác thực email qua mã OTP
- Quên mật khẩu và reset password
- Single device login (logout khi login thiết bị khác)
- JWT access token + refresh token
- Phân quyền: Student, Admin, SuperAdmin

#### 2. **WiFi Session Tracking**
- Theo dõi thời gian sinh viên kết nối WiFi trường
- Xác thực vị trí (GPS) và IP address của trường
- Tự động tính điểm dựa trên thời gian kết nối
- Background sync cho mobile app
- Phát hiện và dọn dẹp session cũ

#### 3. **Points System**
- Tích điểm tự động từ WiFi sessions (60 điểm/giờ)
- Điểm điểm danh (attendance)
- Điểm thưởng từ admin
- Lịch sử giao dịch điểm chi tiết
- Leaderboard với allTimePoints

#### 4. **Virtual Trees (Cây ảo)**
- Đổi điểm để trồng cây ảo
- Cây phát triển theo thời gian WiFi
- Hệ thống chăm sóc (watering)
- Các giai đoạn phát triển (seedling → ancient_tree)
- Health score và death mechanism

#### 5. **Real Trees (Cây thật)**
- Đổi cây ảo trưởng thành thành cây thật
- Admin quản lý cây thật và tree types
- Thống kê cây thật đã trồng

#### 6. **Push Notifications**
- Expo push notifications cho mobile
- Thông báo: cây cần tưới, milestone, system messages
- Quản lý notification preferences

#### 7. **Admin Dashboard**
- Quản lý users, trees, points, wifi sessions
- CRUD tree types
- Thống kê tổng quan
- Điều chỉnh điểm thủ công

#### 8. **Statistics & Leaderboard**
- Leaderboard theo allTimePoints
- Thống kê user activity
- Báo cáo WiFi usage

---

## 🎯 Mục Tiêu Hệ Thống Mới

### 1. **Migration từ MongoDB sang PostgreSQL**
- Tận dụng ACID transactions
- Quan hệ foreign key rõ ràng
- Better query performance cho reports
- Data integrity cao hơn

### 2. **Thêm Chức Năng Chat Real-time**
- Chat 1-1 giữa users
- Group chat (nhóm)
- Gửi text, ảnh, video
- Online status
- Typing indicators
- Message read receipts
- Socket.IO cho real-time

### 3. **Security Enhancements**
- Prevent SQL injection (parameterized queries)
- Rate limiting toàn bộ APIs
- Input validation & sanitization
- Helmet.js cho HTTP headers
- CORS strict configuration
- Bcrypt cho passwords (already done)
- JWT với short-lived access tokens
- Refresh token rotation
- API key cho admin operations

### 4. **Performance Optimizations**
- Giải quyết N+1 query problem
- Database indexing chiến lược
- Query optimization
- Redis caching cho:
  - Leaderboard
  - User sessions
  - Frequently accessed data
  - Rate limiting
- Connection pooling
- Lazy loading và eager loading hợp lý

### 5. **Code Quality & Architecture**
- Modular feature-based structure
- Consistent code conventions
- DRY principles
- SOLID principles
- Service layer pattern
- Repository pattern
- DTOs (Data Transfer Objects)
- Centralized error handling
- Comprehensive logging

### 6. **API Documentation**
- Full Swagger/OpenAPI 3.0 docs
- Mô tả chi tiết parameters
- Request/Response schemas
- Authentication requirements
- Error responses
- Example requests

### 7. **Pagination & Search**
- Tất cả list APIs có pagination (page, size)
- Search functionality với full-text search
- Filtering và sorting options

### 8. **Authentication & Authorization**
- Token-based auth (NO userId in headers)
- Access token validation
- Refresh token mechanism
- Role-based access control (RBAC)
- Permission-based operations
- Middleware cho authorization

### 9. **Redis Integration**
- Session management
- Cache frequently accessed data
- Real-time features (pub/sub)
- Rate limiting
- Queue management

### 10. **FCM Push Notifications**
- Firebase Cloud Messaging integration
- Support iOS và Android
- Notification scheduling
- Badge management
- Deep linking

---

## 🏗️ Kiến Trúc Hệ Thống Mới

### Tech Stack
```
- Runtime: Node.js 18+ LTS
- Framework: Express.js 4.x
- Database: PostgreSQL 15+
- ORM: Sequelize 6.x (hoặc Prisma)
- Cache: Redis 7+
- Real-time: Socket.IO 4+
- Push Notifications: Firebase Admin SDK
- API Docs: Swagger/OpenAPI 3.0
- Validation: Joi / express-validator
- Testing: Jest + Supertest
- Process Manager: PM2
```

### Folder Structure (Feature-based Modular)
```
server/
├── src/
│   ├── config/                    # Configuration files
│   │   ├── database.js           # PostgreSQL config
│   │   ├── redis.js              # Redis config
│   │   ├── firebase.js           # Firebase config
│   │   ├── swagger.js            # Swagger config
│   │   └── index.js              # Export all configs
│   │
│   ├── shared/                    # Shared utilities & middleware
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   ├── rbac.middleware.js
│   │   │   ├── validation.middleware.js
│   │   │   ├── error.middleware.js
│   │   │   ├── rateLimit.middleware.js
│   │   │   └── upload.middleware.js
│   │   ├── utils/
│   │   │   ├── logger.js
│   │   │   ├── response.js
│   │   │   ├── errors.js
│   │   │   ├── crypto.js
│   │   │   └── validators.js
│   │   ├── constants/
│   │   │   ├── roles.js
│   │   │   ├── permissions.js
│   │   │   └── enums.js
│   │   └── types/                 # TypeScript types (if using TS)
│   │
│   ├── features/                  # Feature modules
│   │   ├── auth/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   ├── auth.repository.js
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.validation.js
│   │   │   ├── auth.dto.js
│   │   │   └── auth.test.js
│   │   │
│   │   ├── users/
│   │   │   ├── users.controller.js
│   │   │   ├── users.service.js
│   │   │   ├── users.repository.js
│   │   │   ├── users.routes.js
│   │   │   ├── users.validation.js
│   │   │   ├── users.dto.js
│   │   │   └── users.test.js
│   │   │
│   │   ├── wifi-sessions/
│   │   │   └── ... (same pattern)
│   │   │
│   │   ├── points/
│   │   │   └── ... (same pattern)
│   │   │
│   │   ├── trees/
│   │   │   └── ... (same pattern)
│   │   │
│   │   ├── chat/                  # NEW FEATURE
│   │   │   ├── chat.controller.js
│   │   │   ├── chat.service.js
│   │   │   ├── chat.repository.js
│   │   │   ├── chat.routes.js
│   │   │   ├── chat.validation.js
│   │   │   ├── chat.socket.js     # Socket.IO handlers
│   │   │   ├── chat.dto.js
│   │   │   └── chat.test.js
│   │   │
│   │   ├── notifications/
│   │   │   └── ... (same pattern)
│   │   │
│   │   ├── admin/
│   │   │   └── ... (same pattern)
│   │   │
│   │   └── statistics/
│   │       └── ... (same pattern)
│   │
│   ├── database/                  # Database related
│   │   ├── models/               # Sequelize models
│   │   │   ├── User.js
│   │   │   ├── WifiSession.js
│   │   │   ├── Point.js
│   │   │   ├── Tree.js
│   │   │   ├── TreeType.js
│   │   │   ├── RealTree.js
│   │   │   ├── Admin.js
│   │   │   ├── Conversation.js    # NEW
│   │   │   ├── Message.js         # NEW
│   │   │   ├── ConversationParticipant.js  # NEW
│   │   │   └── index.js
│   │   ├── migrations/           # Database migrations
│   │   └── seeders/              # Seed data
│   │
│   ├── services/                  # Global services
│   │   ├── cache.service.js      # Redis caching
│   │   ├── fcm.service.js        # Firebase push notifications
│   │   ├── email.service.js      # Email sending
│   │   ├── storage.service.js    # Cloud storage (Cloudinary)
│   │   ├── socket.service.js     # Socket.IO management
│   │   └── cron.service.js       # Scheduled jobs
│   │
│   ├── app.js                     # Express app setup
│   ├── server.js                  # Server entry point
│   └── routes.js                  # Route aggregator
│
├── tests/                         # Integration tests
│   ├── auth.test.js
│   ├── users.test.js
│   └── ...
│
├── docs/                          # Documentation
│   ├── api/                      # API documentation
│   ├── database/                 # Database schemas
│   └── guides/                   # Development guides
│
├── .env.example
├── .eslintrc.js
├── .prettierrc.js
├── package.json
├── docker-compose.yml
└── README.md
```

---

## 📊 Database Schema (PostgreSQL)

### Core Tables

#### users
```sql
id: SERIAL PRIMARY KEY
email: VARCHAR(255) UNIQUE NOT NULL
password_hash: VARCHAR(255) NOT NULL
full_name: VARCHAR(255)
nickname: VARCHAR(100)
university: VARCHAR(255) NOT NULL
student_id: VARCHAR(50) UNIQUE NOT NULL
points: INTEGER DEFAULT 0
all_time_points: INTEGER DEFAULT 0
avatar_url: VARCHAR(500)
role: ENUM('student') DEFAULT 'student'
total_time_connected: INTEGER DEFAULT 0  -- seconds
day_time_connected: INTEGER DEFAULT 0
week_time_connected: INTEGER DEFAULT 0
month_time_connected: INTEGER DEFAULT 0
last_day_reset: TIMESTAMP
last_week_reset: TIMESTAMP
last_month_reset: TIMESTAMP
push_token: VARCHAR(500)
notification_preference: JSONB
is_active: BOOLEAN DEFAULT true
email_verified: BOOLEAN DEFAULT false
last_login: TIMESTAMP
created_at: TIMESTAMP DEFAULT NOW()
updated_at: TIMESTAMP DEFAULT NOW()
```

#### admins
```sql
id: SERIAL PRIMARY KEY
username: VARCHAR(100) UNIQUE NOT NULL
password_hash: VARCHAR(255) NOT NULL
role: ENUM('admin', 'superadmin') DEFAULT 'admin'
permissions: JSONB  -- flexible permissions object
last_login: TIMESTAMP
created_at: TIMESTAMP DEFAULT NOW()
updated_at: TIMESTAMP DEFAULT NOW()
```

#### user_sessions
```sql
id: SERIAL PRIMARY KEY
user_id: INTEGER REFERENCES users(id) ON DELETE CASCADE
access_token_hash: VARCHAR(255)
refresh_token_hash: VARCHAR(255)
device_info: VARCHAR(500)
ip_address: INET
login_time: TIMESTAMP DEFAULT NOW()
last_activity: TIMESTAMP DEFAULT NOW()
expires_at: TIMESTAMP NOT NULL
is_revoked: BOOLEAN DEFAULT false
created_at: TIMESTAMP DEFAULT NOW()
```

#### wifi_sessions
```sql
id: SERIAL PRIMARY KEY
user_id: INTEGER REFERENCES users(id) ON DELETE CASCADE
ssid: VARCHAR(100)
bssid: VARCHAR(50)
ip_address: INET NOT NULL
latitude: DECIMAL(10, 8)
longitude: DECIMAL(11, 8)
accuracy: DECIMAL(10, 2)
start_time: TIMESTAMP NOT NULL
end_time: TIMESTAMP
duration: INTEGER DEFAULT 0  -- seconds
points_earned: INTEGER DEFAULT 0
session_date: DATE NOT NULL
is_valid: BOOLEAN DEFAULT true
created_at: TIMESTAMP DEFAULT NOW()
updated_at: TIMESTAMP DEFAULT NOW()

INDEX idx_wifi_user_date ON wifi_sessions(user_id, session_date)
INDEX idx_wifi_start ON wifi_sessions(start_time)
```

#### points
```sql
id: SERIAL PRIMARY KEY
user_id: INTEGER REFERENCES users(id) ON DELETE CASCADE
amount: INTEGER NOT NULL
type: ENUM('WIFI_SESSION', 'TREE_REDEMPTION', 'REAL_TREE_REDEMPTION', 'ADMIN_ADJUSTMENT', 'ATTENDANCE', 'ACHIEVEMENT', 'BONUS')
metadata: JSONB
created_at: TIMESTAMP DEFAULT NOW()

INDEX idx_points_user ON points(user_id, created_at DESC)
```

#### tree_types
```sql
id: SERIAL PRIMARY KEY
name: VARCHAR(100) NOT NULL
scientific_name: VARCHAR(200)
description: TEXT
image_url: VARCHAR(500)
cost: INTEGER NOT NULL  -- points required
growth_duration: INTEGER NOT NULL  -- days to mature
is_active: BOOLEAN DEFAULT true
created_at: TIMESTAMP DEFAULT NOW()
updated_at: TIMESTAMP DEFAULT NOW()
```

#### trees
```sql
id: SERIAL PRIMARY KEY
user_id: INTEGER REFERENCES users(id) ON DELETE CASCADE
tree_type_id: INTEGER REFERENCES tree_types(id)
name: VARCHAR(100) NOT NULL
planted_date: TIMESTAMP DEFAULT NOW()
last_watered: TIMESTAMP DEFAULT NOW()
stage: ENUM('seedling', 'sprout', 'sapling', 'young_tree', 'mature_tree', 'ancient_tree') DEFAULT 'seedling'
health_score: INTEGER DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100)
is_dead: BOOLEAN DEFAULT false
death_date: TIMESTAMP
total_wifi_time: INTEGER DEFAULT 0  -- seconds
wifi_time_at_redeem: INTEGER DEFAULT 0
created_at: TIMESTAMP DEFAULT NOW()
updated_at: TIMESTAMP DEFAULT NOW()

INDEX idx_trees_user ON trees(user_id)
INDEX idx_trees_stage ON trees(stage)
```

#### tree_milestones
```sql
id: SERIAL PRIMARY KEY
tree_id: INTEGER REFERENCES trees(id) ON DELETE CASCADE
type: ENUM('PLANTED', 'STAGE_CHANGE', 'WATERED', 'DIED')
description: TEXT
created_at: TIMESTAMP DEFAULT NOW()
```

#### real_trees
```sql
id: SERIAL PRIMARY KEY
user_id: INTEGER REFERENCES users(id) ON DELETE CASCADE
tree_id: INTEGER REFERENCES trees(id)
tree_type_id: INTEGER REFERENCES tree_types(id)
planting_location: VARCHAR(255)
planting_date: DATE
status: ENUM('pending', 'planted', 'growing', 'deceased') DEFAULT 'pending'
notes: TEXT
image_url: VARCHAR(500)
created_at: TIMESTAMP DEFAULT NOW()
updated_at: TIMESTAMP DEFAULT NOW()
```

### Chat Feature Tables (NEW)

#### conversations
```sql
id: SERIAL PRIMARY KEY
type: ENUM('direct', 'group') NOT NULL
name: VARCHAR(255)  -- null for direct, required for group
avatar_url: VARCHAR(500)
created_by: INTEGER REFERENCES users(id)
last_message_at: TIMESTAMP
created_at: TIMESTAMP DEFAULT NOW()
updated_at: TIMESTAMP DEFAULT NOW()

INDEX idx_conversations_last_message ON conversations(last_message_at DESC)
```

#### conversation_participants
```sql
id: SERIAL PRIMARY KEY
conversation_id: INTEGER REFERENCES conversations(id) ON DELETE CASCADE
user_id: INTEGER REFERENCES users(id) ON DELETE CASCADE
role: ENUM('member', 'admin') DEFAULT 'member'
joined_at: TIMESTAMP DEFAULT NOW()
last_read_at: TIMESTAMP
is_active: BOOLEAN DEFAULT true
notification_enabled: BOOLEAN DEFAULT true

UNIQUE(conversation_id, user_id)
INDEX idx_participants_user ON conversation_participants(user_id)
INDEX idx_participants_conversation ON conversation_participants(conversation_id)
```

#### messages
```sql
id: SERIAL PRIMARY KEY
conversation_id: INTEGER REFERENCES conversations(id) ON DELETE CASCADE
sender_id: INTEGER REFERENCES users(id) ON DELETE SET NULL
content: TEXT
message_type: ENUM('text', 'image', 'video', 'file') DEFAULT 'text'
media_url: VARCHAR(500)
media_thumbnail: VARCHAR(500)
media_size: INTEGER  -- bytes
media_duration: INTEGER  -- seconds for video
reply_to_id: INTEGER REFERENCES messages(id) ON DELETE SET NULL
is_deleted: BOOLEAN DEFAULT false
deleted_at: TIMESTAMP
created_at: TIMESTAMP DEFAULT NOW()
updated_at: TIMESTAMP DEFAULT NOW()

INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC)
INDEX idx_messages_sender ON messages(sender_id)
```

#### message_read_receipts
```sql
id: SERIAL PRIMARY KEY
message_id: INTEGER REFERENCES messages(id) ON DELETE CASCADE
user_id: INTEGER REFERENCES users(id) ON DELETE CASCADE
read_at: TIMESTAMP DEFAULT NOW()

UNIQUE(message_id, user_id)
INDEX idx_receipts_message ON message_read_receipts(message_id)
INDEX idx_receipts_user ON message_read_receipts(user_id)
```

---

## 🔐 Security Requirements

### 1. SQL Injection Prevention
- ✅ Use parameterized queries (Sequelize automatically does this)
- ✅ Never concatenate user input into SQL
- ✅ Validate and sanitize all inputs
- ✅ Use ORM query builders

### 2. Authentication Security
- ✅ Bcrypt password hashing (already implemented)
- ✅ JWT with short expiration (15 minutes)
- ✅ Refresh token with rotation
- ✅ Token stored in httpOnly cookies (for web) or secure storage (mobile)
- ✅ No userId in request headers - extract from validated token

### 3. Authorization
- ✅ Role-based access control (RBAC)
- ✅ Permission checking middleware
- ✅ Resource ownership validation

### 4. Rate Limiting
- ✅ Express-rate-limit + Redis
- ✅ Different limits per endpoint type:
  - Auth: 5 req/15min
  - APIs: 100 req/15min
  - Admin: 200 req/15min

### 5. Input Validation
- ✅ Joi/express-validator for all inputs
- ✅ Sanitize HTML content
- ✅ File upload validation (size, type)

### 6. HTTP Security Headers
- ✅ Helmet.js middleware
- ✅ CORS strict configuration
- ✅ Content Security Policy

### 7. Logging & Monitoring
- ✅ Winston logger
- ✅ Log all authentication attempts
- ✅ Log suspicious activities
- ✅ Error tracking (Sentry optional)

---

## ⚡ Performance Requirements

### 1. N+1 Query Prevention
- ✅ Use eager loading với includes
- ✅ Use dataloader pattern cho nested queries
- ✅ Batch database operations

### 2. Database Indexing
- ✅ Primary keys và foreign keys
- ✅ Frequently queried columns
- ✅ Composite indexes cho common queries
- ✅ Analyze query execution plans

### 3. Redis Caching Strategy
```javascript
// Cache keys structure
user:{userId}:profile          // TTL: 5 minutes
leaderboard:alltime            // TTL: 1 hour
wifi_session:{userId}:active   // TTL: session duration
tree_types:all                 // TTL: 24 hours
conversation:{conversationId}  // TTL: 5 minutes
```

### 4. Connection Pooling
```javascript
// PostgreSQL pool config
{
  max: 20,
  min: 5,
  idle: 10000,
  acquire: 30000,
  evict: 10000
}
```

### 5. Response Optimization
- ✅ Pagination for all lists
- ✅ Field selection (sparse fieldsets)
- ✅ Compression middleware (gzip)
- ✅ CDN for static assets

---

## 📝 Code Conventions

### File Naming
- Controllers: `*.controller.js`
- Services: `*.service.js`
- Repositories: `*.repository.js`
- Routes: `*.routes.js`
- Models: PascalCase (e.g., `User.js`)
- Utilities: camelCase (e.g., `logger.js`)

### Code Style
```javascript
// Use ESLint + Prettier
// Function naming: camelCase
// Class naming: PascalCase
// Constants: UPPER_SNAKE_CASE
// Private methods: _prefixWithUnderscore

// Async/await over callbacks
// Arrow functions for short callbacks
// Destructuring where appropriate
// Template literals over concatenation
```

### Import Order
```javascript
// 1. Node modules
const express = require('express');

// 2. Third-party modules
const { Sequelize } = require('sequelize');

// 3. Internal shared modules
const { logger } = require('@/shared/utils');

// 4. Feature modules
const userService = require('./user.service');
```

---

## 📚 API Documentation Standards

### Swagger/OpenAPI Structure
```yaml
paths:
  /api/users:
    get:
      summary: Get paginated list of users
      tags: [Users]
      security:
        - bearerAuth: []
      parameters:
        - name: page
          in: query
          required: true
          schema:
            type: integer
            minimum: 1
            default: 1
        - name: size
          in: query
          required: true
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
        - name: search
          in: query
          required: false
          schema:
            type: string
      responses:
        200:
          description: Success
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    type: object
                    properties:
                      items:
                        type: array
                        items:
                          $ref: '#/components/schemas/User'
                      pagination:
                        $ref: '#/components/schemas/Pagination'
        401:
          $ref: '#/components/responses/Unauthorized'
        500:
          $ref: '#/components/responses/ServerError'
```

---

## 🧪 Testing Strategy

### Test Coverage Target
- Unit tests: 80%+
- Integration tests: 70%+
- E2E tests: Critical flows

### Test Structure
```javascript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user successfully', async () => {
      // Arrange
      // Act
      // Assert
    });

    it('should throw error if email exists', async () => {
      // Test error cases
    });
  });
});
```

---

## 📦 Detailed Plans

Xem các file kế hoạch chi tiết:

1. **[DATABASE_MIGRATION_PLAN.md](./DATABASE_MIGRATION_PLAN.md)** - Migration từ MongoDB sang PostgreSQL
2. **[CHAT_FEATURE_PLAN.md](./CHAT_FEATURE_PLAN.md)** - Thiết kế và triển khai tính năng chat
3. **[API_SPECIFICATIONS.md](./API_SPECIFICATIONS.md)** - Đặc tả API đầy đủ với Swagger
4. **[SECURITY_IMPLEMENTATION.md](./SECURITY_IMPLEMENTATION.md)** - Chi tiết implement security features
5. **[REDIS_CACHING_STRATEGY.md](./REDIS_CACHING_STRATEGY.md)** - Chiến lược caching với Redis
6. **[CODE_CONVENTIONS.md](./CODE_CONVENTIONS.md)** - Quy ước code chi tiết
7. **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Hướng dẫn deploy production

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation (2 weeks)
- [ ] Setup project structure
- [ ] PostgreSQL schema & migrations
- [ ] Base models với Sequelize
- [ ] Authentication system với JWT
- [ ] Redis integration
- [ ] Error handling & logging
- [ ] API response standardization

### Phase 2: Core Features Migration (3 weeks)
- [ ] User management APIs
- [ ] WiFi session tracking
- [ ] Points system
- [ ] Trees management
- [ ] Admin features
- [ ] Notifications with FCM

### Phase 3: Chat Feature (2 weeks)
- [ ] Chat database models
- [ ] Socket.IO setup
- [ ] 1-1 chat implementation
- [ ] Group chat implementation
- [ ] Media upload (images, videos)
- [ ] Read receipts & typing indicators

### Phase 4: Optimization & Security (1 week)
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Rate limiting
- [ ] Caching strategies
- [ ] N+1 query fixes

### Phase 5: Documentation & Testing (1 week)
- [ ] Swagger documentation
- [ ] Unit tests
- [ ] Integration tests
- [ ] API testing
- [ ] Deployment documentation

### Phase 6: Migration & Deployment (1 week)
- [ ] Data migration scripts
- [ ] Production setup
- [ ] Monitoring & logging setup
- [ ] Performance testing
- [ ] Go live

**Total Estimated Time: 10 weeks**

---

## 📈 Success Metrics

- ✅ API response time < 200ms (p95)
- ✅ Database query time < 50ms (p95)
- ✅ Zero SQL injection vulnerabilities
- ✅ Test coverage > 80%
- ✅ Zero N+1 query issues
- ✅ API documentation completeness: 100%
- ✅ Uptime: 99.9%
- ✅ Real-time message delivery < 100ms

---

## 👥 Team & Resources

### Required Skills
- Node.js/Express.js
- PostgreSQL + Sequelize
- Redis
- Socket.IO
- Firebase Admin SDK
- RESTful API design
- Security best practices

### Development Environment
- Node.js 18+ LTS
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose
- Git
- Postman/Insomnia
- pgAdmin/DBeaver

---

**Document Version:** 1.0  
**Last Updated:** December 24, 2025  
**Author:** Backend Development Team
