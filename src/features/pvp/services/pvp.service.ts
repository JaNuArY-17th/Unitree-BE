import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserResource } from '../../../database/entities/user-resource.entity';
import { UserTree } from '../../../database/entities/user-tree.entity';
import { PvpActionLog } from '../../../database/entities/pvp-action-log.entity';
import { EconomyLog } from '../../../database/entities/economy-log.entity';
import { RaidDto } from '../dto/raid.dto';
import { AttackDto } from '../dto/attack.dto';

@Injectable()
export class PvpService {
  constructor(
    @InjectRepository(UserResource)
    private readonly userResourceRepo: Repository<UserResource>,
    @InjectRepository(UserTree)
    private readonly userTreeRepo: Repository<UserTree>,
    @InjectRepository(PvpActionLog)
    private readonly pvpActionLogRepo: Repository<PvpActionLog>,
    @InjectRepository(EconomyLog)
    private readonly economyLogRepo: Repository<EconomyLog>,
    private readonly dataSource: DataSource,
  ) {}

  async raid(userId: string, dto: RaidDto): Promise<any> {
    if (userId === dto.targetUserId) {
      throw new BadRequestException('Không thể tự hái lộc của chính mình');
    }

    return await this.dataSource.transaction(async (manager) => {
      const urRepo = manager.getRepository(UserResource);
      const actionLogRepo = manager.getRepository(PvpActionLog);
      const ecoLogRepo = manager.getRepository(EconomyLog);

      // Fetch attacker resources
      const attackerResources = await urRepo
        .createQueryBuilder('ur')
        .innerJoinAndSelect('ur.resource', 'r')
        .where('ur.userId = :userId', { userId })
        .andWhere('UPPER(r.code) IN (:...codes)', {
          codes: ['RAID_ITEM', 'SPIN', 'SPINS', 'LUOT_QUAY', 'GOLD', 'COIN'],
        })
        // Add pessimistic mapping to avoid concurrent raids changing spins/items
        .setLock('pessimistic_write')
        .getMany();

      const raidItem = attackerResources.find((ur) =>
        ['RAID_ITEM'].includes(ur.resource.code.toUpperCase()),
      );
      const spinItem = attackerResources.find((ur) =>
        ['SPIN', 'SPINS', 'LUOT_QUAY'].includes(ur.resource.code.toUpperCase()),
      );

      const raidBal = raidItem ? Number(raidItem.balance) : 0;
      const spinBal = spinItem ? Number(spinItem.balance) : 0;

      if (raidBal <= 0 && spinBal <= 0) {
        throw new BadRequestException(
          'Không đủ Găng Tay hoặc Lượt Quay để Hái Lộc',
        );
      }

      // Determine consumed item
      let consumedUr: UserResource | undefined;
      let consumedCode = '';
      if (raidBal > 0) {
        consumedUr = raidItem;
        consumedCode = raidItem!.resource.code;
      } else {
        consumedUr = spinItem;
        consumedCode = spinItem!.resource.code;
      }

      // Fetch defender resources
      const defenderResources = await urRepo
        .createQueryBuilder('ur')
        .innerJoinAndSelect('ur.resource', 'r')
        .where('ur.userId = :defenderId', { defenderId: dto.targetUserId })
        .andWhere('UPPER(r.code) IN (:...codes)', {
          codes: ['SHIELD', 'MAN', 'GOLD', 'COIN'],
        })
        .setLock('pessimistic_write')
        .getMany();

      const shieldItem = defenderResources.find((ur) =>
        ['SHIELD', 'MAN'].includes(ur.resource.code.toUpperCase()),
      );
      const targetGoldItem = defenderResources.find((ur) =>
        ['GOLD', 'COIN'].includes(ur.resource.code.toUpperCase()),
      );

      const shieldBal = shieldItem ? Number(shieldItem.balance) : 0;

      // Consume attacker's item
      consumedUr!.balance = (Number(consumedUr!.balance) - 1).toString();
      await urRepo.save(consumedUr!);

      // Eco log for consumed item
      await ecoLogRepo.save(
        ecoLogRepo.create({
          userId,
          resourceType: consumedCode,
          amount: -1,
          source: 'pvp_raid_fee',
        }),
      );

      // Check Shield
      if (shieldBal > 0) {
        shieldItem!.balance = (shieldBal - 1).toString();
        await urRepo.save(shieldItem!);

        await actionLogRepo.save(
          actionLogRepo.create({
            attackerId: userId,
            defenderId: dto.targetUserId,
            actionType: 'RAID',
            wasBlocked: true,
          }),
        );

        return {
          success: true,
          message: 'Đối thủ có Màn bắt côn trùng! Lượt Hái Lộc bị chặn.',
          stolenAmount: 0,
          wasBlocked: true,
        };
      }

      // Successful Raid
      const targetGoldBal = targetGoldItem ? Number(targetGoldItem.balance) : 0;
      if (targetGoldBal <= 0) {
        await actionLogRepo.save(
          actionLogRepo.create({
            attackerId: userId,
            defenderId: dto.targetUserId,
            actionType: 'RAID',
            stolenAmount: 0,
            wasBlocked: false,
          }),
        );
        return {
          success: true,
          message: 'Đối thủ không có Vàng để hái!',
          stolenAmount: 0,
          wasBlocked: false,
        };
      }

      // Random 5% - 15%
      const percentage = Math.floor(Math.random() * (15 - 5 + 1) + 5) / 100;
      let stolenAmount = Math.floor(targetGoldBal * percentage);
      // Cap at 1000
      if (stolenAmount > 1000) stolenAmount = 1000;
      if (stolenAmount < 1) stolenAmount = 1;

      targetGoldItem!.balance = (targetGoldBal - stolenAmount).toString();
      await urRepo.save(targetGoldItem!);

      // Give to attacker
      let attackerGoldItem = attackerResources.find((ur) =>
        ['GOLD', 'COIN'].includes(ur.resource.code.toUpperCase()),
      );
      if (attackerGoldItem) {
        attackerGoldItem.balance = (
          Number(attackerGoldItem.balance) + stolenAmount
        ).toString();
        await urRepo.save(attackerGoldItem);
      } else {
        // Create gold balance if they don't have it (requires fetching Gold resource, simplified here)
        // Usually handled gracefully or Gold is pre-seeded. We'll throw if missing for simplicity,
        // or we fetch the gold resource ID.
        const goldRes = await manager
          .getRepository('Resource')
          .findOne({ where: { code: targetGoldItem!.resource.code } });
        if (goldRes) {
          attackerGoldItem = urRepo.create({
            userId,
            resourceId: (goldRes as any).id,
            balance: stolenAmount.toString(),
          });
          await urRepo.save(attackerGoldItem);
        }
      }

      // Eco logs
      await ecoLogRepo.save(
        ecoLogRepo.create({
          userId: dto.targetUserId,
          resourceType: targetGoldItem!.resource.code,
          amount: -stolenAmount,
          source: 'pvp_raided',
        }),
      );
      await ecoLogRepo.save(
        ecoLogRepo.create({
          userId,
          resourceType: targetGoldItem!.resource.code,
          amount: stolenAmount,
          source: 'pvp_raid_reward',
        }),
      );

      await actionLogRepo.save(
        actionLogRepo.create({
          attackerId: userId,
          defenderId: dto.targetUserId,
          actionType: 'RAID',
          stolenAmount,
          wasBlocked: false,
        }),
      );

      return {
        success: true,
        message: 'Hái Lộc thành công!',
        stolenAmount,
        wasBlocked: false,
      };
    });
  }

