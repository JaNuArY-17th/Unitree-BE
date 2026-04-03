"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolePermissions = exports.Permission = void 0;
var Permission;
(function (Permission) {
    Permission["USER_READ"] = "user:read";
    Permission["USER_CREATE"] = "user:create";
    Permission["USER_UPDATE"] = "user:update";
    Permission["USER_DELETE"] = "user:delete";
    Permission["WIFI_READ"] = "wifi:read";
    Permission["WIFI_CREATE"] = "wifi:create";
    Permission["WIFI_UPDATE"] = "wifi:update";
    Permission["POINTS_READ"] = "points:read";
    Permission["POINTS_CREATE"] = "points:create";
    Permission["POINTS_UPDATE"] = "points:update";
    Permission["POINTS_DELETE"] = "points:delete";
    Permission["TREE_READ"] = "tree:read";
    Permission["TREE_CREATE"] = "tree:create";
    Permission["TREE_UPDATE"] = "tree:update";
    Permission["TREE_DELETE"] = "tree:delete";
    Permission["REAL_TREE_READ"] = "real_tree:read";
    Permission["REAL_TREE_CREATE"] = "real_tree:create";
    Permission["REAL_TREE_UPDATE"] = "real_tree:update";
    Permission["REAL_TREE_DELETE"] = "real_tree:delete";
    Permission["CHAT_READ"] = "chat:read";
    Permission["CHAT_CREATE"] = "chat:create";
    Permission["CHAT_UPDATE"] = "chat:update";
    Permission["CHAT_DELETE"] = "chat:delete";
    Permission["ADMIN_ALL"] = "admin:all";
})(Permission || (exports.Permission = Permission = {}));
exports.RolePermissions = {
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
//# sourceMappingURL=permissions.constant.js.map