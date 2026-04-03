"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLES = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["USER"] = "user";
    UserRole["ADMIN"] = "admin";
    UserRole["SUPER_ADMIN"] = "super_admin";
})(UserRole || (exports.UserRole = UserRole = {}));
exports.ROLES = {
    USER: UserRole.USER,
    ADMIN: UserRole.ADMIN,
    SUPER_ADMIN: UserRole.SUPER_ADMIN,
};
//# sourceMappingURL=roles.constant.js.map