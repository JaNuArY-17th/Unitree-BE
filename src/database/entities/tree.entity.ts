import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { TreeStatus } from '../../shared/constants/enums.constant';

@Entity('trees')
export class Tree extends BaseEntity {
  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column()
  name: string;

  @Column({ name: 'tree_type' })
  treeType: string;

  @Column({ name: 'growth_stage', default: 0 })
  growthStage: number;

  @Column({ name: 'growth_points', default: 0 })
  growthPoints: number;

  @Column({ name: 'water_level', default: 100 })
  waterLevel: number;

  @Column({ name: 'health', default: 100 })
  health: number;

  @Column({
    type: 'enum',
    enum: TreeStatus,
    default: TreeStatus.GROWING,
  })
  status: TreeStatus;

  @Column({ name: 'last_watered', nullable: true })
  lastWatered?: Date;

  @Column({ name: 'planted_date' })
  plantedDate: Date;

  @Column({ name: 'matured_date', nullable: true })
  maturedDate?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  // Relations
  @ManyToOne(() => User, (user) => user.trees)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
