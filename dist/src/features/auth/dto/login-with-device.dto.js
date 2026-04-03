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
exports.LoginWithDeviceDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class LoginWithDeviceDto {
    email;
    password;
    deviceId;
    deviceName;
    deviceType;
    deviceOs;
    deviceModel;
    browser;
    fcmToken;
}
exports.LoginWithDeviceDto = LoginWithDeviceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'user@example.com', description: 'Email đăng nhập' }),
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], LoginWithDeviceDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'strongPassword123', description: 'Mật khẩu' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], LoginWithDeviceDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'device-uuid-abc123',
        description: 'ID định danh thiết bị (unique)',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], LoginWithDeviceDto.prototype, "deviceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Samsung Galaxy S24',
        description: 'Tîn thiết bị',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], LoginWithDeviceDto.prototype, "deviceName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'android',
        description: 'Loại thiết bị: ios | android | web',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], LoginWithDeviceDto.prototype, "deviceType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Android 14',
        description: 'Hệ điều hành của thiết bị',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], LoginWithDeviceDto.prototype, "deviceOs", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'SM-S921B',
        description: 'Model thiết bị',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], LoginWithDeviceDto.prototype, "deviceModel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Chrome',
        description: 'Tîn trình duyệt (cho web)',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], LoginWithDeviceDto.prototype, "browser", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'fcm-token-xyz',
        description: 'Firebase Cloud Messaging token',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], LoginWithDeviceDto.prototype, "fcmToken", void 0);
//# sourceMappingURL=login-with-device.dto.js.map