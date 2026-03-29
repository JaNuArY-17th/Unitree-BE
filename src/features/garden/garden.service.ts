import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UserTree } from '../../database/entities/user-tree.entity';
import { Tree } from '../../database/entities/tree.entity';
import { UserResource } from '../../database/entities/user-resource.entity';
import { Resource } from '../../database/entities/resource.entity';
import { WifiSession } from '../../database/entities/wifi-session.entity';
import { EconomyLog } from '../../database/entities/economy-log.entity';
import { EconomyUtil } from '../../shared/utils/economy.util';
import { WifiSessionStatus } from '../../shared/constants/enums.constant';

@Injectable()
export class GardenService {
  constructor(
    @InjectRepository(UserTree)
    private readonly userTreeRepository: Repository<UserTree>,
    @InjectRepository(Tree)
    private readonly treeRepository: Repository<Tree>,
    @InjectRepository(UserResource)
    private readonly userResourceRepository: Repository<UserResource>,
    @InjectRepository(Resource)
    private readonly resourceRepository: Repository<Resource>,
    @InjectRepository(WifiSession)
    private readonly wifiSessionRepository: Repository<WifiSession>,
    @InjectRepository(EconomyLog)
    private readonly economyLogRepository: Repository<EconomyLog>,
    private readonly dataSource: DataSource,
  ) {}

  async syncOxygen(userId: string, userTreeId: string) {
    const userTree = await this.userTreeRepository.findOne({
      where: { id: userTreeId, userId },
      relations: ['tree'],
    });

    if (!userTree) {
      throw new NotFoundException('Cây không tồn tại');
    }

    const tree = userTree.tree;
    const now = new Date();

    const activeWifiSession = await this.wifiSessionRepository.findOne({
      where: {
        userId,
        status: WifiSessionStatus.ACTIVE,
      },
    });

    const hasWifiBoost = !!activeWifiSession;
    const lastHeartbeat = activeWifiSession?.lastHeartbeat || null;

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
    const earnedWholeOxygen = Math.floor(oxygenEarned);
    console.log(
      '[sync_oxy] oxygenEarned:',
      oxygenEarned,
      'earnedWholeOxygen:',
      earnedWholeOxygen,
      'tree:',
      tree.name,
      'oxyBase:',
      tree.oxyBase,
      'oxyRate:',
      tree.oxyRate,
    );

    const oxygenResource = await this.findOxygenResource();

    return await this.dataSource.transaction(async (manager) => {
      const userResourceRepo = manager.getRepository(UserResource);
      const userTreeRepo = manager.getRepository(UserTree);
      const economyLogRepo = manager.getRepository(EconomyLog);

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

        // Preserve fractional progress by moving lastHarvestTime only when at least 1 O2 was actually credited.
        userTree.lastHarvestTime = now;
        await userTreeRepo.save(userTree);

        await economyLogRepo.save(
          economyLogRepo.create({
            userId,
            resourceType: oxygenResource.code,
            amount: earnedWholeOxygen,
            source: 'sync_oxy',
          }),
        );
      }

      return {
        userTreeId: userTree.id,
        oxygenEarned: earnedWholeOxygen,
        currentBalance:
          earnedWholeOxygen > 0
            ? userOxygen.balance
            : currentBalance.toString(),
        hasWifiBoost,
        lastHarvestTime: userTree.lastHarvestTime,
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
        oxygenEarned: Math.floor(oxygenEarned),
        isDamaged: true,
      };
    });
  }

  async getActiveWifiSession(userId: string): Promise<WifiSession | null> {
    return this.wifiSessionRepository.findOne({
      where: {
        userId,
        status: WifiSessionStatus.ACTIVE,
      },
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
}
