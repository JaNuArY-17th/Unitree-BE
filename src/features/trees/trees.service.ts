import { UpgradeTreeDto } from './dto/upgrade-tree.dto';
import { RepairTreeDto } from './dto/repair-tree.dto';
import { EvolveTreeDto } from './dto/evolve-tree.dto';
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

@Injectable()
export class TreesService {
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
          resourceType: leafResource.name,
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

  async evolveTree(userId: string, dto: EvolveTreeDto): Promise<UserTree> {
    await this.completeFinishedUpgradesForUser(userId);

    const userTree = await this.userTreeRepository.findOne({
      where: { id: dto.userTreeId, userId },
      relations: ['tree'],
    });
    if (!userTree) throw new NotFoundException('UserTree not found');
    // TODO: implement evolve logic
    return userTree;
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
    const now = new Date();
    const finishedTrees = await this.userTreeRepository.find({
      where: {
        userId,
        upgradeEndTime: LessThanOrEqual(now),
      },
      relations: ['tree'],
    });

    if (finishedTrees.length === 0) {
      return;
    }

    for (const userTree of finishedTrees) {
      if (userTree.level < userTree.tree.maxLevel) {
        userTree.level += 1;
      }
      userTree.upgradeEndTime = undefined;
    }

    await this.userTreeRepository.save(finishedTrees);
  }

  private async findUpgradeCurrencyResource(): Promise<Resource> {
    const preferredNames = [
      'green_leaf',
      'green_leaves',
      'leaf',
      'leaves',
      'la_xanh',
      'coin',
      'coins',
      'gold',
    ];

    for (const name of preferredNames) {
      const resource = await this.resourceRepository.findOne({
        where: { name },
      });
      if (resource) {
        return resource;
      }
    }

    throw new BadRequestException(
      'Không tìm thấy resource Lá Xanh. Cần seed resource với tên phù hợp.',
    );
  }
}
