# Code Conventions - Quick Reference

## 📋 Tổng Quan

Tài liệu này định nghĩa code conventions nhất quán cho toàn bộ Unitree Backend project.

---

## 🗂️ File Naming Conventions

### JavaScript Files
```
feature.controller.js    - Controllers
feature.service.js       - Business logic services
feature.repository.js    - Database access layer
feature.routes.js        - Route definitions
feature.validation.js    - Input validation schemas
feature.dto.js          - Data Transfer Objects
feature.test.js         - Test files
```

### Model Files
```
User.js                 - PascalCase for models
WifiSession.js         - PascalCase
Conversation.js        - PascalCase
```

### Utility Files
```
logger.js              - camelCase
emailService.js        - camelCase
crypto.js              - camelCase
```

### Constants & Config
```
roles.js               - camelCase
permissions.js         - camelCase
database.js           - camelCase
```

---

## 🎨 Naming Conventions

### Variables & Functions
```javascript
// camelCase for variables
const userName = 'John';
const userAge = 25;
const isActive = true;

// camelCase for functions
function getUserById(id) {}
async function createUser(data) {}
const calculatePoints = (duration) => {};
```

### Classes
```javascript
// PascalCase for classes
class UserService {}
class AuthController {}
class ChatRepository {}
```

### Constants
```javascript
// UPPER_SNAKE_CASE for constants
const MAX_FILE_SIZE = 10485760; // 10MB
const POINTS_PER_HOUR = 60;
const JWT_EXPIRE_TIME = '15m';
```

### Database Fields
```javascript
// snake_case for database columns
{
  user_id: DataTypes.INTEGER,
  created_at: DataTypes.DATE,
  full_name: DataTypes.STRING,
  is_active: DataTypes.BOOLEAN
}
```

### Private Methods
```javascript
// Prefix with underscore
class UserService {
  async getUser(id) {
    return this._findUserById(id);
  }

  _findUserById(id) {
    // Private method
  }
}
```

---

## 📦 Module Structure

### Feature Module Pattern
```
features/users/
├── users.controller.js
├── users.service.js
├── users.repository.js
├── users.routes.js
├── users.validation.js
├── users.dto.js
└── users.test.js
```

### Import Order
```javascript
// 1. Node.js built-in modules
const fs = require('fs');
const path = require('path');

// 2. Third-party modules
const express = require('express');
const { Op } = require('sequelize');

// 3. Project shared modules
const { logger } = require('@/shared/utils/logger');
const { auth } = require('@/shared/middleware/auth');

// 4. Feature modules
const userService = require('./users.service');
const userValidation = require('./users.validation');

// 5. Models
const { User, Point } = require('@/database/models');
```

---

## 🔤 Code Style

### Function Declarations

```javascript
// ✅ Good: Use async/await
async function getUser(id) {
  try {
    const user = await User.findByPk(id);
    return user;
  } catch (error) {
    logger.error('Error getting user:', error);
    throw error;
  }
}

// ❌ Bad: Callbacks
function getUser(id, callback) {
  User.findByPk(id).then(user => {
    callback(null, user);
  }).catch(error => {
    callback(error);
  });
}

// ✅ Good: Arrow functions for short callbacks
const userIds = users.map(u => u.id);
const activeUsers = users.filter(u => u.is_active);

// ✅ Good: Destructuring
const { email, full_name, student_id } = req.body;

// ❌ Bad: No destructuring
const email = req.body.email;
const full_name = req.body.full_name;
const student_id = req.body.student_id;
```

### Error Handling

```javascript
// ✅ Good: Consistent error handling
async function createUser(data) {
  try {
    // Validate
    if (!data.email) {
      throw new BadRequestError('Email is required');
    }

    // Business logic
    const user = await User.create(data);
    return user;
  } catch (error) {
    // Log error
    logger.error('Error creating user:', error);
    
    // Re-throw or handle
    throw error;
  }
}

// ❌ Bad: Silent errors
async function createUser(data) {
  try {
    const user = await User.create(data);
    return user;
  } catch (error) {
    return null; // Don't do this!
  }
}
```

### Response Format

```javascript
// ✅ Good: Consistent response format
return res.status(200).json({
  success: true,
  data: {
    user: userDto,
    token: accessToken
  },
  message: 'User created successfully'
});

// Error response
return res.status(400).json({
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid input data',
    details: validationErrors
  }
});

// Paginated response
return res.status(200).json({
  success: true,
  data: {
    items: users,
    pagination: {
      page: 1,
      size: 20,
      total: 100,
      total_pages: 5
    }
  }
});
```

---

## 💬 Comments & Documentation

### JSDoc Comments

```javascript
/**
 * Create a new user account
 * @param {Object} userData - User registration data
 * @param {string} userData.email - User email address
 * @param {string} userData.password - User password (plain text, will be hashed)
 * @param {string} userData.full_name - User's full name
 * @returns {Promise<Object>} Created user object
 * @throws {BadRequestError} If validation fails
 * @throws {ConflictError} If email already exists
 */
async function createUser(userData) {
  // Implementation
}
```

### Inline Comments

