# Security Implementation Guide

## 🔒 Tổng Quan

Tài liệu này chi tiết cách implement các security features cho Unitree Backend để đảm bảo hệ thống an toàn trước các threats phổ biến.

---

## 🛡️ SQL Injection Prevention

### 1. Sử Dụng Sequelize ORM

Sequelize tự động escape và parameterize queries:

```javascript
// ✅ SAFE: Sequelize automatically parameterizes
const user = await User.findOne({
  where: { email: userInputEmail }
});

// ✅ SAFE: Sequelize handles this safely
const users = await User.findAll({
  where: {
    email: { [Op.like]: `%${searchTerm}%` }
  }
});

// ❌ DANGEROUS: Never use raw queries with user input
const users = await sequelize.query(
  `SELECT * FROM users WHERE email = '${userInput}'` // SQL INJECTION RISK!
);

// ✅ SAFE: If you must use raw queries, use replacements
const users = await sequelize.query(
  'SELECT * FROM users WHERE email = :email',
  {
    replacements: { email: userInput },
    type: QueryTypes.SELECT
  }
);
```

### 2. Input Validation với Joi

```javascript
// src/shared/middleware/validation.middleware.js
const Joi = require('joi');
const { BadRequestError } = require('../utils/errors');

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      throw new BadRequestError('Validation failed', errors);
    }

    req.validatedBody = value;
    next();
  };
};

// Usage in routes
router.post('/users', 
  validate(userValidation.createUserSchema),
  userController.createUser
);
```

---

## 🔐 Authentication Security

### 1. JWT Implementation

```javascript
// src/shared/utils/jwt.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { env } = require('../../config/env');

// Generate access token (short-lived)
function generateAccessToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '15m', // 15 minutes
    issuer: 'unitree-api',
    audience: 'unitree-client'
  });
}

// Generate refresh token (long-lived)
function generateRefreshToken(payload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: '30d', // 30 days
    issuer: 'unitree-api',
    audience: 'unitree-client'
  });
}

// Verify access token
async function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: 'unitree-api',
      audience: 'unitree-client'
    });
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Access token expired');
    }
    throw new UnauthorizedError('Invalid access token');
  }
}

// Hash token for storage
function hashToken(token) {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  hashToken
};
```

### 2. Password Hashing

```javascript
// src/shared/utils/crypto.js
const bcrypt = require('bcryptjs');

// Hash password
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Compare password
async function comparePassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

// Validate password strength
function validatePasswordStrength(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  if (!hasUpperCase || !hasLowerCase) {
    return { valid: false, message: 'Password must contain uppercase and lowercase letters' };
  }
  if (!hasNumbers) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  
  return { valid: true };
}

module.exports = {
  hashPassword,
  comparePassword,
  validatePasswordStrength
};
```

### 3. Session Management

```javascript
// src/features/auth/auth.service.js
const { UserSession } = require('../../database/models');
const { generateAccessToken, generateRefreshToken, hashToken } = require('../../shared/utils/jwt');

class AuthService {
  async createSession(user, deviceInfo, ipAddress) {
    // Generate tokens
    const accessToken = generateAccessToken({ id: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ id: user.id });

    // Hash tokens for storage
    const accessTokenHash = hashToken(accessToken);
    const refreshTokenHash = hashToken(refreshToken);

    // Calculate expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Revoke existing sessions (single device login)
    await UserSession.update(
      { is_revoked: true },
      { where: { user_id: user.id, is_revoked: false } }
    );

    // Create new session
    await UserSession.create({
      user_id: user.id,
      access_token_hash: accessTokenHash,
      refresh_token_hash: refreshTokenHash,
      device_info: deviceInfo,
      ip_address: ipAddress,
      expires_at: expiresAt
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900 // 15 minutes in seconds
    };
  }

  async refreshAccessToken(refreshToken, ipAddress) {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);

    // Find session
    const refreshTokenHash = hashToken(refreshToken);
    const session = await UserSession.findOne({
      where: {
        user_id: decoded.id,
        refresh_token_hash: refreshTokenHash,
        is_revoked: false
      }
    });

    if (!session || new Date() > session.expires_at) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Generate new tokens (rotation)
    const newAccessToken = generateAccessToken({ id: decoded.id });
    const newRefreshToken = generateRefreshToken({ id: decoded.id });

    // Update session
    await session.update({
      access_token_hash: hashToken(newAccessToken),
      refresh_token_hash: hashToken(newRefreshToken),
      last_activity: new Date(),
      ip_address: ipAddress
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900
    };
  }

  async revokeSession(refreshToken) {
    const refreshTokenHash = hashToken(refreshToken);
    await UserSession.update(
      { is_revoked: true },
      { where: { refresh_token_hash: refreshTokenHash } }
    );
  }
}

module.exports = new AuthService();
```

