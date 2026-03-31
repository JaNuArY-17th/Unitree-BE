import { UpgradeTreeDto } from './dto/upgrade-tree.dto';
import { RepairTreeDto } from './dto/repair-tree.dto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserTree } from '../../database/entities/user-tree.entity';
import { Tree } from '../../database/entities/tree.entity';
import { UnlockTreeDto } from 'src/features/trees/dto/unlock-tree.dto';
import { UserResource } from '../../database/entities/user-resource.entity';
import { Resource } from '../../database/entities/resource.entity';
import { EconomyLog } from '../../database/entities/economy-log.entity';
import { WifiSession } from '../../database/entities/wifi-session.entity';
import { EconomyUtil } from '../../shared/utils/economy.util';
import { WifiSessionStatus } from '../../shared/constants/enums.constant';

@Injectable()
export class TreesService {
  async upgradeTree(userId: string, dto: UpgradeTreeDto): Promise<UserTree> {
    const userTree = await this.userTreeRepository.findOne({
      where: { id: dto.userTreeId, userId },
      relations: ['tree'],
    });
    if (!userTree) {
      throw new NotFoundException('UserTree not found');
    }

    const tree = userTree.tree;
    const nextLevel = userTree.level + 1;

    if (nextLevel > tree.maxLevel) {
      throw new BadRequestException('Cây đã đạt cấp tối đa');
    }

    const now = new Date();

    const activeWifiSession = await this.wifiSessionRepository.findOne({
      where: {
        userId,
        status: WifiSessionStatus.ACTIVE,
      },
    });
    const hasWifiBoost = !!activeWifiSession;

    const oxygenEarned = EconomyUtil.calculateOxygenHarvest({
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
    const reachedEvolutionMilestone =
      nextLevel % 20 === 0 || nextLevel === tree.maxLevel;

    const leafResource = await this.findUpgradeCurrencyResource();
    const oxygenResource = await this.findOxygenResource();

    await this.dataSource.transaction(async (manager) => {
      const userResourceRepo = manager.getRepository(UserResource);
      const userTreeRepo = manager.getRepository(UserTree);
      const economyLogRepo = manager.getRepository(EconomyLog);

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
        throw new BadRequestException('Không đủ Lá Xanh để nâng cấp cây');
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
      userOxygen.balance = (
        oxygenBalance + BigInt(Math.floor(oxygenEarned))
      ).toString();
      await userResourceRepo.save(userOxygen);

      userTree.level = nextLevel;
      userTree.lastHarvestTime = now;
      userTree.upgradeEndTime = undefined;
      if (reachedEvolutionMilestone) {
        const stage = Math.ceil(nextLevel / 20);
        userTree.assetPath = this.buildAssetPath(tree.assetsPath, stage);
      }
      await userTreeRepo.save(userTree);

      await economyLogRepo.save(
        economyLogRepo.create({
          userId,
          resourceType: leafResource.code,
          amount: -upgradeCost,
          source: 'tree_upgrade',
        }),
      );

      if (oxygenEarned > 0) {
        await economyLogRepo.save(
          economyLogRepo.create({
            userId,
            resourceType: oxygenResource.code,
            amount: Math.floor(oxygenEarned),
            source: 'tree_upgrade_harvest',
          }),
        );
      }
    });

    return this.userTreeRepository.findOneOrFail({
      where: { id: dto.userTreeId, userId },
      relations: ['tree'],
    });
  }

  async repairTree(userId: string, dto: RepairTreeDto): Promise<UserTree> {
    const userTree = await this.userTreeRepository.findOne({
      where: { id: dto.userTreeId, userId },
      relations: ['tree'],
    });
    if (!userTree) throw new NotFoundException('UserTree not found');

    if (!userTree.isDamaged) {
      throw new BadRequestException('Cây không bị hư hại');
    }

    const tree = userTree.tree;
    const now = new Date();

    const activeWifiSession = await this.wifiSessionRepository.findOne({
      where: {
        userId,
        status: WifiSessionStatus.ACTIVE,
      },
    });

    const oxygenEarned = EconomyUtil.calculateOxygenHarvest({
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
      const oxygenBalance = BigInt(userOxygen.balance || '0');
      userOxygen.balance = (
        oxygenBalance + BigInt(Math.floor(oxygenEarned))
      ).toString();
      await userResourceRepo.save(userOxygen);

      userTree.isDamaged = false;
      userTree.lastHarvestTime = now;
      await userTreeRepo.save(userTree);

      if (oxygenEarned > 0) {
        await economyLogRepo.save(
          economyLogRepo.create({
            userId,
            resourceType: oxygenResource.code,
            amount: Math.floor(oxygenEarned),
            source: 'tree_repair_harvest',
          }),
        );
      }

      return userTree;
    });
  }

  async getTreeUpgradeStatus(
    userId: string,
    userTreeId: string,
  ): Promise<{
    userTreeId: string;
    level: number;
    maxLevel: number;
    isUpgrading: boolean;
    upgradeEndTime?: Date;
    secondsRemaining: number;
    canUpgrade: boolean;
  }> {
    const userTree = await this.userTreeRepository.findOne({
      where: { id: userTreeId, userId },
      relations: ['tree'],
    });
    if (!userTree) {
      throw new NotFoundException('UserTree not found');
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

  async unlockTree(userId: string, dto: UnlockTreeDto): Promise<UserTree> {
    // Kiểm tra user đã sở hữu cây này chưa
    const existed = await this.userTreeRepository.findOne({
      where: { userId, treeId: dto.treeId },
    });
    if (existed) {
      throw new BadRequestException('User đã sở hữu cây này');
    }
    // Kiểm tra cây có tồn tại không
    const tree = await this.treeRepository.findOne({
      where: { id: dto.treeId },
    });
    if (!tree) {
      throw new BadRequestException('Loại cây không tồn tại');
    }
    // Tạo mới UserTree
    const userTree = this.userTreeRepository.create({
      userId,
      treeId: dto.treeId,
      level: 1,
      isDamaged: false,
      assetPath: this.buildAssetPath(tree.assetsPath, 1),
      lastHarvestTime: new Date(),
      checksum: '', // TODO: generate checksum
    });
    return this.userTreeRepository.save(userTree);
  }
  constructor(
    @InjectRepository(UserTree)
    private readonly userTreeRepository: Repository<UserTree>,
    @InjectRepository(Tree)
    private readonly treeRepository: Repository<Tree>,
    @InjectRepository(Resource)
    private readonly resourceRepository: Repository<Resource>,
    @InjectRepository(WifiSession)
    private readonly wifiSessionRepository: Repository<WifiSession>,
    private readonly dataSource: DataSource,
  ) {}

  async getUserTrees(userId: string): Promise<UserTree[]> {
    await this.completeFinishedUpgradesForUser(userId);

    return this.userTreeRepository.find({
      where: { userId },
      relations: ['tree'],
      order: { createdAt: 'DESC' },
    });
  }

  // Catalog logic: fetch all trees
  async getAllCatalogTrees(): Promise<Tree[]> {
    return this.treeRepository.find({ order: { slotIndex: 'ASC' } });
  }

  async getCatalogTreeById(id: string): Promise<Tree | null> {
    return this.treeRepository.findOne({ where: { id } });
  }

  async getTreeById(treeId: string, userId: string): Promise<UserTree> {
    await this.completeFinishedUpgradesForUser(userId);

    const userTree = await this.userTreeRepository.findOne({
      where: { id: treeId, userId },
      relations: ['tree'],
    });

    if (!userTree) {
      throw new NotFoundException('Tree not found');
    }

    return userTree;
  }

  private calculateUpgradeCost(tree: Tree, level: number): number {
    const rawCost = tree.costBase * Math.pow(Number(tree.costRate), level - 1);
    return Math.max(10, Math.round(rawCost / 10) * 10);
  }

  private async findUpgradeCurrencyResource(): Promise<Resource> {
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

    throw new BadRequestException(
      'Không tìm thấy resource Lá Xanh. Cần seed resource với code phù hợp.',
    );
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

  private buildAssetPath(basePath: string, stage: number): string {
    const normalizedBasePath = basePath.replace(/\.png$/i, '');
    return `${normalizedBasePath}${stage}.png`;
  }
}
