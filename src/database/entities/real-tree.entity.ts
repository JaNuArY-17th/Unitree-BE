import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { RealTreeStatus } from '../../shared/constants/enums.constant';

@Entity('real_trees')
export class RealTree extends BaseEntity {
  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ name: 'tree_type' })
  treeType: string;

  @Column({ name: 'planted_location' })
  plantedLocation: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude?: number;

  @Column({ name: 'planted_date' })
  plantedDate: Date;

  @Column({
    type: 'enum',
    enum: RealTreeStatus,
    default: RealTreeStatus.PENDING,
  })
  status: RealTreeStatus;

  @Column({ name: 'verification_image', nullable: true })
  verificationImage?: string;

  @Column({ name: 'verified_by', nullable: true })
  verifiedBy?: string;

  @Column({ name: 'verified_date', nullable: true })
  verifiedDate?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'qr_code', nullable: true })
  qrCode?: string;
}
