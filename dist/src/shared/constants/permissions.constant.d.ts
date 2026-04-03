export declare enum Permission {
    USER_READ = "user:read",
    USER_CREATE = "user:create",
    USER_UPDATE = "user:update",
    USER_DELETE = "user:delete",
    WIFI_READ = "wifi:read",
    WIFI_CREATE = "wifi:create",
    WIFI_UPDATE = "wifi:update",
    POINTS_READ = "points:read",
    POINTS_CREATE = "points:create",
    POINTS_UPDATE = "points:update",
    POINTS_DELETE = "points:delete",
    TREE_READ = "tree:read",
    TREE_CREATE = "tree:create",
    TREE_UPDATE = "tree:update",
    TREE_DELETE = "tree:delete",
    REAL_TREE_READ = "real_tree:read",
    REAL_TREE_CREATE = "real_tree:create",
    REAL_TREE_UPDATE = "real_tree:update",
    REAL_TREE_DELETE = "real_tree:delete",
    CHAT_READ = "chat:read",
    CHAT_CREATE = "chat:create",
    CHAT_UPDATE = "chat:update",
    CHAT_DELETE = "chat:delete",
    ADMIN_ALL = "admin:all"
}
export declare const RolePermissions: {
    user: Permission[];
    admin: Permission[];
    super_admin: Permission[];
};
