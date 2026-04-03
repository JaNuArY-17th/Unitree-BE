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
exports.PvpController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const pvp_service_1 = require("../services/pvp.service");
const raid_dto_1 = require("../dto/raid.dto");
const attack_dto_1 = require("../dto/attack.dto");
const current_user_decorator_1 = require("../../../shared/decorators/current-user.decorator");
const response_util_1 = require("../../../shared/utils/response.util");
let PvpController = class PvpController {
    pvpService;
    constructor(pvpService) {
        this.pvpService = pvpService;
    }
    async getTargets(userId) {
        const result = await this.pvpService.getAttackTargets(userId);
        return response_util_1.ResponseUtil.success(result, 'Attack targets fetched');
    }
    async getHistory(userId, limit) {
        const parsedLimit = limit ? Number.parseInt(limit, 10) : undefined;
        const result = await this.pvpService.getHistory(userId, parsedLimit);
        return response_util_1.ResponseUtil.success(result, 'PVP history fetched');
    }
    async raid(userId, dto) {
        const result = await this.pvpService.raid(userId, dto);
        return response_util_1.ResponseUtil.success(result, 'Raid action completed');
    }
    async attack(userId, dto) {
        const result = await this.pvpService.attack(userId, dto);
        return response_util_1.ResponseUtil.success(result, 'Attack action completed');
    }
};
exports.PvpController = PvpController;
__decorate([
    (0, common_1.Get)('targets'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách mục tiêu tấn công theo matchmaking' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Danh sách mục tiêu gồm 4 thường + 1 báo thủ',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PvpController.prototype, "getTargets", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, swagger_1.ApiOperation)({ summary: 'Lịch sử PvP để hỗ trợ trả thù sau này' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Các lượt tấn công và phòng thủ gần đây của user',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PvpController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Post)('raid'),
    (0, swagger_1.ApiOperation)({ summary: 'Hái lộc (Đi cướp Vàng)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Kết quả hái lộc (thành công hoặc bị block)',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, raid_dto_1.RaidDto]),
    __metadata("design:returntype", Promise)
], PvpController.prototype, "raid", null);
__decorate([
    (0, common_1.Post)('attack'),
    (0, swagger_1.ApiOperation)({ summary: 'Thả bọ (Làm hỏng cây)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Kết quả thả bọ (thành công hoặc bị block)',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, attack_dto_1.AttackDto]),
    __metadata("design:returntype", Promise)
], PvpController.prototype, "attack", null);
exports.PvpController = PvpController = __decorate([
    (0, swagger_1.ApiTags)('PvP'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('pvp'),
    __metadata("design:paramtypes", [pvp_service_1.PvpService])
], PvpController);
//# sourceMappingURL=pvp.controller.js.map