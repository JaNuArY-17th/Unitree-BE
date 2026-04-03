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
exports.GardenController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../../shared/decorators/current-user.decorator");
const response_util_1 = require("../../../shared/utils/response.util");
const garden_service_1 = require("../services/garden.service");
let GardenController = class GardenController {
    gardenService;
    constructor(gardenService) {
        this.gardenService = gardenService;
    }
    async syncResources(userId) {
        const result = await this.gardenService.syncAllOxygen(userId);
        return response_util_1.ResponseUtil.success(result, 'Dong bo tai nguyen thanh cong');
    }
};
exports.GardenController = GardenController;
__decorate([
    (0, common_1.Post)('sync-resources'),
    (0, swagger_1.ApiOperation)({
        summary: 'Dong bo tai nguyen truc tiep tu DB theo toan bo cay cua user',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Dong bo tai nguyen thanh cong',
    }),
    (0, common_1.HttpCode)(200),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GardenController.prototype, "syncResources", null);
exports.GardenController = GardenController = __decorate([
    (0, swagger_1.ApiTags)('Garden'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('garden'),
    __metadata("design:paramtypes", [garden_service_1.GardenService])
], GardenController);
//# sourceMappingURL=garden.controller.js.map