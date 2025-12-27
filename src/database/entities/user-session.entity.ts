import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { UserDevice } from './user-device.entity';

@Entity('user_sessions')
export class UserSession extends BaseEntity {
  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ name: 'device_id' })
  @Index()
  deviceId: string;

  @Column({ name: 'access_token_id' })
  @Index()
  accessTokenId: string; // JWT jti

  @Column({ name: 'refresh_token_id' })
  @Index()
  refreshTokenId: string; // JWT jti

  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'expires_at' })
  expiresAt: Date;

  @Column({ name: 'last_active' })
  lastActive: Date;

  @Column({ name: 'logged_out_at', type: 'timestamp', nullable: true })
  loggedOutAt?: Date | null;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => UserDevice, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'device_id' })
  device: UserDevice;
}
