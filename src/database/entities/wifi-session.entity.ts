import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { WifiSessionStatus } from '../../shared/constants/enums.constant';

/**
 * WiFi Session Entity
 *
 * Simplified design:
 * - FE validates WiFi connection (BSSID check)
 * - BE only manages session and calculates points
 * - Point calculation: 1 point per minute (no maximum)
 */
@Entity('wifi_sessions')
@Index('idx_wifi_user_status', ['userId', 'status'])
@Index('idx_wifi_last_heartbeat', ['lastHeartbeat'], {
  where: "status = 'active'",
})
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

  @Column({ name: 'last_heartbeat', type: 'timestamp', nullable: true })
  lastHeartbeat?: Date;

  // Optional metadata for debugging/analytics
  @Column({ name: 'device_id', nullable: true })
  deviceId?: string;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  // Relations
  @ManyToOne(() => User, (user) => user.wifiSessions)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
