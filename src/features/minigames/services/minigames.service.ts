import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { SpinReward } from '../../../database/entities/spin-reward.entity';
import { UserResource } from '../../../database/entities/user-resource.entity';
import { EconomyLog } from '../../../database/entities/economy-log.entity';
import { Resource } from '../../../database/entities/resource.entity';
import { UserGameState } from '../../../database/entities/user-game-state.entity';
import { UserTree } from '../../../database/entities/user-tree.entity';
import { CacheService } from '../../../services/cache.service';
import { ResourceCode } from '../../../shared/constants/resource-code.constant';
import { computeLeafSpinReward } from '../common/utils/leaf-spin-reward.util';

type SpinRewardSnapshot = {
  id: number;
  rewardType: string;
  rewardAmount: number;
  dropWeight: number;
};

type SpinResourceConfig = {
  id: string;
  code: string;
  maxStack: number;
};

type SpinBalanceSnapshot = {
  spinResource: SpinResourceConfig;
  spinItem: UserResource;
  spinBalance: number;
};

@Injectable()
export class MinigamesService {
  private readonly spinRewardsCacheKey = 'minigames:spin:rewards';
  private readonly spinRewardsRuntimeCacheKey =
    'minigames:spin:rewards:runtime';
  private readonly spinResourceConfigCacheKey =
    'minigames:spin:resource-config';
  private readonly spinRewardsCacheTtlSeconds = 300;
  private readonly spinResourceConfigCacheTtlSeconds = 300;
  private readonly instantUseRewardCodes = new Set<string>([
    ResourceCode.BO_XIT_HOI_NACH,
    ResourceCode.BAN_TAY_TAY_MAY,
  ]);

  constructor(
    @InjectRepository(SpinReward)
    private readonly spinRewardRepo: Repository<SpinReward>,
    private readonly dataSource: DataSource,
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
  ) {}

  async getRewards(): Promise<any> {
    const rewards = await this.getSpinRewardsSnapshot();
    let totalWeight = 0;
    for (const r of rewards) {
      totalWeight += r.dropWeight;
    }

    const rewardList = rewards.map((r) => {
      const percentage =
        totalWeight > 0 ? (r.dropWeight / totalWeight) * 100 : 0;
      return {
        id: r.id,
        rewardType: r.rewardType,
        rewardAmount: r.rewardAmount,
        dropWeight: r.dropWeight,
        dropRatePercent: percentage.toFixed(2) + '%',
      };
    });

    await this.cacheService.set(
      this.spinRewardsCacheKey,
      rewardList,
      this.spinRewardsCacheTtlSeconds,
    );

    return rewardList;
  }