---

## 🔑 Authorization & RBAC

### 1. Auth Middleware

```javascript
// src/shared/middleware/auth.middleware.js
const { verifyAccessToken } = require('../utils/jwt');
const { User, Admin } = require('../../database/models');
const { UnauthorizedError } = require('../utils/errors');

// Authenticate user
async function authenticateUser(req, res, next) {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = await verifyAccessToken(token);

    // Get user
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password_hash'] }
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedError('User not found or inactive');
    }

    // Attach to request
    req.user = user;
    req.userId = user.id;

    next();
  } catch (error) {
    next(error);
  }
}

// Authenticate admin
async function authenticateAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = await verifyAccessToken(token);

    const admin = await Admin.findByPk(decoded.id, {
      attributes: { exclude: ['password_hash'] }
    });

    if (!admin) {
      throw new UnauthorizedError('Admin not found');
    }

    req.admin = admin;
    req.adminId = admin.id;

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  authenticateUser,
  authenticateAdmin
};
```

### 2. Permission Middleware

```javascript
// src/shared/middleware/rbac.middleware.js
const { ForbiddenError } = require('../utils/errors');

// Check admin permission
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.admin) {
      throw new ForbiddenError('Admin authentication required');
    }

    if (!req.admin.permissions[permission]) {
      throw new ForbiddenError(`Permission '${permission}' required`);
    }

    next();
  };
}

// Check if superadmin
function requireSuperAdmin(req, res, next) {
  if (!req.admin || req.admin.role !== 'superadmin') {
    throw new ForbiddenError('Superadmin access required');
  }
  next();
}

// Check resource ownership
function requireOwnership(resourceGetter) {
  return async (req, res, next) => {
    try {
      const resource = await resourceGetter(req);
      
      if (!resource) {
        throw new NotFoundError('Resource not found');
      }

      if (resource.user_id !== req.userId) {
        throw new ForbiddenError('You can only access your own resources');
      }

      req.resource = resource;
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  requirePermission,
  requireSuperAdmin,
  requireOwnership
};
```

---

## ⏱️ Rate Limiting

### 1. Redis-based Rate Limiter

```javascript
// src/shared/middleware/rateLimit.middleware.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('../../config/redis');
const { TooManyRequestsError } = require('../utils/errors');

// General API rate limiter
const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:api:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    throw new TooManyRequestsError('Rate limit exceeded');
  }
});

// Strict limiter for authentication endpoints
const authLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:auth:'
  }),
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 attempts per 15 minutes
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts'
});

// Upload limiter
const uploadLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:upload:'
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: 'Upload limit exceeded'
});

// Custom rate limiter by user ID
function userRateLimiter(maxRequests, windowMs) {
  return async (req, res, next) => {
    if (!req.userId) {
      return next();
    }

    const key = `rl:user:${req.userId}`;
    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, Math.floor(windowMs / 1000));
    }

    if (current > maxRequests) {
      throw new TooManyRequestsError('User rate limit exceeded');
    }

    next();
  };
}

module.exports = {
  apiLimiter,
  authLimiter,
  uploadLimiter,
  userRateLimiter
};
```

---

## 🛡️ HTTP Security Headers

### Helmet Configuration

```javascript
// src/config/security.js
const helmet = require('helmet');

const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  
  // Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },

  // X-Frame-Options
  frameguard: {
    action: 'deny'
  },

  // X-Content-Type-Options
  noSniff: true,

  // X-XSS-Protection
  xssFilter: true,

  // Referrer-Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  }
});

module.exports = helmetConfig;
```

### CORS Configuration

```javascript
// src/config/cors.js
const cors = require('cors');
const { env } = require('./env');

const allowedOrigins = env.ALLOWED_ORIGINS.split(',');

const corsConfig = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Number'],
  maxAge: 86400 // 24 hours
});

module.exports = corsConfig;
```

---

## 📝 Input Validation & Sanitization

### Comprehensive Validation

