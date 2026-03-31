import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

/**
 * EconomyLog Entity
 *
 * Lịch sử giao dịch tài nguyên của user.
 * Ghi lại mọi thay đổi tài nguyên (earn / spend) cùng nguồn gốc.
 * Không kế thừa BaseEntity vì không cần updated_at, deleted_at.
 */
@Entity('economy_logs')
export class EconomyLog {
  @Column({
    type: 'uuid',
    primary: true,
    generated: 'uuid',
  })
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  /**
   * Loại tài nguyên (tên resource, vd: 'oxygen', 'coin')
   */
  @Column({ name: 'resource_type', type: 'varchar' })
  resourceType: string;

  /**
   * Số lượng thay đổi (dương = nhận, âm = chi)
   */
  @Column()
  amount: number;

  /**
   * Nguồn gốc giao dịch (vd: 'harvest', 'airdrop', 'pvp_steal')
   */
  @Column({ type: 'varchar' })
  source: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  // Relations
  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
