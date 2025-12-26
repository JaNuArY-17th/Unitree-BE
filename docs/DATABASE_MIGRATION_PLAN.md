# Database Migration Plan: MongoDB → PostgreSQL

## 📋 Tổng Quan

Tài liệu này chi tiết kế hoạch migration từ MongoDB (NoSQL) sang PostgreSQL (SQL) cho hệ thống Unitree Backend.

---

## 🎯 Lý Do Migration

### Advantages of PostgreSQL
1. **ACID Transactions** - Data integrity tuyệt đối
2. **Foreign Key Constraints** - Enforce referential integrity
3. **Complex Queries** - JOIN operations hiệu quả hơn
4. **Analytics & Reporting** - Better aggregation và statistics
5. **Data Consistency** - Strong schema validation
6. **Mature Ecosystem** - Extensive tools và community support
7. **Performance** - Better indexing và query optimization

### MongoDB Limitations for This Use Case
- Không có foreign key enforcement
- Embedded documents phức tạp khi scale
- Transaction support limited
- Aggregation pipeline phức tạp
- Redundant data storage

---

## 📊 Schema Design

### Database Connection Configuration

```javascript
// src/config/database.js
const { Sequelize } = require('sequelize');
const { env } = require('./env');
const logger = require('../shared/utils/logger');

const sequelize = new Sequelize(env.DATABASE_URL, {
  dialect: 'postgres',
  logging: (msg) => logger.debug(msg),
  pool: {
    max: 20,
    min: 5,
    acquire: 30000,
    idle: 10000,
    evict: 10000
  },
  define: {
    underscored: true,      // snake_case column names
    timestamps: true,        // createdAt, updatedAt
    freezeTableName: true,  // Không pluralize table names
  },
  dialectOptions: {
    ssl: env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

module.exports = sequelize;
```

---

## 📁 Sequelize Models

### 1. User Model

```javascript
// src/database/models/User.js
const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../../config/database');

class User extends Model {
  // Instance method: Compare password
  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password_hash);
  }

  // Instance method: Get public profile
  toPublicProfile() {
    const { password_hash, ...publicData } = this.toJSON();
    return publicData;
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
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'password_hash'
  },
  full_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  nickname: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  university: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  student_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  all_time_points: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  avatar_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('student'),
    defaultValue: 'student'
  },
  total_time_connected: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Total WiFi time in seconds'
  },
  day_time_connected: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  week_time_connected: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  month_time_connected: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  last_day_reset: {
    type: DataTypes.DATE,
    allowNull: true
  },
  last_week_reset: {
    type: DataTypes.DATE,
    allowNull: true
  },
  last_month_reset: {
    type: DataTypes.DATE,
    allowNull: true
  },
  push_token: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  notification_preference: {
    type: DataTypes.JSONB,
    defaultValue: {
      tree_needs_water: true,
      tree_milestone: true,
      system_messages: true,
      chat_messages: true
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  indexes: [
    { fields: ['email'] },
    { fields: ['student_id'] },
    { fields: ['all_time_points'] }, // For leaderboard
    { fields: ['is_active'] }
  ],
  hooks: {
    beforeCreate: async (user) => {
      if (user.password_hash) {
        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(user.password_hash, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password_hash')) {
        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(user.password_hash, salt);
      }
    }
  }
});

module.exports = User;
```

### 2. Admin Model

```javascript
// src/database/models/Admin.js
const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../../config/database');

class Admin extends Model {
  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password_hash);
  }

  hasPermission(permission) {
    return this.permissions[permission] === true;
  }
}

Admin.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'superadmin'),
    defaultValue: 'admin'
  },
  permissions: {
    type: DataTypes.JSONB,
    defaultValue: {
      manage_admins: false,
      manage_students: true,
      manage_trees: true,
      manage_points: true,
      manage_wifi_sessions: true,
      manage_tree_types: true,
      manage_real_trees: true,
      view_statistics: true
    }
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Admin',
  tableName: 'admins',
  hooks: {
    beforeCreate: async (admin) => {
      if (admin.password_hash) {
        const salt = await bcrypt.genSalt(10);
        admin.password_hash = await bcrypt.hash(admin.password_hash, salt);
      }
      // Superadmin gets all permissions
      if (admin.role === 'superadmin') {
        admin.permissions = {
          manage_admins: true,
          manage_students: true,
          manage_trees: true,
          manage_points: true,
          manage_wifi_sessions: true,
          manage_tree_types: true,
          manage_real_trees: true,
          view_statistics: true
        };
      }
    },
    beforeUpdate: async (admin) => {
      if (admin.changed('password_hash')) {
        const salt = await bcrypt.genSalt(10);
        admin.password_hash = await bcrypt.hash(admin.password_hash, salt);
      }
      if (admin.changed('role') && admin.role === 'superadmin') {
        admin.permissions = {
          manage_admins: true,
          manage_students: true,
          manage_trees: true,
          manage_points: true,
          manage_wifi_sessions: true,
          manage_tree_types: true,
          manage_real_trees: true,
          view_statistics: true
        };
      }
    }
  }
});

module.exports = Admin;
```

