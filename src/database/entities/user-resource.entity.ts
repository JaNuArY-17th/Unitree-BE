import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Resource } from './resource.entity';

/**
 * UserResource Entity
 *
 * Lưu số dư tài nguyên của từng user.
 * Mỗi user chỉ có một record cho mỗi loại resource.
 */
@Entity('user_resources')
@Unique('unique_user_resource', ['userId', 'resourceId'])
export class UserResource extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId!: string;

  @Column({ name: 'resource_id', type: 'uuid' })
  @Index()
  resourceId!: string;

  @Column({ type: 'bigint', default: 0 })
  balance!: string; // bigint được TypeORM trả về dạng string

  // Relations
  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne('Resource', 'userResources', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'resource_id' })
  resource!: Resource;
}
