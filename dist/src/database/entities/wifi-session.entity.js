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
exports.WifiSession = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const user_entity_1 = require("./user.entity");
const enums_constant_1 = require("../../shared/constants/enums.constant");
let WifiSession = class WifiSession extends base_entity_1.BaseEntity {
    userId;
    startTime;
    endTime;
    durationMinutes;
    pointsEarned;
    status;
    lastHeartbeat;
    deviceId;
    ipAddress;
    user;
};
exports.WifiSession = WifiSession;
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], WifiSession.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'start_time' }),
    __metadata("design:type", Date)
], WifiSession.prototype, "startTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'end_time', nullable: true }),
    __metadata("design:type", Date)
], WifiSession.prototype, "endTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'duration_minutes', default: 0 }),
    __metadata("design:type", Number)
], WifiSession.prototype, "durationMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'points_earned', default: 0 }),
    __metadata("design:type", Number)
], WifiSession.prototype, "pointsEarned", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_constant_1.WifiSessionStatus,
        default: enums_constant_1.WifiSessionStatus.ACTIVE,
    }),
    __metadata("design:type", String)
], WifiSession.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_heartbeat', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], WifiSession.prototype, "lastHeartbeat", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'device_id', nullable: true }),
    __metadata("design:type", String)
], WifiSession.prototype, "deviceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ip_address', nullable: true }),
    __metadata("design:type", String)
], WifiSession.prototype, "ipAddress", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], WifiSession.prototype, "user", void 0);
exports.WifiSession = WifiSession = __decorate([
    (0, typeorm_1.Entity)('wifi_sessions'),
    (0, typeorm_1.Index)('idx_wifi_user_status', ['userId', 'status']),
    (0, typeorm_1.Index)('idx_wifi_last_heartbeat', ['lastHeartbeat'], {
        where: "status = 'active'",
    })
], WifiSession);
//# sourceMappingURL=wifi-session.entity.js.map