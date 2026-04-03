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
exports.MinigamesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const minigames_service_1 = require("../services/minigames.service");
const current_user_decorator_1 = require("../../../shared/decorators/current-user.decorator");
let MinigamesController = class MinigamesController {
    minigamesService;
    constructor(minigamesService) {
        this.minigamesService = minigamesService;
    }
    async getQuickInventory(userId) {
        return this.minigamesService.getQuickInventory(userId);
    }
    async getSpinRewards() {
        return this.minigamesService.getRewards();
    }
    async playSpin(user) {
        return this.minigamesService.playSpin(user.id);
    }
};
exports.MinigamesController = MinigamesController;
__decorate([
    (0, common_1.Get)('inventory/quick'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy nhanh số dư SPIN và MAN_CHUP_TRANH_MUOI' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Số dư hiện tại của SPIN và MAN_CHUP_TRANH_MUOI',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MinigamesController.prototype, "getQuickInventory", null);
__decorate([
    (0, common_1.Get)('spin/rewards'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy cấu hình phần thưởng vòng quay' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Danh sách các phần thưởng kèm drop rate',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MinigamesController.prototype, "getSpinRewards", null);
__decorate([
    (0, common_1.Post)('spin/play'),
    (0, swagger_1.ApiOperation)({ summary: 'Quay vòng quay gacha' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Kết quả vòng quay (Trúng thưởng item gì)',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MinigamesController.prototype, "playSpin", null);
exports.MinigamesController = MinigamesController = __decorate([
    (0, swagger_1.ApiTags)('Minigames'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('minigames'),
    __metadata("design:paramtypes", [minigames_service_1.MinigamesService])
], MinigamesController);
//# sourceMappingURL=minigames.controller.js.map