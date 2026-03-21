import { UpgradeTreeDto } from './dto/upgrade-tree.dto';
import { RepairTreeDto } from './dto/repair-tree.dto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThanOrEqual, Repository } from 'typeorm';
import { UserTree } from '../../database/entities/user-tree.entity';
import { Tree } from '../../database/entities/tree.entity';
import { UnlockTreeDto } from 'src/features/trees/dto/unlock-tree.dto';
import { UserResource } from '../../database/entities/user-resource.entity';
import { Resource } from '../../database/entities/resource.entity';
import { EconomyLog } from '../../database/entities/economy-log.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TreesService {
  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleUpgradeCompletionScheduler(): Promise<void> {
    await this.completeFinishedUpgrades();
  }

  async upgradeTree(userId: string, dto: UpgradeTreeDto): Promise<UserTree> {
    await this.completeFinishedUpgradesForUser(userId);

    const userTree = await this.userTreeRepository.findOne({
      where: { id: dto.userTreeId, userId },
      relations: ['tree'],
    });
    if (!userTree) {
      throw new NotFoundException('UserTree not found');
    }

    if (userTree.upgradeEndTime && userTree.upgradeEndTime > new Date()) {
      throw new BadRequestException('Cây đang trong quá trình nâng cấp');
    }

    const tree = userTree.tree;
    const nextLevel = userTree.level + 1;

    if (nextLevel > tree.maxLevel) {
      throw new BadRequestException('Cây đã đạt cấp tối đa');
    }

    const upgradeCost = this.calculateUpgradeCost(tree, nextLevel);
    const upgradeMinutes = this.calculateUpgradeMinutes(tree, nextLevel);
    const upgradeEndTime = new Date(Date.now() + upgradeMinutes * 60 * 1000);

    const leafResource = await this.findUpgradeCurrencyResource();

    await this.dataSource.transaction(async (manager) => {
      const userResourceRepo = manager.getRepository(UserResource);
      const userTreeRepo = manager.getRepository(UserTree);
      const economyLogRepo = manager.getRepository(EconomyLog);

      const userLeafBalance = await userResourceRepo.findOne({
        where: {
          userId,
          resourceId: leafResource.id,
        },
      });

      const currentBalance = BigInt(userLeafBalance?.balance ?? '0');
      const requiredCost = BigInt(upgradeCost);

      if (currentBalance < requiredCost) {
        throw new BadRequestException('Không đủ Lá Xanh để nâng cấp cây');
      }

      const newBalance = currentBalance - requiredCost;

      if (!userLeafBalance) {
        throw new BadRequestException('Không đủ Lá Xanh để nâng cấp cây');
      }

      userLeafBalance.balance = newBalance.toString();
      await userResourceRepo.save(userLeafBalance);

      userTree.upgradeEndTime = upgradeEndTime;
      await userTreeRepo.save(userTree);

      await economyLogRepo.save(
        economyLogRepo.create({
          userId,
          resourceType: leafResource.code,
          amount: -upgradeCost,
          source: 'tree_upgrade',
        }),
      );
    });

    return this.userTreeRepository.findOneOrFail({
      where: { id: dto.userTreeId, userId },
      relations: ['tree'],
    });
  }

  async repairTree(userId: string, dto: RepairTreeDto): Promise<UserTree> {
    // Dummy logic: repair tree
    const userTree = await this.userTreeRepository.findOne({
      where: { id: dto.userTreeId, userId },
      relations: ['tree'],
    });
    if (!userTree) throw new NotFoundException('UserTree not found');
    userTree.isDamaged = false;
    return this.userTreeRepository.save(userTree);
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
    await this.completeFinishedUpgradesForUser(userId);

    const userTree = await this.userTreeRepository.findOne({
      where: { id: userTreeId, userId },
      relations: ['tree'],
    });
    if (!userTree) {
      throw new NotFoundException('UserTree not found');
    }

    const now = new Date();
    const isUpgrading =
      !!userTree.upgradeEndTime &&
      userTree.upgradeEndTime.getTime() > now.getTime();
    const secondsRemaining = isUpgrading
      ? Math.max(
          0,
          Math.ceil(
            (userTree.upgradeEndTime!.getTime() - now.getTime()) / 1000,
          ),
        )
      : 0;

    return {
      userTreeId: userTree.id,
      level: userTree.level,
      maxLevel: userTree.tree.maxLevel,
      isUpgrading,
      upgradeEndTime: userTree.upgradeEndTime,
      secondsRemaining,
      canUpgrade: !isUpgrading && userTree.level < userTree.tree.maxLevel,
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

  private calculateUpgradeMinutes(tree: Tree, level: number): number {
    const rawMinutes =
      tree.timeBase * Math.pow(Number(tree.timeRate), level - 1);
    return Math.max(1, Math.round(rawMinutes));
  }

  private async completeFinishedUpgradesForUser(userId: string): Promise<void> {
    await this.completeFinishedUpgrades(userId);
  }

  private async completeFinishedUpgrades(userId?: string): Promise<void> {
    const now = new Date();
    const whereClause = userId
      ? {
          userId,
          upgradeEndTime: LessThanOrEqual(now),
        }
      : {
          upgradeEndTime: LessThanOrEqual(now),
        };

    const finishedTrees = await this.userTreeRepository.find({
      where: whereClause,
      relations: ['tree'],
    });

    if (finishedTrees.length === 0) {
      return;
    }

    for (const userTree of finishedTrees) {
      if (userTree.level < userTree.tree.maxLevel) {
        userTree.level += 1;
      }

      const reachedEvolutionMilestone =
        userTree.level % 20 === 0 || userTree.level === userTree.tree.maxLevel;

      if (reachedEvolutionMilestone) {
        const stage = Math.ceil(userTree.level / 20);
        userTree.assetPath = this.buildAssetPath(
          userTree.tree.assetsPath,
          stage,
        );
      }

      userTree.upgradeEndTime = undefined;
    }

    await this.userTreeRepository.save(finishedTrees);
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

  private buildAssetPath(basePath: string, stage: number): string {
    const normalizedBasePath = basePath.replace(/\.png$/i, '');
    return `${normalizedBasePath}${stage}.png`;
  }
}
