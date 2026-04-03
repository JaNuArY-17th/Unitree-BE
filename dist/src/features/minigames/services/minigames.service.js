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
exports.MinigamesService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const spin_reward_entity_1 = require("../../../database/entities/spin-reward.entity");
const user_resource_entity_1 = require("../../../database/entities/user-resource.entity");
const economy_log_entity_1 = require("../../../database/entities/economy-log.entity");
const resource_entity_1 = require("../../../database/entities/resource.entity");
const user_game_state_entity_1 = require("../../../database/entities/user-game-state.entity");
const user_tree_entity_1 = require("../../../database/entities/user-tree.entity");
const cache_service_1 = require("../../../services/cache.service");
const resource_code_constant_1 = require("../../../shared/constants/resource-code.constant");
const leaf_spin_reward_util_1 = require("../common/utils/leaf-spin-reward.util");
let MinigamesService = class MinigamesService {
    spinRewardRepo;
    dataSource;
    cacheService;
    configService;
    spinRewardsCacheKey = 'minigames:spin:rewards';
    spinRewardsRuntimeCacheKey = 'minigames:spin:rewards:runtime';
    spinResourceConfigCacheKey = 'minigames:spin:resource-config';
    spinRewardsCacheTtlSeconds = 300;
    spinResourceConfigCacheTtlSeconds = 300;
    instantUseRewardCodes = new Set([
        resource_code_constant_1.ResourceCode.BO_XIT_HOI_NACH,
        resource_code_constant_1.ResourceCode.BAN_TAY_TAY_MAY,
    ]);
    constructor(spinRewardRepo, dataSource, cacheService, configService) {
        this.spinRewardRepo = spinRewardRepo;
        this.dataSource = dataSource;
        this.cacheService = cacheService;
        this.configService = configService;
    }
    async getRewards() {
        const rewards = await this.getSpinRewardsSnapshot();
        let totalWeight = 0;
        for (const r of rewards) {
            totalWeight += r.dropWeight;
        }
        const rewardList = rewards.map((r) => {
            const percentage = totalWeight > 0 ? (r.dropWeight / totalWeight) * 100 : 0;
            return {
                id: r.id,
                rewardType: r.rewardType,
                rewardAmount: r.rewardAmount,
                dropWeight: r.dropWeight,
                dropRatePercent: percentage.toFixed(2) + '%',
            };
        });
        await this.cacheService.set(this.spinRewardsCacheKey, rewardList, this.spinRewardsCacheTtlSeconds);
        return rewardList;
    }
    async playSpin(userId) {
        const rewards = await this.getSpinRewardsSnapshot();
        if (rewards.length === 0) {
            throw new common_1.BadRequestException('Chưa cấu hình vòng quay!');
        }
        return await this.dataSource.transaction(async (manager) => {
            const urRepo = manager.getRepository(user_resource_entity_1.UserResource);
            const resRepo = manager.getRepository(resource_entity_1.Resource);
            const ecoLogRepo = manager.getRepository(economy_log_entity_1.EconomyLog);
            const spinSnapshot = await this.getSpinBalanceSnapshotWithRegen(userId, manager);
            const { spinResource, spinItem } = spinSnapshot;
            const spinCount = spinSnapshot.spinBalance;
            if (spinCount <= 0) {
                throw new common_1.BadRequestException('Bạn đã hết Lượt Quay!');
            }
            spinItem.balance = (spinCount - 1).toString();
            await urRepo.save(spinItem);
            await ecoLogRepo.save(ecoLogRepo.create({
                userId,
                resourceType: spinResource.code,
                amount: -1,
                source: 'minigame_spin_fee',
            }));
            const wonReward = this.pickWeightedReward(rewards);
            const normalizedRewardType = wonReward.rewardType.toUpperCase();
            let rewardAmount = wonReward.rewardAmount;
            let isMiss = normalizedRewardType === 'MISS' ||
                normalizedRewardType === 'NOTHING' ||
                rewardAmount <= 0;
            let requiresTargetSelection = false;
            if (!isMiss) {
                if (normalizedRewardType === resource_code_constant_1.ResourceCode.LA_XANH) {
                    const leafTier = await this.getLeafScalingTier(userId, manager);
                    rewardAmount = (0, leaf_spin_reward_util_1.computeLeafSpinReward)({
                        baseAmount: rewardAmount,
                        tier: leafTier,
                    });
                    if (rewardAmount <= 0) {
                        isMiss = true;
                    }
                }
                if (!isMiss) {
                    if (this.instantUseRewardCodes.has(normalizedRewardType)) {
                        requiresTargetSelection = true;
                        await ecoLogRepo.save(ecoLogRepo.create({
                            userId,
                            resourceType: normalizedRewardType,
                            amount: rewardAmount,
                            source: 'minigame_spin_instant_use',
                        }));
                    }
                    else {
                        const resourceConfig = await resRepo.findOne({
                            where: { code: normalizedRewardType },
                        });
                        if (!resourceConfig) {
                            throw new common_1.BadRequestException(`Không tìm thấy resource cho reward ${normalizedRewardType}`);
                        }
                        if (resourceConfig.id === spinResource.id) {
                            spinItem.balance = (Number(spinItem.balance || '0') + rewardAmount).toString();
                            await urRepo.save(spinItem);
                        }
                        else {
                            let userRewardItem = await urRepo
                                .createQueryBuilder('ur')
                                .where('ur.userId = :userId', { userId })
                                .andWhere('ur.resourceId = :resourceId', {
                                resourceId: resourceConfig.id,
                            })
                                .setLock('pessimistic_write')
                                .getOne();
                            if (!userRewardItem) {
                                userRewardItem = urRepo.create({
                                    userId,
                                    resourceId: resourceConfig.id,
                                    balance: '0',
                                });
                            }
                            userRewardItem.balance = (Number(userRewardItem.balance || '0') + rewardAmount).toString();
                            await urRepo.save(userRewardItem);
                        }
                        await ecoLogRepo.save(ecoLogRepo.create({
                            userId,
                            resourceType: normalizedRewardType,
                            amount: rewardAmount,
                            source: 'minigame_spin_reward',
                        }));
                    }
                }
            }
            return {
                success: true,
                rewardId: wonReward.id,
                rewardType: normalizedRewardType,
                rewardAmount,
                requiresTargetSelection,
                spinBalance: Number(spinItem.balance || '0'),
                message: isMiss
                    ? 'Rất tiếc, bạn không trúng gì cả. Thử lại nhé!'
                    : `Chúc mừng bạn nhận được ${rewardAmount} ${normalizedRewardType}!`,
            };
        });
    }
    async getQuickInventory(userId) {
        return this.dataSource.transaction(async (manager) => {
            const urRepo = manager.getRepository(user_resource_entity_1.UserResource);
            const resRepo = manager.getRepository(resource_entity_1.Resource);
            const { spinBalance } = await this.getSpinBalanceSnapshotWithRegen(userId, manager);
            const mosquitoScreenResource = await resRepo.findOne({
                where: {
                    code: resource_code_constant_1.ResourceCode.MAN_CHUP_TRANH_MUOI,
                },
            });
            if (!mosquitoScreenResource) {
                return {
                    spinBalance,
                    manChupTranhMuoiBalance: 0,
                };
            }
            const mosquitoBalance = await urRepo.findOne({
                where: {
                    userId,
                    resourceId: mosquitoScreenResource.id,
                },
            });
            return {
                spinBalance,
                manChupTranhMuoiBalance: Number(mosquitoBalance?.balance || '0'),
            };
        });
    }
    getSpinRegenIntervalMinutes() {
        const configuredMinutes = this.configService.get('minigame.spinRegenIntervalMinutes') ?? 5;
        return Number.isFinite(configuredMinutes) && configuredMinutes > 0
            ? Math.floor(configuredMinutes)
            : 5;
    }
    async getSpinRewardsSnapshot() {
        const cachedRewards = await this.cacheService.get(this.spinRewardsRuntimeCacheKey);
        if (cachedRewards) {
            return cachedRewards;
        }
        const rewards = await this.spinRewardRepo.find();
        const normalized = rewards.map((reward) => ({
            id: reward.id,
            rewardType: reward.rewardType,
            rewardAmount: reward.rewardAmount,
            dropWeight: Number(reward.dropWeight),
        }));
        await this.cacheService.set(this.spinRewardsRuntimeCacheKey, normalized, this.spinRewardsCacheTtlSeconds);
        return normalized;
    }
    pickWeightedReward(rewards) {
        let totalWeight = 0;
        for (const reward of rewards) {
            totalWeight += reward.dropWeight;
        }
        if (totalWeight <= 0) {
            throw new common_1.BadRequestException('Cấu hình vòng quay không hợp lệ');
        }
        const randomVal = Math.random() * totalWeight;
        let cumulativeWeight = 0;
        for (const reward of rewards) {
            cumulativeWeight += reward.dropWeight;
            if (randomVal <= cumulativeWeight) {
                return reward;
            }
        }
        return rewards[rewards.length - 1];
    }
    async getSpinResourceConfig(resourceRepo) {
        const cachedConfig = await this.cacheService.get(this.spinResourceConfigCacheKey);
        if (cachedConfig) {
            return cachedConfig;
        }
        const spinResource = await resourceRepo
            .createQueryBuilder('resource')
            .where('UPPER(resource.code) IN (:...codes)', {
            codes: ['SPIN', 'SPINS', 'LUOT_QUAY'],
        })
            .orderBy("CASE WHEN UPPER(resource.code) = 'SPIN' THEN 0 WHEN UPPER(resource.code) = 'SPINS' THEN 1 ELSE 2 END", 'ASC')
            .getOne();
        if (!spinResource) {
            throw new common_1.BadRequestException('Không tìm thấy resource SPIN để quay.');
        }
        const config = {
            id: spinResource.id,
            code: spinResource.code,
            maxStack: Number(spinResource.maxStack || 0),
        };
        await this.cacheService.set(this.spinResourceConfigCacheKey, config, this.spinResourceConfigCacheTtlSeconds);
        return config;
    }
    async getSpinBalanceSnapshotWithRegen(userId, manager) {
        const urRepo = manager.getRepository(user_resource_entity_1.UserResource);
        const resRepo = manager.getRepository(resource_entity_1.Resource);
        const gameStateRepo = manager.getRepository(user_game_state_entity_1.UserGameState);
        const spinResource = await this.getSpinResourceConfig(resRepo);
        if (spinResource.maxStack <= 0) {
            throw new common_1.BadRequestException('Cần cấu hình max_stack > 0 cho resource SPIN.');
        }
        let spinItem = await urRepo
            .createQueryBuilder('ur')
            .where('ur.userId = :userId', { userId })
            .andWhere('ur.resourceId = :resourceId', {
            resourceId: spinResource.id,
        })
            .setLock('pessimistic_write')
            .getOne();
        if (!spinItem) {
            spinItem = urRepo.create({
                userId,
                resourceId: spinResource.id,
                balance: '0',
            });
            await urRepo.save(spinItem);
        }
        const now = new Date();
        let gameState = await gameStateRepo
            .createQueryBuilder('state')
            .where('state.userId = :userId', { userId })
            .setLock('pessimistic_write')
            .getOne();
        if (!gameState) {
            gameState = gameStateRepo.create({
                userId,
                lastSpinRegen: now,
            });
        }
        const regenIntervalMs = this.getSpinRegenIntervalMinutes() * 60 * 1000;
        let spinCount = Number(spinItem.balance || '0');
        if (spinCount < spinResource.maxStack) {
            const baseline = gameState.lastSpinRegen ?? now;
            const elapsedMs = now.getTime() - baseline.getTime();
            const regenSteps = Math.floor(elapsedMs / regenIntervalMs);
            if (regenSteps > 0) {
                const canAdd = spinResource.maxStack - spinCount;
                const regenAmount = Math.min(regenSteps, canAdd);
                if (regenAmount > 0) {
                    spinCount += regenAmount;
                    spinItem.balance = spinCount.toString();
                    await urRepo.save(spinItem);
                }
                gameState.lastSpinRegen =
                    spinCount >= spinResource.maxStack
                        ? now
                        : new Date(baseline.getTime() + regenSteps * regenIntervalMs);
            }
        }
        else {
            gameState.lastSpinRegen = now;
        }
        await gameStateRepo.save(gameState);
        return {
            spinResource,
            spinItem,
            spinBalance: spinCount,
        };
    }
    async getLeafScalingTier(userId, manager) {
        const userTreeRepo = manager.getRepository(user_tree_entity_1.UserTree);
        const aggregate = await userTreeRepo
            .createQueryBuilder('ut')
            .select('COALESCE(SUM(ut.level), 0)', 'totalLevel')
            .where('ut.userId = :userId', { userId })
            .getRawOne();
        const totalLevel = Number(aggregate?.totalLevel ?? 0);
        const computedTier = Math.floor(totalLevel / 67);
        return Math.max(0, Math.min(7, computedTier));
    }
};
exports.MinigamesService = MinigamesService;
exports.MinigamesService = MinigamesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(spin_reward_entity_1.SpinReward)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource,
        cache_service_1.CacheService,
        config_1.ConfigService])
], MinigamesService);
//# sourceMappingURL=minigames.service.js.map