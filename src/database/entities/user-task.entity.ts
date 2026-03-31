import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

/**
 * UserTask Entity
 *
 * Trạng thái hoàn thành task của từng user.
 * Mỗi record đại diện cho một lần user nhận/thực hiện một task.
 */
@Entity('user_tasks')
export class UserTask extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @Column({ name: 'task_id', type: 'uuid' })
  @Index()
  taskId: string;

  /**
   * Trạng thái task: PENDING | COMPLETED | CLAIMED
   */
  @Column({ type: 'varchar', default: 'PENDING' })
  status: string;

  // Relations
  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: any;

  @ManyToOne('Task', 'userTasks', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: any;
}
