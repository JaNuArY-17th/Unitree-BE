"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageType = exports.ConversationType = exports.PointTransactionType = exports.WifiSessionStatus = exports.UserRole = exports.UserTaskStatus = void 0;
var UserTaskStatus;
(function (UserTaskStatus) {
    UserTaskStatus["PENDING"] = "PENDING";
    UserTaskStatus["COMPLETED"] = "COMPLETED";
    UserTaskStatus["CLAIMED"] = "CLAIMED";
})(UserTaskStatus || (exports.UserTaskStatus = UserTaskStatus = {}));
var UserRole;
(function (UserRole) {
    UserRole["USER"] = "USER";
    UserRole["ADMIN"] = "ADMIN";
})(UserRole || (exports.UserRole = UserRole = {}));
var WifiSessionStatus;
(function (WifiSessionStatus) {
    WifiSessionStatus["ACTIVE"] = "active";
    WifiSessionStatus["COMPLETED"] = "completed";
    WifiSessionStatus["TIMEOUT"] = "timeout";
    WifiSessionStatus["CHEAT_FLAGGED"] = "cheat_flagged";
    WifiSessionStatus["CANCELLED"] = "cancelled";
})(WifiSessionStatus || (exports.WifiSessionStatus = WifiSessionStatus = {}));
var PointTransactionType;
(function (PointTransactionType) {
    PointTransactionType["WIFI"] = "wifi";
    PointTransactionType["REFERRAL"] = "referral";
    PointTransactionType["DAILY_CHECK_IN"] = "daily_check_in";
    PointTransactionType["TREE_CARE"] = "tree_care";
    PointTransactionType["ADMIN_ADJUSTMENT"] = "admin_adjustment";
    PointTransactionType["REDEEM"] = "redeem";
})(PointTransactionType || (exports.PointTransactionType = PointTransactionType = {}));
var ConversationType;
(function (ConversationType) {
    ConversationType["DIRECT"] = "direct";
    ConversationType["GROUP"] = "group";
})(ConversationType || (exports.ConversationType = ConversationType = {}));
var MessageType;
(function (MessageType) {
    MessageType["TEXT"] = "text";
    MessageType["IMAGE"] = "image";
    MessageType["FILE"] = "file";
    MessageType["SYSTEM"] = "system";
})(MessageType || (exports.MessageType = MessageType = {}));
//# sourceMappingURL=enums.constant.js.map