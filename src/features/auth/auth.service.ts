import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LoginWithDeviceDto } from './dto/login-with-device.dto';
import { VerifyDeviceDto } from './dto/verify-device.dto';
import { CryptoUtil } from '../../shared/utils/crypto.util';
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

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({
      where: [
        { email: registerDto.email },
        { phoneNumber: registerDto.phoneNumber },
      ],
    });

    if (existingUser) {
      throw new ConflictException('Email or phone number already exists');
    }

    const hashedPassword = await CryptoUtil.hashPassword(registerDto.password);
    const referralCode = CryptoUtil.generateRandomToken(8);

    const user = this.userRepository.create({
      email: registerDto.email,
      phoneNumber: registerDto.phoneNumber,
      hashedPassword,
      fullName: registerDto.fullName,
      referralCode,
      referredBy: registerDto.referralCode,
    });

    await this.userRepository.save(user);

    const tokens = await this.tokensService.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await CryptoUtil.comparePassword(
      loginDto.password,
      user.hashedPassword,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    user.lastLogin = new Date();
    await this.userRepository.save(user);

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

      if (!user || !user.isActive) {
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
    loginDto: LoginWithDeviceDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Validate user credentials
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await CryptoUtil.comparePassword(
      loginDto.password,
      user.hashedPassword,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Prepare device info
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

    // Handle device login flow
    const deviceCheck = await this.devicesService.handleDeviceLogin(
      user.id,
      user.email,
      deviceInfo,
    );

    if (deviceCheck.requireOtp) {
      // OTP required for new device
      return {
        requireOtp: true,
        message: deviceCheck.message,
        userId: user.id,
        deviceId: loginDto.deviceId,
      };
    }

    // Device is recognized, proceed with login
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
    // Register/update device
    await this.devicesService.registerDevice(user.id, deviceInfo);

    // Generate tokens
    const tokens = await this.tokensService.generateTokens(user);

    // Session is managed via TokenService (tokens stored in Redis)

    // Update last login
    user.lastLogin = new Date();
    await this.userRepository.save(user);

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
    verifyDto: VerifyDeviceDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Get user email for OTP verification
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify OTP and register device
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

    // Complete login with full device info
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
    // Note: verificationToken and resetPasswordToken removed (now in Redis)
    const { hashedPassword, ...sanitized } = user;
    return sanitized;
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      return null;
    }

    const isPasswordValid = await CryptoUtil.comparePassword(
      password,
      user.hashedPassword,
    );

    if (isPasswordValid) {
      const { hashedPassword, ...result } = user;
      return result;
    }

    return null;
  }
}