### 3. UserSession Model

```javascript
// src/database/models/UserSession.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../config/database');

class UserSession extends Model {}

UserSession.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  access_token_hash: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  refresh_token_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  device_info: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  ip_address: {
    type: DataTypes.INET,
    allowNull: true
  },
  login_time: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  last_activity: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  is_revoked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  sequelize,
  modelName: 'UserSession',
  tableName: 'user_sessions',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['refresh_token_hash'] },
    { fields: ['expires_at'] },
    { fields: ['is_revoked'] }
  ]
});

module.exports = UserSession;
```

### 4. WifiSession Model

```javascript
// src/database/models/WifiSession.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../config/database');

class WifiSession extends Model {
  // Calculate duration in seconds
  calculateDuration() {
    if (!this.end_time) return 0;
    return Math.floor((new Date(this.end_time) - new Date(this.start_time)) / 1000);
  }

  // Calculate points earned based on duration
  calculatePoints(pointsPerHour = 60) {
    const durationInHours = this.duration / 3600;
    return Math.floor(durationInHours * pointsPerHour);
  }
}

WifiSession.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  ssid: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  bssid: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  ip_address: {
    type: DataTypes.INET,
    allowNull: false
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  accuracy: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Duration in seconds'
  },
  points_earned: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  session_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  is_valid: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  sequelize,
  modelName: 'WifiSession',
  tableName: 'wifi_sessions',
  indexes: [
    { fields: ['user_id', 'session_date'] },
    { fields: ['start_time'] },
    { fields: ['is_valid'] }
  ],
  hooks: {
    beforeSave: (session) => {
      if (session.end_time && session.start_time) {
        session.duration = Math.floor(
          (new Date(session.end_time) - new Date(session.start_time)) / 1000
        );
      }
    }
  }
});

module.exports = WifiSession;
```

### 5. Point Model

```javascript
// src/database/models/Point.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../config/database');

class Point extends Model {}

Point.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM(
      'WIFI_SESSION',
      'TREE_REDEMPTION',
      'REAL_TREE_REDEMPTION',
      'ADMIN_ADJUSTMENT',
      'ATTENDANCE',
      'ACHIEVEMENT',
      'BONUS'
    ),
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  sequelize,
  modelName: 'Point',
  tableName: 'points',
  indexes: [
    { fields: ['user_id', 'created_at'] },
    { fields: ['type'] }
  ]
});

module.exports = Point;
```

### 6. TreeType Model

```javascript
// src/database/models/TreeType.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../config/database');

class TreeType extends Model {}

TreeType.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  scientific_name: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  cost: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  growth_duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Days to reach maturity'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  sequelize,
  modelName: 'TreeType',
  tableName: 'tree_types',
  indexes: [
    { fields: ['is_active'] },
    { fields: ['cost'] }
  ]
});

module.exports = TreeType;
```

### 7. Tree Model

```javascript
// src/database/models/Tree.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../config/database');

class Tree extends Model {
  // Calculate current stage based on WiFi time
  calculateStage() {
    const hoursConnected = this.total_wifi_time / 3600;
    
    if (hoursConnected < 5) return 'seedling';
    if (hoursConnected < 20) return 'sprout';
    if (hoursConnected < 50) return 'sapling';
    if (hoursConnected < 100) return 'young_tree';
    if (hoursConnected < 200) return 'mature_tree';
    return 'ancient_tree';
  }

  // Update health score based on last watering
  updateHealthScore() {
    const now = new Date();
    const lastWatered = new Date(this.last_watered);
    const daysSinceWatering = (now - lastWatered) / (1000 * 60 * 60 * 24);
    
    if (daysSinceWatering > 7) {
      this.health_score = Math.max(0, this.health_score - 20);
    } else if (daysSinceWatering > 3) {
      this.health_score = Math.max(0, this.health_score - 10);
    }

    if (this.health_score === 0 && !this.is_dead) {
      this.is_dead = true;
      this.death_date = now;
    }
  }
}

Tree.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  tree_type_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tree_types',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  planted_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  last_watered: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  stage: {
    type: DataTypes.ENUM(
      'seedling',
      'sprout',
      'sapling',
      'young_tree',
      'mature_tree',
      'ancient_tree'
    ),
    defaultValue: 'seedling'
  },
  health_score: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    validate: {
      min: 0,
      max: 100
    }
  },
  is_dead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  death_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  total_wifi_time: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Total WiFi time in seconds'
  },
  wifi_time_at_redeem: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  sequelize,
  modelName: 'Tree',
  tableName: 'trees',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['tree_type_id'] },
    { fields: ['stage'] },
    { fields: ['is_dead'] }
  ]
});

module.exports = Tree;
```

