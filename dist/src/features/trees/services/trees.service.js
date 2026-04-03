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
exports.TreesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_tree_entity_1 = require("../../../database/entities/user-tree.entity");
const tree_entity_1 = require("../../../database/entities/tree.entity");
const user_resource_entity_1 = require("../../../database/entities/user-resource.entity");
const resource_entity_1 = require("../../../database/entities/resource.entity");
const economy_log_entity_1 = require("../../../database/entities/economy-log.entity");
const wifi_session_entity_1 = require("../../../database/entities/wifi-session.entity");
const economy_util_1 = require("../../../shared/utils/economy.util");
const enums_constant_1 = require("../../../shared/constants/enums.constant");
const garden_gateway_1 = require("../../garden/gateways/garden.gateway");
let TreesService = class TreesService {
    userTreeRepository;
    treeRepository;
    resourceRepository;
    wifiSessionRepository;
    dataSource;
    gardenGateway;
    async upgradeTree(userId, dto) {
        const userTree = await this.userTreeRepository.findOne({
            where: { id: dto.userTreeId, userId },
            relations: ['tree'],
        });
        if (!userTree) {
            throw new common_1.NotFoundException('UserTree not found');
        }
        const tree = userTree.tree;
        const nextLevel = userTree.level + 1;
        if (nextLevel > tree.maxLevel) {
            throw new common_1.BadRequestException('Cây đã đạt cấp tối đa');
        }
        const now = new Date();
        const activeWifiSession = await this.wifiSessionRepository.findOne({
            where: {
                userId,
                status: enums_constant_1.WifiSessionStatus.ACTIVE,
            },
        });
        const hasWifiBoost = !!activeWifiSession;
        const oxygenEarned = economy_util_1.EconomyUtil.calculateOxygenHarvest({
            baseYield: tree.oxyBase || 10,
            rate: Number(tree.oxyRate || 1.1),
            level: userTree.level,
            lastHarvestTime: userTree.lastHarvestTime,
            lastHeartbeat: activeWifiSession?.lastHeartbeat || null,
            now,
            isDamaged: userTree.isDamaged,
            hasWifiBoost,
        });
        const upgradeCost = this.calculateUpgradeCost(tree, nextLevel);
        const reachedEvolutionMilestone = nextLevel % 20 === 0 || nextLevel === tree.maxLevel;
        const leafResource = await this.findUpgradeCurrencyResource();
        const oxygenResource = await this.findOxygenResource();
        await this.dataSource.transaction(async (manager) => {
            const userResourceRepo = manager.getRepository(user_resource_entity_1.UserResource);
            const userTreeRepo = manager.getRepository(user_tree_entity_1.UserTree);
            const economyLogRepo = manager.getRepository(economy_log_entity_1.EconomyLog);
            let userLeafBalance = await userResourceRepo.findOne({
                where: {
                    userId,
                    resourceId: leafResource.id,
                },
            });
            if (!userLeafBalance) {
                userLeafBalance = userResourceRepo.create({
                    userId,
                    resourceId: leafResource.id,
                    balance: '0',
                });
            }
            const currentBalance = BigInt(userLeafBalance.balance ?? '0');
            const requiredCost = BigInt(upgradeCost);
            if (currentBalance < requiredCost) {
                throw new common_1.BadRequestException('Không đủ Lá Xanh để nâng cấp cây');
            }
            const newBalance = currentBalance - requiredCost;
            userLeafBalance.balance = newBalance.toString();
            await userResourceRepo.save(userLeafBalance);
            let userOxygen = await userResourceRepo.findOne({
                where: { userId, resourceId: oxygenResource.id },
            });
            if (!userOxygen) {
                userOxygen = userResourceRepo.create({
                    userId,
                    resourceId: oxygenResource.id,
                    balance: '0',
                });
            }
            const oxygenBalance = BigInt(userOxygen.balance || '0');
            userOxygen.balance = (oxygenBalance + BigInt(Math.floor(oxygenEarned))).toString();
            await userResourceRepo.save(userOxygen);
            userTree.level = nextLevel;
            userTree.lastHarvestTime = now;
            userTree.upgradeEndTime = undefined;
            if (reachedEvolutionMilestone) {
                const stage = Math.ceil(nextLevel / 20);
                userTree.assetPath = this.buildAssetPath(tree.assetsPath, stage);
            }
            await userTreeRepo.save(userTree);
            await economyLogRepo.save(economyLogRepo.create({
                userId,
                resourceType: leafResource.code,
                amount: -upgradeCost,
                source: 'tree_upgrade',
            }));
            if (oxygenEarned > 0) {
                await economyLogRepo.save(economyLogRepo.create({
                    userId,
                    resourceType: oxygenResource.code,
                    amount: Math.floor(oxygenEarned),
                    source: 'tree_upgrade_harvest',
                }));
            }
        });
        const upgradedTree = await this.userTreeRepository.findOneOrFail({
            where: { id: dto.userTreeId, userId },
            relations: ['tree'],
        });
        this.gardenGateway.emitToUser(userId, 'tree_updated', {
            userTreeId: upgradedTree.id,
            level: upgradedTree.level,
            isDamaged: upgradedTree.isDamaged,
            assetPath: upgradedTree.assetPath,
            source: 'upgrade',
        });
        return upgradedTree;
    }
    async repairTree(userId, dto) {
        const userTree = await this.userTreeRepository.findOne({
            where: { id: dto.userTreeId, userId },
            relations: ['tree'],
        });
        if (!userTree)
            throw new common_1.NotFoundException('UserTree not found');
        if (!userTree.isDamaged) {
            throw new common_1.BadRequestException('Cây không bị hư hại');
        }
        const tree = userTree.tree;
        const now = new Date();
        const activeWifiSession = await this.wifiSessionRepository.findOne({
            where: {
                userId,
                status: enums_constant_1.WifiSessionStatus.ACTIVE,
            },
        });
        const oxygenEarned = economy_util_1.EconomyUtil.calculateOxygenHarvest({
            baseYield: tree.oxyBase || 10,
            rate: Number(tree.oxyRate || 1.1),
            level: userTree.level,
            lastHarvestTime: userTree.lastHarvestTime,
            lastHeartbeat: activeWifiSession?.lastHeartbeat || null,
            now,
            isDamaged: true,
            hasWifiBoost: !!activeWifiSession,
        });
        const oxygenResource = await this.findOxygenResource();
        await this.dataSource.transaction(async (manager) => {
            const userResourceRepo = manager.getRepository(user_resource_entity_1.UserResource);
            const userTreeRepo = manager.getRepository(user_tree_entity_1.UserTree);
            const economyLogRepo = manager.getRepository(economy_log_entity_1.EconomyLog);
            let userOxygen = await userResourceRepo.findOne({
                where: { userId, resourceId: oxygenResource.id },
            });
            if (!userOxygen) {
                userOxygen = userResourceRepo.create({
                    userId,
                    resourceId: oxygenResource.id,
                    balance: '0',
                });
            }
            const oxygenBalance = BigInt(userOxygen.balance || '0');
            userOxygen.balance = (oxygenBalance + BigInt(Math.floor(oxygenEarned))).toString();
            await userResourceRepo.save(userOxygen);
            userTree.isDamaged = false;
            userTree.lastHarvestTime = now;
            await userTreeRepo.save(userTree);
            if (oxygenEarned > 0) {
                await economyLogRepo.save(economyLogRepo.create({
                    userId,
                    resourceType: oxygenResource.code,
                    amount: Math.floor(oxygenEarned),
                    source: 'tree_repair_harvest',
                }));
            }
            return userTree;
        });
        const repairedTree = await this.userTreeRepository.findOneOrFail({
            where: { id: dto.userTreeId, userId },
            relations: ['tree'],
        });
        this.gardenGateway.emitToUser(userId, 'tree_updated', {
            userTreeId: repairedTree.id,
            level: repairedTree.level,
            isDamaged: repairedTree.isDamaged,
            assetPath: repairedTree.assetPath,
            source: 'repair',
        });
        return repairedTree;
    }
    async getTreeUpgradeStatus(userId, userTreeId) {
        const userTree = await this.userTreeRepository.findOne({
            where: { id: userTreeId, userId },
            relations: ['tree'],
        });
        if (!userTree) {
            throw new common_1.NotFoundException('UserTree not found');
        }
        return {
            userTreeId: userTree.id,
            level: userTree.level,
            maxLevel: userTree.tree.maxLevel,
            isUpgrading: false,
            upgradeEndTime: undefined,
            secondsRemaining: 0,
            canUpgrade: userTree.level < userTree.tree.maxLevel,
        };
    }
    async unlockTree(userId, dto) {
        const existed = await this.userTreeRepository.findOne({
            where: { userId, treeId: dto.treeId },
        });
        if (existed) {
            throw new common_1.BadRequestException('User đã sở hữu cây này');
        }
        const tree = await this.treeRepository.findOne({
            where: { id: dto.treeId },
        });
        if (!tree) {
            throw new common_1.BadRequestException('Loại cây không tồn tại');
        }
        const userTree = this.userTreeRepository.create({
            userId,
            treeId: dto.treeId,
            level: 1,
            isDamaged: false,
            assetPath: this.buildAssetPath(tree.assetsPath, 1),
            lastHarvestTime: new Date(),
            checksum: '',
        });
        return this.userTreeRepository.save(userTree);
    }
    constructor(userTreeRepository, treeRepository, resourceRepository, wifiSessionRepository, dataSource, gardenGateway) {
        this.userTreeRepository = userTreeRepository;
        this.treeRepository = treeRepository;
        this.resourceRepository = resourceRepository;
        this.wifiSessionRepository = wifiSessionRepository;
        this.dataSource = dataSource;
        this.gardenGateway = gardenGateway;
    }
    async getUserTrees(userId) {
        return this.userTreeRepository.find({
            where: { userId },
            relations: ['tree'],
            order: { createdAt: 'DESC' },
        });
    }
    async getAllCatalogTrees() {
        return this.treeRepository.find({ order: { slotIndex: 'ASC' } });
    }
    async getCatalogTreeById(id) {
        return this.treeRepository.findOne({ where: { id } });
    }
    async getTreeById(treeId, userId) {
        const userTree = await this.userTreeRepository.findOne({
            where: { id: treeId, userId },
            relations: ['tree'],
        });
        if (!userTree) {
            throw new common_1.NotFoundException('Tree not found');
        }
        return userTree;
    }
    calculateUpgradeCost(tree, level) {
        const rawCost = tree.costBase * Math.pow(Number(tree.costRate), level - 1);
        return Math.max(10, Math.round(rawCost / 10) * 10);
    }
    async findUpgradeCurrencyResource() {
        const preferredCodes = [
            'GREEN_LEAF',
            'GREEN_LEAVES',
            'LEAF',
            'LEAVES',
            'LA_XANH',
            'COIN',
            'COINS',
            'GOLD',
        ];
        for (const code of preferredCodes) {
            const resource = await this.resourceRepository.findOne({
                where: { code },
            });
            if (resource) {
                return resource;
            }
        }
        throw new common_1.BadRequestException('Không tìm thấy resource Lá Xanh. Cần seed resource với code phù hợp.');
    }
    async findOxygenResource() {
        const oxygenCodes = ['OXYGEN', 'OXY', 'O2', 'O2_GENERATED'];
        for (const code of oxygenCodes) {
            const resource = await this.resourceRepository.findOne({
                where: { code },
            });
            if (resource) {
                return resource;
            }
        }
        throw new common_1.BadRequestException('Không tìm thấy resource Oxygen. Cần seed resource với code phù hợp.');
    }
    buildAssetPath(basePath, stage) {
        const normalizedBasePath = basePath.replace(/\.png$/i, '');
        return `${normalizedBasePath}${stage}.png`;
    }
};
exports.TreesService = TreesService;
exports.TreesService = TreesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_tree_entity_1.UserTree)),
    __param(1, (0, typeorm_1.InjectRepository)(tree_entity_1.Tree)),
    __param(2, (0, typeorm_1.InjectRepository)(resource_entity_1.Resource)),
    __param(3, (0, typeorm_1.InjectRepository)(wifi_session_entity_1.WifiSession)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        garden_gateway_1.GardenGateway])
], TreesService);
//# sourceMappingURL=trees.service.js.map