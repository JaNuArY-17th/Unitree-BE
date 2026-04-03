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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const users_service_1 = require("../services/users.service");
const update_user_dto_1 = require("../dto/update-user.dto");
const apply_referral_dto_1 = require("../dto/apply-referral.dto");
const current_user_decorator_1 = require("../../../shared/decorators/current-user.decorator");
const response_util_1 = require("../../../shared/utils/response.util");
const roles_decorator_1 = require("../../../shared/decorators/roles.decorator");
const roles_constant_1 = require("../../../shared/constants/roles.constant");
const roles_guard_1 = require("../../../shared/guards/roles.guard");
const pagination_dto_1 = require("../../../shared/dto/pagination.dto");
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    async getCurrentUser(userId) {
        const user = await this.usersService.findById(userId);
        return response_util_1.ResponseUtil.success(user);
    }
    async updateCurrentUser(userId, updateUserDto) {
        const user = await this.usersService.update(userId, updateUserDto);
        return response_util_1.ResponseUtil.success(user, 'Profile updated successfully');
    }
    async findAll(paginationDto, search) {
        const result = await this.usersService.findAll(paginationDto, search);
        return response_util_1.ResponseUtil.success(result, 'Users retrieved successfully');
    }
    async validateReferralCode(userId, code) {
        return this.usersService.validateReferralCode(userId, code);
    }
    async findById(id) {
        const user = await this.usersService.findById(id);
        return response_util_1.ResponseUtil.success(user);
    }
    async applyReferralCode(userId, dto) {
        return this.usersService.applyReferralCode(userId, dto);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy thông tin user đang đăng nhập' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Trả về thông tin user hiện tại' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Chưa xác thực' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getCurrentUser", null);
__decorate([
    (0, common_1.Put)('me'),
    (0, swagger_1.ApiOperation)({
        summary: 'Cập nhật thông tin profile của user đang đăng nhập',
    }),
    (0, swagger_1.ApiBody)({ type: update_user_dto_1.UpdateUserDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Profile được cập nhật thành công' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Dữ liệu không hợp lệ' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Chưa xác thực' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_user_dto_1.UpdateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateCurrentUser", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_constant_1.UserRole.ADMIN, roles_constant_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] Lấy danh sách tất cả users' }),
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
    (0, swagger_1.ApiQuery)({
        name: 'search',
        required: false,
        type: String,
        description: 'Tìm kiếm theo tên hoặc email',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Trả về danh sách users có phân trang',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Chưa xác thực' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Không đủ quyền truy cập (yêu cầu ADMIN hoặc SUPER_ADMIN)',
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationDto, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('ref-code/:code'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Kiểm tra mã mời và lấy thông tin người giới thiệu',
    }),
    (0, swagger_1.ApiParam)({
        name: 'code',
        description: 'Mã mời 4 ký tự',
        example: 'AB12',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Kiểm tra mã mời thành công' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Mã mời không hợp lệ' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Mã mời không tồn tại' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Chưa xác thực' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "validateReferralCode", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy thông tin user theo ID' }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'UUID của user',
        example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Trả về thông tin user' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Chưa xác thực' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User không tồn tại' }),
    __param(0, (0, common_1.Param)('id', new common_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(['apply-ref', 'apply-referral']),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Nhập mã mời của người khác' }),
    (0, swagger_1.ApiBody)({ type: apply_referral_dto_1.ApplyReferralCodeDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Áp dụng mã mời thành công' }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Mã mời không hợp lệ hoặc đã sử dụng',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Chưa xác thực' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, apply_referral_dto_1.ApplyReferralCodeDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "applyReferralCode", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('Users'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map