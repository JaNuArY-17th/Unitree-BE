import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { CacheService } from '../../../services/cache.service';

/**
 * OTP Types
 */
export enum OtpType {
  EMAIL_VERIFICATION = 'email_verification',
  PHONE_VERIFICATION = 'phone_verification',
  PASSWORD_RESET = 'password_reset',
  DEVICE_VERIFICATION = 'device_verification',
  TWO_FACTOR_AUTH = 'two_factor_auth',
}

/**
 * OTP Data Structure (stored in Redis)
 */
interface OtpData {
  code: string; // Hashed OTP code
  attempts: number; // Failed verification attempts
  userId?: string; // Associated user ID
  createdAt: number; // Timestamp
  metadata?: any; // Additional data
}

/**
 * Redis-based OTP Service
 *
 * Inspired by Ensogo-IAM best practices:
 * - Store OTPs in Redis (not database)
 * - Auto-expiration with TTL
 * - Fast access (< 5ms)
 * - No cleanup jobs needed
 */
@Injectable()
export class OtpRedisService {
  private readonly logger = new Logger(OtpRedisService.name);

  // TTL constants (in seconds)
  private readonly TTL = {
    [OtpType.EMAIL_VERIFICATION]: 300, // 5 minutes
    [OtpType.PHONE_VERIFICATION]: 300, // 5 minutes
    [OtpType.PASSWORD_RESET]: 600, // 10 minutes
    [OtpType.DEVICE_VERIFICATION]: 300, // 5 minutes
    [OtpType.TWO_FACTOR_AUTH]: 300, // 5 minutes
  };

  private readonly MAX_ATTEMPTS = 5;

  constructor(private readonly cacheService: CacheService) {}

  /**
   * Generate OTP code
   * @param type OTP type
   * @param identifier Email, phone number, or user+device ID
   * @param userId Optional user ID
   * @param metadata Optional additional data
   * @returns Plain OTP code (to send via email/SMS)
   */
  async generateOTP(
    type: OtpType,
    identifier: string,
    userId?: string,
    metadata?: any,
  ): Promise<string> {
    // Generate 6-digit code
    const code = this.generateRandomCode(6);

    // Hash the code before storing
    const hashedCode = await bcrypt.hash(code, 10);

    // Build Redis key
    const key = this.buildKey(type, identifier, userId);

    // Store in Redis with TTL
    const otpData: OtpData = {
      code: hashedCode,
      attempts: 0,
      userId,
      createdAt: Date.now(),
      metadata,
    };

    const ttl = this.getTTL(type);
    await this.cacheService.set(key, otpData, ttl);

    this.logger.log(`OTP generated for ${type}:${identifier} (TTL: ${ttl}s)`);

    // Return plain code to send
    return code;
  }

  /**
   * Verify OTP code
   * @param type OTP type
   * @param identifier Email, phone number, or user+device ID
   * @param code Plain OTP code from user input
   * @param userId Optional user ID (for device verification)
   * @returns true if valid, throws error if invalid
   */
  async verifyOTP(
    type: OtpType,
    identifier: string,
    code: string,
    userId?: string,
  ): Promise<boolean> {
    const key = this.buildKey(type, identifier, userId);
    const data = await this.cacheService.get<OtpData>(key);

    // Check if OTP exists
    if (!data) {
      this.logger.warn(`OTP not found or expired: ${key}`);
      throw new BadRequestException('OTP expired or not found');
    }

    // Check max attempts
    if (data.attempts >= this.MAX_ATTEMPTS) {
      await this.cacheService.del(key);
      this.logger.warn(`Max attempts reached for ${key}`);
      throw new BadRequestException(
        'Too many failed attempts. Please request a new OTP.',
      );
    }

    // Verify code
    const isValid = await bcrypt.compare(code, data.code);

    if (!isValid) {
      // Increment attempts
      data.attempts++;
      const ttl = await this.cacheService.ttl(key);
      await this.cacheService.set(key, data, ttl > 0 ? ttl : this.getTTL(type));

      this.logger.warn(
        `Invalid OTP attempt ${data.attempts}/${this.MAX_ATTEMPTS} for ${key}`,
      );
      throw new BadRequestException(
        `Invalid OTP code. ${this.MAX_ATTEMPTS - data.attempts} attempts remaining.`,
      );
    }

    // Success: delete OTP (one-time use)
    await this.cacheService.del(key);
    this.logger.log(`OTP verified and deleted: ${key}`);

    return true;
  }

