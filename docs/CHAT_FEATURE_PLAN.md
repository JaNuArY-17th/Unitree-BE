# Chat Feature Implementation Plan

## 📋 Tổng Quan

Tài liệu này chi tiết kế hoạch thiết kế và triển khai tính năng **Chat Real-time** cho hệ thống Unitree, bao gồm:
- Chat 1-1 (Direct messages)
- Group chat
- Gửi text, images, videos
- Real-time với Socket.IO
- Read receipts
- Typing indicators
- Online status

---

## 🎯 Yêu Cầu Chức Năng

### 1. Direct Chat (1-1)
- ✅ User có thể tạo conversation với user khác
- ✅ Tự động tạo conversation khi gửi tin nhắn đầu tiên
- ✅ Chỉ 2 participants
- ✅ Không có admin role

### 2. Group Chat
- ✅ User có thể tạo group với nhiều members
- ✅ Đặt tên group và avatar
- ✅ Group creator là admin mặc định
- ✅ Admin có thể:
  - Thêm/xóa members
  - Đổi tên group
  - Đổi avatar group
  - Promote member thành admin
- ✅ Members có thể:
  - Gửi tin nhắn
  - Xem lịch sử tin nhắn
  - Rời group (leave)

### 3. Messaging
- ✅ Gửi text messages
- ✅ Gửi images (max 10MB)
- ✅ Gửi videos (max 50MB)
- ✅ Reply to message
- ✅ Delete message (soft delete)
- ✅ Edit message (optional - phase 2)

### 4. Real-time Features
- ✅ Instant message delivery
- ✅ Typing indicators
- ✅ Online/offline status
- ✅ Read receipts
- ✅ New message notifications

### 5. Notifications
- ✅ Push notification cho new messages
- ✅ Badge count cho unread messages
- ✅ Notification settings per conversation

---

## 🏗️ Database Schema

### Tables

#### conversations
```sql
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('direct', 'group')),
  name VARCHAR(255), -- Null for direct, required for group
  avatar_url VARCHAR(500),
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conversations_type ON conversations(type);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);
```

#### conversation_participants
```sql
CREATE TABLE conversation_participants (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  joined_at TIMESTAMP DEFAULT NOW(),
  last_read_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  notification_enabled BOOLEAN DEFAULT true,
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_participants_user ON conversation_participants(user_id);
CREATE INDEX idx_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX idx_participants_active ON conversation_participants(is_active);
```

#### messages
```sql
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  content TEXT,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'file')),
  media_url VARCHAR(500),
  media_thumbnail VARCHAR(500),
  media_size INTEGER, -- bytes
  media_duration INTEGER, -- seconds for video
  reply_to_id INTEGER REFERENCES messages(id) ON DELETE SET NULL,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_not_deleted ON messages(is_deleted) WHERE is_deleted = false;
```

#### message_read_receipts
```sql
CREATE TABLE message_read_receipts (
  id SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

CREATE INDEX idx_receipts_message ON message_read_receipts(message_id);
CREATE INDEX idx_receipts_user ON message_read_receipts(user_id);
```

---

## 🔌 Socket.IO Architecture

### Socket Events

#### Client → Server Events
```javascript
// Connection
'connect'
'disconnect'
'user:online'      // Notify online status
'user:offline'     // Notify offline status

// Conversations
'conversation:join'    // Join conversation room
'conversation:leave'   // Leave conversation room

// Messages
'message:send'         // Send new message
'message:delete'       // Delete message
'message:typing'       // Typing indicator

// Read receipts
'message:read'         // Mark messages as read
```

#### Server → Client Events
```javascript
// Connection
'connect_success'
'auth_error'

// Conversations
'conversation:joined'
'conversation:new'        // New conversation created

// Messages
'message:new'            // New message received
'message:deleted'        // Message was deleted
'message:typing'         // Someone is typing

// Read receipts
'message:read_receipt'   // Message was read

// User status
'user:status'            // User online/offline status
```

### Socket.IO Implementation

