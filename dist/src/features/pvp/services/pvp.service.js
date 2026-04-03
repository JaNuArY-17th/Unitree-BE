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
exports.PvpService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_resource_entity_1 = require("../../../database/entities/user-resource.entity");
const user_tree_entity_1 = require("../../../database/entities/user-tree.entity");
const pvp_action_log_entity_1 = require("../../../database/entities/pvp-action-log.entity");
const economy_log_entity_1 = require("../../../database/entities/economy-log.entity");
const user_entity_1 = require("../../../database/entities/user.entity");
const resource_entity_1 = require("../../../database/entities/resource.entity");
const tree_entity_1 = require("../../../database/entities/tree.entity");
const resource_code_constant_1 = require("../../../shared/constants/resource-code.constant");
const tree_code_constant_1 = require("../../../shared/constants/tree-code.constant");
let PvpService = class PvpService {
    userResourceRepo;
    userTreeRepo;
    pvpActionLogRepo;
    economyLogRepo;
    userRepo;
    resourceRepo;
    treeRepo;
    configService;
    dataSource;
    leafResourceCodes = [
        resource_code_constant_1.ResourceCode.LA_XANH,
        'GREEN_LEAF',
        'GREEN_LEAVES',
        'LEAF',
        'LEAVES',
    ];
    constructor(userResourceRepo, userTreeRepo, pvpActionLogRepo, economyLogRepo, userRepo, resourceRepo, treeRepo, configService, dataSource) {
        this.userResourceRepo = userResourceRepo;
        this.userTreeRepo = userTreeRepo;
        this.pvpActionLogRepo = pvpActionLogRepo;
        this.economyLogRepo = economyLogRepo;
        this.userRepo = userRepo;
        this.resourceRepo = resourceRepo;
        this.treeRepo = treeRepo;
        this.configService = configService;
        this.dataSource = dataSource;
    }
    async getAttackTargets(userId) {
        const [snapshots, revengeLog] = await Promise.all([
            this.buildPowerSnapshots(),
            this.pvpActionLogRepo
                .createQueryBuilder('log')
                .where('log.defenderId = :userId', { userId })
                .orderBy('log.createdAt', 'DESC')
                .limit(1)
                .getOne(),
        ]);
        const me = snapshots.find((entry) => entry.userId === userId);
        if (!me) {
            throw new common_1.NotFoundException('Không tìm thấy dữ liệu sức mạnh của người chơi');
        }
        const others = snapshots.filter((entry) => entry.userId !== userId);
        if (others.length === 0) {
            return {
                myScore: me.powerScore,
                targets: [],
            };
        }
        const minRatio = this.getPvpNumberConfig('pvp.matchmakingMinRatio', 0.8);
        const maxRatio = this.getPvpNumberConfig('pvp.matchmakingMaxRatio', 1.2);
        let candidatePool = others.filter((entry) => {
            return (entry.powerScore >= me.powerScore * minRatio &&
                entry.powerScore <= me.powerScore * maxRatio);
        });
        const sortedScores = [...snapshots].sort((a, b) => a.powerScore - b.powerScore);
        const isLowest = sortedScores[0]?.userId === userId;
        const isHighest = sortedScores[sortedScores.length - 1]?.userId === userId;
        if (candidatePool.length === 0) {
            if (isLowest) {
                const lowMaxRatio = this.getPvpNumberConfig('pvp.fallbackLowMaxRatio', 2);
                candidatePool = others.filter((entry) => entry.powerScore <= me.powerScore * lowMaxRatio);
            }
            else if (isHighest) {
                const topMinRatio = this.getPvpNumberConfig('pvp.fallbackTopMinRatio', 0.5);
                candidatePool = others.filter((entry) => entry.powerScore >= me.powerScore * topMinRatio);
            }
            else {
                const globalMinRatio = this.getPvpNumberConfig('pvp.fallbackGlobalMinRatio', 0.5);
                const globalMaxRatio = this.getPvpNumberConfig('pvp.fallbackGlobalMaxRatio', 2);
                candidatePool = others.filter((entry) => {
                    return (entry.powerScore >= me.powerScore * globalMinRatio &&
                        entry.powerScore <= me.powerScore * globalMaxRatio);
                });
            }
        }
        let usedClosestFallback = false;
        if (candidatePool.length === 0) {
            candidatePool = this.pickClosestTargets(others, me.powerScore);
            usedClosestFallback = true;
        }
        const revengeTargetId = await this.resolveRevengeTargetId(userId, revengeLog);
        const lastAttackerId = revengeLog?.attackerId ?? null;
        const excludeAttackerId = revengeTargetId ?? lastAttackerId;
        const revengeTarget = revengeTargetId
            ? snapshots.find((entry) => entry.userId === revengeTargetId)
            : undefined;
        const regularTargetCount = this.getPvpNumberConfig('pvp.regularTargetCount', 4);
        const regularCandidates = candidatePool.filter((entry) => entry.userId !== excludeAttackerId);
        if (regularCandidates.length < regularTargetCount) {
            const fallbackCandidates = this.pickClosestTargets(others.filter((entry) => entry.userId !== excludeAttackerId), me.powerScore);
            const existingIds = new Set(regularCandidates.map((entry) => entry.userId));
            for (const entry of fallbackCandidates) {
                if (!existingIds.has(entry.userId)) {
                    regularCandidates.push(entry);
                    existingIds.add(entry.userId);
                }
            }
        }
        const regularSource = usedClosestFallback
            ? regularCandidates
            : this.shuffleArray(regularCandidates);
        const pickedRegular = regularSource.slice(0, regularTargetCount);
        const selected = revengeTarget
            ? [revengeTarget, ...pickedRegular]
            : pickedRegular;
        if (selected.length === 0) {
            return {
                myScore: me.powerScore,
                targets: [],
            };
        }
        return {
            myScore: me.powerScore,
            targets: selected.map((entry) => ({
                userId: entry.userId,
                username: entry.username,
                avatarUrl: entry.avatarUrl,
                powerScore: this.roundScore(entry.powerScore),
                primaryTreeId: entry.primaryTreeId,
                passiveBlockChance: this.roundChance(entry.passiveBlockChance),
                hasShield: entry.hasShield,
                isBaoThu: revengeTargetId != null && entry.userId === revengeTargetId,
            })),
        };
    }
    async getHistory(userId, requestedLimit) {
        const defaultLimit = this.getPvpNumberConfig('pvp.historyDefaultLimit', 30);
        const maxLimit = this.getPvpNumberConfig('pvp.historyMaxLimit', 100);
        const normalizedLimit = Math.max(1, Math.min(maxLimit, requestedLimit ?? defaultLimit));
        const logs = await this.pvpActionLogRepo
            .createQueryBuilder('log')
            .leftJoinAndSelect('log.attacker', 'attacker')
            .leftJoinAndSelect('log.defender', 'defender')
            .where('log.attackerId = :userId OR log.defenderId = :userId', { userId })
            .orderBy('log.createdAt', 'DESC')
            .limit(normalizedLimit)
            .getMany();
        return {
            total: logs.length,
            items: logs.map((entry) => {
                const direction = entry.attackerId === userId ? 'ATTACKED' : 'DEFENDED';
                const revengeTargetUserId = direction === 'ATTACKED' ? entry.defenderId : entry.attackerId;
                return {
                    id: entry.id,
                    actionType: entry.actionType,
                    direction,
                    wasBlocked: entry.wasBlocked,
                    stolenAmount: entry.stolenAmount ?? 0,
                    createdAt: entry.createdAt,
                    attacker: {
                        userId: entry.attackerId,
                        username: entry.attacker?.username ?? 'Unknown',
                        avatarUrl: entry.attacker?.avatar ?? '',
                    },
                    defender: {
                        userId: entry.defenderId,
                        username: entry.defender?.username ?? 'Unknown',
                        avatarUrl: entry.defender?.avatar ?? '',
                    },
                    targetTreeId: entry.targetTreeId,
                    revengeTargetUserId,
                };
            }),
        };
    }
    async raid(userId, dto) {
        if (userId === dto.targetUserId) {
            throw new common_1.BadRequestException('Không thể tự cướp Lá của chính mình');
        }
        return this.dataSource.transaction(async (manager) => {
            const urRepo = manager.getRepository(user_resource_entity_1.UserResource);
            const ecoLogRepo = manager.getRepository(economy_log_entity_1.EconomyLog);
            const actionLogRepo = manager.getRepository(pvp_action_log_entity_1.PvpActionLog);
            const leafResource = await this.findFirstResourceByCodes(manager, this.leafResourceCodes);
            if (!leafResource) {
                throw new common_1.BadRequestException('Không tìm thấy resource Lá Xanh để xử lý cướp');
            }
            const defense = await this.resolveDefense(manager, dto.targetUserId, 'RAID');
            if (defense.wasBlocked) {
                await actionLogRepo.save(actionLogRepo.create({
                    attackerId: userId,
                    defenderId: dto.targetUserId,
                    actionType: 'RAID',
                    wasBlocked: true,
                    stolenAmount: 0,
                }));
                await this.tryUnlockOtGrinini(manager, dto.targetUserId);
                return {
                    success: true,
                    wasBlocked: true,
                    defenseSource: defense.source,
                    stolenLeafAmount: 0,
                    selectedBoxes: [],
                    message: defense.message ?? 'Đòn cướp bị chặn.',
                };
            }
            const defenderLeaf = await urRepo
                .createQueryBuilder('ur')
                .where('ur.userId = :userId', { userId: dto.targetUserId })
                .andWhere('ur.resourceId = :resourceId', {
                resourceId: leafResource.id,
            })
                .setLock('pessimistic_write')
                .getOne();
            const defenderBalanceBefore = BigInt(defenderLeaf?.balance ?? '0');
            if (defenderBalanceBefore <= 0n) {
                await actionLogRepo.save(actionLogRepo.create({
                    attackerId: userId,
                    defenderId: dto.targetUserId,
                    actionType: 'RAID',
                    wasBlocked: false,
                    stolenAmount: 0,
                }));
                await this.tryUnlockOtGrinini(manager, dto.targetUserId);
                return {
                    success: true,
                    wasBlocked: false,
                    stolenLeafAmount: 0,
                    selectedBoxes: [],
                    message: 'Mục tiêu không còn Lá Xanh để cướp.',
                };
            }
            const selection = this.resolveRaidSelection(defenderBalanceBefore, dto.selectedBoxIndexes);
            const selectedBoxes = selection.selectedBoxes;
            let stolenAmount = selection.stolenAmount;
            stolenAmount = Math.max(0, Math.min(stolenAmount, Number(defenderBalanceBefore)));
            if (stolenAmount > 0) {
                const stolenBigInt = BigInt(stolenAmount);
                if (defenderLeaf) {
                    defenderLeaf.balance = (defenderBalanceBefore - stolenBigInt).toString();
                    await urRepo.save(defenderLeaf);
                }
                let attackerLeaf = await urRepo
                    .createQueryBuilder('ur')
                    .where('ur.userId = :userId', { userId })
                    .andWhere('ur.resourceId = :resourceId', {
                    resourceId: leafResource.id,
                })
                    .setLock('pessimistic_write')
                    .getOne();
                if (!attackerLeaf) {
                    attackerLeaf = urRepo.create({
                        userId,
                        resourceId: leafResource.id,
                        balance: '0',
                    });
                }
                const attackerBefore = BigInt(attackerLeaf.balance ?? '0');
                attackerLeaf.balance = (attackerBefore + stolenBigInt).toString();
                await urRepo.save(attackerLeaf);
                await ecoLogRepo.save(ecoLogRepo.create({
                    userId: dto.targetUserId,
                    resourceType: leafResource.code,
                    amount: -stolenAmount,
                    source: 'pvp_raid_leaf_lost',
                }));
                await ecoLogRepo.save(ecoLogRepo.create({
                    userId,
                    resourceType: leafResource.code,
                    amount: stolenAmount,
                    source: 'pvp_raid_leaf_reward',
                }));
            }
            await actionLogRepo.save(actionLogRepo.create({
                attackerId: userId,
                defenderId: dto.targetUserId,
                actionType: 'RAID',
                wasBlocked: false,
                stolenAmount,
            }));
            await this.tryUnlockOtGrinini(manager, dto.targetUserId);
            return {
                success: true,
                wasBlocked: false,
                stolenLeafAmount: stolenAmount,
                selectedBoxes,
                message: stolenAmount > 0
                    ? `Cướp thành công ${stolenAmount} Lá Xanh!`
                    : 'Đã chọn trúng các hộp rỗng.',
            };
        });
    }
    async attack(userId, dto) {
        return this.dataSource.transaction(async (manager) => {
            const targetTree = await manager.getRepository(user_tree_entity_1.UserTree).findOne({
                where: { id: dto.targetUserTreeId },
                relations: ['tree'],
                lock: { mode: 'pessimistic_write' },
            });
            if (!targetTree) {
                throw new common_1.NotFoundException('Không tìm thấy cây mục tiêu');
            }
            if (targetTree.userId === userId) {
                throw new common_1.BadRequestException('Không thể phá hoại cây của chính mình');
            }
            if (targetTree.isDamaged) {
                throw new common_1.BadRequestException('Cây mục tiêu đã bị hỏng');
            }
            const defense = await this.resolveDefense(manager, targetTree.userId, 'ATTACK');
            if (defense.wasBlocked) {
                await manager.getRepository(pvp_action_log_entity_1.PvpActionLog).save(manager.getRepository(pvp_action_log_entity_1.PvpActionLog).create({
                    attackerId: userId,
                    defenderId: targetTree.userId,
                    actionType: 'ATTACK',
                    targetTreeId: targetTree.id,
                    wasBlocked: true,
                    stolenAmount: 0,
                }));
                await this.tryUnlockOtGrinini(manager, targetTree.userId);
                return {
                    success: true,
                    wasBlocked: true,
                    defenseSource: defense.source,
                    targetUserTreeId: targetTree.id,
                    message: defense.message ?? 'Đòn phá hoại đã bị chặn.',
                };
            }
            const now = new Date();
            targetTree.isDamaged = true;
            targetTree.damagedAt = now;
            targetTree.lastHarvestTime = now;
            await manager.getRepository(user_tree_entity_1.UserTree).save(targetTree);
            await manager.getRepository(pvp_action_log_entity_1.PvpActionLog).save(manager.getRepository(pvp_action_log_entity_1.PvpActionLog).create({
                attackerId: userId,
                defenderId: targetTree.userId,
                actionType: 'ATTACK',
                targetTreeId: targetTree.id,
                wasBlocked: false,
                stolenAmount: 0,
            }));
            await this.tryUnlockOtGrinini(manager, targetTree.userId);
            return {
                success: true,
                wasBlocked: false,
                targetUserTreeId: targetTree.id,
                message: 'Phá hoại thành công. Cây mục tiêu giảm 50% sản lượng cho tới khi sửa.',
            };
        });
    }
    async resolveDefense(manager, defenderId, actionType) {
        const passiveChance = await this.getPassiveBlockChance(manager, defenderId);
        const passiveCap = this.getPvpNumberConfig('pvp.passiveBlockMaxChance', 0.2);
        const effectivePassiveChance = Math.min(passiveChance, passiveCap);
        if (effectivePassiveChance > 0 && Math.random() < effectivePassiveChance) {
            return {
                wasBlocked: true,
                source: 'OT_GRININI_PASSIVE',
                message: actionType === 'RAID'
                    ? '[Lá Chắn Xanh] chặn đòn cướp.'
                    : '[Lá Chắn Xanh] chặn đòn phá hoại.',
            };
        }
        const shieldUsed = await this.tryConsumeMosquitoShield(manager, defenderId);
        if (shieldUsed) {
            return {
                wasBlocked: true,
                source: 'MAN_CHUP_TRANH_MUOI',
                message: 'Mục tiêu đang được bảo vệ bởi MAN_CHUP_TRANH_MUOI.',
            };
        }
        return { wasBlocked: false };
    }
    async tryConsumeMosquitoShield(manager, userId) {
        const shieldItem = await manager
            .getRepository(user_resource_entity_1.UserResource)
            .createQueryBuilder('ur')
            .innerJoinAndSelect('ur.resource', 'resource')
            .where('ur.userId = :userId', { userId })
            .andWhere('UPPER(resource.code) = :resourceCode', {
            resourceCode: resource_code_constant_1.ResourceCode.MAN_CHUP_TRANH_MUOI,
        })
            .setLock('pessimistic_write')
            .getOne();
        const shieldBalance = Number(shieldItem?.balance ?? '0');
        if (!shieldItem || shieldBalance <= 0) {
            return false;
        }
        shieldItem.balance = (shieldBalance - 1).toString();
        await manager.getRepository(user_resource_entity_1.UserResource).save(shieldItem);
        await manager.getRepository(economy_log_entity_1.EconomyLog).save(manager.getRepository(economy_log_entity_1.EconomyLog).create({
            userId,
            resourceType: resource_code_constant_1.ResourceCode.MAN_CHUP_TRANH_MUOI,
            amount: -1,
            source: 'pvp_defense_consume',
        }));
        return true;
    }
    async getPassiveBlockChance(manager, userId) {
        const treeRepo = manager.getRepository(user_tree_entity_1.UserTree);
        const passiveTree = await treeRepo
            .createQueryBuilder('userTree')
            .innerJoinAndSelect('userTree.tree', 'tree')
            .where('userTree.userId = :userId', { userId })
            .andWhere('UPPER(tree.code) = :treeCode', {
            treeCode: tree_code_constant_1.TreeCode.OT_GRININI,
        })
            .orderBy('userTree.level', 'DESC')
            .getOne();
        if (!passiveTree) {
            return 0;
        }
        const perkBase = Number(passiveTree.tree.perkBase ?? 0);
        const perkStep = Number(passiveTree.tree.perkStep ?? 0);
        const rawPerk = perkBase + perkStep * Math.max(0, passiveTree.level - 1);
        if (!Number.isFinite(rawPerk)) {
            return 0;
        }
        return Math.max(0, rawPerk);
    }
    async tryUnlockOtGrinini(manager, defenderId) {
        const requiredDefenseCount = this.getPvpNumberConfig('pvp.otGrininiUnlockDefenseCount', 20);
        const defenseCount = await manager.getRepository(pvp_action_log_entity_1.PvpActionLog).count({
            where: {
                defenderId,
            },
        });
        if (defenseCount < requiredDefenseCount) {
            return;
        }
        const otGrininiTree = await manager.getRepository(tree_entity_1.Tree).findOne({
            where: { code: tree_code_constant_1.TreeCode.OT_GRININI },
        });
        if (!otGrininiTree) {
            return;
        }
        const existing = await manager.getRepository(user_tree_entity_1.UserTree).findOne({
            where: {
                userId: defenderId,
                treeId: otGrininiTree.id,
            },
        });
        if (existing) {
            return;
        }
        const newTree = manager.getRepository(user_tree_entity_1.UserTree).create({
            userId: defenderId,
            treeId: otGrininiTree.id,
            level: 1,
            isDamaged: false,
            assetPath: this.buildAssetPath(otGrininiTree.assetsPath, 1),
            lastHarvestTime: new Date(),
            checksum: '',
        });
        await manager.getRepository(user_tree_entity_1.UserTree).save(newTree);
    }
    async buildPowerSnapshots() {
        const [users, userTrees, shieldResources] = await Promise.all([
            this.userRepo.find(),
            this.userTreeRepo.find({ relations: ['tree'] }),
            this.userResourceRepo
                .createQueryBuilder('ur')
                .innerJoinAndSelect('ur.resource', 'resource')
                .where('UPPER(resource.code) = :code', {
                code: resource_code_constant_1.ResourceCode.MAN_CHUP_TRANH_MUOI,
            })
                .getMany(),
        ]);
        const treesByUser = new Map();
        for (const userTree of userTrees) {
            const existing = treesByUser.get(userTree.userId) ?? [];
            existing.push(userTree);
            treesByUser.set(userTree.userId, existing);
        }
        const shieldByUser = new Map();
        for (const item of shieldResources) {
            shieldByUser.set(item.userId, Number(item.balance ?? '0') > 0);
        }
        return users.map((user) => {
            const ownedTrees = treesByUser.get(user.id) ?? [];
            const totalTreeLevel = ownedTrees.reduce((sum, tree) => sum + tree.level, 0);
            const oxyPerHour = ownedTrees.reduce((sum, tree) => sum + this.computeTreeOxyPerHour(tree), 0);
            const powerScore = totalTreeLevel * 10 + oxyPerHour / 1000;
            const primaryTree = [...ownedTrees]
                .sort((a, b) => b.level - a.level)
                .find((tree) => !tree.isDamaged);
            const passiveTree = [...ownedTrees]
                .filter((tree) => tree.tree?.code?.toUpperCase() === tree_code_constant_1.TreeCode.OT_GRININI)
                .sort((a, b) => b.level - a.level)[0];
            const passiveBlockChance = passiveTree
                ? Math.max(0, Number(passiveTree.tree.perkBase ?? 0) +
                    Number(passiveTree.tree.perkStep ?? 0) *
                        Math.max(0, passiveTree.level - 1))
                : 0;
            const cappedPassiveChance = Math.min(passiveBlockChance, this.getPvpNumberConfig('pvp.passiveBlockMaxChance', 0.2));
            const hasShield = shieldByUser.get(user.id) ?? false;
            const defenseScore = cappedPassiveChance + (hasShield ? 1 : 0);
            return {
                userId: user.id,
                username: user.username,
                avatarUrl: user.avatar ?? '',
                powerScore,
                oxyPerHour,
                totalTreeLevel,
                primaryTreeId: primaryTree?.id ?? null,
                passiveBlockChance: cappedPassiveChance,
                hasShield,
                defenseScore,
            };
        });
    }
    async resolveRevengeTargetId(userId, revengeLog) {
        if (!revengeLog?.attackerId) {
            return null;
        }
        const revengeUsed = await this.pvpActionLogRepo
            .createQueryBuilder('log')
            .where('log.attackerId = :userId', { userId })
            .andWhere('log.defenderId = :defenderId', {
            defenderId: revengeLog.attackerId,
        })
            .andWhere('log.createdAt > :after', { after: revengeLog.createdAt })
            .limit(1)
            .getOne();
        return revengeUsed ? null : revengeLog.attackerId;
    }
    pickClosestTargets(candidates, referenceScore) {
        return [...candidates].sort((a, b) => {
            const diffA = Math.abs(a.powerScore - referenceScore);
            const diffB = Math.abs(b.powerScore - referenceScore);
            return diffA - diffB;
        });
    }
    computeTreeOxyPerHour(userTree) {
        const tree = userTree.tree;
        if (!tree) {
            return 0;
        }
        if ((tree.treeType ?? '').toUpperCase() !== 'PRODUCTION') {
            return 0;
        }
        const oxyBase = Number(tree.oxyBase ?? 0);
        const oxyRate = Number(tree.oxyRate ?? 1);
        if (!Number.isFinite(oxyBase) ||
            !Number.isFinite(oxyRate) ||
            oxyBase <= 0) {
            return 0;
        }
        let oxy = oxyBase * Math.pow(oxyRate, Math.max(0, userTree.level - 1));
        if (userTree.isDamaged) {
            oxy *= 0.5;
        }
        if (!Number.isFinite(oxy) || oxy <= 0) {
            return 0;
        }
        return Math.round(oxy);
    }
    async findFirstResourceByCodes(manager, codes) {
        for (const code of codes) {
            const resource = await manager.getRepository(resource_entity_1.Resource).findOne({
                where: { code },
            });
            if (resource) {
                return resource;
            }
        }
        return null;
    }
    pickRandomDistinctIndexes(maxExclusive, count) {
        const indexes = Array.from({ length: maxExclusive }, (_, idx) => idx);
        for (let i = indexes.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = indexes[i];
            indexes[i] = indexes[j];
            indexes[j] = tmp;
        }
        return indexes.slice(0, Math.min(count, maxExclusive));
    }
    resolveRaidSelection(defenderBalance, selectedBoxIndexes) {
        const raidBoxPercents = [15, 10, 5, 0];
        const shuffledPercents = this.shuffleArray(raidBoxPercents);
        const normalizedSelection = this.normalizeSelectedBoxIndexes(selectedBoxIndexes);
        const selectedIndexes = normalizedSelection.length > 0
            ? normalizedSelection.map((box) => box - 1)
            : this.pickRandomDistinctIndexes(raidBoxPercents.length, 3);
        const selectedBoxes = selectedIndexes.map((index) => {
            const percent = shuffledPercents[index];
            const amount = Number((defenderBalance * BigInt(percent)) / 100n);
            return {
                boxIndex: index + 1,
                percent,
                amount,
            };
        });
        let stolenAmount = selectedBoxes.reduce((sum, box) => sum + box.amount, 0);
        stolenAmount = Math.max(0, Math.min(stolenAmount, Number(defenderBalance)));
        return { selectedBoxes, stolenAmount };
    }
    normalizeSelectedBoxIndexes(selectedBoxIndexes) {
        const raw = selectedBoxIndexes?.length ? selectedBoxIndexes : [];
        const unique = new Set();
        for (const value of raw) {
            if (Number.isInteger(value) && value >= 1 && value <= 4) {
                unique.add(value);
            }
            if (unique.size >= 3) {
                break;
            }
        }
        return Array.from(unique);
    }
    shuffleArray(items) {
        const array = [...items];
        for (let i = array.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = array[i];
            array[i] = array[j];
            array[j] = tmp;
        }
        return array;
    }
    buildAssetPath(basePath, stage) {
        if (!basePath) {
            return undefined;
        }
        const normalizedBasePath = basePath.replace(/\.png$/i, '');
        return `${normalizedBasePath}${stage}.png`;
    }
    getPvpNumberConfig(path, fallback) {
        const configured = this.configService.get(path);
        return Number.isFinite(configured) ? Number(configured) : fallback;
    }
    roundScore(score) {
        return Math.round(score * 100) / 100;
    }
    roundChance(chance) {
        return Math.round(chance * 10000) / 10000;
    }
};
exports.PvpService = PvpService;
exports.PvpService = PvpService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_resource_entity_1.UserResource)),
    __param(1, (0, typeorm_1.InjectRepository)(user_tree_entity_1.UserTree)),
    __param(2, (0, typeorm_1.InjectRepository)(pvp_action_log_entity_1.PvpActionLog)),
    __param(3, (0, typeorm_1.InjectRepository)(economy_log_entity_1.EconomyLog)),
    __param(4, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(5, (0, typeorm_1.InjectRepository)(resource_entity_1.Resource)),
    __param(6, (0, typeorm_1.InjectRepository)(tree_entity_1.Tree)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService,
        typeorm_2.DataSource])
], PvpService);
//# sourceMappingURL=pvp.service.js.map