```javascript
// ✅ Good: Explain WHY, not WHAT
// Use transaction to ensure atomicity when creating user and initial points
const transaction = await sequelize.transaction();

// ❌ Bad: State the obvious
// Set points to 0
user.points = 0;

// ✅ Good: Complex logic explanation
// Calculate points based on hourly rate
// Formula: (duration_seconds / 3600) * POINTS_PER_HOUR
const points = Math.floor((duration / 3600) * POINTS_PER_HOUR);
```

---

## 🗄️ Database Conventions

### Model Definition

```javascript
// ✅ Good: Clear model structure
class User extends Model {
  // Instance methods
  async comparePassword(password) {
    return bcrypt.compare(password, this.password_hash);
  }

  // Transform to DTO
  toPublicProfile() {
    const { password_hash, ...public } = this.toJSON();
    return public;
  }
}

User.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  full_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  underscored: true
});
```

### Queries

```javascript
// ✅ Good: Use eager loading to prevent N+1
const users = await User.findAll({
  include: [
    {
      model: Tree,
      as: 'trees',
      include: [{
        model: TreeType,
        as: 'treeType'
      }]
    }
  ]
});

// ❌ Bad: N+1 query problem
const users = await User.findAll();
for (const user of users) {
  const trees = await Tree.findAll({ where: { user_id: user.id } });
  user.trees = trees;
}

// ✅ Good: Use transactions for multiple operations
const transaction = await sequelize.transaction();
try {
  const user = await User.create(userData, { transaction });
  await Point.create({ user_id: user.id, amount: 0 }, { transaction });
  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
}
```

---

## 🛡️ Validation

### Joi Validation Schema

```javascript
// users.validation.js
const Joi = require('joi');

const createUserSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Invalid email format',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain uppercase, lowercase, and number'
    }),
  full_name: Joi.string()
    .min(2)
    .max(255)
    .required(),
  student_id: Joi.string()
    .pattern(/^[0-9]{8}$/)
    .required()
    .messages({
      'string.pattern.base': 'Student ID must be 8 digits'
    })
});

module.exports = {
  createUserSchema
};
```

---

## 🧪 Testing Conventions

### Test File Structure

```javascript
// users.test.js
describe('UserService', () => {
  // Setup
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    await clearUsers();
  });

  // Test suites
  describe('createUser', () => {
    it('should create user successfully', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'Password123',
        full_name: 'Test User',
        student_id: '12345678',
        university: 'Test University'
      };

      // Act
      const user = await userService.createUser(userData);

      // Assert
      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.password_hash).not.toBe(userData.password);
    });

    it('should throw error if email exists', async () => {
      // Arrange
      await createTestUser({ email: 'test@example.com' });

      // Act & Assert
      await expect(
        userService.createUser({ email: 'test@example.com' })
      ).rejects.toThrow(ConflictError);
    });
  });
});
```

---

## 🔐 Security Best Practices

```javascript
// ✅ Good: Parameterized queries (Sequelize does this automatically)
const user = await User.findOne({ where: { email: email } });

// ❌ Bad: Never do raw SQL with user input
const user = await sequelize.query(
  `SELECT * FROM users WHERE email = '${email}'` // SQL injection risk!
);

// ✅ Good: Validate and sanitize input
const { error, value } = createUserSchema.validate(req.body);
if (error) {
  throw new BadRequestError(error.details[0].message);
}

// ✅ Good: Hash passwords
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);

// ✅ Good: Extract userId from token, never from headers
const token = req.headers.authorization.split(' ')[1];
const decoded = jwt.verify(token, JWT_SECRET);
const userId = decoded.id; // Use this, not req.headers['user-id']
```

---

## 📁 Folder Structure Convention

```
src/
├── config/              # Configuration files
│   ├── database.js
│   ├── redis.js
│   └── index.js
├── features/           # Feature modules
│   ├── auth/
│   │   ├── auth.controller.js
│   │   ├── auth.service.js
│   │   ├── auth.routes.js
│   │   └── auth.validation.js
│   └── users/
│       └── ...
├── shared/            # Shared utilities
│   ├── middleware/
│   ├── utils/
│   └── constants/
├── database/          # Database related
│   ├── models/
│   ├── migrations/
│   └── seeders/
└── services/         # Global services
    ├── cache.service.js
    └── fcm.service.js
```

---

## 📝 Git Conventions

### Branch Naming
```
feature/user-authentication
feature/chat-system
fix/wifi-session-bug
hotfix/security-vulnerability
chore/update-dependencies
```

### Commit Messages
```
feat(auth): add JWT refresh token rotation
fix(wifi): resolve session timeout issue
docs(api): update Swagger documentation
refactor(users): optimize user query performance
test(chat): add unit tests for message service
chore(deps): update sequelize to v6.35.0
```

---

## ✅ ESLint Configuration

```javascript
// .eslintrc.js
module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 2021
  },
  rules: {
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'no-console': 'warn',
    'no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern': '^_'
    }],
    'prefer-const': 'error',
    'no-var': 'error',
    'arrow-spacing': 'error',
    'object-curly-spacing': ['error', 'always'],
    'comma-dangle': ['error', 'never']
  }
};
```

---

## 🎨 Prettier Configuration

```javascript
// .prettierrc.js
module.exports = {
  semi: true,
  trailingComma: 'none',
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  arrowParens: 'avoid',
  endOfLine: 'lf'
};
```

---

**Document Version:** 1.0  
**Last Updated:** December 24, 2025
