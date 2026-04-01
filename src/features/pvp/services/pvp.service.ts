import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { UserResource } from '../../../database/entities/user-resource.entity';
import { UserTree } from '../../../database/entities/user-tree.entity';
import { PvpActionLog } from '../../../database/entities/pvp-action-log.entity';
import { EconomyLog } from '../../../database/entities/economy-log.entity';
import { User } from '../../../database/entities/user.entity';
import { Resource } from '../../../database/entities/resource.entity';
import { Tree } from '../../../database/entities/tree.entity';
import { RaidDto } from '../dto/raid.dto';
import { AttackDto } from '../dto/attack.dto';
import { ResourceCode } from '../../../shared/constants/resource-code.constant';
import { TreeCode } from '../../../shared/constants/tree-code.constant';
import { WifiSessionsService } from '../../wifi-sessions/services/wifi-sessions.service';

type PvpActionType = 'RAID' | 'ATTACK';
type DefenseSource =
  | 'THO_NHUONG'
  | 'OT_GRININI_PASSIVE'
  | 'MAN_CHUP_TRANH_MUOI';

type DefenseResult = {
  wasBlocked: boolean;
  source?: DefenseSource;
  message?: string;
};

type UserPowerSnapshot = {
  userId: string;
  username: string;
  avatarUrl: string;
  powerScore: number;
  oxyPerHour: number;
  totalTreeLevel: number;
  primaryTreeId: string | null;
  passiveBlockChance: number;
  hasShield: boolean;
  defenseScore: number;
};

type SelectedRaidBox = {
  boxIndex: number;
  percent: number;
  amount: number;
};

@Injectable()
export class PvpService {
  private readonly leafResourceCodes = [
    ResourceCode.LA_XANH,
    'GREEN_LEAF',
    'GREEN_LEAVES',
    'LEAF',
    'LEAVES',
  ];