```javascript
// src/services/socket.service.js
const socketIO = require('socket.io');
const { verifyToken } = require('../shared/utils/jwt');
const { User } = require('../database/models');
const logger = require('../shared/utils/logger');

class SocketService {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // userId -> Set of socketIds
  }

  initialize(server) {
    this.io = socketIO(server, {
      cors: {
        origin: process.env.CLIENT_URLS.split(','),
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = await verifyToken(token);
        const user = await User.findByPk(decoded.id, {
          attributes: ['id', 'email', 'full_name', 'avatar_url']
        });

        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user.id;
        socket.user = user;
        next();
      } catch (error) {
        logger.error('Socket authentication error:', error);
        next(new Error('Authentication error'));
      }
    });

    this.setupEventHandlers();
    logger.info('Socket.IO initialized');
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`User ${socket.userId} connected`);
      
      // Track user socket
      if (!this.userSockets.has(socket.userId)) {
        this.userSockets.set(socket.userId, new Set());
      }
      this.userSockets.get(socket.userId).add(socket.id);

      // Broadcast online status
      this.broadcastUserStatus(socket.userId, 'online');

      // Handle disconnect
      socket.on('disconnect', () => {
        logger.info(`User ${socket.userId} disconnected`);
        const userSocketSet = this.userSockets.get(socket.userId);
        if (userSocketSet) {
          userSocketSet.delete(socket.id);
          if (userSocketSet.size === 0) {
            this.userSockets.delete(socket.userId);
            this.broadcastUserStatus(socket.userId, 'offline');
          }
        }
      });

      // Join conversation room
      socket.on('conversation:join', async (conversationId) => {
        socket.join(`conversation:${conversationId}`);
        logger.info(`User ${socket.userId} joined conversation ${conversationId}`);
      });

      // Leave conversation room
      socket.on('conversation:leave', (conversationId) => {
        socket.leave(`conversation:${conversationId}`);
        logger.info(`User ${socket.userId} left conversation ${conversationId}`);
      });

      // Typing indicator
      socket.on('message:typing', ({ conversationId, isTyping }) => {
        socket.to(`conversation:${conversationId}`).emit('message:typing', {
          conversationId,
          userId: socket.userId,
          user: socket.user,
          isTyping
        });
      });

      // Mark message as read
      socket.on('message:read', async ({ messageId, conversationId }) => {
        try {
          // Handle in chat controller
          socket.to(`conversation:${conversationId}`).emit('message:read_receipt', {
            messageId,
            userId: socket.userId,
            readAt: new Date()
          });
        } catch (error) {
          logger.error('Error marking message as read:', error);
        }
      });
    });
  }

  // Emit new message to conversation
  emitNewMessage(conversationId, message) {
    this.io.to(`conversation:${conversationId}`).emit('message:new', message);
  }

  // Emit message deleted
  emitMessageDeleted(conversationId, messageId) {
    this.io.to(`conversation:${conversationId}`).emit('message:deleted', {
      conversationId,
      messageId
    });
  }

  // Broadcast user online/offline status
  broadcastUserStatus(userId, status) {
    this.io.emit('user:status', {
      userId,
      status,
      timestamp: new Date()
    });
  }

  // Send notification to specific user
  notifyUser(userId, event, data) {
    const userSocketIds = this.userSockets.get(userId);
    if (userSocketIds) {
      userSocketIds.forEach(socketId => {
        this.io.to(socketId).emit(event, data);
      });
    }
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.userSockets.has(userId);
  }

  getIO() {
    return this.io;
  }
}

module.exports = new SocketService();
```

---

## 📝 API Endpoints

### Conversations

#### POST /api/chat/conversations
**Create new conversation**
```javascript
Request:
{
  "type": "direct" | "group",
  "name": "Group Name", // Required for group, null for direct
  "participantIds": [2, 3, 4] // User IDs
}

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "type": "group",
    "name": "Group Name",
    "avatar_url": null,
    "created_by": 1,
    "participants": [
      {
        "user_id": 1,
        "user": { "id": 1, "full_name": "User 1", "avatar_url": "..." },
        "role": "admin"
      }
    ],
    "last_message_at": null,
    "created_at": "2025-12-24T10:00:00Z"
  }
}
```