### 8. TreeMilestone Model

```javascript
// src/database/models/TreeMilestone.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../config/database');

class TreeMilestone extends Model {}

TreeMilestone.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tree_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'trees',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  type: {
    type: DataTypes.ENUM('PLANTED', 'STAGE_CHANGE', 'WATERED', 'DIED'),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'TreeMilestone',
  tableName: 'tree_milestones',
  indexes: [
    { fields: ['tree_id', 'created_at'] }
  ]
});

module.exports = TreeMilestone;
```

### 9. RealTree Model

```javascript
// src/database/models/RealTree.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../config/database');

class RealTree extends Model {}

RealTree.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  tree_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'trees',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  tree_type_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tree_types',
      key: 'id'
    }
  },
  planting_location: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  planting_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'planted', 'growing', 'deceased'),
    defaultValue: 'pending'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'RealTree',
  tableName: 'real_trees',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['tree_type_id'] },
    { fields: ['status'] }
  ]
});

module.exports = RealTree;
```

### 10. Chat Models

```javascript
// src/database/models/Conversation.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../config/database');

class Conversation extends Model {}

Conversation.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.ENUM('direct', 'group'),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Required for group chats'
  },
  avatar_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  last_message_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Conversation',
  tableName: 'conversations',
  indexes: [
    { fields: ['type'] },
    { fields: ['last_message_at'] }
  ]
});

// src/database/models/ConversationParticipant.js
class ConversationParticipant extends Model {}

ConversationParticipant.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  conversation_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'conversations',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  role: {
    type: DataTypes.ENUM('member', 'admin'),
    defaultValue: 'member'
  },
  joined_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  last_read_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notification_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  sequelize,
  modelName: 'ConversationParticipant',
  tableName: 'conversation_participants',
  indexes: [
    { 
      unique: true,
      fields: ['conversation_id', 'user_id']
    },
    { fields: ['user_id'] },
    { fields: ['conversation_id'] }
  ]
});

// src/database/models/Message.js
class Message extends Model {}

Message.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  conversation_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'conversations',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  sender_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  message_type: {
    type: DataTypes.ENUM('text', 'image', 'video', 'file'),
    defaultValue: 'text'
  },
  media_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  media_thumbnail: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  media_size: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Size in bytes'
  },
  media_duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Duration in seconds for video'
  },
  reply_to_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'messages',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  is_deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Message',
  tableName: 'messages',
  indexes: [
    { fields: ['conversation_id', 'created_at'] },
    { fields: ['sender_id'] },
    { fields: ['is_deleted'] }
  ]
});

// src/database/models/MessageReadReceipt.js
class MessageReadReceipt extends Model {}

MessageReadReceipt.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  message_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'messages',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  read_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'MessageReadReceipt',
  tableName: 'message_read_receipts',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['message_id', 'user_id']
    },
    { fields: ['message_id'] },
    { fields: ['user_id'] }
  ]
});

module.exports = {
  Conversation,
  ConversationParticipant,
  Message,
  MessageReadReceipt
};
```

---

## 🔗 Model Associations

