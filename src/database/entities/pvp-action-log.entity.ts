import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { UserTree } from './user-tree.entity';

/**
 * PvpActionLog Entity
 *
 * Log hành động PvP giữa các user (tấn công / phòng thủ).
 * Ghi lại ai tấn công ai, cây nào bị nhắm tới, số tài nguyên bị đánh cắp.
 * Không kế thừa BaseEntity vì chỉ cần created_at.
 */
@Entity('pvp_action_logs')
export class PvpActionLog {
  @Column({
    type: 'uuid',
    primary: true,
    generated: 'uuid',
  })
  id!: string;

  @Column({ name: 'attacker_id', type: 'uuid' })
  @Index()
  attackerId!: string;

  @Column({ name: 'defender_id', type: 'uuid' })
  @Index()
  defenderId!: string;

  @Column({ name: 'action_type', type: 'varchar' })
  actionType!: string;

  @Column({ name: 'stolen_amount', nullable: true })
  stolenAmount?: number;

  @Column({ name: 'target_tree_id', type: 'uuid', nullable: true })
  @Index()
  targetTreeId?: string;

  @Column({ name: 'was_blocked', default: false })
  wasBlocked!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  // Relations
  @ManyToOne('User', { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'attacker_id' })
  attacker!: User;

  @ManyToOne('User', { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'defender_id' })
  defender!: User;

  @ManyToOne('UserTree', 'pvpActionLogs', {
    onDelete: 'NO ACTION',
    nullable: true,
  })
  @JoinColumn({ name: 'target_tree_id' })
  targetTree!: UserTree;
}
