import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserTask } from './user-task.entity';

/**
 * Task Entity
 *
 * Định nghĩa các nhiệm vụ trong game.
 * Task có thể là daily (hàng ngày) hoặc one-time.
 */
@Entity('tasks')
export class Task extends BaseEntity {
  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'reward_type', type: 'varchar' })
  rewardType: string;

  @Column({ name: 'reward_amount' })
  rewardAmount: number;

  @Column({ name: 'is_daily', default: true })
  isDaily: boolean;

  // Relations
  @OneToMany('UserTask', 'task')
  userTasks: UserTask[];
}
