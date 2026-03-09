import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { TokensService } from '../tokens/tokens.service';
import { DevicesService } from '../devices/devices.service';
import { DeviceInfo } from '../devices/interfaces';
import { Student } from '../../database/entities/student.entity';
import { FirebaseService } from '../../services/firebase.service';
import * as admin from 'firebase-admin';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    private readonly tokensService: TokensService,
    private readonly devicesService: DevicesService,
    private readonly firebaseService: FirebaseService,
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

  async googleLogin(idToken: string) {
    let decodedToken: admin.auth.DecodedIdToken;
    try {
      decodedToken = await this.firebaseService.verifyIdToken(idToken);
    } catch {
      throw new UnauthorizedException('Invalid Google ID token');
    }

    const { email, name, picture, uid } = decodedToken;
    if (!email) {
      throw new UnauthorizedException('Google account does not have an email');
    }

    let user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      // Attempt to link to the student table by email to get a student_id
      const student = await this.studentRepository.findOne({
        where: { email },
      });
      const fallBackStudentId = student ? student.studentId : `google-${uid}`;
      const defaultAvatar = picture || undefined;
      const defaultUsername =
        String(email.split('@')[0]) || `user_${uid.slice(0, 6)}`;

      user = this.userRepository.create({
        email,
        fullname: name || 'Google User',
        username: defaultUsername,
        nickname: name || 'Google User',
        studentId: fallBackStudentId,
        avatar: defaultAvatar,
        role: 'user', // Default role
      });

      user = await this.userRepository.save(user);
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
    } catch {
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
    loginDto: {
      email: string;
      deviceId: string;
      deviceName?: string;
      deviceType: string;
      deviceOs?: string;
      deviceModel?: string;
      browser?: string;
      fcmToken?: string;
    },
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

    return this.completeDeviceLogin(user, deviceInfo);
  }

  /**
   * Complete device login after OTP verification
   */
  async completeDeviceLogin(user: User, deviceInfo: DeviceInfo) {
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
