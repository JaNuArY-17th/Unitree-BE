import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserTree } from './user-tree.entity';

/**
 * Tree Entity (Catalog)
 *
 * Định nghĩa các loại cây trong game (template/catalog).
 * Đây là bảng master data, không phải cây của từng user.
 * Cây của user nằm ở UserTree.
 */
@Entity('trees')
export class Tree extends BaseEntity {
  @Column({ type: 'varchar', unique: true })
  code: string;

  @Column({ type: 'varchar', unique: true })
  name: string;

  @Column({ name: 'tree_type', type: 'varchar' })
  treeType: string;

  @Column({ name: 'max_level', type: 'smallint' })
  maxLevel: number;

  @Column({ name: 'cost_base' })
  costBase: number;

  @Column({ name: 'cost_rate', type: 'decimal' })
  costRate: number;

  @Column({ name: 'oxy_base', nullable: true })
  oxyBase?: number;

  @Column({ name: 'oxy_rate', type: 'decimal', nullable: true })
  oxyRate?: number;

  @Column({ name: 'time_base', type: 'integer', default: 1 })
  timeBase: number;

  @Column({ name: 'time_rate', type: 'decimal', default: 1 })
  timeRate: number;

  @Column({ name: 'perk_base', type: 'decimal', nullable: true })
  perkBase?: number;

  @Column({ name: 'perk_step', type: 'decimal', nullable: true })
  perkStep?: number;

  @Column({ name: 'slot_index', type: 'smallint' })
  slotIndex: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'assets_path', type: 'varchar' })
  assetsPath: string;

  @Column({ name: 'unlock_condition', type: 'text', nullable: true })
  unlockCondition?: string;

  // Relations
  @OneToMany('UserTree', 'tree')
  userTrees: UserTree[];
}