```javascript
// src/features/users/users.validation.js
const Joi = require('joi');

const schemas = {
  // Register validation
  register: Joi.object({
    email: Joi.string()
      .email()
      .lowercase()
      .trim()
      .required(),
    
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.pattern.base': 'Password must contain uppercase, lowercase, and number'
      }),
    
    full_name: Joi.string()
      .min(2)
      .max(255)
      .trim()
      .required(),
    
    student_id: Joi.string()
      .pattern(/^[0-9]{8}$/)
      .required()
      .messages({
        'string.pattern.base': 'Student ID must be 8 digits'
      }),
    
    university: Joi.string()
      .min(2)
      .max(255)
      .required()
  }),

  // Update profile validation
  updateProfile: Joi.object({
    full_name: Joi.string()
      .min(2)
      .max(255)
      .trim(),
    
    nickname: Joi.string()
      .min(2)
      .max(100)
      .trim(),
    
    avatar_url: Joi.string()
      .uri()
  }).min(1), // At least one field required

  // Search query validation
  searchQuery: Joi.object({
    q: Joi.string()
      .max(100)
      .trim()
      .allow(''),
    
    page: Joi.number()
      .integer()
      .min(1)
      .default(1),
    
    size: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(20)
  })
};

module.exports = schemas;
```

### HTML Sanitization

```javascript
// src/shared/utils/sanitize.js
const createDOMPurify = require('isomorphic-dompurify');

function sanitizeHtml(dirty) {
  const clean = createDOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: []
  });
  return clean;
}

function sanitizeInput(input) {
  if (typeof input === 'string') {
    return sanitizeHtml(input);
  }
  if (typeof input === 'object' && input !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  return input;
}

module.exports = {
  sanitizeHtml,
  sanitizeInput
};
```

---

## 📤 File Upload Security

```javascript
// src/shared/middleware/upload.middleware.js
const multer = require('multer');
const path = require('path');
const { BadRequestError } = require('../utils/errors');

// Allowed mime types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime'];

// File filter
const fileFilter = (allowedTypes) => (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`), false);
  }
};

// Image upload
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: fileFilter(ALLOWED_IMAGE_TYPES)
});

// Video upload
const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: fileFilter(ALLOWED_VIDEO_TYPES)
});

// Validate file content (basic check)
function validateFileContent(file) {
  // Check file signature (magic numbers)
  const signatures = {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47],
    'video/mp4': [0x00, 0x00, 0x00]
  };

  const signature = signatures[file.mimetype];
  if (!signature) return true;

  const fileHeader = file.buffer.slice(0, signature.length);
  for (let i = 0; i < signature.length; i++) {
    if (fileHeader[i] !== signature[i]) {
      throw new BadRequestError('File content does not match declared type');
    }
  }

  return true;
}

module.exports = {
  imageUpload,
  videoUpload,
  validateFileContent
};
```

---

## 📊 Audit Logging

```javascript
// src/shared/utils/auditLogger.js
const { createLogger, format, transports } = require('winston');

const auditLogger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.File({ 
      filename: 'logs/audit.log',
      maxsize: 10485760, // 10MB
      maxFiles: 30
    })
  ]
});

// Log authentication events
function logAuth(event, userId, details = {}) {
  auditLogger.info({
    type: 'AUTH',
    event,
    userId,
    timestamp: new Date(),
    ...details
  });
}

// Log suspicious activity
function logSuspicious(event, details = {}) {
  auditLogger.warn({
    type: 'SUSPICIOUS',
    event,
    timestamp: new Date(),
    ...details
  });
}

// Log admin actions
function logAdminAction(adminId, action, target, details = {}) {
  auditLogger.info({
    type: 'ADMIN_ACTION',
    adminId,
    action,
    target,
    timestamp: new Date(),
    ...details
  });
}

module.exports = {
  logAuth,
  logSuspicious,
  logAdminAction
};
```

---

## ✅ Security Checklist

### Development
- [ ] All database queries use parameterized queries
- [ ] Input validation on all endpoints
- [ ] Passwords hashed with bcrypt (cost 10+)
- [ ] JWT tokens short-lived (15 min)
- [ ] Refresh token rotation implemented
- [ ] Rate limiting on all endpoints
- [ ] File upload validation
- [ ] HTTPS enforced in production
- [ ] Environment variables for secrets
- [ ] Security headers configured (Helmet)

### Authentication
- [ ] No userId in request headers
- [ ] Token extracted from Authorization header
- [ ] Token verified before each request
- [ ] Session management implemented
- [ ] Multi-device session handling
- [ ] Failed login attempts logged

### Authorization
- [ ] RBAC implemented
- [ ] Permission checks on admin operations
- [ ] Resource ownership validation
- [ ] API endpoints properly protected

### Monitoring
- [ ] Audit logging for critical operations
- [ ] Suspicious activity detection
- [ ] Error tracking configured
- [ ] Security alerts setup

---

**Document Version:** 1.0  
**Last Updated:** December 24, 2025
