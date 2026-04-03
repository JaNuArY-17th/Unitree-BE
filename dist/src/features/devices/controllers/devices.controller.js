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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevicesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const devices_service_1 = require("../services/devices.service");
const jwt_auth_guard_1 = require("../../../shared/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../../shared/decorators/current-user.decorator");
const response_util_1 = require("../../../shared/utils/response.util");
let DevicesController = class DevicesController {
    devicesService;
    constructor(devicesService) {
        this.devicesService = devicesService;
    }
    async getActiveSessions(user) {
        const sessions = await this.devicesService.getActiveSessions(user.id);
        return response_util_1.ResponseUtil.success(sessions, 'Active sessions retrieved');
    }
    async getUserDevices(user) {
        const devices = await this.devicesService.getUserDevices(user.id);
        return response_util_1.ResponseUtil.success(devices, 'Devices retrieved');
    }
    async logoutAllDevices(user) {
        await this.devicesService.logoutAllDevices(user.id);
        return response_util_1.ResponseUtil.success(null, 'Logged out from all devices');
    }
    async removeDevice(user, deviceId) {
        await this.devicesService.removeDevice(user.id, deviceId);
        return response_util_1.ResponseUtil.success(null, 'Device removed successfully');
    }
};
exports.DevicesController = DevicesController;
__decorate([
    (0, common_1.Get)('sessions'),
    (0, swagger_1.ApiOperation)({
        summary: 'Lấy danh sách phiên đăng nhập đang hoạt động của user',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Danh sách active sessions' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Chưa xác thực' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "getActiveSessions", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách tất cả thiết bị của user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Danh sách thiết bị của user' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Chưa xác thực' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "getUserDevices", null);
__decorate([
    (0, common_1.Delete)('logout-all'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Đăng xuất khỏi tất cả thiết bị' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Đã đăng xuất khỏi tất cả thiết bị thành công',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Chưa xác thực' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "logoutAllDevices", null);
__decorate([
    (0, common_1.Delete)(':deviceId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Xoá một thiết bị cụ thể' }),
    (0, swagger_1.ApiParam)({
        name: 'deviceId',
        description: 'UUID của thiết bị cần xoá',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Thiết bị đã được xoá thành công' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Chưa xác thực' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Thiết bị không tồn tại' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('deviceId', new common_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "removeDevice", null);
exports.DevicesController = DevicesController = __decorate([
    (0, swagger_1.ApiTags)('Devices'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('devices'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [devices_service_1.DevicesService])
], DevicesController);
//# sourceMappingURL=devices.controller.js.map