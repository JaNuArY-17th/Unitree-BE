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
exports.PointsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const points_service_1 = require("../services/points.service");
const current_user_decorator_1 = require("../../../shared/decorators/current-user.decorator");
const response_util_1 = require("../../../shared/utils/response.util");
const pagination_dto_1 = require("../../../shared/dto/pagination.dto");
let PointsController = class PointsController {
    pointsService;
    constructor(pointsService) {
        this.pointsService = pointsService;
    }
    async getEconomyHistory(userId, pagination) {
        const page = pagination.page || 1;
        const limit = pagination.limit || 10;
        const result = await this.pointsService.getEconomyHistory(userId, page, limit);
        return response_util_1.ResponseUtil.paginated(result.data, page, limit, result.total);
    }
};
exports.PointsController = PointsController;
__decorate([
    (0, common_1.Get)('history'),
    (0, swagger_1.ApiOperation)({
        summary: 'Lấy lịch sử điểm của user',
        description: 'Trả về danh sách giao dịch điểm (kiếm được / sử dụng) với phân trang',
    }),
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
        description: 'Số bản ghi mỗi trang (mặc định: 10)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Trả về lịch sử điểm có phân trang',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Chưa xác thực' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", Promise)
], PointsController.prototype, "getEconomyHistory", null);
exports.PointsController = PointsController = __decorate([
    (0, swagger_1.ApiTags)('Points'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('points'),
    __metadata("design:paramtypes", [points_service_1.PointsService])
], PointsController);
//# sourceMappingURL=points.controller.js.map