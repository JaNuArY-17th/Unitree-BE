export enum Permission {
  // User permissions
  USER_READ = 'user:read',
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',

  // WiFi session permissions
  WIFI_READ = 'wifi:read',
  WIFI_CREATE = 'wifi:create',
  WIFI_UPDATE = 'wifi:update',

  // Points permissions
  POINTS_READ = 'points:read',
  POINTS_CREATE = 'points:create',
  POINTS_UPDATE = 'points:update',
  POINTS_DELETE = 'points:delete',

  // Tree permissions
  TREE_READ = 'tree:read',
  TREE_CREATE = 'tree:create',
  TREE_UPDATE = 'tree:update',
  TREE_DELETE = 'tree:delete',

  // Real tree permissions
  REAL_TREE_READ = 'real_tree:read',
  REAL_TREE_CREATE = 'real_tree:create',
  REAL_TREE_UPDATE = 'real_tree:update',
  REAL_TREE_DELETE = 'real_tree:delete',

  // Chat permissions
  CHAT_READ = 'chat:read',
  CHAT_CREATE = 'chat:create',
  CHAT_UPDATE = 'chat:update',
  CHAT_DELETE = 'chat:delete',

  // Admin permissions
  ADMIN_ALL = 'admin:all',
}

export const RolePermissions = {
  user: [
    Permission.USER_READ,
    Permission.WIFI_CREATE,
    Permission.WIFI_READ,
    Permission.POINTS_READ,
    Permission.TREE_READ,
    Permission.TREE_CREATE,
    Permission.TREE_UPDATE,
    Permission.CHAT_READ,
    Permission.CHAT_CREATE,
  ],
  admin: [
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.WIFI_READ,
    Permission.WIFI_UPDATE,
    Permission.POINTS_READ,
    Permission.POINTS_CREATE,
    Permission.POINTS_UPDATE,
    Permission.TREE_READ,
    Permission.TREE_UPDATE,
    Permission.REAL_TREE_READ,
    Permission.REAL_TREE_CREATE,
    Permission.REAL_TREE_UPDATE,
    Permission.CHAT_READ,
    Permission.CHAT_UPDATE,
  ],
  super_admin: Object.values(Permission),
};