  async attack(userId: string, dto: AttackDto): Promise<any> {
    return await this.dataSource.transaction(async (manager) => {
      const urRepo = manager.getRepository(UserResource);
      const actionLogRepo = manager.getRepository(PvpActionLog);
      const ecoLogRepo = manager.getRepository(EconomyLog);
      const utRepo = manager.getRepository(UserTree);

      const targetTree = await utRepo.findOne({
        where: { id: dto.targetUserTreeId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!targetTree)
        throw new NotFoundException('Không tìm thấy cây mục tiêu');
      if (targetTree.userId === userId)
        throw new BadRequestException('Không thể thả bọ vườn nhà mình');
      if (targetTree.isDamaged)
        throw new BadRequestException('Cây này đã bị héo rồi');

      // Fetch attacker items
      const attackerResources = await urRepo
        .createQueryBuilder('ur')
        .innerJoinAndSelect('ur.resource', 'r')
        .where('ur.userId = :userId', { userId })
        .andWhere('UPPER(r.code) IN (:...codes)', {
          codes: ['ATTACK_ITEM'],
        })
        .setLock('pessimistic_write')
        .getMany();

      const attackItem = attackerResources.find((ur) =>
        ['ATTACK_ITEM'].includes(ur.resource.code.toUpperCase()),
      );

      const attackBal = attackItem ? Number(attackItem.balance) : 0;
      if (attackBal <= 0) {
        throw new BadRequestException('Không đủ Bọ Xít để Thả bọ');
      }

      // Deduct attack item
      attackItem!.balance = (attackBal - 1).toString();
      await urRepo.save(attackItem!);
      await ecoLogRepo.save(
        ecoLogRepo.create({
          userId,
          resourceType: attackItem!.resource.code,
          amount: -1,
          source: 'pvp_attack_fee',
        }),
      );

      // Check Shield
      const defenderShield = await urRepo
        .createQueryBuilder('ur')
        .innerJoinAndSelect('ur.resource', 'r')
        .where('ur.userId = :defenderId', { defenderId: targetTree.userId })
        .andWhere('UPPER(r.code) IN (:...codes)', {
          codes: ['SHIELD', 'MAN'],
        })
        .setLock('pessimistic_write')
        .getOne();

      const shieldBal = defenderShield ? Number(defenderShield.balance) : 0;

      if (shieldBal > 0) {
        defenderShield!.balance = (shieldBal - 1).toString();
        await urRepo.save(defenderShield!);

        await actionLogRepo.save(
          actionLogRepo.create({
            attackerId: userId,
            defenderId: targetTree.userId,
            actionType: 'ATTACK',
            targetTreeId: targetTree.id,
            wasBlocked: true,
          }),
        );

        return {
          success: true,
          message:
            'Đối thủ có Màn bắt côn trùng! Bọ Xít của bạn đã bị tiêu diệt.',
          wasBlocked: true,
        };
      }

      // Successful Attack
      targetTree.isDamaged = true;
      await utRepo.save(targetTree);

      await actionLogRepo.save(
        actionLogRepo.create({
          attackerId: userId,
          defenderId: targetTree.userId,
          actionType: 'ATTACK',
          targetTreeId: targetTree.id,
          wasBlocked: false,
        }),
      );

      return {
        success: true,
        message: 'Thả Bọ thành công! Cây của đối thủ đã bị héo.',
        wasBlocked: false,
      };
    });
  }
}
