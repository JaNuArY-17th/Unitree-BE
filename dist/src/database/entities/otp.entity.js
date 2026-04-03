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
exports.Otp = exports.OtpType = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
var OtpType;
(function (OtpType) {
    OtpType["EMAIL_VERIFICATION"] = "email_verification";
    OtpType["PHONE_VERIFICATION"] = "phone_verification";
    OtpType["PASSWORD_RESET"] = "password_reset";
    OtpType["DEVICE_VERIFICATION"] = "device_verification";
    OtpType["TWO_FACTOR_AUTH"] = "two_factor_auth";
})(OtpType || (exports.OtpType = OtpType = {}));
let Otp = class Otp extends base_entity_1.BaseEntity {
    userId;
    otpCode;
    type;
    email;
    phoneNumber;
    deviceId;
    expiresAt;
    verifiedAt;
    attempts;
    maxAttempts;
    isUsed;
    metadata;
};
exports.Otp = Otp;
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Otp.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'otp_code' }),
    __metadata("design:type", String)
], Otp.prototype, "otpCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: OtpType }),
    __metadata("design:type", String)
], Otp.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Otp.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'phone_number', nullable: true }),
    __metadata("design:type", String)
], Otp.prototype, "phoneNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'device_id', nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Otp.prototype, "deviceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expires_at' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Date)
], Otp.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'verified_at', nullable: true }),
    __metadata("design:type", Date)
], Otp.prototype, "verifiedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'attempts', default: 0 }),
    __metadata("design:type", Number)
], Otp.prototype, "attempts", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'max_attempts', default: 5 }),
    __metadata("design:type", Number)
], Otp.prototype, "maxAttempts", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_used', default: false }),
    __metadata("design:type", Boolean)
], Otp.prototype, "isUsed", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Otp.prototype, "metadata", void 0);
exports.Otp = Otp = __decorate([
    (0, typeorm_1.Entity)('otps')
], Otp);
//# sourceMappingURL=otp.entity.js.map