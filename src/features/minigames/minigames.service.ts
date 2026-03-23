import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SpinReward } from '../../database/entities/spin-reward.entity';
import { UserResource } from '../../database/entities/user-resource.entity';
import { EconomyLog } from '../../database/entities/economy-log.entity';
import { Resource } from '../../database/entities/resource.entity';
import { CacheService } from '../../services/cache.service';

@Injectable()
export class MinigamesService {
  private readonly spinRewardsCacheKey = 'minigames:spin:rewards';
  private readonly spinRewardsCacheTtlSeconds = 300;

  constructor(
    @InjectRepository(SpinReward)
    private readonly spinRewardRepo: Repository<SpinReward>,
    @InjectRepository(UserResource)
    private readonly userResourceRepo: Repository<UserResource>,
    @InjectRepository(EconomyLog)
    private readonly economyLogRepo: Repository<EconomyLog>,
    @InjectRepository(Resource)
    private readonly resourceRepo: Repository<Resource>,
    private readonly dataSource: DataSource,
    private readonly cacheService: CacheService,
  ) {}

  async getRewards(): Promise<any> {
    const cachedRewards = await this.cacheService.get<any[]>(
      this.spinRewardsCacheKey,
    );
    if (cachedRewards) {
      return cachedRewards;
    }

    const rewards = await this.spinRewardRepo.find();
    let totalWeight = 0;
    for (const r of rewards) {
      totalWeight += Number(r.dropWeight);
    }

    const rewardList = rewards.map((r) => {
      const percentage =
        totalWeight > 0 ? (Number(r.dropWeight) / totalWeight) * 100 : 0;
      return {
        id: r.id,
        rewardType: r.rewardType,
        rewardAmount: r.rewardAmount,
        dropWeight: Number(r.dropWeight),
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
    return await this.dataSource.transaction(async (manager) => {
      const srRepo = manager.getRepository(SpinReward);
      const urRepo = manager.getRepository(UserResource);
      const resRepo = manager.getRepository(Resource);
      const ecoLogRepo = manager.getRepository(EconomyLog);

      // Fetch user's spins with pessimistic lock
      const userSpins = await urRepo
        .createQueryBuilder('ur')
        .innerJoinAndSelect('ur.resource', 'r')
        .where('ur.userId = :userId', { userId })
        .andWhere('UPPER(r.code) IN (:...codes)', {
          codes: ['SPIN', 'LUOT_QUAY'],
        })
        .setLock('pessimistic_write')
        .getMany();

      const spinItem = userSpins[0];
      const spinCount = spinItem ? Number(spinItem.balance) : 0;

      if (spinCount <= 0) {
        throw new BadRequestException('Bạn đã hết Lượt Quay!');
      }

      // Deduct spin
      spinItem.balance = (spinCount - 1).toString();
      await urRepo.save(spinItem);

      await ecoLogRepo.save(
        ecoLogRepo.create({
          userId,
          resourceType: spinItem.resource.code,
          amount: -1,
          source: 'minigame_spin_fee',
        }),
      );

      // Determine reward via weighted random
      const rewards = await srRepo.find();
      if (rewards.length === 0) {
        throw new BadRequestException('Chưa cấu hình vòng quay!');
      }

      let totalWeight = 0;
      for (const r of rewards) {
        totalWeight += Number(r.dropWeight);
      }

      const randomVal = Math.random() * totalWeight;
      let cumulativeWeight = 0;
      let wonReward: SpinReward = rewards[rewards.length - 1]; // fallback

      for (const r of rewards) {
        cumulativeWeight += Number(r.dropWeight);
        if (randomVal <= cumulativeWeight) {
          wonReward = r;
          break;
        }
      }

      const rewardAmount = wonReward.rewardAmount;
      const isMiss =
        wonReward.rewardType === 'MISS' ||
        wonReward.rewardType === 'NOTHING' ||
        rewardAmount <= 0;

      if (!isMiss) {
        // Find resource config for the reward
        const resourceConfig = await resRepo.findOne({
          where: { code: wonReward.rewardType },
        });

        if (resourceConfig) {
          // Find if user already has this resource, lock it
          let userRewardItem = await urRepo
            .createQueryBuilder('ur')
            .where('ur.userId = :userId', { userId })
            .andWhere('ur.resourceId = :resId', { resId: resourceConfig.id })
            .setLock('pessimistic_write')
            .getOne();

          if (userRewardItem) {
            userRewardItem.balance = (
              Number(userRewardItem.balance) + rewardAmount
            ).toString();
            await urRepo.save(userRewardItem);
          } else {
            userRewardItem = urRepo.create({
              userId,
              resourceId: resourceConfig.id,
              balance: rewardAmount.toString(),
            });
            await urRepo.save(userRewardItem);
          }

          // Log reward economy
          await ecoLogRepo.save(
            ecoLogRepo.create({
              userId,
              resourceType: resourceConfig.code,
              amount: rewardAmount,
              source: 'minigame_spin_reward',
            }),
          );
        }
      }

      return {
        success: true,
        rewardId: wonReward.id,
        rewardType: wonReward.rewardType,
        rewardAmount: wonReward.rewardAmount,
        message: isMiss
          ? 'Rất tiếc, bạn không trúng gì cả. Thử lại nhé!'
          : `Chúc mừng bạn nhận được ${wonReward.rewardAmount} ${wonReward.rewardType}!`,
      };
    });
  }
}