  /**
   * Check if OTP exists and get remaining time
   * @param type OTP type
   * @param identifier Email, phone number, or user+device ID
   * @param userId Optional user ID
   * @returns TTL in seconds, or null if not found
   */
  async getOtpTTL(
    type: OtpType,
    identifier: string,
    userId?: string,
  ): Promise<number | null> {
    const key = this.buildKey(type, identifier, userId);
    const exists = await this.cacheService.get(key);

    if (!exists) {
      return null;
    }

    const ttl = await this.cacheService.ttl(key);
    return ttl > 0 ? ttl : null;
  }

  /**
   * Delete OTP (cancel/invalidate)
   * @param type OTP type
   * @param identifier Email, phone number, or user+device ID
   * @param userId Optional user ID
   */
  async deleteOTP(
    type: OtpType,
    identifier: string,
    userId?: string,
  ): Promise<void> {
    const key = this.buildKey(type, identifier, userId);
    await this.cacheService.del(key);
    this.logger.log(`OTP deleted: ${key}`);
  }

  /**
   * Build Redis key based on OTP type
   * @private
   */
  private buildKey(type: OtpType, identifier: string, userId?: string): string {
    switch (type) {
      case OtpType.EMAIL_VERIFICATION:
        return `otp:email_verification:${identifier.toLowerCase()}`;

      case OtpType.PHONE_VERIFICATION:
        return `otp:phone_verification:${identifier}`;

      case OtpType.PASSWORD_RESET:
        return `otp:password_reset:${identifier.toLowerCase()}`;

      case OtpType.DEVICE_VERIFICATION:
        if (!userId) {
          throw new Error('userId required for device verification OTP');
        }
        return `otp:device_verification:${userId}:${identifier}`;

      case OtpType.TWO_FACTOR_AUTH:
        if (!userId) {
          throw new Error('userId required for 2FA OTP');
        }
        return `otp:two_factor_auth:${userId}`;

      default:
        throw new Error(`Invalid OTP type: ${type}`);
    }
  }

  /**
   * Get TTL for OTP type
   * @private
   */
  private getTTL(type: OtpType): number {
    return this.TTL[type] || 300;
  }

  /**
   * Generate random numeric code
   * @private
   */
  private generateRandomCode(length: number): string {
    const digits = '0123456789';
    let code = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, digits.length);
      code += digits[randomIndex];
    }

    return code;
  }

  /**
   * Generate secure token (for email verification links, password reset links)
   * @param type Token type
   * @param userId User ID
   * @param data Additional data to store
   * @param ttl TTL in seconds
   * @returns Token string
   */
  async generateToken(
    type: 'email_verification' | 'password_reset',
    userId: string,
    data: any,
    ttl: number = 86400,
  ): Promise<string> {
    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex');

    // Build Redis key
    const key = `token:${type}:${token}`;

    // Store in Redis
    await this.cacheService.set(
      key,
      {
        userId,
        ...data,
        createdAt: Date.now(),
      },
      ttl,
    );

    this.logger.log(
      `Token generated: ${type} for user ${userId} (TTL: ${ttl}s)`,
    );

    return token;
  }

  /**
   * Verify and consume token
   * @param type Token type
   * @param token Token string
   * @returns Token data
   */
  async verifyToken(
    type: 'email_verification' | 'password_reset',
    token: string,
  ): Promise<any> {
    const key = `token:${type}:${token}`;
    const data = await this.cacheService.get(key);

    if (!data) {
      this.logger.warn(`Token not found or expired: ${key}`);
      throw new BadRequestException('Token expired or invalid');
    }

    // Delete token (one-time use)
    await this.cacheService.del(key);
    this.logger.log(`Token verified and deleted: ${key}`);

    return data;
  }

  /**
   * Delete token
   * @param type Token type
   * @param token Token string
   */
  async deleteToken(
    type: 'email_verification' | 'password_reset',
    token: string,
  ): Promise<void> {
    const key = `token:${type}:${token}`;
    await this.cacheService.del(key);
    this.logger.log(`Token deleted: ${key}`);
  }
}
