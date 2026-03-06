import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { TokensService } from '../tokens/tokens.service';
import { DevicesService } from '../devices/devices.service';
import { DeviceInfo } from '../devices/interfaces';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly tokensService: TokensService,
    private readonly devicesService: DevicesService,
  ) {}

  async login(loginDto: { email: string; password?: string }) {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.tokensService.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.tokensService.verifyRefreshToken(refreshToken);

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.tokensService.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async logout(userId: string) {
    await this.tokensService.revokeAllTokens(userId);
    return { message: 'Logged out successfully' };
  }

  /**
   * Login with device tracking
   */
  async loginWithDevice(
    loginDto: { email: string; deviceId: string; deviceName?: string; deviceType: string; deviceOs?: string; deviceModel?: string; browser?: string; fcmToken?: string },
    ipAddress?: string,
    userAgent?: string,
  ) {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const deviceInfo: DeviceInfo = {
      deviceId: loginDto.deviceId,
      deviceName: loginDto.deviceName,
      deviceType: loginDto.deviceType,
      deviceOs: loginDto.deviceOs,
      deviceModel: loginDto.deviceModel,
      browser: loginDto.browser,
      ipAddress,
      userAgent,
    };

    const deviceCheck = await this.devicesService.handleDeviceLogin(
      user.id,
      user.email,
      deviceInfo,
    );

    if (deviceCheck.requireOtp) {
      return {
        requireOtp: true,
        message: deviceCheck.message,
        userId: user.id,
        deviceId: loginDto.deviceId,
      };
    }

    return this.completeDeviceLogin(user, deviceInfo, loginDto.fcmToken);
  }

  /**
   * Complete device login after OTP verification
   */
  async completeDeviceLogin(
    user: User,
    deviceInfo: DeviceInfo,
    fcmToken?: string,
  ) {
    await this.devicesService.registerDevice(user.id, deviceInfo);

    const tokens = await this.tokensService.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
      deviceId: deviceInfo.deviceId,
    };
  }

  /**
   * Verify device with OTP and complete login
   */
  async verifyDeviceAndLogin(
    userId: string,
    verifyDto: { deviceId: string; otpCode: string },
    ipAddress?: string,
    userAgent?: string,
  ) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const baseDeviceInfo: DeviceInfo = {
      deviceId: verifyDto.deviceId,
      deviceType: 'unknown',
    };

    await this.devicesService.verifyAndRegisterDevice(
      userId,
      user.email,
      baseDeviceInfo,
      verifyDto.otpCode,
    );

    const deviceInfo: DeviceInfo = {
      deviceId: verifyDto.deviceId,
      deviceType: 'unknown',
      ipAddress,
      userAgent,
    };

    return this.completeDeviceLogin(user, deviceInfo);
  }

  /**
   * Logout from specific device
   */
  async logoutDevice(userId: string, deviceId: string) {
    await this.devicesService.logoutDevice(deviceId);
    return { message: 'Device logged out successfully' };
  }

  /**
   * Get user's devices
   */
  async getUserDevices(userId: string) {
    return this.devicesService.getUserDevices(userId);
  }

  /**
   * Get active sessions
   */
  async getActiveSessions(userId: string) {
    return this.devicesService.getActiveSessions(userId);
  }

  private sanitizeUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      fullname: user.fullname,
      nickname: user.nickname,
      studentId: user.studentId,
      avatar: user.avatar,
      role: user.role,
      spinCount: user.spinCount,
      gloveCount: user.gloveCount,
      wateringCanCount: user.wateringCanCount,
      shieldCount: user.shieldCount,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async validateUser(email: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { email } });
    return user || null;
  }
}
