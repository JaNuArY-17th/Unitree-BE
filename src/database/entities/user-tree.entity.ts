import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Tree } from './tree.entity';
import { PvpActionLog } from './pvp-action-log.entity';

/**
 * UserTree Entity
 *
 * Cây của từng user trong game (instance của Tree catalog).
 * Mỗi user có thể sở hữu nhiều cây, mỗi cây thuộc một loại (Tree).
 */
@Entity('user_trees')
@Unique('unique_user_tree', ['userId', 'treeId'])
export class UserTree extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @Column({ name: 'tree_id', type: 'uuid' })
  @Index()
  treeId: string;

  @Column({ type: 'smallint', default: 1 })
  level: number;

  @Column({ name: 'is_damaged', default: false })
  isDamaged: boolean;

  @Column({ name: 'upgrade_end_time', type: 'timestamp', nullable: true })
  upgradeEndTime?: Date;

  @Column({ name: 'asset_path', type: 'varchar', nullable: true })
  assetPath?: string;

  @Column({
    name: 'last_harvest_time',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  lastHarvestTime: Date;

  @Column({ name: 'damaged_at', type: 'timestamp', nullable: true })
  damagedAt: Date | null;

  /**
   * Optimistic locking version counter.
   * Tăng lên mỗi lần record được update để tránh race condition.
   */
  @Column({ default: 1 })
  version: number;

  /**
   * Checksum dùng để validate tính toàn vẹn của dữ liệu cây.
   */
  @Column({ type: 'varchar' })
  checksum: string;

  // Relations
  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne('Tree', 'userTrees', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tree_id' })
  tree: Tree;

  @OneToMany('PvpActionLog', 'targetTree')
  pvpActionLogs: PvpActionLog[];
}