#### GET /api/chat/conversations
**Get user's conversations (paginated)**
```javascript
Query:
?page=1&size=20&search=keyword

Response:
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "type": "direct",
        "name": null,
        "other_user": { // For direct chat
          "id": 2,
          "full_name": "John Doe",
          "avatar_url": "..."
        },
        "last_message": {
          "content": "Hello!",
          "sender_id": 2,
          "created_at": "2025-12-24T10:00:00Z"
        },
        "unread_count": 3,
        "last_message_at": "2025-12-24T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "size": 20,
      "total": 50,
      "total_pages": 3
    }
  }
}
```

#### GET /api/chat/conversations/:id
**Get conversation details**
```javascript
Response:
{
  "success": true,
  "data": {
    "id": 1,
    "type": "group",
    "name": "Team Chat",
    "avatar_url": "...",
    "created_by": 1,
    "participants": [
      {
        "user_id": 1,
        "user": {
          "id": 1,
          "full_name": "User 1",
          "avatar_url": "...",
          "is_online": true
        },
        "role": "admin",
        "joined_at": "2025-12-24T10:00:00Z"
      }
    ],
    "last_message_at": "2025-12-24T11:00:00Z",
    "created_at": "2025-12-24T10:00:00Z"
  }
}
```

#### PUT /api/chat/conversations/:id
**Update conversation (admin only for groups)**
```javascript
Request:
{
  "name": "New Group Name",
  "avatar_url": "https://..."
}

Response:
{
  "success": true,
  "data": { /* updated conversation */ }
}
```

#### DELETE /api/chat/conversations/:id
**Delete conversation (creator only)**
```javascript
Response:
{
  "success": true,
  "message": "Conversation deleted successfully"
}
```

### Conversation Participants

#### POST /api/chat/conversations/:id/participants
**Add participants (group admin only)**
```javascript
Request:
{
  "userIds": [5, 6]
}

Response:
{
  "success": true,
  "data": {
    "added": [
      { "user_id": 5, "user": {...} }
    ]
  }
}
```

#### DELETE /api/chat/conversations/:id/participants/:userId
**Remove participant (admin only)**
```javascript
Response:
{
  "success": true,
  "message": "Participant removed successfully"
}
```

#### POST /api/chat/conversations/:id/leave
**Leave conversation**
```javascript
Response:
{
  "success": true,
  "message": "Left conversation successfully"
}
```

### Messages

#### POST /api/chat/conversations/:id/messages
**Send message**
```javascript
Request (text):
{
  "content": "Hello, world!",
  "message_type": "text",
  "reply_to_id": null // Optional
}

Request (media):
{
  "message_type": "image",
  "media_url": "https://...",
  "media_thumbnail": "https://...",
  "media_size": 1024000,
  "content": "Optional caption"
}

Response:
{
  "success": true,
  "data": {
    "id": 123,
    "conversation_id": 1,
    "sender_id": 1,
    "sender": {
      "id": 1,
      "full_name": "User 1",
      "avatar_url": "..."
    },
    "content": "Hello, world!",
    "message_type": "text",
    "reply_to": null,
    "is_deleted": false,
    "created_at": "2025-12-24T10:00:00Z"
  }
}
```

#### GET /api/chat/conversations/:id/messages
**Get messages (paginated)**
```javascript
Query:
?page=1&size=50&before=messageId

Response:
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 123,
        "sender_id": 1,
        "sender": {...},
        "content": "Hello!",
        "message_type": "text",
        "reply_to": null,
        "read_receipts": [
          { "user_id": 2, "read_at": "2025-12-24T10:05:00Z" }
        ],
        "created_at": "2025-12-24T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "size": 50,
      "has_more": true
    }
  }
}
```

#### DELETE /api/chat/messages/:id
**Delete message (soft delete)**
```javascript
Response:
{
  "success": true,
  "message": "Message deleted successfully"
}
```

#### POST /api/chat/messages/:id/read
**Mark message as read**
```javascript
Response:
{
  "success": true,
  "data": {
    "message_id": 123,
    "read_at": "2025-12-24T10:05:00Z"
  }
}
```

#### POST /api/chat/conversations/:id/read-all
**Mark all messages as read**
```javascript
Response:
{
  "success": true,
  "data": {
    "conversation_id": 1,
    "read_count": 15
  }
}
```

### Upload Media

