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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("../services/auth.service");
const login_dto_1 = require("../dto/login.dto");
const google_login_dto_1 = require("../dto/google-login.dto");
const login_with_device_dto_1 = require("../dto/login-with-device.dto");
const verify_device_dto_1 = require("../dto/verify-device.dto");
const refresh_token_dto_1 = require("../dto/refresh-token.dto");
const public_decorator_1 = require("../../../shared/decorators/public.decorator");
const current_user_decorator_1 = require("../../../shared/decorators/current-user.decorator");
const response_util_1 = require("../../../shared/utils/response.util");
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async login(loginDto) {
        const result = await this.authService.login(loginDto);
        return response_util_1.ResponseUtil.success(result, 'Login successful');
    }
    async googleLogin(googleLoginDto) {
        const result = await this.authService.googleLogin(googleLoginDto.idToken);
        return response_util_1.ResponseUtil.success(result, 'Google login successful');
    }
    async refresh(refreshTokenDto) {
        const result = await this.authService.refreshToken(refreshTokenDto.refreshToken);
        return response_util_1.ResponseUtil.success(result, 'Token refreshed');
    }
    async getProfile(userId) {
        const user = await this.authService.getProfile(userId);
        return response_util_1.ResponseUtil.success(user);
    }
    async logout(userId) {
        await this.authService.logout(userId);
        return response_util_1.ResponseUtil.success(null, 'Logout successful');
    }
    async loginWithDevice(loginDto, req) {
        const ipAddress = req.ip || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];
        const result = await this.authService.loginWithDevice(loginDto, ipAddress, userAgent);
        if ('requireOtp' in result && result.requireOtp) {
            return response_util_1.ResponseUtil.success({
                requireOtp: true,
                userId: result.userId,
                deviceId: result.deviceId,
            }, result.message);
        }
        return response_util_1.ResponseUtil.success(result, 'Login successful');
    }
    async verifyDevice(verifyDto, req) {
        const ipAddress = req.ip || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];
        const result = await this.authService.verifyDeviceAndLogin(verifyDto.userId, verifyDto, ipAddress, userAgent);
        return response_util_1.ResponseUtil.success(result, 'Device verified and logged in successfully');
    }
    async getUserDevices(userId) {
        const devices = await this.authService.getUserDevices(userId);
        return response_util_1.ResponseUtil.success(devices);
    }
    async getActiveSessions(userId) {
        const sessions = await this.authService.getActiveSessions(userId);
        return response_util_1.ResponseUtil.success(sessions);
    }
    async logoutDevice(userId, deviceId) {
        await this.authService.logoutDevice(userId, deviceId);
        return response_util_1.ResponseUtil.success(null, 'Device logged out successfully');
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Đăng nhập bằng email và mật khẩu' }),
    (0, swagger_1.ApiBody)({ type: login_dto_1.LoginDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Đăng nhập thành công, trả về access token và refresh token',
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Email hoặc mật khẩu không chính xác',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('google/login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Đăng nhập bằng Google (Firebase ID Token)' }),
    (0, swagger_1.ApiBody)({ type: google_login_dto_1.GoogleLoginDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Đăng nhập thành công, trả về access token và refresh token',
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'ID Token không hợp lệ',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [google_login_dto_1.GoogleLoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleLogin", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Làm mới access token bằng refresh token' }),
    (0, swagger_1.ApiBody)({ type: refresh_token_dto_1.RefreshTokenDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Trả về access token mới' }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Refresh token không hợp lệ hoặc đã hết hạn',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [refresh_token_dto_1.RefreshTokenDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Get)('profile'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy thông tin profile của user đang đăng nhập' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Trả về thông tin profile user' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Chưa xác thực' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Đăng xuất khỏi phiên hiện tại' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Đăng xuất thành công' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Chưa xác thực' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('login-with-device'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Đăng nhập kèm thông tin thiết bị',
        description: 'Nếu thiết bị chưa được xác minh, server sẽ gửi OTP qua email và trả về requireOtp: true',
    }),
    (0, swagger_1.ApiBody)({ type: login_with_device_dto_1.LoginWithDeviceDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Đăng nhập thành công hoặc yêu cầu OTP xác minh thiết bị',
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Email hoặc mật khẩu không chính xác',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_with_device_dto_1.LoginWithDeviceDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "loginWithDevice", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('verify-device'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Xác minh thiết bị mới bằng mã OTP',
        description: 'Nhận mã OTP 6 chữ số được gửi qua email để xác minh thiết bị và đăng nhập',
    }),
    (0, swagger_1.ApiBody)({ type: verify_device_dto_1.VerifyDeviceDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Xác minh thiết bị thành công, trả về access token',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'OTP không chính xác hoặc đã hết hạn',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verify_device_dto_1.VerifyDeviceDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyDevice", null);
__decorate([
    (0, common_1.Get)('devices'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách thiết bị đã đăng ký của user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Danh sách thiết bị của user' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Chưa xác thực' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getUserDevices", null);
__decorate([
    (0, common_1.Get)('sessions'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách phiên đăng nhập đang hoạt động' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Danh sách active sessions của user',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Chưa xác thực' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getActiveSessions", null);
__decorate([
    (0, common_1.Delete)('devices/:deviceId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Đăng xuất và xoá một thiết bị cụ thể' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Thiết bị đã được xoá thành công' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Chưa xác thực' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Thiết bị không tồn tại' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('deviceId', new common_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logoutDevice", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map