```javascript
// src/database/models/index.js
const sequelize = require('../../config/database');

// Import all models
const User = require('./User');
const Admin = require('./Admin');
const UserSession = require('./UserSession');
const WifiSession = require('./WifiSession');
const Point = require('./Point');
const TreeType = require('./TreeType');
const Tree = require('./Tree');
const TreeMilestone = require('./TreeMilestone');
const RealTree = require('./RealTree');
const {
  Conversation,
  ConversationParticipant,
  Message,
  MessageReadReceipt
} = require('./Chat');

// Define associations
const setupAssociations = () => {
  // User associations
  User.hasMany(UserSession, { foreignKey: 'user_id', as: 'sessions' });
  User.hasMany(WifiSession, { foreignKey: 'user_id', as: 'wifiSessions' });
  User.hasMany(Point, { foreignKey: 'user_id', as: 'points' });
  User.hasMany(Tree, { foreignKey: 'user_id', as: 'trees' });
  User.hasMany(RealTree, { foreignKey: 'user_id', as: 'realTrees' });
  User.hasMany(Message, { foreignKey: 'sender_id', as: 'sentMessages' });
  User.belongsToMany(Conversation, {
    through: ConversationParticipant,
    foreignKey: 'user_id',
    as: 'conversations'
  });

  // UserSession associations
  UserSession.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // WifiSession associations
  WifiSession.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // Point associations
  Point.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // TreeType associations
  TreeType.hasMany(Tree, { foreignKey: 'tree_type_id', as: 'trees' });
  TreeType.hasMany(RealTree, { foreignKey: 'tree_type_id', as: 'realTrees' });

  // Tree associations
  Tree.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });
  Tree.belongsTo(TreeType, { foreignKey: 'tree_type_id', as: 'treeType' });
  Tree.hasMany(TreeMilestone, { foreignKey: 'tree_id', as: 'milestones' });
  Tree.hasOne(RealTree, { foreignKey: 'tree_id', as: 'realTree' });

  // TreeMilestone associations
  TreeMilestone.belongsTo(Tree, { foreignKey: 'tree_id', as: 'tree' });

  // RealTree associations
  RealTree.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });
  RealTree.belongsTo(Tree, { foreignKey: 'tree_id', as: 'virtualTree' });
  RealTree.belongsTo(TreeType, { foreignKey: 'tree_type_id', as: 'treeType' });

  // Conversation associations
  Conversation.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
  Conversation.hasMany(Message, { foreignKey: 'conversation_id', as: 'messages' });
  Conversation.belongsToMany(User, {
    through: ConversationParticipant,
    foreignKey: 'conversation_id',
    as: 'participants'
  });

  // ConversationParticipant associations
  ConversationParticipant.belongsTo(Conversation, {
    foreignKey: 'conversation_id',
    as: 'conversation'
  });
  ConversationParticipant.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // Message associations
  Message.belongsTo(Conversation, { foreignKey: 'conversation_id', as: 'conversation' });
  Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });
  Message.belongsTo(Message, { foreignKey: 'reply_to_id', as: 'replyTo' });
  Message.hasMany(MessageReadReceipt, { foreignKey: 'message_id', as: 'readReceipts' });

  // MessageReadReceipt associations
  MessageReadReceipt.belongsTo(Message, { foreignKey: 'message_id', as: 'message' });
  MessageReadReceipt.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
};

setupAssociations();

module.exports = {
  sequelize,
  User,
  Admin,
  UserSession,
  WifiSession,
  Point,
  TreeType,
  Tree,
  TreeMilestone,
  RealTree,
  Conversation,
  ConversationParticipant,
  Message,
  MessageReadReceipt
};
```

---

## 🔄 Data Migration Script

