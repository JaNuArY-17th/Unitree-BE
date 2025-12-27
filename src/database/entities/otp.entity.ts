import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum OtpType {
  EMAIL_VERIFICATION = 'email_verification',
  PHONE_VERIFICATION = 'phone_verification',
  PASSWORD_RESET = 'password_reset',
  DEVICE_VERIFICATION = 'device_verification',
  TWO_FACTOR_AUTH = 'two_factor_auth',
}

@Entity('otps')
export class Otp extends BaseEntity {
  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ name: 'otp_code' })
  otpCode: string; // Hashed OTP

  @Column({ type: 'enum', enum: OtpType })
  type: OtpType;

  @Column({ nullable: true })
  email?: string;

  @Column({ name: 'phone_number', nullable: true })
  phoneNumber?: string;

  @Column({ name: 'device_id', nullable: true })
  @Index()
  deviceId?: string; // For device verification

  @Column({ name: 'expires_at' })
  @Index()
  expiresAt: Date;

  @Column({ name: 'verified_at', nullable: true })
  verifiedAt?: Date;

  @Column({ name: 'attempts', default: 0 })
  attempts: number;

  @Column({ name: 'max_attempts', default: 5 })
  maxAttempts: number;

  @Column({ name: 'is_used', default: false })
  isUsed: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any; // Additional data (IP, user agent, etc.)
}