  async playSpin(userId: string): Promise<any> {
    const rewards = await this.getSpinRewardsSnapshot();
    if (rewards.length === 0) {
      throw new BadRequestException('Chưa cấu hình vòng quay!');
    }

    return await this.dataSource.transaction(async (manager) => {
      const urRepo = manager.getRepository(UserResource);
      const resRepo = manager.getRepository(Resource);
      const ecoLogRepo = manager.getRepository(EconomyLog);
      const spinSnapshot = await this.getSpinBalanceSnapshotWithRegen(
        userId,
        manager,
      );
      const { spinResource, spinItem } = spinSnapshot;
      const spinCount = spinSnapshot.spinBalance;

      if (spinCount <= 0) {
        throw new BadRequestException('Bạn đã hết Lượt Quay!');
      }

      spinItem.balance = (spinCount - 1).toString();
      await urRepo.save(spinItem);

      await ecoLogRepo.save(
        ecoLogRepo.create({
          userId,
          resourceType: spinResource.code,
          amount: -1,
          source: 'minigame_spin_fee',
        }),
      );

      const wonReward = this.pickWeightedReward(rewards);
      const normalizedRewardType = wonReward.rewardType.toUpperCase();
      let rewardAmount = wonReward.rewardAmount;
      let isMiss =
        normalizedRewardType === 'MISS' ||
        normalizedRewardType === 'NOTHING' ||
        rewardAmount <= 0;
      let requiresTargetSelection = false;

      if (!isMiss) {
        if (normalizedRewardType === ResourceCode.LA_XANH) {
          const leafTier = await this.getLeafScalingTier(userId, manager);
          rewardAmount = computeLeafSpinReward({
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
            await ecoLogRepo.save(
              ecoLogRepo.create({
                userId,
                resourceType: normalizedRewardType,
                amount: rewardAmount,
                source: 'minigame_spin_instant_use',
              }),
            );
          } else {
            const resourceConfig = await resRepo.findOne({
              where: { code: normalizedRewardType },
            });

            if (!resourceConfig) {
              throw new BadRequestException(
                `Không tìm thấy resource cho reward ${normalizedRewardType}`,
              );
            }

            if (resourceConfig.id === spinResource.id) {
              spinItem.balance = (
                Number(spinItem.balance || '0') + rewardAmount
              ).toString();
              await urRepo.save(spinItem);
            } else {
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

              userRewardItem.balance = (
                Number(userRewardItem.balance || '0') + rewardAmount
              ).toString();
              await urRepo.save(userRewardItem);
            }

            await ecoLogRepo.save(
              ecoLogRepo.create({
                userId,
                resourceType: normalizedRewardType,
                amount: rewardAmount,
                source: 'minigame_spin_reward',
              }),
            );
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

  async getQuickInventory(userId: string): Promise<{
    spinBalance: number;
    manChupTranhMuoiBalance: number;
  }> {
    return this.dataSource.transaction(async (manager) => {
      const urRepo = manager.getRepository(UserResource);
      const resRepo = manager.getRepository(Resource);

      const { spinBalance } = await this.getSpinBalanceSnapshotWithRegen(
        userId,
        manager,
      );

      const mosquitoScreenResource = await resRepo.findOne({
        where: {
          code: ResourceCode.MAN_CHUP_TRANH_MUOI,
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

  private getSpinRegenIntervalMinutes(): number {
    const configuredMinutes =
      this.configService.get<number>('minigame.spinRegenIntervalMinutes') ?? 5;

    return Number.isFinite(configuredMinutes) && configuredMinutes > 0
      ? Math.floor(configuredMinutes)
      : 5;
  }

  private async getSpinRewardsSnapshot(): Promise<SpinRewardSnapshot[]> {
    const cachedRewards = await this.cacheService.get<SpinRewardSnapshot[]>(
      this.spinRewardsRuntimeCacheKey,
    );

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

    await this.cacheService.set(
      this.spinRewardsRuntimeCacheKey,
      normalized,
      this.spinRewardsCacheTtlSeconds,
    );

    return normalized;
  }

  private pickWeightedReward(
    rewards: SpinRewardSnapshot[],
  ): SpinRewardSnapshot {
    let totalWeight = 0;
    for (const reward of rewards) {
      totalWeight += reward.dropWeight;
    }

    if (totalWeight <= 0) {
      throw new BadRequestException('Cấu hình vòng quay không hợp lệ');
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

  private async getSpinResourceConfig(
    resourceRepo: Repository<Resource>,
  ): Promise<SpinResourceConfig> {
    const cachedConfig = await this.cacheService.get<SpinResourceConfig>(
      this.spinResourceConfigCacheKey,
    );

    if (cachedConfig) {
      return cachedConfig;
    }

    const spinResource = await resourceRepo
      .createQueryBuilder('resource')
      .where('UPPER(resource.code) IN (:...codes)', {
        codes: ['SPIN', 'SPINS', 'LUOT_QUAY'],
      })
      .orderBy(
        "CASE WHEN UPPER(resource.code) = 'SPIN' THEN 0 WHEN UPPER(resource.code) = 'SPINS' THEN 1 ELSE 2 END",
        'ASC',
      )
      .getOne();

    if (!spinResource) {
      throw new BadRequestException('Không tìm thấy resource SPIN để quay.');
    }

    const config: SpinResourceConfig = {
      id: spinResource.id,
      code: spinResource.code,
      maxStack: Number(spinResource.maxStack || 0),
    };

    await this.cacheService.set(
      this.spinResourceConfigCacheKey,
      config,
      this.spinResourceConfigCacheTtlSeconds,
    );

    return config;
  }

  private async getSpinBalanceSnapshotWithRegen(
    userId: string,
    manager: EntityManager,
  ): Promise<SpinBalanceSnapshot> {
    const urRepo = manager.getRepository(UserResource);
    const resRepo = manager.getRepository(Resource);
    const gameStateRepo = manager.getRepository(UserGameState);

    const spinResource = await this.getSpinResourceConfig(resRepo);
    if (spinResource.maxStack <= 0) {
      throw new BadRequestException(
        'Cần cấu hình max_stack > 0 cho resource SPIN.',
      );
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
    } else {
      gameState.lastSpinRegen = now;
    }

    await gameStateRepo.save(gameState);

    return {
      spinResource,
      spinItem,
      spinBalance: spinCount,
    };
  }

  private async getLeafScalingTier(
    userId: string,
    manager: EntityManager,
  ): Promise<number> {
    const userTreeRepo = manager.getRepository(UserTree);

    const aggregate = await userTreeRepo
      .createQueryBuilder('ut')
      .select('COALESCE(SUM(ut.level), 0)', 'totalLevel')
      .where('ut.userId = :userId', { userId })
      .getRawOne<{ totalLevel: string | number | null }>();

    const totalLevel = Number(aggregate?.totalLevel ?? 0);
    const computedTier = Math.floor(totalLevel / 67);

    return Math.max(0, Math.min(7, computedTier));
  }
}