```javascript
// scripts/migrate-mongo-to-postgres.js
const mongoose = require('mongoose');
const { 
  sequelize,
  User,
  Admin,
  WifiSession,
  Point,
  TreeType,
  Tree,
  TreeMilestone,
  RealTree
} = require('../src/database/models');

// Import old MongoDB models
const OldUser = require('../src-old/models/User');
const OldAdmin = require('../src-old/models/Admin');
const OldWifiSession = require('../src-old/models/WifiSession');
const OldPoint = require('../src-old/models/Point');
const OldTreeType = require('../src-old/models/TreeType');
const OldTree = require('../src-old/models/Tree');
const OldRealTree = require('../src-old/models/RealTree');

const logger = require('../src/shared/utils/logger');

async function migrateUsers() {
  logger.info('Starting user migration...');
  
  const oldUsers = await OldUser.find({});
  logger.info(`Found ${oldUsers.length} users to migrate`);

  for (const oldUser of oldUsers) {
    try {
      await User.create({
        email: oldUser.email.toLowerCase(),
        password_hash: oldUser.password, // Already hashed
        full_name: oldUser.fullname,
        nickname: oldUser.nickname,
        university: oldUser.university,
        student_id: oldUser.studentId,
        points: oldUser.points || 0,
        all_time_points: oldUser.allTimePoints || 0,
        avatar_url: oldUser.avatar,
        role: oldUser.role,
        total_time_connected: oldUser.totalTimeConnected || 0,
        day_time_connected: oldUser.dayTimeConnected || 0,
        week_time_connected: oldUser.weekTimeConnected || 0,
        month_time_connected: oldUser.monthTimeConnected || 0,
        last_day_reset: oldUser.lastDayReset,
        last_week_reset: oldUser.lastWeekReset,
        last_month_reset: oldUser.lastMonthReset,
        push_token: oldUser.pushToken,
        is_active: true,
        email_verified: true,
        created_at: oldUser.createdAt,
        updated_at: oldUser.updatedAt
      });
      
      logger.info(`Migrated user: ${oldUser.email}`);
    } catch (error) {
      logger.error(`Error migrating user ${oldUser.email}:`, error.message);
    }
  }
  
  logger.info('User migration completed');
}

async function migrateAdmins() {
  logger.info('Starting admin migration...');
  
  const oldAdmins = await OldAdmin.find({});
  logger.info(`Found ${oldAdmins.length} admins to migrate`);

  for (const oldAdmin of oldAdmins) {
    try {
      await Admin.create({
        username: oldAdmin.username,
        password_hash: oldAdmin.password,
        role: oldAdmin.role,
        permissions: oldAdmin.permissions,
        last_login: oldAdmin.lastLogin,
        created_at: oldAdmin.createdAt,
        updated_at: oldAdmin.updatedAt
      });
      
      logger.info(`Migrated admin: ${oldAdmin.username}`);
    } catch (error) {
      logger.error(`Error migrating admin ${oldAdmin.username}:`, error.message);
    }
  }
  
  logger.info('Admin migration completed');
}

async function migrateWifiSessions() {
  logger.info('Starting WiFi session migration...');
  
  const oldSessions = await OldWifiSession.find({}).populate('user');
  logger.info(`Found ${oldSessions.length} WiFi sessions to migrate`);

  for (const oldSession of oldSessions) {
    try {
      if (!oldSession.user) continue;
      
      const newUser = await User.findOne({ 
        where: { email: oldSession.user.email.toLowerCase() }
      });
      
      if (!newUser) continue;

      await WifiSession.create({
        user_id: newUser.id,
        ssid: oldSession.ssid,
        bssid: oldSession.bssid,
        ip_address: oldSession.ipAddress,
        latitude: oldSession.location?.latitude,
        longitude: oldSession.location?.longitude,
        accuracy: oldSession.location?.accuracy,
        start_time: oldSession.startTime,
        end_time: oldSession.endTime,
        duration: oldSession.duration || 0,
        points_earned: oldSession.pointsEarned || 0,
        session_date: oldSession.sessionDate || oldSession.startTime,
        is_valid: true,
        created_at: oldSession.createdAt,
        updated_at: oldSession.updatedAt
      });
      
    } catch (error) {
      logger.error(`Error migrating WiFi session:`, error.message);
    }
  }
  
  logger.info('WiFi session migration completed');
}

async function migratePoints() {
  logger.info('Starting points migration...');
  
  const oldPoints = await OldPoint.find({}).populate('userId');
  logger.info(`Found ${oldPoints.length} point transactions to migrate`);

  for (const oldPoint of oldPoints) {
    try {
      if (!oldPoint.userId) continue;
      
      const newUser = await User.findOne({ 
        where: { email: oldPoint.userId.email.toLowerCase() }
      });
      
      if (!newUser) continue;

      const metadata = {};
      if (oldPoint.metadata) {
        oldPoint.metadata.forEach((value, key) => {
          metadata[key] = value;
        });
      }

      await Point.create({
        user_id: newUser.id,
        amount: oldPoint.amount,
        type: oldPoint.type,
        metadata: metadata,
        created_at: oldPoint.createdAt,
        updated_at: oldPoint.updatedAt
      });
      
    } catch (error) {
      logger.error(`Error migrating point transaction:`, error.message);
    }
  }
  
  logger.info('Points migration completed');
}

async function migrateTreeTypes() {
  logger.info('Starting tree type migration...');
  
  const oldTreeTypes = await OldTreeType.find({});
  logger.info(`Found ${oldTreeTypes.length} tree types to migrate`);

  for (const oldType of oldTreeTypes) {
    try {
      await TreeType.create({
        name: oldType.name,
        scientific_name: oldType.scientificName,
        description: oldType.description,
        image_url: oldType.imageUrl,
        cost: oldType.cost || 100,
        growth_duration: oldType.growthDuration || 30,
        is_active: oldType.isActive !== false,
        created_at: oldType.createdAt,
        updated_at: oldType.updatedAt
      });
      
      logger.info(`Migrated tree type: ${oldType.name}`);
    } catch (error) {
      logger.error(`Error migrating tree type ${oldType.name}:`, error.message);
    }
  }
  
  logger.info('Tree type migration completed');
}

async function migrateTrees() {
  logger.info('Starting tree migration...');
  
  const oldTrees = await OldTree.find({}).populate('userId');
  logger.info(`Found ${oldTrees.length} trees to migrate`);

  for (const oldTree of oldTrees) {
    try {
      if (!oldTree.userId) continue;
      
      const newUser = await User.findOne({ 
        where: { email: oldTree.userId.email.toLowerCase() }
      });
      
      if (!newUser) continue;

      const treeType = await TreeType.findOne({
        where: { name: oldTree.species }
      });

      if (!treeType) continue;

      const newTree = await Tree.create({
        user_id: newUser.id,
        tree_type_id: treeType.id,
        name: oldTree.name,
        planted_date: oldTree.plantedDate,
        last_watered: oldTree.lastWatered,
        stage: oldTree.stage,
        health_score: oldTree.healthScore || 100,
        is_dead: oldTree.isDead || false,
        death_date: oldTree.deathDate,
        total_wifi_time: oldTree.totalWifiTime || 0,
        wifi_time_at_redeem: oldTree.wifiTimeAtRedeem || 0,
        created_at: oldTree.createdAt,
        updated_at: oldTree.updatedAt
      });

      // Migrate milestones
      if (oldTree.milestones && oldTree.milestones.length > 0) {
        for (const milestone of oldTree.milestones) {
          await TreeMilestone.create({
            tree_id: newTree.id,
            type: milestone.type,
            description: milestone.description,
            created_at: milestone.date
          });
        }
      }
      
    } catch (error) {
      logger.error(`Error migrating tree:`, error.message);
    }
  }
  
  logger.info('Tree migration completed');
}

async function migrateRealTrees() {
  logger.info('Starting real tree migration...');
  
  const oldRealTrees = await OldRealTree.find({}).populate('userId');
  logger.info(`Found ${oldRealTrees.length} real trees to migrate`);

  for (const oldRealTree of oldRealTrees) {
    try {
      if (!oldRealTree.userId) continue;
      
      const newUser = await User.findOne({ 
        where: { email: oldRealTree.userId.email.toLowerCase() }
      });
      
      if (!newUser) continue;

      const treeType = await TreeType.findOne({
        where: { name: oldRealTree.species }
      });

      if (!treeType) continue;

      await RealTree.create({
        user_id: newUser.id,
        tree_type_id: treeType.id,
        planting_location: oldRealTree.plantingLocation,
        planting_date: oldRealTree.plantingDate,
        status: 'planted',
        notes: oldRealTree.notes,
        image_url: oldRealTree.imageUrl,
        created_at: oldRealTree.createdAt,
        updated_at: oldRealTree.updatedAt
      });
      
    } catch (error) {
      logger.error(`Error migrating real tree:`, error.message);
    }
  }
  
  logger.info('Real tree migration completed');
}

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Connect to PostgreSQL
    await sequelize.authenticate();
    logger.info('Connected to PostgreSQL');

    // Sync models (create tables)
    await sequelize.sync({ force: false });
    logger.info('PostgreSQL tables synced');

    // Run migrations in order
    await migrateUsers();
    await migrateAdmins();
    await migrateTreeTypes();
    await migrateWifiSessions();
    await migratePoints();
    await migrateTrees();
    await migrateRealTrees();

    logger.info('✅ All migrations completed successfully!');
    
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    await sequelize.close();
  }
}

// Run migration
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { main };
```

---

## ✅ Migration Checklist

- [ ] Setup PostgreSQL database
- [ ] Install Sequelize and dependencies
- [ ] Create all models
- [ ] Setup model associations
- [ ] Create database migrations
- [ ] Test models locally
- [ ] Backup MongoDB database
- [ ] Run data migration script
- [ ] Verify data integrity
- [ ] Update application code to use Sequelize
- [ ] Test all features with PostgreSQL
- [ ] Performance testing
- [ ] Deploy to production

---

**Document Version:** 1.0  
**Last Updated:** December 24, 2025
