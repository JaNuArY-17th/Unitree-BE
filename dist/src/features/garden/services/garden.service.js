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
exports.GardenService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_tree_entity_1 = require("../../../database/entities/user-tree.entity");
const user_resource_entity_1 = require("../../../database/entities/user-resource.entity");
const resource_entity_1 = require("../../../database/entities/resource.entity");
const wifi_session_entity_1 = require("../../../database/entities/wifi-session.entity");
const economy_log_entity_1 = require("../../../database/entities/economy-log.entity");
const economy_util_1 = require("../../../shared/utils/economy.util");
const enums_constant_1 = require("../../../shared/constants/enums.constant");
let GardenService = class GardenService {
    userTreeRepository;
    resourceRepository;
    wifiSessionRepository;
    dataSource;
    fallbackLeafResourceCodes = [
        'GREEN_LEAF',
        'GREEN_LEAVES',
        'LEAF',
        'LEAVES',
        'LA_XANH',
    ];
    constructor(userTreeRepository, resourceRepository, wifiSessionRepository, dataSource) {
        this.userTreeRepository = userTreeRepository;
        this.resourceRepository = resourceRepository;
        this.wifiSessionRepository = wifiSessionRepository;
        this.dataSource = dataSource;
    }
    async syncAllOxygen(userId) {
        const userTrees = await this.userTreeRepository.find({
            where: { userId },
            relations: ['tree'],
        });
        const now = new Date();
        const activeWifiSession = await this.wifiSessionRepository.findOne({
            where: {
                userId,
                status: enums_constant_1.WifiSessionStatus.ACTIVE,
            },
        });
        const hasWifiBoost = !!activeWifiSession;
        const lastHeartbeat = activeWifiSession?.lastHeartbeat || null;
        let earnedWholeOxygen = 0;
        const treesToUpdate = [];
        for (const userTree of userTrees) {
            const tree = userTree.tree;
            const oxygenEarned = economy_util_1.EconomyUtil.calculateOxygenHarvest({
                baseYield: tree.oxyBase || 10,
                rate: Number(tree.oxyRate || 1.1),
                level: userTree.level,
                lastHarvestTime: userTree.lastHarvestTime,
                lastHeartbeat,
                now,
                isDamaged: userTree.isDamaged,
                hasWifiBoost,
            });
            const earnedForTree = Math.floor(oxygenEarned);
            if (earnedForTree > 0) {
                earnedWholeOxygen += earnedForTree;
                userTree.lastHarvestTime = now;
                treesToUpdate.push(userTree);
            }
        }
        const oxygenResource = await this.findOxygenResource();
        return await this.dataSource.transaction(async (manager) => {
            const userResourceRepo = manager.getRepository(user_resource_entity_1.UserResource);
            const userTreeRepo = manager.getRepository(user_tree_entity_1.UserTree);
            const economyLogRepo = manager.getRepository(economy_log_entity_1.EconomyLog);
            const resourceRepo = manager.getRepository(resource_entity_1.Resource);
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
            const currentBalance = BigInt(userOxygen.balance || '0');
            if (earnedWholeOxygen > 0) {
                userOxygen.balance = (currentBalance + BigInt(earnedWholeOxygen)).toString();
                await userResourceRepo.save(userOxygen);
                if (treesToUpdate.length > 0) {
                    await userTreeRepo.save(treesToUpdate);
                }
                await economyLogRepo.save(economyLogRepo.create({
                    userId,
                    resourceType: oxygenResource.code,
                    amount: earnedWholeOxygen,
                    source: 'sync_resources',
                }));
            }
            const leafResource = await this.findLeafResource(resourceRepo);
            let currentLeafBalance = '0';
            if (leafResource) {
                const userLeaf = await userResourceRepo.findOne({
                    where: { userId, resourceId: leafResource.id },
                });
                currentLeafBalance = userLeaf?.balance ?? '0';
            }
            return {
                oxygenEarned: earnedWholeOxygen,
                currentBalance: earnedWholeOxygen > 0
                    ? userOxygen.balance
                    : currentBalance.toString(),
                currentLeafBalance,
                hasWifiBoost,
                syncedTreeCount: userTrees.length,
                syncedAt: now,
            };
        });
    }
    async throwBug(attackerId, targetUserId, attackerTreeId) {
        const attackerTree = await this.userTreeRepository.findOne({
            where: { id: attackerTreeId, userId: attackerId },
            relations: ['tree'],
        });
        if (!attackerTree) {
            throw new common_1.NotFoundException('Cây tấn công không tồn tại');
        }
        const targetTrees = await this.userTreeRepository.find({
            where: { userId: targetUserId },
            relations: ['tree'],
        });
        if (targetTrees.length === 0) {
            throw new common_1.NotFoundException('Người chơi mục tiêu không có cây');
        }
        const targetTree = targetTrees[0];
        const now = new Date();
        const oxygenEarned = economy_util_1.EconomyUtil.calculateOxygenHarvest({
            baseYield: attackerTree.tree.oxyBase || 10,
            rate: Number(attackerTree.tree.oxyRate || 1.1),
            level: attackerTree.level,
            lastHarvestTime: attackerTree.lastHarvestTime,
            lastHeartbeat: null,
            now,
            isDamaged: attackerTree.isDamaged,
            hasWifiBoost: false,
        });
        return await this.dataSource.transaction(async (manager) => {
            const userResourceRepo = manager.getRepository(user_resource_entity_1.UserResource);
            const userTreeRepo = manager.getRepository(user_tree_entity_1.UserTree);
            const economyLogRepo = manager.getRepository(economy_log_entity_1.EconomyLog);
            const oxygenResource = await this.findOxygenResource();
            if (oxygenEarned > 0) {
                let attackerOxygen = await userResourceRepo.findOne({
                    where: { userId: attackerId, resourceId: oxygenResource.id },
                });
                if (!attackerOxygen) {
                    attackerOxygen = userResourceRepo.create({
                        userId: attackerId,
                        resourceId: oxygenResource.id,
                        balance: '0',
                    });
                }
                const currentBalance = BigInt(attackerOxygen.balance || '0');
                attackerOxygen.balance = (currentBalance + BigInt(Math.floor(oxygenEarned))).toString();
                await userResourceRepo.save(attackerOxygen);
                await economyLogRepo.save(economyLogRepo.create({
                    userId: attackerId,
                    resourceType: oxygenResource.code,
                    amount: Math.floor(oxygenEarned),
                    source: 'throw_bug',
                }));
            }
            targetTree.isDamaged = true;
            targetTree.damagedAt = now;
            targetTree.lastHarvestTime = now;
            await userTreeRepo.save(targetTree);
            return {
                attackerId,
                targetId: targetUserId,
                targetTreeId: targetTree.id,
                userTreeId: targetTree.id,
                level: targetTree.level,
                oxygenEarned: Math.floor(oxygenEarned),
                isDamaged: true,
            };
        });
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
    async findLeafResource(repo = this.resourceRepository) {
        for (const code of this.fallbackLeafResourceCodes) {
            const resource = await repo
                .createQueryBuilder('resource')
                .where('LOWER(resource.code) = LOWER(:code)', { code })
                .getOne();
            if (resource) {
                return resource;
            }
        }
        return null;
    }
};
exports.GardenService = GardenService;
exports.GardenService = GardenService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_tree_entity_1.UserTree)),
    __param(1, (0, typeorm_1.InjectRepository)(resource_entity_1.Resource)),
    __param(2, (0, typeorm_1.InjectRepository)(wifi_session_entity_1.WifiSession)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], GardenService);
//# sourceMappingURL=garden.service.js.map