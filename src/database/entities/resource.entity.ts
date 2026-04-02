import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { AirdropCode } from './airdrop-code.entity';
import { UserResource } from './user-resource.entity';

/**
 * Resource Entity
 *
 * Bảng định nghĩa các loại tài nguyên trong game
 * (ví dụ: oxygen, coins, seeds, v.v.)
 */
@Entity('resources')
export class Resource extends BaseEntity {
  @Column({ type: 'varchar', unique: true })
  code!: string;

  @Column({ type: 'varchar', unique: false })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'assets_path', type: 'varchar', nullable: true })
  assetsPath?: string;

  @Column({ name: 'max_stack', type: 'int', nullable: true })
  maxStack?: number;

  // Relations
  @OneToMany('AirdropCode', 'resource')
  airdropCodes!: AirdropCode[];

  @OneToMany('UserResource', 'resource')
  userResources!: UserResource[];
}
