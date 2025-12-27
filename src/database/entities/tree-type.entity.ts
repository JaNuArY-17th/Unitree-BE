import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tree } from './tree.entity';

/**
 * Tree Type Entity
 *
 * Manages different types of trees that users can plant
 * Admin can add/edit tree types without code changes
 */
@Entity('tree_types')
export class TreeType extends BaseEntity {
  @Column({ unique: true })
  @Index()
  code: string; // Unique identifier (e.g., 'oak', 'pine', 'maple')

  @Column()
  name: string; // Display name (e.g., 'Oak Tree', 'Pine Tree')

  @Column({ type: 'text' })
  description: string; // Description for users

  @Column({ nullable: true })
  image?: string; // Image URL

  @Column({ name: 'growth_stages', default: 5 })
  growthStages: number; // Number of stages to reach maturity

  @Column({ name: 'points_per_stage', default: 100 })
  pointsPerStage: number; // Points required to advance one stage

  @Column({ name: 'water_frequency_hours', default: 24 })
  waterFrequencyHours: number; // How often user needs to water (hours)

  @Column({
    name: 'co2_offset_kg',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  co2OffsetKg: number; // CO2 offset when tree reaches maturity (kg)

  @Column({ name: 'is_active', default: true })
  isActive: boolean; // Can be planted by users

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number; // Display order in UI

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    rarity?: 'common' | 'rare' | 'epic' | 'legendary';
    seasonalBonus?: boolean;
    specialAbility?: string;
    unlockLevel?: number;
    unlockPoints?: number;
  };

  // Relations
  @OneToMany(() => Tree, (tree) => tree.treeType)
  trees: Tree[];
}
