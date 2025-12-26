import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { PointTransactionType } from '../../shared/constants/enums.constant';

@Entity('points')
export class Point extends BaseEntity {
  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column()
  amount: number;

  @Column({
    type: 'enum',
    enum: PointTransactionType,
  })
  type: PointTransactionType;

  @Column({ name: 'reference_id', nullable: true })
  referenceId?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'balance_after' })
  balanceAfter: number;

  // Relations
  @ManyToOne(() => User, (user) => user.points)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
