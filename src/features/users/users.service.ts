import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Not } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { PaginationResult } from '../../shared/repositories/pagination.repository';
import { UserResource } from '../../database/entities/user-resource.entity';
import { Resource } from '../../database/entities/resource.entity';
import { UserTree } from '../../database/entities/user-tree.entity';
import { Friendship } from '../../database/entities/friendship.entity';
import { PvpActionLog } from '../../database/entities/pvp-action-log.entity';
import { EconomyLog } from '../../database/entities/economy-log.entity';
import { FriendshipStatus } from '../../shared/constants/enums.constant';
import {
  MyInventoryResponseDto,
  ResourceBalanceDto,
  SpinRegenInfoDto,
} from './dto/resource-balance.dto';
import { GardenProfileResponseDto, GardenTreeDto } from './dto/garden-profile.dto';
import { ActivityLogType, ActivityItem, EconomyActivityDto, PvpActivityDto } from './dto/activity-log.dto';

/** Hằng số spin regen */
const SPIN_REGEN_PER_HOUR = 5;
const MAX_SPINS = 20;
const SPIN_RESOURCE_CODES = ['SPIN', 'SPINS', 'LUOT_QUAY'];
const SHIELD_RESOURCE_CODES = ['SHIELD', 'MAN', 'SHIELD_ITEM'];

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserResource)
    private readonly userResourceRepository: Repository<UserResource>,
    @InjectRepository(Resource)
    private readonly resourceRepository: Repository<Resource>,
    @InjectRepository(UserTree)
    private readonly userTreeRepository: Repository<UserTree>,
    @InjectRepository(Friendship)
    private readonly friendshipRepository: Repository<Friendship>,
    @InjectRepository(PvpActionLog)
    private readonly pvpActionLogRepository: Repository<PvpActionLog>,
    @InjectRepository(EconomyLog)
    private readonly economyLogRepository: Repository<EconomyLog>,
  ) {}

  // ──────────────────────────────────
  // Helper: tính Oxy/giờ của một cây
  // Công thức: oxyBase * oxyRate^(level-1)
  // ──────────────────────────────────
  private _calcOxyPerHour(oxyBase: number, oxyRate: number, level: number): number {
    return Math.round(oxyBase * Math.pow(oxyRate, level - 1));
  }

  // ──────────────────────────────────
  // Helper: tính spin hiện tại dựa trên lastSpinRegen
  // ──────────────────────────────────
  private _calcSpinRegen(
    currentSpinBalance: number,
    lastSpinRegen: Date | null | undefined,
  ): SpinRegenInfoDto {
    if (currentSpinBalance >= MAX_SPINS || !lastSpinRegen) {
      return {
        currentSpins: Math.min(currentSpinBalance, MAX_SPINS),
        maxSpins: MAX_SPINS,
        nextRegenAt: currentSpinBalance >= MAX_SPINS ? null : new Date().toISOString(),
        secondsUntilNextRegen: null,
      };
    }

    const msPerSpin = (3600 * 1000) / SPIN_REGEN_PER_HOUR; // ms per spin
    const now = Date.now();
    const elapsed = now - lastSpinRegen.getTime();
    const spinsEarned = Math.floor(elapsed / msPerSpin);
    const totalSpins = Math.min(currentSpinBalance + spinsEarned, MAX_SPINS);

    if (totalSpins >= MAX_SPINS) {
      return {
        currentSpins: MAX_SPINS,
        maxSpins: MAX_SPINS,
        nextRegenAt: null,
        secondsUntilNextRegen: null,
      };
    }

    const msUntilNext = msPerSpin - (elapsed % msPerSpin);
    const nextRegenAt = new Date(now + msUntilNext);

    return {
      currentSpins: totalSpins,
      maxSpins: MAX_SPINS,
      nextRegenAt: nextRegenAt.toISOString(),
      secondsUntilNextRegen: Math.ceil(msUntilNext / 1000),
    };
  }

  // ──────────────────────────────────
  // 1. GET /users/me/inventory
  // ──────────────────────────────────
  async getMyInventory(userId: string): Promise<MyInventoryResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'lastSpinRegen'],
    });
    if (!user) throw new NotFoundException('User not found');

    // Lấy tất cả UserResource join Resource
    const userResources = await this.userResourceRepository.find({
      where: { userId },
      relations: ['resource'],
      order: { createdAt: 'ASC' },
    });

    // Tìm resource spin để tính regen
    let spinBalance = 0;
    let spinRegenInfo: SpinRegenInfoDto = {
      currentSpins: 0,
      maxSpins: MAX_SPINS,
      nextRegenAt: null,
      secondsUntilNextRegen: null,
    };

    const resources: ResourceBalanceDto[] = userResources.map((ur) => {
      const balance = Number(ur.balance);
      const code = ur.resource?.code ?? '';

      if (SPIN_RESOURCE_CODES.includes(code.toUpperCase())) {
        spinBalance = balance;
      }

      return {
        code,
        name: ur.resource?.name ?? code,
        balance,
        maxStack: ur.resource?.maxStack ?? null,
      };
    });

    // Tính spin regen
    const spinResourceFound = userResources.find((ur) =>
      SPIN_RESOURCE_CODES.includes((ur.resource?.code ?? '').toUpperCase()),
    );
    if (spinResourceFound) {
      spinRegenInfo = this._calcSpinRegen(spinBalance, user.lastSpinRegen);
    }

    return { resources, spinRegen: spinRegenInfo };
  }

  // ──────────────────────────────────
  // 2. GET /users/:id/garden
  // ──────────────────────────────────
  async getGardenProfile(
    targetUserId: string,
  ): Promise<GardenProfileResponseDto> {
    const owner = await this.userRepository.findOne({
      where: { id: targetUserId },
      select: ['id', 'username', 'fullname', 'avatar'],
    });
    if (!owner) throw new NotFoundException('User not found');

    // Lấy cây của user target
    const userTrees = await this.userTreeRepository.find({
      where: { userId: targetUserId },
      relations: ['tree'],
      order: { createdAt: 'ASC' },
    });

    // Tìm shield count
    const shieldResources = await this.userResourceRepository
      .createQueryBuilder('ur')
      .innerJoin('ur.resource', 'r')
      .where('ur.userId = :userId', { userId: targetUserId })
      .andWhere('UPPER(r.code) IN (:...codes)', {
        codes: SHIELD_RESOURCE_CODES,
      })
      .getOne();
    const shieldCount = shieldResources ? Number(shieldResources.balance) : 0;

    const trees: GardenTreeDto[] = userTrees.map((ut) => {
      const now = new Date();
      const isUpgrading =
        !!ut.upgradeEndTime && ut.upgradeEndTime.getTime() > now.getTime();

      let oxyPerHour = 0;
      if (ut.tree.oxyBase && ut.tree.oxyRate) {
        oxyPerHour = this._calcOxyPerHour(
          ut.tree.oxyBase,
          Number(ut.tree.oxyRate),
          ut.level,
        );
        // Cây bị hư hại giảm 50% năng suất
        if (ut.isDamaged) oxyPerHour = Math.floor(oxyPerHour * 0.5);
      }

      return {
        treeName: ut.tree.name,
        treeType: ut.tree.treeType,
        level: ut.level,
        maxLevel: ut.tree.maxLevel,
        oxyPerHour,
        isDamaged: ut.isDamaged,
        isUpgrading,
        assetPath: ut.assetPath ?? null,
      };
    });

    const totalOxyPerHour = trees.reduce((sum, t) => sum + t.oxyPerHour, 0);

    return {
      owner: {
        id: owner.id,
        username: owner.username,
        fullname: owner.fullname,
        avatar: owner.avatar ?? null,
      },
      trees,
      totalOxyPerHour,
      shieldCount,
    };
  }

  // ──────────────────────────────────
  // 3. GET /users/opponents/random
  // ──────────────────────────────────
  async getRandomOpponents(
    userId: string,
    count = 3,
  ): Promise<Partial<User>[]> {
    // Lấy Oxy của user hiện tại để soft-match (không bắt buộc)
    const safeCount = Math.min(Math.max(count, 1), 10);

    // Lấy random users (không phải mình)
    // Dùng custom query để có RANDOM()
    const opponents = await this.userRepository
      .createQueryBuilder('u')
      .select(['u.id', 'u.username', 'u.fullname', 'u.avatar'])
      .where('u.id != :userId', { userId })
      .orderBy('RANDOM()')
      .limit(safeCount * 3)
      .getMany();

    // Trả về đúng số lượng yêu cầu
    return opponents.slice(0, safeCount);
  }

  // ──────────────────────────────────
  // 4. GET /users/opponents/revenge-list
  // ──────────────────────────────────
  async getRevengeList(
    userId: string,
    limit = 10,
  ): Promise<
    {
      attackerId: string;
      attackerUsername: string;
      attackerAvatar: string | null;
      actionType: string;
      stolenAmount: number | null;
      wasBlocked: boolean;
      createdAt: string;
    }[]
  > {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 giờ

    const logs = await this.pvpActionLogRepository
      .createQueryBuilder('log')
      .innerJoin('log.attacker', 'attacker')
      .select([
        'log.id',
        'log.attackerId',
        'log.actionType',
        'log.stolenAmount',
        'log.wasBlocked',
        'log.createdAt',
        'attacker.username',
        'attacker.avatar',
      ])
      .where('log.defenderId = :userId', { userId })
      .andWhere('log.createdAt >= :cutoff', { cutoff })
      .orderBy('log.createdAt', 'DESC')
      .limit(limit)
      .getMany();

    return logs.map((log) => ({
      attackerId: log.attackerId,
      attackerUsername: (log as any).attacker?.username ?? 'Unknown',
      attackerAvatar: (log as any).attacker?.avatar ?? null,
      actionType: log.actionType,
      stolenAmount: log.stolenAmount ?? null,
      wasBlocked: log.wasBlocked,
      createdAt: log.createdAt.toISOString(),
    }));
  }

  // ──────────────────────────────────
  // 5. GET /users/leaderboard
  // ──────────────────────────────────
  async getLeaderboard(
    userId: string,
    type: 'global' | 'friends' = 'global',
    page = 1,
    limit = 20,
  ): Promise<{
    data: { rank: number; userId: string; username: string; avatar: string | null; oxyBalance: number }[];
    myRank: number | null;
    meta: { page: number; limit: number; total: number };
  }> {
    const skip = (page - 1) * limit;

    // Tìm resource Oxygen
    const oxyResource = await this.resourceRepository
      .createQueryBuilder('r')
      .where('UPPER(r.code) IN (:...codes)', {
        codes: ['OXYGEN', 'OXY', 'O2'],
      })
      .getOne();

    if (!oxyResource) {
      return {
        data: [],
        myRank: null,
        meta: { page, limit, total: 0 },
      };
    }

    let qb = this.userResourceRepository
      .createQueryBuilder('ur')
      .innerJoin('ur.user', 'u')
      .innerJoin('ur.resource', 'r')
      .select([
        'ur.userId AS "userId"',
        'u.username AS username',
        'u.avatar AS avatar',
        'ur.balance AS "oxyBalance"',
      ])
      .where('ur.resourceId = :resourceId', { resourceId: oxyResource.id })
      .andWhere('u.id IS NOT NULL');

    // Filter by friends only
    if (type === 'friends') {
      // Lấy danh sách bạn bè của userId
      const friendships = await this.friendshipRepository.find({
        where: [
          { userId1: userId, status: FriendshipStatus.ACCEPTED },
          { userId2: userId, status: FriendshipStatus.ACCEPTED },
        ],
      });
      const friendIds = friendships.map((f) =>
        f.userId1 === userId ? f.userId2 : f.userId1,
      );
      if (friendIds.length === 0) {
        return {
          data: [],
          myRank: null,
          meta: { page, limit, total: 0 },
        };
      }
      qb = qb.andWhere('ur.userId IN (:...friendIds)', { friendIds });
    }

    const total = await qb.getCount();
    const rawRows = await qb
      .orderBy('ur.balance', 'DESC')
      .offset(skip)
      .limit(limit)
      .getRawMany<{ userId: string; username: string; avatar: string | null; oxyBalance: string }>();

    const data = rawRows.map((row, i) => ({
      rank: skip + i + 1,
      userId: row.userId,
      username: row.username,
      avatar: row.avatar,
      oxyBalance: Number(row.oxyBalance),
    }));

    // Tính rank của user hiện tại
    const myRankRaw = await this.userResourceRepository
      .createQueryBuilder('ur')
      .where('ur.resourceId = :resourceId', { resourceId: oxyResource.id })
      .andWhere(
        'ur.balance > (SELECT balance FROM user_resources WHERE user_id = :userId AND resource_id = :resourceId)',
        { userId, resourceId: oxyResource.id },
      )
      .getCount();
    const myRank = myRankRaw + 1;

    return {
      data,
      myRank,
      meta: { page, limit, total },
    };
  }

  // ──────────────────────────────────
  // 6. GET /users/me/activity
  // ──────────────────────────────────
  async getActivityLog(
    userId: string,
    type: ActivityLogType = ActivityLogType.ALL,
    page = 1,
    limit = 20,
  ): Promise<{
    data: ActivityItem[];
    meta: { page: number; limit: number; total: number };
  }> {
    const skip = (page - 1) * limit;
    const items: ActivityItem[] = [];
    let total = 0;

    if (type === ActivityLogType.ECONOMY || type === ActivityLogType.ALL) {
      const [econLogs, econTotal] = await this.economyLogRepository.findAndCount({
        where: { userId },
        order: { createdAt: 'DESC' },
        skip: type === ActivityLogType.ECONOMY ? skip : 0,
        take: type === ActivityLogType.ECONOMY ? limit : 200,
      });

      if (type === ActivityLogType.ECONOMY) {
        total = econTotal;
      }

      for (const e of econLogs) {
        const item: EconomyActivityDto = {
          kind: 'economy',
          resourceType: e.resourceType,
          amount: e.amount,
          source: e.source,
          createdAt: e.createdAt.toISOString(),
        };
        items.push(item);
      }
    }

    if (type === ActivityLogType.PVP || type === ActivityLogType.ALL) {
      const pvpLogs = await this.pvpActionLogRepository
        .createQueryBuilder('log')
        .innerJoin('log.attacker', 'attacker')
        .innerJoin('log.defender', 'defender')
        .select([
          'log.id',
          'log.attackerId',
          'log.defenderId',
          'log.actionType',
          'log.stolenAmount',
          'log.wasBlocked',
          'log.createdAt',
          'attacker.username',
          'attacker.avatar',
          'defender.username',
        ])
        .where('log.attackerId = :userId OR log.defenderId = :userId', { userId })
        .orderBy('log.createdAt', 'DESC')
        .limit(type === ActivityLogType.PVP ? limit : 200)
        .offset(type === ActivityLogType.PVP ? skip : 0)
        .getMany();

      if (type === ActivityLogType.PVP) {
        total = await this.pvpActionLogRepository.count({
          where: [{ attackerId: userId }, { defenderId: userId }],
        });
      }

      for (const p of pvpLogs) {
        const item: PvpActivityDto = {
          kind: 'pvp',
          attackerId: p.attackerId,
          attackerUsername: (p as any).attacker?.username ?? 'Unknown',
          attackerAvatar: (p as any).attacker?.avatar ?? null,
          defenderId: p.defenderId,
          defenderUsername: (p as any).defender?.username ?? 'Unknown',
          actionType: p.actionType,
          stolenAmount: p.stolenAmount ?? null,
          wasBlocked: p.wasBlocked,
          createdAt: p.createdAt.toISOString(),
        };
        items.push(item);
      }
    }

    if (type === ActivityLogType.ALL) {
      // Merge & sort by date desc, then paginate
      items.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      total = items.length;
      const paged = items.slice(skip, skip + limit);
      return { data: paged, meta: { page, limit, total } };
    }

    return { data: items, meta: { page, limit, total } };
  }

  // ──────────────────────────────────
  // Existing methods (giữ nguyên)
  // ──────────────────────────────────

  async countReferredUsers(userId: string): Promise<number> {
    const user = await this.findById(userId);
    if (!user.referralCode) return 0;
    return this.userRepository.count({
      where: { invitedByCode: user.referralCode },
    });
  }

  async getReferredUsers(userId: string): Promise<User[]> {
    const user = await this.findById(userId);
    if (!user.referralCode) return [];
    return this.userRepository.find({
      where: { invitedByCode: user.referralCode },
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'username',
        'fullname',
        'studentId',
        'avatar',
        'role',
        'createdAt',
        'updatedAt',
        'referralCode',
        'invitedByCode',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async generateReferralCode(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.referralCode) return user;

    let code: string;
    let exists = true;
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    do {
      code = Array.from(
        { length: 4 },
        () => charset[Math.floor(Math.random() * charset.length)],
      ).join('');
      exists = !!(await this.userRepository.findOne({
        where: { referralCode: code },
      }));
    } while (exists);

    user.referralCode = code;
    await this.userRepository.save(user);
    return user;
  }

  async findAll(
    paginationDto: PaginationDto,
    search?: string,
  ): Promise<PaginationResult<User>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const where = search
      ? [
          { fullname: ILike(`%${search}%`) },
          { email: ILike(`%${search}%`) },
          { username: ILike(`%${search}%`) },
        ]
      : {};

    const [data, total] = await this.userRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      select: [
        'id',
        'email',
        'username',
        'fullname',
        'studentId',
        'avatar',
        'role',
        'createdAt',
      ],
    });

    return new PaginationResult<User>({
      data,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    Object.assign(user, updateUserDto);
    await this.userRepository.save(user);
    return this.findById(id);
  }
}
