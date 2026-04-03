"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSession = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const user_entity_1 = require("./user.entity");
const user_device_entity_1 = require("./user-device.entity");
let UserSession = class UserSession extends base_entity_1.BaseEntity {
    userId;
    deviceId;
    accessTokenId;
    refreshTokenId;
    ipAddress;
    userAgent;
    isActive;
    expiresAt;
    lastActive;
    loggedOutAt;
    user;
    device;
};
exports.UserSession = UserSession;
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], UserSession.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'device_id' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], UserSession.prototype, "deviceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'access_token_id' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], UserSession.prototype, "accessTokenId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'refresh_token_id' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], UserSession.prototype, "refreshTokenId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ip_address', nullable: true }),
    __metadata("design:type", String)
], UserSession.prototype, "ipAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_agent', nullable: true }),
    __metadata("design:type", String)
], UserSession.prototype, "userAgent", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], UserSession.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expires_at' }),
    __metadata("design:type", Date)
], UserSession.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_active' }),
    __metadata("design:type", Date)
], UserSession.prototype, "lastActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'logged_out_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], UserSession.prototype, "loggedOutAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], UserSession.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_device_entity_1.UserDevice, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'device_id' }),
    __metadata("design:type", user_device_entity_1.UserDevice)
], UserSession.prototype, "device", void 0);
exports.UserSession = UserSession = __decorate([
    (0, typeorm_1.Entity)('user_sessions')
], UserSession);
//# sourceMappingURL=user-session.entity.js.map