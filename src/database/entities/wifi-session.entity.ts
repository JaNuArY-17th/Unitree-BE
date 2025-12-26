import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { WifiSessionStatus } from '../../shared/constants/enums.constant';

@Entity('wifi_sessions')
export class WifiSession extends BaseEntity {
  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ name: 'start_time' })
  startTime: Date;

  @Column({ name: 'end_time', nullable: true })
  endTime?: Date;

  @Column({ name: 'duration_minutes', default: 0 })
  durationMinutes: number;

  @Column({ name: 'points_earned', default: 0 })
  pointsEarned: number;

  @Column({
    type: 'enum',
    enum: WifiSessionStatus,
    default: WifiSessionStatus.ACTIVE,
  })
  status: WifiSessionStatus;

  @Column({ name: 'device_id', nullable: true })
  deviceId?: string;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  @Column({ name: 'mac_address', nullable: true })
  macAddress?: string;

  @Column({ name: 'location', nullable: true })
  location?: string;

  // Relations
  @ManyToOne(() => User, (user) => user.wifiSessions)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
