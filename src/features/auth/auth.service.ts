import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { TokensService } from '../tokens/tokens.service';
import { DevicesService } from '../devices/devices.service';
import { DeviceInfo } from '../devices/interfaces';
import { Student } from '../../database/entities/student.entity';
import { FirebaseService } from '../../services/firebase.service';
import { UserRole } from '../../shared/constants/roles.constant';
import { UsersService } from '../users/users.service';
import { UserInfoDto } from '../users/dto/user-info.dto';
import { plainToInstance } from 'class-transformer';
import * as admin from 'firebase-admin';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    private readonly tokensService: TokensService,
    private readonly devicesService: DevicesService,
    private readonly firebaseService: FirebaseService,
    private readonly usersService: UsersService,
  ) {}

  async login(loginDto: { email: string; password?: string }) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.student', 'student')
      .where('LOWER(student.email) = LOWER(:email)', {
        email: loginDto.email,
      })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.tokensService.generateTokens(user);

    return {
      user: plainToInstance(UserInfoDto, user),
      ...tokens,
    };
  }

  async googleLogin(idToken: string) {
    let decodedToken: admin.auth.DecodedIdToken;
    try {
      decodedToken = await this.firebaseService.verifyIdToken(idToken);
    } catch (error: any) {
      this.logger.warn(
        `Google token verification failed: ${error?.message || 'unknown error'}`,
      );

      if (error?.message?.includes('Firebase is not initialized')) {
        throw new InternalServerErrorException(
          'Firebase authentication is not configured on server',
        );
      }

      throw new UnauthorizedException('Invalid Google ID token');
    }

    const { email, picture } = decodedToken;
    if (!email) {
      throw new UnauthorizedException('Google account does not have an email');
    }

    let user = await this.userRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.student', 'student')
      .where('LOWER(student.email) = LOWER(:email)', { email })
      .getOne();

    if (!user) {
      // Only check if email exists in students table, ignore domain
      // Case-insensitive email check
      const student = await this.studentRepository
        .createQueryBuilder('student')
        .where('LOWER(student.email) = LOWER(:email)', { email })
        .getOne();
      if (!student) {
        throw new UnauthorizedException('auth.must_use_school_email');
      }

      const defaultAvatar = picture || undefined;
      const defaultUsername = String(email.split('@')[0]);

      user = this.userRepository.create({
        username: defaultUsername,
        student: student,
        avatar: defaultAvatar,
        role: UserRole.USER, // Default role
      });

      user = await this.userRepository.save(user);
    }

    // Tạo referral code nếu chưa có
    await this.usersService.generateReferralCode(user.id);

    // TokensService automatically stores generated tokens into Redis
    const tokens = await this.tokensService.generateTokens(user);

    return {
      user: plainToInstance(UserInfoDto, user),
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.tokensService.verifyRefreshToken(refreshToken);

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
        relations: ['student'],
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
      relations: ['student'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return plainToInstance(UserInfoDto, user);
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
    const user = await this.userRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.student', 'student')
      .where('LOWER(student.email) = LOWER(:email)', {
        email: loginDto.email,
      })
      .getOne();

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
      user.student.email,
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
      user: plainToInstance(UserInfoDto, user),
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
      relations: ['student'],
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
      user.student.email,
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

  async validateUser(email: string): Promise<any> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.student', 'student')
      .where('LOWER(student.email) = LOWER(:email)', { email })
      .getOne();
    return user || null;
  }
}