  constructor(
    @InjectRepository(UserResource)
    private readonly userResourceRepo: Repository<UserResource>,
    @InjectRepository(UserTree)
    private readonly userTreeRepo: Repository<UserTree>,
    @InjectRepository(PvpActionLog)
    private readonly pvpActionLogRepo: Repository<PvpActionLog>,
    @InjectRepository(EconomyLog)
    private readonly economyLogRepo: Repository<EconomyLog>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Resource)
    private readonly resourceRepo: Repository<Resource>,
    @InjectRepository(Tree)
    private readonly treeRepo: Repository<Tree>,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
    private readonly wifiSessionsService: WifiSessionsService,
  ) {}

  async getAttackTargets(userId: string): Promise<{
    myScore: number;
    targets: Array<{
      userId: string;
      username: string;
      avatarUrl: string;
      powerScore: number;
      primaryTreeId: string | null;
      passiveBlockChance: number;
      hasShield: boolean;
      isBaoThu: boolean;
    }>;
  }> {
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
      throw new NotFoundException(
        'Không tìm thấy dữ liệu sức mạnh của người chơi',
      );
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
      return (
        entry.powerScore >= me.powerScore * minRatio &&
        entry.powerScore <= me.powerScore * maxRatio
      );
    });

    const sortedScores = [...snapshots].sort(
      (a, b) => a.powerScore - b.powerScore,
    );
    const isLowest = sortedScores[0]?.userId === userId;
    const isHighest = sortedScores[sortedScores.length - 1]?.userId === userId;

    if (candidatePool.length === 0) {
      if (isLowest) {
        const lowMaxRatio = this.getPvpNumberConfig(
          'pvp.fallbackLowMaxRatio',
          2,
        );
        candidatePool = others.filter(
          (entry) => entry.powerScore <= me.powerScore * lowMaxRatio,
        );
      } else if (isHighest) {
        const topMinRatio = this.getPvpNumberConfig(
          'pvp.fallbackTopMinRatio',
          0.5,
        );
        candidatePool = others.filter(
          (entry) => entry.powerScore >= me.powerScore * topMinRatio,
        );
      } else {
        const globalMinRatio = this.getPvpNumberConfig(
          'pvp.fallbackGlobalMinRatio',
          0.5,
        );
        const globalMaxRatio = this.getPvpNumberConfig(
          'pvp.fallbackGlobalMaxRatio',
          2,
        );
        candidatePool = others.filter((entry) => {
          return (
            entry.powerScore >= me.powerScore * globalMinRatio &&
            entry.powerScore <= me.powerScore * globalMaxRatio
          );
        });
      }
    }

    let usedClosestFallback = false;
    if (candidatePool.length === 0) {
      candidatePool = this.pickClosestTargets(others, me.powerScore);
      usedClosestFallback = true;
    }

    const revengeTargetId = await this.resolveRevengeTargetId(
      userId,
      revengeLog,
    );
    const lastAttackerId = revengeLog?.attackerId ?? null;
    const excludeAttackerId = revengeTargetId ?? lastAttackerId;
    const revengeTarget = revengeTargetId
      ? snapshots.find((entry) => entry.userId === revengeTargetId)
      : undefined;

    const regularTargetCount = this.getPvpNumberConfig(
      'pvp.regularTargetCount',
      4,
    );

    const regularCandidates = candidatePool.filter(
      (entry) => entry.userId !== excludeAttackerId,
    );

    if (regularCandidates.length < regularTargetCount) {
      const fallbackCandidates = this.pickClosestTargets(
        others.filter((entry) => entry.userId !== excludeAttackerId),
        me.powerScore,
      );
      const existingIds = new Set(
        regularCandidates.map((entry) => entry.userId),
      );
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

  async getHistory(
    userId: string,
    requestedLimit?: number,
  ): Promise<{
    total: number;
    items: Array<{
      id: string;
      actionType: string;
      direction: 'ATTACKED' | 'DEFENDED';
      wasBlocked: boolean;
      stolenAmount: number;
      createdAt: Date;
      attacker: {
        userId: string;
        username: string;
        avatarUrl: string;
      };
      defender: {
        userId: string;
        username: string;
        avatarUrl: string;
      };
      targetTreeId?: string;
      revengeTargetUserId: string;
    }>;
  }> {
    const defaultLimit = this.getPvpNumberConfig('pvp.historyDefaultLimit', 30);
    const maxLimit = this.getPvpNumberConfig('pvp.historyMaxLimit', 100);

    const normalizedLimit = Math.max(
      1,
      Math.min(maxLimit, requestedLimit ?? defaultLimit),
    );

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
        const revengeTargetUserId =
          direction === 'ATTACKED' ? entry.defenderId : entry.attackerId;

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

  async raid(
    userId: string,
    dto: RaidDto,
  ): Promise<{
    success: boolean;
    wasBlocked: boolean;
    defenseSource?: DefenseSource;
    stolenLeafAmount: number;
    selectedBoxes: SelectedRaidBox[];
    message: string;
  }> {
    if (userId === dto.targetUserId) {
      throw new BadRequestException('Không thể tự cướp Lá của chính mình');
    }

    return this.dataSource.transaction(async (manager) => {
      const urRepo = manager.getRepository(UserResource);
      const ecoLogRepo = manager.getRepository(EconomyLog);
      const actionLogRepo = manager.getRepository(PvpActionLog);

      const leafResource = await this.findFirstResourceByCodes(
        manager,
        this.leafResourceCodes,
      );

      if (!leafResource) {
        throw new BadRequestException(
          'Không tìm thấy resource Lá Xanh để xử lý cướp',
        );
      }

      const defense = await this.resolveDefense(
        manager,
        dto.targetUserId,
        'RAID',
      );

      if (defense.wasBlocked) {
        await actionLogRepo.save(
          actionLogRepo.create({
            attackerId: userId,
            defenderId: dto.targetUserId,
            actionType: 'RAID',
            wasBlocked: true,
            stolenAmount: 0,
          }),
        );

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
        await actionLogRepo.save(
          actionLogRepo.create({
            attackerId: userId,
            defenderId: dto.targetUserId,
            actionType: 'RAID',
            wasBlocked: false,
            stolenAmount: 0,
          }),
        );

        await this.tryUnlockOtGrinini(manager, dto.targetUserId);

        return {
          success: true,
          wasBlocked: false,
          stolenLeafAmount: 0,
          selectedBoxes: [],
          message: 'Mục tiêu không còn Lá Xanh để cướp.',
        };
      }

      const selection = this.resolveRaidSelection(
        defenderBalanceBefore,
        dto.selectedBoxIndexes,
      );
      const selectedBoxes = selection.selectedBoxes;

      let stolenAmount = selection.stolenAmount;
      stolenAmount = Math.max(
        0,
        Math.min(stolenAmount, Number(defenderBalanceBefore)),
      );

      if (stolenAmount > 0) {
        const stolenBigInt = BigInt(stolenAmount);

        if (defenderLeaf) {
          defenderLeaf.balance = (
            defenderBalanceBefore - stolenBigInt
          ).toString();
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

        await ecoLogRepo.save(
          ecoLogRepo.create({
            userId: dto.targetUserId,
            resourceType: leafResource.code,
            amount: -stolenAmount,
            source: 'pvp_raid_leaf_lost',
          }),
        );

        await ecoLogRepo.save(
          ecoLogRepo.create({
            userId,
            resourceType: leafResource.code,
            amount: stolenAmount,
            source: 'pvp_raid_leaf_reward',
          }),
        );
      }

      await actionLogRepo.save(
        actionLogRepo.create({
          attackerId: userId,
          defenderId: dto.targetUserId,
          actionType: 'RAID',
          wasBlocked: false,
          stolenAmount,
        }),
      );

      await this.tryUnlockOtGrinini(manager, dto.targetUserId);

      return {
        success: true,
        wasBlocked: false,
        stolenLeafAmount: stolenAmount,
        selectedBoxes,
        message:
          stolenAmount > 0
            ? `Cướp thành công ${stolenAmount} Lá Xanh!`
            : 'Đã chọn trúng các hộp rỗng.',
      };
    });
  }

  async attack(
    userId: string,
    dto: AttackDto,
  ): Promise<{
    success: boolean;
    wasBlocked: boolean;
    defenseSource?: DefenseSource;
    targetUserTreeId: string;
    message: string;
  }> {
    return this.dataSource.transaction(async (manager) => {
      const targetTree = await manager.getRepository(UserTree).findOne({
        where: { id: dto.targetUserTreeId },
        relations: ['tree'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!targetTree) {
        throw new NotFoundException('Không tìm thấy cây mục tiêu');
      }

      if (targetTree.userId === userId) {
        throw new BadRequestException('Không thể phá hoại cây của chính mình');
      }

      if (targetTree.isDamaged) {
        throw new BadRequestException('Cây mục tiêu đã bị hỏng');
      }

      const defense = await this.resolveDefense(
        manager,
        targetTree.userId,
        'ATTACK',
      );

      if (defense.wasBlocked) {
        await manager.getRepository(PvpActionLog).save(
          manager.getRepository(PvpActionLog).create({
            attackerId: userId,
            defenderId: targetTree.userId,
            actionType: 'ATTACK',
            targetTreeId: targetTree.id,
            wasBlocked: true,
            stolenAmount: 0,
          }),
        );

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
      await manager.getRepository(UserTree).save(targetTree);

      await manager.getRepository(PvpActionLog).save(
        manager.getRepository(PvpActionLog).create({
          attackerId: userId,
          defenderId: targetTree.userId,
          actionType: 'ATTACK',
          targetTreeId: targetTree.id,
          wasBlocked: false,
          stolenAmount: 0,
        }),
      );

      await this.tryUnlockOtGrinini(manager, targetTree.userId);

      return {
        success: true,
        wasBlocked: false,
        targetUserTreeId: targetTree.id,
        message:
          'Phá hoại thành công. Cây mục tiêu giảm 50% sản lượng cho tới khi sửa.',
      };
    });
  }

  private async resolveDefense(
    manager: EntityManager,
    defenderId: string,
    actionType: PvpActionType,
  ): Promise<DefenseResult> {
    const thoNhuongBonusChance = this.getPvpNumberConfig(
      'pvp.thoNhuongDefenseBonusChance',
      0.05,
    );

    const hasThoNhuongEffect =
      thoNhuongBonusChance > 0 &&
      (await this.wifiSessionsService.isThoNhuongActive(defenderId));

    if (hasThoNhuongEffect && Math.random() < thoNhuongBonusChance) {
      return {
        wasBlocked: true,
        source: 'THO_NHUONG',
        message:
          actionType === 'RAID'
            ? '[Tho nhuong] chan don cuop.'
            : '[Tho nhuong] chan don pha hoai.',
      };
    }

    const passiveChance = await this.getPassiveBlockChance(manager, defenderId);
    const passiveCap = this.getPvpNumberConfig(
      'pvp.passiveBlockMaxChance',
      0.2,
    );
    const effectivePassiveChance = Math.min(passiveChance, passiveCap);

    if (effectivePassiveChance > 0 && Math.random() < effectivePassiveChance) {
      return {
        wasBlocked: true,
        source: 'OT_GRININI_PASSIVE',
        message:
          actionType === 'RAID'
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

  private async tryConsumeMosquitoShield(
    manager: EntityManager,
    userId: string,
  ): Promise<boolean> {
    const shieldItem = await manager
      .getRepository(UserResource)
      .createQueryBuilder('ur')
      .innerJoinAndSelect('ur.resource', 'resource')
      .where('ur.userId = :userId', { userId })
      .andWhere('UPPER(resource.code) = :resourceCode', {
        resourceCode: ResourceCode.MAN_CHUP_TRANH_MUOI,
      })
      .setLock('pessimistic_write')
      .getOne();

    const shieldBalance = Number(shieldItem?.balance ?? '0');
    if (!shieldItem || shieldBalance <= 0) {
      return false;
    }

    shieldItem.balance = (shieldBalance - 1).toString();
    await manager.getRepository(UserResource).save(shieldItem);

    await manager.getRepository(EconomyLog).save(
      manager.getRepository(EconomyLog).create({
        userId,
        resourceType: ResourceCode.MAN_CHUP_TRANH_MUOI,
        amount: -1,
        source: 'pvp_defense_consume',
      }),
    );

    return true;
  }

  private async getPassiveBlockChance(
    manager: EntityManager,
    userId: string,
  ): Promise<number> {
    const treeRepo = manager.getRepository(UserTree);
    const passiveTree = await treeRepo
      .createQueryBuilder('userTree')
      .innerJoinAndSelect('userTree.tree', 'tree')
      .where('userTree.userId = :userId', { userId })
      .andWhere('UPPER(tree.code) = :treeCode', {
        treeCode: TreeCode.OT_GRININI,
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

  private async tryUnlockOtGrinini(
    manager: EntityManager,
    defenderId: string,
  ): Promise<void> {
    const requiredDefenseCount = this.getPvpNumberConfig(
      'pvp.otGrininiUnlockDefenseCount',
      20,
    );

    const defenseCount = await manager.getRepository(PvpActionLog).count({
      where: {
        defenderId,
      },
    });

    if (defenseCount < requiredDefenseCount) {
      return;
    }

    const otGrininiTree = await manager.getRepository(Tree).findOne({
      where: { code: TreeCode.OT_GRININI },
    });

    if (!otGrininiTree) {
      return;
    }

    const existing = await manager.getRepository(UserTree).findOne({
      where: {
        userId: defenderId,
        treeId: otGrininiTree.id,
      },
    });

    if (existing) {
      return;
    }

    const newTree = manager.getRepository(UserTree).create({
      userId: defenderId,
      treeId: otGrininiTree.id,
      level: 1,
      isDamaged: false,
      assetPath: this.buildAssetPath(otGrininiTree.assetsPath, 1),
      lastHarvestTime: new Date(),
      checksum: '',
    });

    await manager.getRepository(UserTree).save(newTree);
  }

  private async buildPowerSnapshots(): Promise<UserPowerSnapshot[]> {
    const [users, userTrees, shieldResources] = await Promise.all([
      this.userRepo.find(),
      this.userTreeRepo.find({ relations: ['tree'] }),
      this.userResourceRepo
        .createQueryBuilder('ur')
        .innerJoinAndSelect('ur.resource', 'resource')
        .where('UPPER(resource.code) = :code', {
          code: ResourceCode.MAN_CHUP_TRANH_MUOI,
        })
        .getMany(),
    ]);

    const treesByUser = new Map<string, UserTree[]>();
    for (const userTree of userTrees) {
      const existing = treesByUser.get(userTree.userId) ?? [];
      existing.push(userTree);
      treesByUser.set(userTree.userId, existing);
    }

    const shieldByUser = new Map<string, boolean>();
    for (const item of shieldResources) {
      shieldByUser.set(item.userId, Number(item.balance ?? '0') > 0);
    }

    return users.map((user) => {
      const ownedTrees = treesByUser.get(user.id) ?? [];
      const totalTreeLevel = ownedTrees.reduce(
        (sum, tree) => sum + tree.level,
        0,
      );
      const oxyPerHour = ownedTrees.reduce(
        (sum, tree) => sum + this.computeTreeOxyPerHour(tree),
        0,
      );
      const powerScore = totalTreeLevel * 10 + oxyPerHour / 1000;

      const primaryTree = [...ownedTrees]
        .sort((a, b) => b.level - a.level)
        .find((tree) => !tree.isDamaged);

      const passiveTree = [...ownedTrees]
        .filter(
          (tree) => tree.tree?.code?.toUpperCase() === TreeCode.OT_GRININI,
        )
        .sort((a, b) => b.level - a.level)[0];

      const passiveBlockChance = passiveTree
        ? Math.max(
            0,
            Number(passiveTree.tree.perkBase ?? 0) +
              Number(passiveTree.tree.perkStep ?? 0) *
                Math.max(0, passiveTree.level - 1),
          )
        : 0;
      const cappedPassiveChance = Math.min(
        passiveBlockChance,
        this.getPvpNumberConfig('pvp.passiveBlockMaxChance', 0.2),
      );

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

  private async resolveRevengeTargetId(
    userId: string,
    revengeLog?: PvpActionLog | null,
  ): Promise<string | null> {
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

  private pickClosestTargets(
    candidates: UserPowerSnapshot[],
    referenceScore: number,
  ): UserPowerSnapshot[] {
    return [...candidates].sort((a, b) => {
      const diffA = Math.abs(a.powerScore - referenceScore);
      const diffB = Math.abs(b.powerScore - referenceScore);
      return diffA - diffB;
    });
  }

  private computeTreeOxyPerHour(userTree: UserTree): number {
    const tree = userTree.tree;
    if (!tree) {
      return 0;
    }

    if ((tree.treeType ?? '').toUpperCase() !== 'PRODUCTION') {
      return 0;
    }

    const oxyBase = Number(tree.oxyBase ?? 0);
    const oxyRate = Number(tree.oxyRate ?? 1);

    if (
      !Number.isFinite(oxyBase) ||
      !Number.isFinite(oxyRate) ||
      oxyBase <= 0
    ) {
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

  private async findFirstResourceByCodes(
    manager: EntityManager,
    codes: string[],
  ): Promise<Resource | null> {
    for (const code of codes) {
      const resource = await manager.getRepository(Resource).findOne({
        where: { code },
      });
      if (resource) {
        return resource;
      }
    }

    return null;
  }

  private pickRandomDistinctIndexes(
    maxExclusive: number,
    count: number,
  ): number[] {
    const indexes = Array.from({ length: maxExclusive }, (_, idx) => idx);

    for (let i = indexes.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = indexes[i];
      indexes[i] = indexes[j];
      indexes[j] = tmp;
    }

    return indexes.slice(0, Math.min(count, maxExclusive));
  }

  private resolveRaidSelection(
    defenderBalance: bigint,
    selectedBoxIndexes?: number[],
  ): { selectedBoxes: SelectedRaidBox[]; stolenAmount: number } {
    const raidBoxPercents = [15, 10, 5, 0];
    const shuffledPercents = this.shuffleArray(raidBoxPercents);

    const normalizedSelection =
      this.normalizeSelectedBoxIndexes(selectedBoxIndexes);

    const selectedIndexes =
      normalizedSelection.length > 0
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

  private normalizeSelectedBoxIndexes(selectedBoxIndexes?: number[]): number[] {
    const raw = selectedBoxIndexes?.length ? selectedBoxIndexes : [];

    const unique = new Set<number>();
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

  private shuffleArray<T>(items: T[]): T[] {
    const array = [...items];
    for (let i = array.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = array[i];
      array[i] = array[j];
      array[j] = tmp;
    }
    return array;
  }

  private buildAssetPath(
    basePath: string | undefined,
    stage: number,
  ): string | undefined {
    if (!basePath) {
      return undefined;
    }

    const normalizedBasePath = basePath.replace(/\.png$/i, '');
    return `${normalizedBasePath}${stage}.png`;
  }

  private getPvpNumberConfig(path: string, fallback: number): number {
    const configured = this.configService.get<number>(path);
    return Number.isFinite(configured) ? Number(configured) : fallback;
  }

  private roundScore(score: number): number {
    return Math.round(score * 100) / 100;
  }

  private roundChance(chance: number): number {
    return Math.round(chance * 10000) / 10000;
  }
}
