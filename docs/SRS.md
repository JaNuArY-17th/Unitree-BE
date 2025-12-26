# Software Requirements Specification (SRS)
## Unitree Backend System - Version 2.0

---

**Document Version:** 1.0  
**Date:** December 24, 2025  
**Project:** Unitree Backend Rebuild  
**Client:** GreenityClub  
**Prepared by:** Backend Development Team

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [System Features](#3-system-features)
4. [External Interface Requirements](#4-external-interface-requirements)
5. [System Features and Requirements](#5-system-features-and-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Database Requirements](#7-database-requirements)
8. [Security Requirements](#8-security-requirements)
9. [Appendix](#9-appendix)

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) document provides a complete description of the Unitree Backend System Version 2.0. It details the functional and non-functional requirements for rebuilding the existing system with enhanced features, improved security, and better performance.

### 1.2 Scope
The Unitree Backend System is a gamification platform designed to:
- Encourage university students to use campus WiFi
- Track WiFi usage and reward points
- Enable virtual tree planting and growth
- Allow redemption of virtual trees for real tree planting
- Facilitate real-time communication between users
- Provide comprehensive administration tools

**Key Improvements in V2.0:**
- Migration from MongoDB to PostgreSQL for better data integrity
- Real-time chat functionality (1-1 and group)
- Enhanced security measures
- Performance optimization (N+1 query prevention, Redis caching)
- Modular architecture for better maintainability
- Comprehensive API documentation

### 1.3 Definitions, Acronyms, and Abbreviations

| Term | Definition |
|------|------------|
| API | Application Programming Interface |
| RBAC | Role-Based Access Control |
| JWT | JSON Web Token |
| ORM | Object-Relational Mapping |
| FCM | Firebase Cloud Messaging |
| OTP | One-Time Password |
| SRS | Software Requirements Specification |
| CRUD | Create, Read, Update, Delete |
| REST | Representational State Transfer |
| SQL | Structured Query Language |
| NoSQL | Not Only SQL |
| N+1 | Database query anti-pattern |
| TTL | Time To Live |

### 1.4 References
- Unitree Mobile Application Specification
- PostgreSQL 15 Documentation
- Express.js 4.x Documentation
- Socket.IO 4.x Documentation
- Firebase Cloud Messaging Documentation
- Sequelize ORM Documentation

### 1.5 Overview
This document is organized into sections describing system features, interface requirements, functional requirements, non-functional requirements, and technical specifications.

---

## 2. Overall Description

### 2.1 Product Perspective

The Unitree Backend System V2.0 is a complete rebuild of the existing system, serving as the core API and business logic layer for:
- **Mobile Application** (iOS & Android via React Native)
- **Web Admin Dashboard** (React.js)
- **Real-time Communication** (Socket.IO)

```
┌─────────────────────────────────────────────────┐
│              Client Applications                 │
├───────────────┬───────────────┬─────────────────┤
│ Mobile App    │ Admin Web     │ Future Clients  │
│ (React Native)│ (React.js)    │                 │
└───────┬───────┴───────┬───────┴─────────────────┘
        │               │
        │               │ HTTPS / WSS
        │               │
┌───────▼───────────────▼─────────────────────────┐
│         Unitree Backend API (Express.js)        │
├─────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │   Auth   │  │  Users   │  │   WiFi   │     │
│  │ Service  │  │ Service  │  │ Service  │     │
│  └──────────┘  └──────────┘  └──────────┘     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │  Points  │  │  Trees   │  │   Chat   │     │
│  │ Service  │  │ Service  │  │ Service  │     │
│  └──────────┘  └──────────┘  └──────────┘     │
├─────────────────────────────────────────────────┤
│              Socket.IO Server                   │
└─────────┬───────────────────┬───────────────────┘
          │                   │
          │                   │
┌─────────▼─────────┐  ┌──────▼──────┐  ┌────────┐
│   PostgreSQL      │  │    Redis    │  │Firebase│
│   Database        │  │    Cache    │  │  FCM   │
└───────────────────┘  └─────────────┘  └────────┘
```

### 2.2 Product Functions

**Primary Functions:**

1. **User Management**
   - Student registration and authentication
   - Profile management
   - Session management (single device login)
   - Email verification

2. **WiFi Session Tracking**
   - Automatic session detection
   - GPS location verification
   - IP address validation
   - Duration and points calculation
   - Background synchronization

3. **Points System**
   - Automatic point earning (60 points/hour)
   - Manual point adjustment (admin)
   - Attendance bonus
   - Transaction history
   - Leaderboard

4. **Virtual Trees**
   - Tree redemption with points
   - Growth based on WiFi usage
   - Health monitoring
   - Watering mechanism
   - Stage progression
   - Death mechanism

5. **Real Trees**
   - Virtual tree conversion
   - Planting location tracking
   - Status management
   - Image uploads

6. **Real-time Chat (NEW)**
   - Direct 1-1 messaging
   - Group chat creation
   - Text, image, and video messages
   - Online/offline status
   - Typing indicators
   - Read receipts
   - Message history

7. **Push Notifications**
   - Tree care reminders
   - Achievement notifications
   - Chat message alerts
   - System announcements

8. **Admin Dashboard**
   - User management
   - Points adjustment
   - Tree management
   - Statistics and reports
   - System settings

### 2.3 User Classes and Characteristics

#### 2.3.1 Students (Primary Users)
- **Characteristics:** University students with smartphones
- **Technical Expertise:** Basic to intermediate
- **Usage Frequency:** Daily
- **Primary Tasks:**
  - Connect to campus WiFi
  - Track points and time
  - Manage virtual trees
  - Chat with other students
  - Redeem trees

#### 2.3.2 Administrators
- **Characteristics:** University staff managing the program
- **Technical Expertise:** Intermediate to advanced
- **Usage Frequency:** Several times per week
- **Primary Tasks:**
  - Manage user accounts
  - Adjust points
  - Configure system settings
  - Generate reports
  - Monitor system health

#### 2.3.3 Super Administrators
- **Characteristics:** System administrators
- **Technical Expertise:** Advanced
- **Usage Frequency:** As needed
- **Primary Tasks:**
  - Manage admin accounts
  - Configure core system settings
  - Access all system features
  - Database management

### 2.4 Operating Environment

**Server Environment:**
- **Operating System:** Linux (Ubuntu 20.04+ or CentOS 8+)
- **Node.js Runtime:** v18.x LTS or higher
- **Database:** PostgreSQL 15+
- **Cache:** Redis 7+
- **Process Manager:** PM2
- **Reverse Proxy:** Nginx
- **Cloud Storage:** Cloudinary

**Development Environment:**
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

**Client Support:**
- Mobile: iOS 13+, Android 8+
- Web Browsers: Chrome, Firefox, Safari, Edge (latest 2 versions)

### 2.5 Design and Implementation Constraints

**Technical Constraints:**
- Must use PostgreSQL as primary database
- Must support concurrent users (up to 10,000)
- Real-time messaging latency < 100ms
- API response time < 200ms (p95)
- Must be RESTful API compliant
- Must support Socket.IO for real-time features

**Security Constraints:**
- HTTPS required in production
- JWT-based authentication
- No userId in request headers
- Input validation required for all endpoints
- Rate limiting on all APIs
- GDPR compliance for user data

**Business Constraints:**
- Must support single device login
- Must maintain backward compatibility with existing mobile app
- Must complete migration within 10 weeks
- Zero data loss during migration

### 2.6 Assumptions and Dependencies

**Assumptions:**
- University provides stable WiFi with consistent IP range
- Students have smartphones with GPS capability
- Internet connectivity available for real-time features
- Firebase account available for push notifications
- Cloudinary account available for media storage

**Dependencies:**
- PostgreSQL database availability
- Redis cache availability
- Firebase Cloud Messaging service
- Cloudinary service
- SMTP server for email notifications

---

## 3. System Features

### 3.1 User Authentication and Authorization

#### 3.1.1 Description
Secure user authentication system with JWT tokens, session management, and role-based access control.

#### 3.1.2 Priority
**HIGH** - Critical for system security

#### 3.1.3 Functional Requirements

**FR-AUTH-001:** User Registration
- System shall allow students to register with email, password, student ID, and university name
- System shall validate email format and student ID format
- System shall send email verification code
- System shall hash passwords using bcrypt with cost factor 10
- System shall prevent duplicate email or student ID registration

**FR-AUTH-002:** Email Verification
- System shall generate 6-digit OTP code
- System shall send OTP via email
- System shall validate OTP within 10 minutes
- System shall mark email as verified upon successful validation

**FR-AUTH-003:** User Login
- System shall authenticate user with email and password
- System shall generate JWT access token (15-minute expiry)
- System shall generate refresh token (30-day expiry)
- System shall revoke previous sessions (single device login)
- System shall track login time and IP address

**FR-AUTH-004:** Token Refresh
- System shall accept valid refresh token
- System shall generate new access and refresh tokens
- System shall implement refresh token rotation
- System shall invalidate old refresh token

**FR-AUTH-005:** Logout
- System shall revoke current session
- System shall invalidate access and refresh tokens

**FR-AUTH-006:** Password Reset
- System shall send password reset OTP to email
- System shall validate OTP and allow password change
- System shall enforce password strength requirements

**FR-AUTH-007:** Authorization
- System shall extract userId from JWT token only
- System shall verify token on every protected endpoint
- System shall implement role-based access control
- System shall check permissions for admin operations

### 3.2 WiFi Session Tracking

#### 3.2.1 Description
Automatic tracking of student WiFi usage with location validation and point calculation.

#### 3.2.2 Priority
**HIGH** - Core feature

#### 3.2.3 Functional Requirements

**FR-WIFI-001:** Session Start
- System shall create new WiFi session when user connects
- System shall record SSID, BSSID, and IP address
- System shall validate IP address against university range
- System shall capture GPS coordinates
- System shall validate location within university radius (configurable)
- System shall record start timestamp

**FR-WIFI-002:** Session Update
- System shall allow periodic session updates (heartbeat)
- System shall update last activity timestamp
- System shall detect stale sessions (no update > 5 minutes)

**FR-WIFI-003:** Session End
- System shall record end timestamp
- System shall calculate total duration in seconds
- System shall calculate points earned (duration/3600 * points_per_hour)
- System shall update user's total time and points
- System shall create point transaction record

**FR-WIFI-004:** Background Sync
- System shall accept batch session updates from mobile app
- System shall prevent duplicate sessions
- System shall validate session integrity

**FR-WIFI-005:** Session History
- System shall display user's WiFi session history
- System shall support pagination (page, size)
- System shall show duration, points, location, date

**FR-WIFI-006:** Statistics
- System shall calculate daily/weekly/monthly WiFi time
- System shall reset period counters at configured intervals
- System shall display statistics to user

### 3.3 Points System

#### 3.3.1 Description
Point earning, spending, and transaction tracking system.

#### 3.3.2 Priority
**HIGH** - Core feature

#### 3.3.3 Functional Requirements

**FR-POINTS-001:** Automatic Point Earning
- System shall award points automatically on WiFi session end
- System shall calculate: (duration_seconds / 3600) * POINTS_PER_HOUR
- System shall update user's current points
- System shall update user's all-time points (for leaderboard)
- System shall create WIFI_SESSION transaction record

**FR-POINTS-002:** Point Deduction
- System shall deduct points for tree redemption
- System shall validate sufficient points available
- System shall create TREE_REDEMPTION transaction record
- System shall use database transaction for atomicity

**FR-POINTS-003:** Manual Adjustment (Admin)
- System shall allow admins to add/subtract points
- System shall require adjustment reason
- System shall create ADMIN_ADJUSTMENT transaction record
- System shall log admin action in audit log

**FR-POINTS-004:** Transaction History
- System shall display user's point transaction history
- System shall support pagination
- System shall show: amount, type, date, metadata
- System shall sort by most recent first

**FR-POINTS-005:** Leaderboard
- System shall rank users by all_time_points
- System shall support pagination
- System shall cache leaderboard in Redis (1 hour TTL)
- System shall display: rank, name, points, trees planted

**FR-POINTS-006:** Attendance Bonus
- System shall allow users to claim daily attendance bonus
- System shall validate one claim per day
- System shall award configured bonus points
- System shall create ATTENDANCE transaction record

### 3.4 Virtual Trees

#### 3.4.1 Description
Virtual tree planting, growth, and management system.

#### 3.4.2 Priority
**MEDIUM** - Important feature

#### 3.4.3 Functional Requirements

**FR-TREE-001:** Tree Types
- System shall maintain catalog of tree species
- System shall store: name, scientific name, cost, growth duration, image
- System shall allow admin to manage tree types

**FR-TREE-002:** Tree Redemption
- System shall allow user to redeem tree with points
- System shall validate sufficient points
- System shall deduct points atomically
- System shall create new tree in "seedling" stage
- System shall record user's current WiFi time as baseline
- System shall create PLANTED milestone

**FR-TREE-003:** Tree Growth
- System shall calculate growth based on WiFi time since planting
- System shall progress through stages:
  - seedling (0-5 hours)
  - sprout (5-20 hours)
  - sapling (20-50 hours)
  - young_tree (50-100 hours)
  - mature_tree (100-200 hours)
  - ancient_tree (200+ hours)
- System shall create STAGE_CHANGE milestone on progression

**FR-TREE-004:** Tree Watering
- System shall allow user to water their trees
- System shall update last_watered timestamp
- System shall restore health_score partially
- System shall create WATERED milestone

**FR-TREE-005:** Tree Health
- System shall decrease health_score based on days since watering:
  - 3-7 days: -10 health
  - 7+ days: -20 health
- System shall mark tree as dead if health reaches 0
- System shall record death_date
- System shall create DIED milestone

**FR-TREE-006:** Tree Details
- System shall display: name, species, stage, health, planted date
- System shall show growth progress
- System shall display milestone history
- System shall calculate WiFi time contribution

**FR-TREE-007:** User Tree Collection
- System shall display all user's trees
- System shall support filtering by status (alive/dead)
- System shall support pagination

### 3.5 Real Trees

#### 3.5.1 Description
Real tree redemption and tracking system.

#### 3.5.2 Priority
**MEDIUM**

#### 3.5.3 Functional Requirements

**FR-REAL-001:** Real Tree Redemption
- System shall allow conversion of mature virtual trees
- System shall create real_tree record
- System shall deduct virtual tree from user
- System shall set status to "pending"
- System shall notify admins

**FR-REAL-002:** Real Tree Management (Admin)
- System shall allow admin to update status:
  - pending → planted
  - planted → growing
  - growing → deceased
- System shall allow admin to add planting location
- System shall allow admin to upload photos
- System shall allow admin to add notes

**FR-REAL-003:** User Real Trees
- System shall display user's real trees
- System shall show: species, status, planting date, location, photo

### 3.6 Real-time Chat (NEW)

#### 3.6.1 Description
Real-time messaging system for students to communicate.

#### 3.6.2 Priority
**HIGH** - New major feature

#### 3.6.3 Functional Requirements

**FR-CHAT-001:** Conversation Creation
- System shall allow user to start direct (1-1) conversation
- System shall allow user to create group conversation
- System shall require group name for group chats
- System shall add creator as admin for groups
- System shall add specified participants

**FR-CHAT-002:** Direct Chat
- System shall automatically create conversation for two users
- System shall reuse existing conversation if already exists
- System shall allow only two participants

**FR-CHAT-003:** Group Chat
- System shall allow multiple participants (3+)
- System shall support group name and avatar
- System shall designate group admins
- System shall allow admins to:
  - Add/remove members
  - Change group name
  - Change group avatar
  - Promote members to admin

**FR-CHAT-004:** Sending Messages
- System shall allow text messages (max 5000 characters)
- System shall allow image messages (max 10MB)
- System shall allow video messages (max 50MB)
- System shall generate thumbnails for media
- System shall support reply-to functionality
- System shall timestamp all messages

**FR-CHAT-005:** Real-time Message Delivery
- System shall deliver messages instantly via Socket.IO
- System shall handle offline users gracefully
- System shall queue messages for delivery
- System shall confirm message delivery

**FR-CHAT-006:** Message History
- System shall store all messages in database
- System shall support pagination (cursor-based)
- System shall load messages on conversation open
- System shall support infinite scroll

**FR-CHAT-007:** Typing Indicators
- System shall broadcast typing status to conversation
- System shall show "User is typing..." indicator
- System shall timeout typing status after 3 seconds

**FR-CHAT-008:** Online Status
- System shall track user online/offline status
- System shall broadcast status changes
- System shall show online indicator in UI

**FR-CHAT-009:** Read Receipts
- System shall track when messages are read
- System shall create read receipt records
- System shall broadcast read status to sender
- System shall show read indicators in UI

**FR-CHAT-010:** Message Deletion
- System shall allow user to delete own messages
- System shall soft-delete messages (is_deleted flag)
- System shall hide deleted messages in UI
- System shall broadcast deletion event

**FR-CHAT-011:** Unread Count
- System shall calculate unread messages per conversation
- System shall update count on new messages
- System shall reset count when user reads messages
- System shall show badge with count

**FR-CHAT-012:** Conversation List
- System shall display user's conversations
- System shall show last message preview
- System shall show unread count
- System shall sort by last message timestamp
- System shall support search by name

**FR-CHAT-013:** Leave Conversation
- System shall allow user to leave group
- System shall mark participation as inactive
- System shall hide conversation from user's list
- System shall notify other participants

**FR-CHAT-014:** Push Notifications
- System shall send push notification for new messages
- System shall respect user notification preferences
- System shall include sender name and preview
- System shall support deep linking to conversation

### 3.7 Push Notifications

#### 3.7.1 Description
Firebase Cloud Messaging integration for mobile push notifications.

#### 3.7.2 Priority
**MEDIUM**

#### 3.7.3 Functional Requirements

**FR-NOTIF-001:** Token Management
- System shall store user's FCM push token
- System shall update token when changed
- System shall validate token format

**FR-NOTIF-002:** Notification Types
- System shall support notification types:
  - tree_needs_water: Tree health low
  - tree_milestone: Stage progression
  - system_messages: Admin announcements
  - chat_messages: New chat messages

**FR-NOTIF-003:** Notification Preferences
- System shall allow user to enable/disable each type
- System shall store preferences in database
- System shall respect preferences when sending

**FR-NOTIF-004:** Notification Sending
- System shall use Firebase Admin SDK
- System shall batch notifications for efficiency
- System shall handle send errors gracefully
- System shall retry failed notifications

**FR-NOTIF-005:** Deep Linking
- System shall include deep link data in notifications
- System shall support navigation to:
  - Specific tree
  - Specific conversation
  - App screens

### 3.8 Admin Features

#### 3.8.1 Description
Administrative functions for system management.

#### 3.8.2 Priority
**HIGH**

#### 3.8.3 Functional Requirements

**FR-ADMIN-001:** Admin Authentication
- System shall provide separate admin login
- System shall use JWT authentication
- System shall support admin and superadmin roles

**FR-ADMIN-002:** User Management
- System shall allow viewing all users
- System shall support search and filtering
- System shall allow viewing user details
- System shall allow deactivating users
- System shall allow manual point adjustment

**FR-ADMIN-003:** Tree Management
- System shall allow viewing all trees
- System shall allow viewing all tree types
- System shall allow CRUD operations on tree types
- System shall allow viewing real trees
- System shall allow updating real tree status

**FR-ADMIN-004:** WiFi Session Management
- System shall allow viewing all sessions
- System shall support filtering by user, date
- System shall allow session deletion
- System shall recalculate points on deletion

**FR-ADMIN-005:** Points Management
- System shall allow viewing all transactions
- System shall allow manual adjustments
- System shall require reason for adjustments
- System shall log all admin actions

**FR-ADMIN-006:** Statistics
- System shall display:
  - Total users
  - Active users (last 7 days)
  - Total trees planted
  - Total WiFi time
  - Total points earned
  - Real trees redeemed
- System shall support date range filtering

**FR-ADMIN-007:** System Settings
- System shall allow configuring:
  - Points per hour
  - Tree cost
  - University location (lat, lng, radius)
  - University IP range
  - Minimum session duration
- System shall validate settings

**FR-ADMIN-008:** Admin Management (Superadmin)
- System shall allow superadmin to create admins
- System shall allow permission configuration
- System shall allow admin deletion
- System shall log admin management actions

---

## 4. External Interface Requirements

### 4.1 User Interfaces

#### 4.1.1 Mobile Application (React Native)
- **Authentication Screens:** Login, Register, Forgot Password, Email Verification
- **Main Tabs:**
  - Home: WiFi status, current session, points balance
  - Trees: Virtual tree collection, tree details
  - Chat: Conversation list, chat interface
  - Leaderboard: Point rankings
  - Profile: User settings, preferences
- **UI Requirements:**
  - Responsive design for various screen sizes
  - Support for iOS and Android design guidelines
  - Offline capability for viewing cached data
  - Pull-to-refresh on lists
  - Loading indicators for async operations

#### 4.1.2 Web Admin Dashboard (React)
- **Pages:**
  - Dashboard: Overview statistics
  - Users: User list and management
  - Trees: Virtual and real tree management
  - Points: Transaction history and adjustments
  - WiFi Sessions: Session monitoring
  - Settings: System configuration
- **UI Requirements:**
  - Responsive design (desktop priority)
  - Data tables with sorting, filtering, pagination
  - Charts and visualizations for statistics
  - Modal dialogs for actions
  - Toast notifications for feedback

### 4.2 Hardware Interfaces

**Mobile Device Requirements:**
- **GPS:** For location verification during WiFi sessions
- **WiFi Adapter:** For detecting connection and network info
- **Camera:** For taking photos of real trees (admin)
- **Storage:** For caching data and media

**Server Hardware:**
- **CPU:** Minimum 2 cores, Recommended 4+ cores
- **RAM:** Minimum 4GB, Recommended 8GB+
- **Storage:** Minimum 50GB SSD
- **Network:** High-speed internet connection

### 4.3 Software Interfaces

#### 4.3.1 PostgreSQL Database
- **Version:** 15 or higher
- **Interface:** TCP/IP connection via Sequelize ORM
- **Purpose:** Primary data storage
- **Data:** Users, sessions, points, trees, messages, etc.

#### 4.3.2 Redis Cache
- **Version:** 7 or higher
- **Interface:** TCP/IP connection via ioredis client
- **Purpose:** Caching and session storage
- **Data:** Leaderboard, user sessions, rate limiting, pub/sub

#### 4.3.3 Firebase Cloud Messaging
- **Interface:** Firebase Admin SDK (REST API)
- **Purpose:** Push notifications to mobile devices
- **Authentication:** Service account credentials

#### 4.3.4 Cloudinary
- **Interface:** REST API via cloudinary npm package
- **Purpose:** Image and video storage
- **Authentication:** API key and secret

#### 4.3.5 SMTP Server
- **Interface:** SMTP protocol via nodemailer
- **Purpose:** Email delivery (verification, password reset)
- **Authentication:** SMTP credentials

### 4.4 Communication Interfaces

#### 4.4.1 HTTP/HTTPS
- **Protocol:** HTTPS (TLS 1.2+)
- **Port:** 443 (production), 3000 (development)
- **Format:** JSON
- **Methods:** GET, POST, PUT, DELETE, PATCH

#### 4.4.2 WebSocket (Socket.IO)
- **Protocol:** WebSocket over HTTPS
- **Purpose:** Real-time bidirectional communication
- **Use Cases:** Chat messages, typing indicators, online status

#### 4.4.3 RESTful API Standards
- **Format:** JSON
- **Authentication:** Bearer token (JWT)
- **Versioning:** URL-based (/api/v1/...)
- **Response Format:**
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

---

## 5. System Features and Requirements

### 5.1 User Story Format

Each requirement is presented as a user story with acceptance criteria.

### 5.2 Example User Stories

**US-001: Student Registration**
```
As a: Student
I want to: Register an account with my student email
So that: I can access the Unitree system

Acceptance Criteria:
- Email must be valid format
- Password must be minimum 8 characters with uppercase, lowercase, and number
- Student ID must be 8 digits
- University must be selected
- Email verification code is sent
- Account is created but inactive until verified

Priority: High
Estimate: 5 story points
```

**US-002: WiFi Session Tracking**
```
As a: Student
I want to: Automatically track my WiFi usage
So that: I can earn points for being on campus

Acceptance Criteria:
- Session starts automatically when connected to university WiFi
- Location must be within university radius
- IP address must be in university range
- Points are calculated at 60 points per hour
- Session can be synced in background
- History is viewable with details

Priority: High
Estimate: 13 story points
```

**US-003: Send Chat Message**
```
As a: Student
I want to: Send messages to other students
So that: I can communicate about environmental topics

Acceptance Criteria:
- Can send text messages instantly
- Can send images (max 10MB)
- Can send videos (max 50MB)
- Messages appear in real-time
- Can see typing indicators
- Can see read receipts
- Can reply to specific messages

Priority: High
Estimate: 8 story points
```

---

## 6. Non-Functional Requirements

### 6.1 Performance Requirements

**NFR-PERF-001: API Response Time**
- 95th percentile response time < 200ms
- 99th percentile response time < 500ms
- Measured under normal load (100 concurrent users)

**NFR-PERF-002: Database Query Time**
- 95th percentile query time < 50ms
- No N+1 query problems
- Proper indexing on all foreign keys and frequently queried columns

**NFR-PERF-003: Real-time Message Latency**
- Message delivery latency < 100ms (p95)
- Typing indicator latency < 50ms
- Online status update < 200ms

**NFR-PERF-004: Concurrent Users**
- Support 10,000 registered users
- Support 1,000 concurrent connections
- Support 100 concurrent chat conversations

**NFR-PERF-005: Throughput**
- Minimum 100 requests per second
- Peak handling: 500 requests per second
- Database connection pooling: 20 max connections

### 6.2 Security Requirements

**NFR-SEC-001: Authentication**
- JWT tokens with RS256 algorithm
- Access token expiry: 15 minutes
- Refresh token expiry: 30 days
- Refresh token rotation on each refresh

**NFR-SEC-002: Password Security**
- Bcrypt hashing with cost factor 10
- Minimum 8 characters
- Must contain uppercase, lowercase, and number
- Password strength validation on registration

**NFR-SEC-003: Data Protection**
- HTTPS required in production
- Sensitive data encrypted at rest
- No plain text passwords in logs
- Environment variables for secrets

**NFR-SEC-004: SQL Injection Prevention**
- All queries parameterized via Sequelize
- No raw SQL with user input
- Input validation on all endpoints

**NFR-SEC-005: Rate Limiting**
- Authentication endpoints: 5 requests per 15 minutes
- API endpoints: 100 requests per 15 minutes
- Upload endpoints: 20 requests per hour
- Implemented with Redis

**NFR-SEC-006: Input Validation**
- Joi validation on all request bodies
- XSS prevention with sanitization
- File upload type and size validation
- MIME type verification

**NFR-SEC-007: Authorization**
- Role-based access control (RBAC)
- Permission checks on admin operations
- Resource ownership validation
- No userId in request headers

### 6.3 Reliability Requirements

**NFR-REL-001: Availability**
- System uptime: 99.9% (excluding planned maintenance)
- Maximum planned downtime: 4 hours per month
- Automatic restart on crashes (PM2)

**NFR-REL-002: Data Integrity**
- ACID transactions for critical operations
- Foreign key constraints enforced
- Database backups every 24 hours
- Point-in-time recovery capability

**NFR-REL-003: Error Handling**
- Graceful degradation on service failures
- User-friendly error messages
- Detailed error logging
- Retry logic for external services

**NFR-REL-004: Data Backup**
- Automated daily backups
- Retention: 30 days
- Tested restore procedures
- Offsite backup storage

### 6.4 Maintainability Requirements

**NFR-MAINT-001: Code Quality**
- ESLint compliance
- 80%+ test coverage
- No duplicate code (DRY principle)
- SOLID principles applied

**NFR-MAINT-002: Documentation**
- Complete API documentation (Swagger)
- Code comments for complex logic
- README for setup instructions
- Architecture diagrams

**NFR-MAINT-003: Logging**
- Structured logging with Winston
- Log levels: error, warn, info, debug
- Audit logs for critical operations
- Log rotation and retention

**NFR-MAINT-004: Monitoring**
- Health check endpoint
- Performance metrics collection
- Error rate tracking
- Alerting on anomalies

### 6.5 Scalability Requirements

**NFR-SCALE-001: Horizontal Scaling**
- Stateless API design
- Load balancer support
- Session storage in Redis (not memory)

**NFR-SCALE-002: Database Scaling**
- Connection pooling configured
- Read replica support (future)
- Query optimization
- Index strategy

**NFR-SCALE-003: Cache Strategy**
- Redis caching for frequently accessed data
- Cache invalidation on updates
- TTL-based expiration
- Cache warming for critical data

### 6.6 Usability Requirements

**NFR-USE-001: API Consistency**
- Consistent endpoint naming
- Consistent response format
- Consistent error codes
- Consistent pagination

**NFR-USE-002: Error Messages**
- Clear and actionable error messages
- Field-level validation errors
- HTTP status codes aligned with meanings

**NFR-USE-003: API Documentation**
- Complete Swagger documentation
- Request/response examples
- Authentication requirements documented
- Error responses documented

### 6.7 Portability Requirements

**NFR-PORT-001: Environment Support**
- Support Linux (Ubuntu, CentOS)
- Support macOS for development
- Docker containerization support

**NFR-PORT-002: Database Portability**
- PostgreSQL 15+ compatible
- Migration scripts for version upgrades
- Sequelize ORM abstraction

---

## 7. Database Requirements

### 7.1 Data Model

**Core Entities:**
1. users
2. admins
3. user_sessions
4. wifi_sessions
5. points
6. tree_types
7. trees
8. tree_milestones
9. real_trees
10. conversations
11. conversation_participants
12. messages
13. message_read_receipts

### 7.2 Data Integrity

**DI-001: Primary Keys**
- All tables must have primary key
- Use SERIAL for auto-increment IDs

**DI-002: Foreign Keys**
- All references must have foreign key constraints
- Cascade delete where appropriate
- Set null where needed

**DI-003: Data Types**
- Appropriate data types for each column
- TIMESTAMP for dates
- INTEGER for counts and IDs
- TEXT for long content
- JSONB for flexible metadata

**DI-004: Constraints**
- NOT NULL for required fields
- UNIQUE for email, student_id
- CHECK constraints for valid ranges
- DEFAULT values where appropriate

### 7.3 Indexing Strategy

**Index Requirements:**
- Primary keys (automatic)
- Foreign keys
- Frequently queried columns (email, student_id)
- Composite indexes for common joins
- Columns used in WHERE, ORDER BY

### 7.4 Data Retention

**Retention Policies:**
- User data: Indefinite (until account deletion)
- WiFi sessions: 2 years
- Point transactions: Indefinite
- Chat messages: Indefinite
- Audit logs: 1 year
- Error logs: 90 days

### 7.5 Backup and Recovery

**Backup Requirements:**
- Automated daily full backups
- Transaction logs for point-in-time recovery
- Offsite backup storage
- Backup encryption
- Tested restore procedures

---

## 8. Security Requirements

### 8.1 Authentication Requirements

**SEC-AUTH-001:** JWT Implementation
- Use RS256 algorithm
- Include: userId, email, issued at, expiry
- Store refresh token hash in database
- Verify signature on every request

**SEC-AUTH-002:** Session Management
- Single device login enforced
- Session timeout: 30 days
- Activity tracking
- Session revocation capability

### 8.2 Authorization Requirements

**SEC-AUTHZ-001:** Role-Based Access Control
- Roles: student, admin, superadmin
- Permissions stored per admin
- Middleware for permission checking
- Resource ownership validation

### 8.3 Data Security

**SEC-DATA-001:** Encryption
- HTTPS in production (TLS 1.2+)
- Passwords hashed with bcrypt
- Sensitive data encrypted at rest
- No secrets in code or logs

**SEC-DATA-002:** Input Validation
- Joi validation schemas
- XSS prevention
- SQL injection prevention
- File upload validation

### 8.4 Network Security

**SEC-NET-001:** CORS Configuration
- Whitelist allowed origins
- Credentials support
- Preflight handling

**SEC-NET-002:** Rate Limiting
- Redis-based implementation
- Per-endpoint limits
- IP-based tracking
- User-based tracking (authenticated)

### 8.5 Audit and Logging

**SEC-AUDIT-001:** Audit Logging
- Log all authentication attempts
- Log all admin actions
- Log suspicious activities
- Structured log format
- Secure log storage

---

## 9. Appendix

### 9.1 Glossary

- **Gamification:** Application of game design elements to encourage user engagement
- **WiFi Session:** Period of time a user is connected to university WiFi
- **Virtual Tree:** Digital representation of a tree that grows based on user activity
- **Real Tree:** Physical tree planted as reward for virtual tree maturity
- **Milestone:** Significant event in tree's lifecycle
- **Leaderboard:** Ranking of users based on all-time points
- **OTP:** One-Time Password for verification
- **JWT:** JSON Web Token for authentication

### 9.2 Analysis Models

**Use Case Diagram:**
```
Student:
- Register
- Login
- Connect to WiFi
- View points
- Redeem tree
- Water tree
- Send message
- View leaderboard

Admin:
- Manage users
- Adjust points
- Manage trees
- View statistics
```

### 9.3 Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-24 | Dev Team | Initial SRS for V2.0 rebuild |

### 9.4 Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Project Manager | | | |
| Technical Lead | | | |
| Client Representative | | | |

---

**END OF DOCUMENT**
