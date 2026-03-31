import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UserTree } from '../../database/entities/user-tree.entity';
import { UserResource } from '../../database/entities/user-resource.entity';
import { Resource } from '../../database/entities/resource.entity';
import { WifiSession } from '../../database/entities/wifi-session.entity';
import { EconomyLog } from '../../database/entities/economy-log.entity';
import { EconomyUtil } from '../../shared/utils/economy.util';
import { WifiSessionStatus } from '../../shared/constants/enums.constant';

@Injectable()
export class GardenService {
  private readonly fallbackLeafResourceCodes = [
    'GREEN_LEAF',
    'GREEN_LEAVES',
    'LEAF',
    'LEAVES',
    'LA_XANH',
  ];

  constructor(
    @InjectRepository(UserTree)
    private readonly userTreeRepository: Repository<UserTree>,
    @InjectRepository(Resource)
    private readonly resourceRepository: Repository<Resource>,
    @InjectRepository(WifiSession)
    private readonly wifiSessionRepository: Repository<WifiSession>,
    private readonly dataSource: DataSource,
  ) {}

  async syncAllOxygen(userId: string) {
    const userTrees = await this.userTreeRepository.find({
      where: { userId },
      relations: ['tree'],
    });

    const now = new Date();

    const activeWifiSession = await this.wifiSessionRepository.findOne({
      where: {
        userId,
        status: WifiSessionStatus.ACTIVE,
      },
    });

    const hasWifiBoost = !!activeWifiSession;
    const lastHeartbeat = activeWifiSession?.lastHeartbeat || null;

    let earnedWholeOxygen = 0;
    const treesToUpdate: UserTree[] = [];

    for (const userTree of userTrees) {
      const tree = userTree.tree;

      const oxygenEarned = EconomyUtil.calculateOxygenHarvest({
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
      const userResourceRepo = manager.getRepository(UserResource);
      const userTreeRepo = manager.getRepository(UserTree);
      const economyLogRepo = manager.getRepository(EconomyLog);
      const resourceRepo = manager.getRepository(Resource);

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
        userOxygen.balance = (
          currentBalance + BigInt(earnedWholeOxygen)
        ).toString();
        await userResourceRepo.save(userOxygen);

        if (treesToUpdate.length > 0) {
          await userTreeRepo.save(treesToUpdate);
        }

        await economyLogRepo.save(
          economyLogRepo.create({
            userId,
            resourceType: oxygenResource.code,
            amount: earnedWholeOxygen,
            source: 'sync_resources',
          }),
        );
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
        currentBalance:
          earnedWholeOxygen > 0
            ? userOxygen.balance
            : currentBalance.toString(),
        currentLeafBalance,
        hasWifiBoost,
        syncedTreeCount: userTrees.length,
        syncedAt: now,
      };
    });
  }

  async throwBug(
    attackerId: string,
    targetUserId: string,
    attackerTreeId: string,
  ) {
    const attackerTree = await this.userTreeRepository.findOne({
      where: { id: attackerTreeId, userId: attackerId },
      relations: ['tree'],
    });

    if (!attackerTree) {
      throw new NotFoundException('Cây tấn công không tồn tại');
    }

    const targetTrees = await this.userTreeRepository.find({
      where: { userId: targetUserId },
      relations: ['tree'],
    });

    if (targetTrees.length === 0) {
      throw new NotFoundException('Người chơi mục tiêu không có cây');
    }

    const targetTree = targetTrees[0];
    const now = new Date();

    const oxygenEarned = EconomyUtil.calculateOxygenHarvest({
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
      const userResourceRepo = manager.getRepository(UserResource);
      const userTreeRepo = manager.getRepository(UserTree);
      const economyLogRepo = manager.getRepository(EconomyLog);

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
        attackerOxygen.balance = (
          currentBalance + BigInt(Math.floor(oxygenEarned))
        ).toString();
        await userResourceRepo.save(attackerOxygen);

        await economyLogRepo.save(
          economyLogRepo.create({
            userId: attackerId,
            resourceType: oxygenResource.code,
            amount: Math.floor(oxygenEarned),
            source: 'throw_bug',
          }),
        );
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

  private async findOxygenResource(): Promise<Resource> {
    const oxygenCodes = ['OXYGEN', 'OXY', 'O2', 'O2_GENERATED'];

    for (const code of oxygenCodes) {
      const resource = await this.resourceRepository.findOne({
        where: { code },
      });
      if (resource) {
        return resource;
      }
    }

    throw new BadRequestException(
      'Không tìm thấy resource Oxygen. Cần seed resource với code phù hợp.',
    );
  }

  private async findLeafResource(
    repo: Repository<Resource> = this.resourceRepository,
  ): Promise<Resource | null> {
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
}