#### POST /api/chat/upload
**Upload image/video**
```javascript
Request (multipart/form-data):
- file: File
- type: 'image' | 'video'

Response:
{
  "success": true,
  "data": {
    "url": "https://...",
    "thumbnail": "https://...",
    "size": 1024000,
    "duration": 30 // for video
  }
}
```

---

## 💻 Service Layer Implementation

### Chat Service

```javascript
// src/features/chat/chat.service.js
const { Op } = require('sequelize');
const {
  Conversation,
  ConversationParticipant,
  Message,
  MessageReadReceipt,
  User,
  sequelize
} = require('../../database/models');
const socketService = require('../../services/socket.service');
const fcmService = require('../../services/fcm.service');
const cacheService = require('../../services/cache.service');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../../shared/utils/errors');

class ChatService {
  // ========== Conversations ==========

  async createConversation(userId, { type, name, participantIds }) {
    // Validate
    if (type === 'group' && !name) {
      throw new BadRequestError('Group name is required');
    }

    if (!participantIds || participantIds.length === 0) {
      throw new BadRequestError('At least one participant is required');
    }

    // For direct chat, check if conversation already exists
    if (type === 'direct') {
      if (participantIds.length !== 1) {
        throw new BadRequestError('Direct chat requires exactly one other participant');
      }

      const otherUserId = participantIds[0];
      const existing = await this.findDirectConversation(userId, otherUserId);
      if (existing) {
        return existing;
      }
    }

    const transaction = await sequelize.transaction();

    try {
      // Create conversation
      const conversation = await Conversation.create({
        type,
        name: type === 'group' ? name : null,
        created_by: userId
      }, { transaction });

      // Add creator as admin
      await ConversationParticipant.create({
        conversation_id: conversation.id,
        user_id: userId,
        role: type === 'group' ? 'admin' : 'member'
      }, { transaction });

      // Add other participants
      for (const participantId of participantIds) {
        if (participantId !== userId) {
          await ConversationParticipant.create({
            conversation_id: conversation.id,
            user_id: participantId,
            role: 'member'
          }, { transaction });
        }
      }

      await transaction.commit();

      // Load full conversation with participants
      const fullConversation = await this.getConversationById(conversation.id, userId);

      // Notify participants via Socket.IO
      participantIds.forEach(pId => {
        if (pId !== userId) {
          socketService.notifyUser(pId, 'conversation:new', fullConversation);
        }
      });

      return fullConversation;

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findDirectConversation(userId1, userId2) {
    const conversations = await Conversation.findAll({
      where: { type: 'direct' },
      include: [{
        model: ConversationParticipant,
        as: 'participants',
        required: true,
        where: {
          user_id: { [Op.in]: [userId1, userId2] },
          is_active: true
        }
      }]
    });

    // Find conversation with exactly these two users
    for (const conv of conversations) {
      const participantIds = conv.participants.map(p => p.user_id);
      if (participantIds.length === 2 &&
          participantIds.includes(userId1) &&
          participantIds.includes(userId2)) {
        return this.getConversationById(conv.id, userId1);
      }
    }

    return null;
  }

  async getUserConversations(userId, { page = 1, size = 20, search }) {
    const offset = (page - 1) * size;

    // Build query
    const whereClause = {};
    if (search) {
      whereClause.name = { [Op.iLike]: `%${search}%` };
    }

    // Get conversations user is part of
    const { count, rows } = await Conversation.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: ConversationParticipant,
          as: 'participants',
          required: true,
          where: { user_id: userId, is_active: true },
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'full_name', 'nickname', 'avatar_url']
          }]
        },
        {
          model: Message,
          as: 'messages',
          separate: true,
          limit: 1,
          order: [['created_at', 'DESC']],
          include: [{
            model: User,
            as: 'sender',
            attributes: ['id', 'full_name', 'avatar_url']
          }]
        }
      ],
      order: [['last_message_at', 'DESC NULLS LAST']],
      limit: size,
      offset
    });

    // Format conversations
    const conversations = await Promise.all(rows.map(async conv => {
      const unreadCount = await this.getUnreadCount(userId, conv.id);
      const formatted = conv.toJSON();

      // For direct chat, get other user info
      if (conv.type === 'direct') {
        const otherUser = await this.getOtherUserInDirectChat(userId, conv.id);
        formatted.other_user = otherUser;
      }

      formatted.last_message = formatted.messages[0] || null;
      formatted.unread_count = unreadCount;
      delete formatted.messages;

      return formatted;
    }));

    return {
      items: conversations,
      pagination: {
        page,
        size,
        total: count,
        total_pages: Math.ceil(count / size)
      }
    };
  }

  async getConversationById(conversationId, userId) {
    const conversation = await Conversation.findByPk(conversationId, {
      include: [{
        model: ConversationParticipant,
        as: 'participants',
        where: { is_active: true },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'full_name', 'nickname', 'avatar_url']
        }]
      }]
    });

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(p => p.user_id === userId);
    if (!isParticipant) {
      throw new ForbiddenError('You are not a participant of this conversation');
    }

    // Add online status
    const formatted = conversation.toJSON();
    formatted.participants = formatted.participants.map(p => ({
      ...p,
      user: {
        ...p.user,
        is_online: socketService.isUserOnline(p.user.id)
      }
    }));

    return formatted;
  }

  async updateConversation(conversationId, userId, updates) {
    const conversation = await Conversation.findByPk(conversationId);

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    // Check if user is admin (for groups) or creator
    if (conversation.type === 'group') {
      const participant = await ConversationParticipant.findOne({
        where: {
          conversation_id: conversationId,
          user_id: userId,
          role: 'admin'
        }
      });

      if (!participant) {
        throw new ForbiddenError('Only admins can update group');
      }
    }

    // Update
    await conversation.update(updates);

    return this.getConversationById(conversationId, userId);
  }

  // ========== Messages ==========

  async sendMessage(conversationId, userId, messageData) {
    // Verify user is participant
    const participant = await ConversationParticipant.findOne({
      where: {
        conversation_id: conversationId,
        user_id: userId,
        is_active: true
      }
    });

    if (!participant) {
      throw new ForbiddenError('You are not a participant of this conversation');
    }

    // Create message
    const message = await Message.create({
      conversation_id: conversationId,
      sender_id: userId,
      content: messageData.content,
      message_type: messageData.message_type || 'text',
      media_url: messageData.media_url,
      media_thumbnail: messageData.media_thumbnail,
      media_size: messageData.media_size,
      media_duration: messageData.media_duration,
      reply_to_id: messageData.reply_to_id
    });

    // Update conversation last_message_at
    await Conversation.update(
      { last_message_at: new Date() },
      { where: { id: conversationId } }
    );

    // Load full message with sender
    const fullMessage = await Message.findByPk(message.id, {
      include: [{
        model: User,
        as: 'sender',
        attributes: ['id', 'full_name', 'nickname', 'avatar_url']
      }]
    });

    // Emit via Socket.IO
    socketService.emitNewMessage(conversationId, fullMessage);

    // Send push notifications to offline users
    const participants = await ConversationParticipant.findAll({
      where: {
        conversation_id: conversationId,
        user_id: { [Op.ne]: userId },
        notification_enabled: true
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'push_token']
      }]
    });

    const offlineUsers = participants.filter(p => 
      !socketService.isUserOnline(p.user_id) && p.user.push_token
    );

    if (offlineUsers.length > 0) {
      await fcmService.sendChatNotification(offlineUsers, fullMessage);
    }

    return fullMessage;
  }

  async getMessages(conversationId, userId, { page = 1, size = 50, before }) {
    // Verify user is participant
    const participant = await ConversationParticipant.findOne({
      where: {
        conversation_id: conversationId,
        user_id: userId,
        is_active: true
      }
    });

    if (!participant) {
      throw new ForbiddenError('You are not a participant of this conversation');
    }

    const whereClause = {
      conversation_id: conversationId,
      is_deleted: false
    };

    if (before) {
      whereClause.id = { [Op.lt]: before };
    }

    const messages = await Message.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'full_name', 'nickname', 'avatar_url']
        },
        {
          model: MessageReadReceipt,
          as: 'readReceipts',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'full_name']
          }]
        }
      ],
      order: [['created_at', 'DESC']],
      limit: size
    });

    return {
      items: messages.reverse(),
      pagination: {
        page,
        size,
        has_more: messages.length === size
      }
    };
  }

  async deleteMessage(messageId, userId) {
    const message = await Message.findByPk(messageId);

    if (!message) {
      throw new NotFoundError('Message not found');
    }

    if (message.sender_id !== userId) {
      throw new ForbiddenError('You can only delete your own messages');
    }

    // Soft delete
    await message.update({
      is_deleted: true,
      deleted_at: new Date()
    });

    // Emit via Socket.IO
    socketService.emitMessageDeleted(message.conversation_id, messageId);

    return { success: true };
  }

  async markMessageAsRead(messageId, userId) {
    const message = await Message.findByPk(messageId);

    if (!message) {
      throw new NotFoundError('Message not found');
    }

    // Don't mark own messages as read
    if (message.sender_id === userId) {
      return;
    }

    // Create or update read receipt
    const [receipt, created] = await MessageReadReceipt.findOrCreate({
      where: { message_id: messageId, user_id: userId },
      defaults: { read_at: new Date() }
    });

    if (!created) {
      await receipt.update({ read_at: new Date() });
    }

    // Update participant last_read_at
    await ConversationParticipant.update(
      { last_read_at: new Date() },
      {
        where: {
          conversation_id: message.conversation_id,
          user_id: userId
        }
      }
    );

    return receipt;
  }

  async markAllAsRead(conversationId, userId) {
    // Get all unread messages
    const participant = await ConversationParticipant.findOne({
      where: {
        conversation_id: conversationId,
        user_id: userId
      }
    });

    if (!participant) {
      throw new NotFoundError('Participant not found');
    }

    const messages = await Message.findAll({
      where: {
        conversation_id: conversationId,
        sender_id: { [Op.ne]: userId },
        created_at: { [Op.gt]: participant.last_read_at || new Date(0) }
      }
    });

    // Create read receipts
    for (const message of messages) {
      await MessageReadReceipt.findOrCreate({
        where: { message_id: message.id, user_id: userId },
        defaults: { read_at: new Date() }
      });
    }

    // Update participant last_read_at
    await participant.update({ last_read_at: new Date() });

    return { read_count: messages.length };
  }

  // ========== Utility Methods ==========

  async getUnreadCount(userId, conversationId) {
    const participant = await ConversationParticipant.findOne({
      where: {
        conversation_id: conversationId,
        user_id: userId
      }
    });

    if (!participant) return 0;

    const count = await Message.count({
      where: {
        conversation_id: conversationId,
        sender_id: { [Op.ne]: userId },
        created_at: { [Op.gt]: participant.last_read_at || new Date(0) },
        is_deleted: false
      }
    });

    return count;
  }

  async getOtherUserInDirectChat(userId, conversationId) {
    const participants = await ConversationParticipant.findAll({
      where: {
        conversation_id: conversationId,
        user_id: { [Op.ne]: userId }
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'full_name', 'nickname', 'avatar_url']
      }]
    });

    return participants[0]?.user || null;
  }
}

module.exports = new ChatService();
```

---

## 🚀 Implementation Checklist

### Phase 1: Database & Models (3 days)
- [ ] Create migration files
- [ ] Create Sequelize models
- [ ] Setup model associations
- [ ] Test models locally

### Phase 2: Socket.IO Setup (2 days)
- [ ] Initialize Socket.IO server
- [ ] Implement authentication middleware
- [ ] Setup event handlers
- [ ] Test real-time connections

### Phase 3: API Implementation (5 days)
- [ ] Conversation CRUD APIs
- [ ] Message APIs
- [ ] Upload media endpoint
- [ ] Read receipts APIs
- [ ] Add validation middleware
- [ ] Add Swagger docs

### Phase 4: Real-time Features (3 days)
- [ ] Typing indicators
- [ ] Online/offline status
- [ ] Message delivery
- [ ] Read receipts via Socket

### Phase 5: Notifications (2 days)
- [ ] Push notifications for messages
- [ ] Badge count management
- [ ] Notification preferences

### Phase 6: Testing (2 days)
- [ ] Unit tests
- [ ] Integration tests
- [ ] Socket.IO tests
- [ ] Load testing

**Total: ~17 days (2.5 weeks)**

---

**Document Version:** 1.0  
**Last Updated:** December 24, 2025
