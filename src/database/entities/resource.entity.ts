import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';

/**
 * Resource Entity
 *
 * Bảng định nghĩa các loại tài nguyên trong game
 * (ví dụ: oxygen, coins, seeds, v.v.)
 */
@Entity('resources')
export class Resource extends BaseEntity {
  @Column({ type: 'varchar', unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  // Relations
  @OneToMany('AirdropCode', 'resource')
  airdropCodes: any[];

  @OneToMany('UserResource', 'resource')
  userResources: any[];
}
