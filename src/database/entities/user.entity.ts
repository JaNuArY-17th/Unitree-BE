import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserRole } from '../../shared/constants/roles.constant';
import { WifiSession } from './wifi-session.entity';
import { Point } from './point.entity';
import { Tree } from './tree.entity';
import { ConversationParticipant } from './conversation-participant.entity';
import { Message } from './message.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  @Index()
  email: string;

  @Column({ name: 'phone_number', unique: true, nullable: true })
  @Index()
  phoneNumber?: string;

  @Column({ name: 'hashed_password' })
  hashedPassword: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ name: 'total_points', default: 0 })
  totalPoints: number;

  @Column({ name: 'available_points', default: 0 })
  availablePoints: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'verification_token', nullable: true })
  verificationToken?: string;

  @Column({ name: 'reset_password_token', nullable: true })
  resetPasswordToken?: string;

  @Column({ name: 'reset_password_expires', nullable: true })
  resetPasswordExpires?: Date;

  @Column({ name: 'last_login', nullable: true })
  lastLogin?: Date;

  @Column({ name: 'referral_code', unique: true, nullable: true })
  @Index()
  referralCode?: string;

  @Column({ name: 'referred_by', nullable: true })
  referredBy?: string;

  @Column({ name: 'fcm_token', nullable: true })
  fcmToken?: string;

  // Relations
  @OneToMany(() => WifiSession, (session) => session.user)
  wifiSessions: WifiSession[];

  @OneToMany(() => Point, (point) => point.user)
  points: Point[];

  @OneToMany(() => Tree, (tree) => tree.user)
  trees: Tree[];

  @OneToMany(() => ConversationParticipant, (participant) => participant.user)
  conversationParticipants: ConversationParticipant[];

  @OneToMany(() => Message, (message) => message.sender)
  messages: Message[];
}
