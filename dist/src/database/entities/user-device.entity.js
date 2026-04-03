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
exports.UserDevice = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const user_entity_1 = require("./user.entity");
let UserDevice = class UserDevice extends base_entity_1.BaseEntity {
    userId;
    deviceId;
    deviceName;
    deviceType;
    deviceOs;
    deviceModel;
    browser;
    ipAddress;
    fcmToken;
    isActive;
    lastActive;
    loggedOutAt;
    user;
};
exports.UserDevice = UserDevice;
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], UserDevice.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'device_id' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], UserDevice.prototype, "deviceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'device_name', nullable: true }),
    __metadata("design:type", String)
], UserDevice.prototype, "deviceName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'device_type' }),
    __metadata("design:type", String)
], UserDevice.prototype, "deviceType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'device_os', nullable: true }),
    __metadata("design:type", String)
], UserDevice.prototype, "deviceOs", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'device_model', nullable: true }),
    __metadata("design:type", String)
], UserDevice.prototype, "deviceModel", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'browser', nullable: true }),
    __metadata("design:type", String)
], UserDevice.prototype, "browser", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ip_address', nullable: true }),
    __metadata("design:type", String)
], UserDevice.prototype, "ipAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fcm_token', nullable: true }),
    __metadata("design:type", String)
], UserDevice.prototype, "fcmToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], UserDevice.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_active' }),
    __metadata("design:type", Date)
], UserDevice.prototype, "lastActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'logged_out_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], UserDevice.prototype, "loggedOutAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], UserDevice.prototype, "user", void 0);
exports.UserDevice = UserDevice = __decorate([
    (0, typeorm_1.Entity)('user_devices'),
    (0, typeorm_1.Index)(['userId', 'deviceId'], { unique: true })
], UserDevice);
//# sourceMappingURL=user-device.entity.js.map