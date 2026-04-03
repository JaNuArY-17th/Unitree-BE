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
exports.WifiSessionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const wifi_sessions_service_1 = require("../services/wifi-sessions.service");
const start_session_dto_1 = require("../dto/start-session.dto");
const heartbeat_dto_1 = require("../dto/heartbeat.dto");
const end_session_dto_1 = require("../dto/end-session.dto");
const pagination_dto_1 = require("../../../shared/dto/pagination.dto");
const current_user_decorator_1 = require("../../../shared/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../../../shared/guards/jwt-auth.guard");
const response_util_1 = require("../../../shared/utils/response.util");
let WifiSessionsController = class WifiSessionsController {
    wifiSessionsService;
    constructor(wifiSessionsService) {
        this.wifiSessionsService = wifiSessionsService;
    }
    async startSession(userId, dto) {
        const session = await this.wifiSessionsService.startSession(userId, dto);
        return response_util_1.ResponseUtil.success(session, 'WiFi session started successfully');
    }
    async heartbeat(userId, dto) {
        const result = await this.wifiSessionsService.heartbeat(userId, dto);
        return response_util_1.ResponseUtil.success(result, 'Heartbeat recorded');
    }
    async endSession(userId, sessionId, dto) {
        const result = await this.wifiSessionsService.endSession(sessionId, userId, dto);
        return response_util_1.ResponseUtil.success(result, `WiFi session ended. You earned ${result.pointsEarned} points!`);
    }
    async getActiveSession(userId) {
        const session = await this.wifiSessionsService.getActiveSession(userId);
        return response_util_1.ResponseUtil.success(session);
    }
    async getUserSessions(userId, pagination) {
        const result = await this.wifiSessionsService.getUserSessions(userId, pagination.page || 1, pagination.limit || 10);
        return response_util_1.ResponseUtil.paginated(result.data, pagination.page || 1, pagination.limit || 10, result.total);
    }
    async getSession(userId, sessionId) {
        const session = await this.wifiSessionsService.getSessionById(sessionId, userId);
        return response_util_1.ResponseUtil.success(session);
    }
};
exports.WifiSessionsController = WifiSessionsController;
__decorate([
    (0, common_1.Post)('start'),
    (0, swagger_1.ApiOperation)({
        summary: 'Bắt đầu một phiên WiFi mới',
        description: 'Lưu ý: Việc kiểm tra WiFi hợp lệ (BSSID check) phải được thực hiện ở phía client trước khi gọi endpoint này',
    }),
    (0, swagger_1.ApiBody)({ type: start_session_dto_1.StartSessionDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Phiên WiFi được tạo thành công' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Đã có phiên đang hoạt động' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Chưa xác thực' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, start_session_dto_1.StartSessionDto]),
    __metadata("design:returntype", Promise)
], WifiSessionsController.prototype, "startSession", null);
__decorate([
    (0, common_1.Post)('heartbeat'),
    (0, swagger_1.ApiOperation)({
        summary: 'Gửi heartbeat để duy trì phiên WiFi',
        description: 'Android: Gửi mỗi 5 phút (Foreground Service). iOS: Gửi mỗi 15 phút (Silent Push)',
    }),
    (0, swagger_1.ApiBody)({ type: heartbeat_dto_1.HeartbeatDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Heartbeat đã được ghi nhận' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Chưa xác thực' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Phiên không tồn tại' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, heartbeat_dto_1.HeartbeatDto]),
    __metadata("design:returntype", Promise)
], WifiSessionsController.prototype, "heartbeat", null);
__decorate([
    (0, common_1.Post)(':id/end'),
    (0, swagger_1.ApiOperation)({
        summary: 'Kết thúc phiên WiFi và nhận điểm',
        description: 'Tính toán thời gian phiên và trao điểm thưởng (1 điểm / phút)',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'UUID của phiên WiFi',
        example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Phiên đã kết thúc và điểm được trao',
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Phiên không ở trạng thái active' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Chưa xác thực' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Phiên không tồn tại' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id', new common_1.ParseUUIDPipe())),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, end_session_dto_1.EndSessionDto]),
    __metadata("design:returntype", Promise)
], WifiSessionsController.prototype, "endSession", null);
__decorate([
    (0, common_1.Get)('active'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy phiên WiFi đang hoạt động của user' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Phiên hiện tại hoặc null nếu không có phiên nào',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Chưa xác thực' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WifiSessionsController.prototype, "getActiveSession", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy lịch sử các phiên WiFi có phân trang' }),
    (0, swagger_1.ApiQuery)({
        name: 'page',
        required: false,
        type: Number,
        description: 'Trang hiện tại (mặc định: 1)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Số bản ghi mỗi trang (mặc định: 10, tối đa: 100)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Trả về lịch sử phiên WiFi có phân trang',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Chưa xác thực' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", Promise)
], WifiSessionsController.prototype, "getUserSessions", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy thông tin chi tiết một phiên WiFi theo ID' }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'UUID của phiên WiFi',
        example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Trả về thông tin phiên WiFi' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Chưa xác thực' }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Phiên không tồn tại hoặc không thuộc về user này',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id', new common_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WifiSessionsController.prototype, "getSession", null);
exports.WifiSessionsController = WifiSessionsController = __decorate([
    (0, swagger_1.ApiTags)('WiFi Sessions'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('wifi-sessions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [wifi_sessions_service_1.WifiSessionsService])
], WifiSessionsController);
//# sourceMappingURL=wifi-sessions.controller.js.map