import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

/**
 * AirdropCode Entity
 *
 * Mã airdrop cho phép user nhận tài nguyên miễn phí.
 * Mỗi code gắn với một loại resource và có số lượng nhất định.
 */
@Entity('airdrop_codes')
export class AirdropCode extends BaseEntity {
  @Column({ type: 'varchar', unique: true })
  code: string;

  @Column({ name: 'resource_id', type: 'uuid' })
  @Index()
  resourceId: string;

  @Column()
  amount: number;

  @Column({ name: 'expiration_date', type: 'timestamp', nullable: true })
  expirationDate?: Date;

  // Relations
  @ManyToOne('Resource', 'airdropCodes', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'resource_id' })
  resource: any;
}
