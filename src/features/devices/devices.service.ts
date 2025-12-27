import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserDevice } from '../../database/entities/user-device.entity';
import { OtpRedisService, OtpType } from '../auth/services/otp-redis.service';
import { TokensService } from '../tokens/tokens.service';
import { EmailService } from '../../services/email.service';

export interface DeviceInfo {
  deviceId: string;
  deviceName?: string;
  deviceType: string;
  deviceOs?: string;
  deviceModel?: string;
  browser?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Device Service - Handles device management and single device login
 *
 * Separated from auth module following Ensogo-IAM pattern
 */
@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  constructor(
    @InjectRepository(UserDevice)
    private readonly deviceRepository: Repository<UserDevice>,
    private readonly otpRedisService: OtpRedisService,
    private readonly tokensService: TokensService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Check if device is recognized
   */
  async isDeviceRecognized(userId: string, deviceId: string): Promise<boolean> {
    const device = await this.deviceRepository.findOne({
      where: { userId, deviceId },
    });

    return !!device;
  }

  /**
   * Check if user has active device (for single device login)
   * Note: Active sessions tracked in Redis via TokensService
   */
  async hasActiveDevice(
    userId: string,
    currentDeviceId: string,
  ): Promise<UserDevice | null> {
    const activeDevice = await this.deviceRepository.findOne({
      where: {
        userId,
        isActive: true,
      },
      order: { lastActive: 'DESC' },
    });

    if (activeDevice && activeDevice.deviceId !== currentDeviceId) {
      return activeDevice;
    }

    return null;
  }

  /**
   * Handle device login flow
   * Returns: { requireOtp: boolean, otpSent?: boolean }
   */
  async handleDeviceLogin(
    userId: string,
    userEmail: string,
    deviceInfo: DeviceInfo,
  ): Promise<{ requireOtp: boolean; otpSent?: boolean; message?: string }> {
    const { deviceId } = deviceInfo;

    // Check if device is recognized
    const isRecognized = await this.isDeviceRecognized(userId, deviceId);

    if (isRecognized) {
      this.logger.log(`Device ${deviceId} is recognized for user ${userId}`);

      // Check for active device (single device login)
      const activeDevice = await this.hasActiveDevice(userId, deviceId);

      if (activeDevice) {
        // Logout from other device
        await this.logoutDevice(activeDevice.deviceId);
        this.logger.log(
          `Logged out device ${activeDevice.deviceId} due to single device policy`,
        );
      }

      // Update device activity
      await this.updateDeviceActivity(deviceId);

      return {
        requireOtp: false,
        message: 'Device recognized, login allowed',
      };
    }

    // New device - require OTP verification
    this.logger.log(`New device ${deviceId} detected for user ${userId}`);

    // Generate OTP
    const otpCode = await this.otpRedisService.generateOTP(
      OtpType.DEVICE_VERIFICATION,
      `${userId}:${deviceId}`,
      userId,
      { email: userEmail, deviceId },
    );

    // Send OTP via email
    try {
      await this.emailService.sendDeviceVerificationEmail(userEmail, otpCode);
      this.logger.log(`OTP email sent to ${userEmail} for device verification`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${userEmail}:`, error);
      // Don't throw - OTP is still valid in Redis
    }

    return {
      requireOtp: true,
      otpSent: true,
      message: 'OTP sent to email for device verification',
    };
  }

  /**
   * Verify device with OTP and register
   */
  async verifyAndRegisterDevice(
    userId: string,
    userEmail: string,
    deviceInfo: DeviceInfo,
    otpCode: string,
  ): Promise<UserDevice> {
    const { deviceId } = deviceInfo;

    // Verify OTP
    await this.otpRedisService.verifyOTP(
      OtpType.DEVICE_VERIFICATION,
      `${userId}:${deviceId}`,
      otpCode,
      userId,
    );

    // Check for active devices (single device policy)
    const activeDevice = await this.hasActiveDevice(userId, deviceId);
    if (activeDevice) {
      // Logout other device
      await this.logoutDevice(activeDevice.deviceId);
      this.logger.log(
        `Logged out device ${activeDevice.deviceId} for new device`,
      );
    }

    // Register device
    const device = await this.registerDevice(userId, deviceInfo);

    this.logger.log(
      `Device ${deviceId} verified and registered for user ${userId}`,
    );

    return device;
  }

  /**
   * Register a new device
   */
  async registerDevice(
    userId: string,
    deviceInfo: DeviceInfo,
  ): Promise<UserDevice> {
    // Check if device already exists
    let device = await this.deviceRepository.findOne({
      where: { userId, deviceId: deviceInfo.deviceId },
    });

    if (device) {
      // Update existing device
      device.deviceName = deviceInfo.deviceName;
      device.deviceType = deviceInfo.deviceType;
      device.deviceOs = deviceInfo.deviceOs;
      device.deviceModel = deviceInfo.deviceModel;
      device.browser = deviceInfo.browser;
      device.ipAddress = deviceInfo.ipAddress;
      device.isActive = true;
      device.lastActive = new Date();
      device.loggedOutAt = null;
    } else {
      // Create new device
      device = this.deviceRepository.create({
        userId,
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName,
        deviceType: deviceInfo.deviceType,
        deviceOs: deviceInfo.deviceOs,
        deviceModel: deviceInfo.deviceModel,
        browser: deviceInfo.browser,
        ipAddress: deviceInfo.ipAddress,
        isActive: true,
        lastActive: new Date(),
      });
    }

    return this.deviceRepository.save(device);
  }

  /**
   * Logout device (mark as inactive, revoke tokens in Redis)
   */
  async logoutDevice(deviceId: string): Promise<void> {
    const device = await this.deviceRepository.findOne({
      where: { deviceId },
    });

    if (!device) {
      return;
    }

    // Mark device as inactive
    device.isActive = false;
    device.loggedOutAt = new Date();
    await this.deviceRepository.save(device);

    // Revoke tokens in Redis (handled by TokensService)
    await this.tokensService.revokeUserTokens(device.userId);

    this.logger.log(`Device ${deviceId} logged out`);
  }

  /**
   * Logout all devices for user
   */
  async logoutAllDevices(userId: string): Promise<void> {
    await this.deviceRepository.update(
      { userId, isActive: true },
      {
        isActive: false,
        loggedOutAt: new Date(),
      },
    );

    // Revoke all tokens in Redis
    await this.tokensService.revokeUserTokens(userId);

    this.logger.log(`All devices logged out for user ${userId}`);
  }

  /**
   * Get active devices (sessions managed in Redis)
   */
  async getActiveSessions(userId: string): Promise<UserDevice[]> {
    return this.deviceRepository.find({
      where: { userId, isActive: true },
      order: { lastActive: 'DESC' },
    });
  }

  /**
   * Get all devices for user
   */
  async getUserDevices(userId: string): Promise<UserDevice[]> {
    return this.deviceRepository.find({
      where: { userId },
      order: { lastActive: 'DESC' },
    });
  }

  /**
   * Update device last active
   */
  async updateDeviceActivity(deviceId: string): Promise<void> {
    await this.deviceRepository.update(
      { deviceId },
      { lastActive: new Date() },
    );
  }

  /**
   * Update device FCM token
   */
  async updateFcmToken(
    userId: string,
    deviceId: string,
    fcmToken: string,
  ): Promise<void> {
    await this.deviceRepository.update({ userId, deviceId }, { fcmToken });
    this.logger.log(`FCM token updated for device ${deviceId}`);
  }

  /**
   * Remove device
   */
  async removeDevice(userId: string, deviceId: string): Promise<void> {
    const device = await this.deviceRepository.findOne({
      where: { userId, deviceId },
    });

    if (!device) {
      throw new BadRequestException('Device not found');
    }

    // Soft delete
    await this.deviceRepository.softRemove(device);

    // Revoke tokens if device is active
    if (device.isActive) {
      await this.tokensService.revokeUserTokens(userId);
    }

    this.logger.log(`Device ${deviceId} removed for user ${userId}`);
  }
}
