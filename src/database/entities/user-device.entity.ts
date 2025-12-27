import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('user_devices')
@Index(['userId', 'deviceId'], { unique: true })
export class UserDevice extends BaseEntity {
  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ name: 'device_id' })
  @Index()
  deviceId: string; // Unique device identifier (UUID from client)

  @Column({ name: 'device_name', nullable: true })
  deviceName?: string; // e.g., "iPhone 13 Pro"

  @Column({ name: 'device_type' })
  deviceType: string; // 'ios' | 'android' | 'web'

  @Column({ name: 'device_os', nullable: true })
  deviceOs?: string; // e.g., "iOS 17.1"

  @Column({ name: 'device_model', nullable: true })
  deviceModel?: string; // e.g., "iPhone15,3"

  @Column({ name: 'browser', nullable: true })
  browser?: string; // e.g., "Chrome 120.0"

  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  @Column({ name: 'fcm_token', nullable: true })
  fcmToken?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'last_active' })
  lastActive: Date;

  @Column({ name: 'logged_out_at', type: 'timestamp', nullable: true })
  loggedOutAt?: Date | null;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
