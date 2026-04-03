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
exports.TreesController = void 0;
const common_1 = require("@nestjs/common");
const upgrade_tree_dto_1 = require("../dto/upgrade-tree.dto");
const repair_tree_dto_1 = require("../dto/repair-tree.dto");
const swagger_1 = require("@nestjs/swagger");
const trees_service_1 = require("../services/trees.service");
const current_user_decorator_1 = require("../../../shared/decorators/current-user.decorator");
const response_util_1 = require("../../../shared/utils/response.util");
const unlock_tree_dto_1 = require("../dto/unlock-tree.dto");
let TreesController = class TreesController {
    treesService;
    constructor(treesService) {
        this.treesService = treesService;
    }
    async upgradeTree(userId, dto) {
        const userTree = await this.treesService.upgradeTree(userId, dto);
        return response_util_1.ResponseUtil.success(userTree, 'Nâng cấp cây thành công');
    }
    async repairTree(userId, dto) {
        const userTree = await this.treesService.repairTree(userId, dto);
        return response_util_1.ResponseUtil.success(userTree, 'Sửa cây thành công');
    }
    async getTreeUpgradeStatus(userId, userTreeId) {
        const status = await this.treesService.getTreeUpgradeStatus(userId, userTreeId);
        return response_util_1.ResponseUtil.success(status, 'Lấy trạng thái nâng cấp thành công');
    }
    async unlockTree(userId, dto) {
        const userTree = await this.treesService.unlockTree(userId, dto);
        return response_util_1.ResponseUtil.success(userTree, 'Mở khóa cây thành công');
    }
    async getUserTrees(userId) {
        const trees = await this.treesService.getUserTrees(userId);
        return response_util_1.ResponseUtil.success(trees);
    }
    async getAllCatalogTrees() {
        const trees = await this.treesService.getAllCatalogTrees();
        return response_util_1.ResponseUtil.success(trees);
    }
    async getCatalogTreeById(id) {
        const tree = await this.treesService.getCatalogTreeById(id);
        return response_util_1.ResponseUtil.success(tree);
    }
    async getTreeById(userId, treeId) {
        const tree = await this.treesService.getTreeById(treeId, userId);
        return response_util_1.ResponseUtil.success(tree);
    }
};
exports.TreesController = TreesController;
__decorate([
    (0, common_1.Post)('upgrade'),
    (0, swagger_1.ApiOperation)({ summary: 'Người dùng nâng cấp cây' }),
    (0, swagger_1.ApiBody)({ type: upgrade_tree_dto_1.UpgradeTreeDto, description: 'Dữ liệu nâng cấp cây' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Nâng cấp cây thành công',
        schema: {
            example: {
                success: true,
                data: {},
                message: 'Nâng cấp cây thành công',
            },
        },
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, upgrade_tree_dto_1.UpgradeTreeDto]),
    __metadata("design:returntype", Promise)
], TreesController.prototype, "upgradeTree", null);
__decorate([
    (0, common_1.Post)('repair'),
    (0, swagger_1.ApiOperation)({ summary: 'Người dùng sửa cây' }),
    (0, swagger_1.ApiBody)({ type: repair_tree_dto_1.RepairTreeDto, description: 'Dữ liệu sửa cây' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Sửa cây thành công',
        schema: {
            example: {
                success: true,
                data: {},
                message: 'Sửa cây thành công',
            },
        },
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, repair_tree_dto_1.RepairTreeDto]),
    __metadata("design:returntype", Promise)
], TreesController.prototype, "repairTree", null);
__decorate([
    (0, common_1.Get)(':id/upgrade-status'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy trạng thái nâng cấp của cây' }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'UUID của user tree',
        example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Trả về trạng thái nâng cấp hiện tại của cây',
        schema: {
            example: {
                success: true,
                data: {
                    userTreeId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
                    level: 12,
                    maxLevel: 100,
                    isUpgrading: true,
                    upgradeEndTime: '2026-03-21T15:30:00.000Z',
                    secondsRemaining: 87,
                    canUpgrade: false,
                },
                message: 'Lấy trạng thái nâng cấp thành công',
            },
        },
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id', new common_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TreesController.prototype, "getTreeUpgradeStatus", null);
__decorate([
    (0, common_1.Post)('unlock'),
    (0, swagger_1.ApiOperation)({ summary: 'Mở khóa cây cho user' }),
    (0, swagger_1.ApiBody)({ type: unlock_tree_dto_1.UnlockTreeDto, description: 'Dữ liệu mở khóa cây' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Mở khóa cây thành công',
        schema: {
            example: {
                success: true,
                data: {},
                message: 'Mở khóa cây thành công',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'User đã sở hữu cây này' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, unlock_tree_dto_1.UnlockTreeDto]),
    __metadata("design:returntype", Promise)
], TreesController.prototype, "unlockTree", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách cây của user đang đăng nhập' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Trả về danh sách cây của user' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Chưa xác thực' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TreesController.prototype, "getUserTrees", null);
__decorate([
    (0, common_1.Get)('catalog'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách loại cây (catalog)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Danh sách loại cây' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TreesController.prototype, "getAllCatalogTrees", null);
__decorate([
    (0, common_1.Get)('catalog/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy chi tiết một loại cây theo ID (catalog)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'UUID của loại cây' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Chi tiết loại cây' }),
    __param(0, (0, common_1.Param)('id', new common_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TreesController.prototype, "getCatalogTreeById", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy thông tin chi tiết một cây theo ID' }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'UUID của cây',
        example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Trả về thông tin chi tiết của cây',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Chưa xác thực' }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Cây không tồn tại hoặc không thuộc về user này',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id', new common_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TreesController.prototype, "getTreeById", null);
exports.TreesController = TreesController = __decorate([
    (0, swagger_1.ApiTags)('Trees'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('trees'),
    __metadata("design:paramtypes", [trees_service_1.TreesService])
], TreesController);
//# sourceMappingURL=trees.controller.js.map