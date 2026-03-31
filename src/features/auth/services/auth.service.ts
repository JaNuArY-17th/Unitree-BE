import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../database/entities/user.entity';
import { TokensService } from '../../tokens/services/tokens.service';
import { DevicesService } from '../../devices/services/devices.service';
import { DeviceInfo } from '../../devices/common/interfaces';
import { Student } from '../../../database/entities/student.entity';
import { Tree } from '../../../database/entities/tree.entity';
import { UserTree } from '../../../database/entities/user-tree.entity';
import { Resource } from '../../../database/entities/resource.entity';
import { UserResource } from '../../../database/entities/user-resource.entity';
import { EconomyLog } from '../../../database/entities/economy-log.entity';
import { FirebaseService } from '../../../services/firebase.service';
import { UserRole } from '../../../shared/constants/roles.constant';
import { UsersService } from '../../users/services/users.service';
import { UserInfoDto } from '../../users/dto/user-info.dto';
import { plainToInstance } from 'class-transformer';
import * as admin from 'firebase-admin';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly starterTreeCode = 'BANANA_TREE';
  private readonly fallbackLeafResourceCodes = [
    'GREEN_LEAF',
    'GREEN_LEAVES',
    'LEAF',
    'LEAVES',
    'LA_XANH',
  ];

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Tree)
    private readonly treeRepository: Repository<Tree>,
    @InjectRepository(UserTree)
    private readonly userTreeRepository: Repository<UserTree>,
    @InjectRepository(Resource)
    private readonly resourceRepository: Repository<Resource>,
    @InjectRepository(UserResource)
    private readonly userResourceRepository: Repository<UserResource>,
    @InjectRepository(EconomyLog)
    private readonly economyLogRepository: Repository<EconomyLog>,
    private readonly tokensService: TokensService,
    private readonly devicesService: DevicesService,
    private readonly firebaseService: FirebaseService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  private getStarterLeafAmount(): number {
    const amount =
      this.configService.get<number>('onboarding.starterLeafAmount') ?? 100;
    return Number.isFinite(amount) && amount > 0 ? Math.floor(amount) : 0;
  }

  private getStarterLeafResourceCodes(): string[] {
    const configuredCode = this.configService
      .get<string>('onboarding.starterLeafResourceCode')
      ?.trim();

    const preferredCodes = [
      ...(configuredCode ? [configuredCode] : []),
      ...this.fallbackLeafResourceCodes,
    ];

    const normalizedCodes = preferredCodes
      .map((code) => code.trim())
      .filter((code) => code.length > 0);

    return Array.from(new Set(normalizedCodes));
  }

  private async findResourceByCodeIgnoreCase(
    code: string,
  ): Promise<Resource | null> {
    return this.resourceRepository
      .createQueryBuilder('resource')
      .where('LOWER(resource.code) = LOWER(:code)', { code })
      .getOne();
  }

  private async findStarterLeafResource(): Promise<Resource | null> {
    const preferredCodes = this.getStarterLeafResourceCodes();

    for (const code of preferredCodes) {
      const resource = await this.findResourceByCodeIgnoreCase(code);
      if (resource) {
        return resource;
      }
    }

    return null;
  }

  private async ensureStarterLeafResource(): Promise<Resource | null> {
    const existingResource = await this.findStarterLeafResource();
    if (existingResource) {
      return existingResource;
    }

    const [fallbackCode] = this.getStarterLeafResourceCodes();
    if (!fallbackCode) {
      return null;
    }

    const normalizedCode = fallbackCode.toUpperCase();

    try {
      const createdResource = this.resourceRepository.create({
        code: normalizedCode,
        name: normalizedCode,
        description: 'Starter leaf resource auto-created for onboarding reward',
      });
      return await this.resourceRepository.save(createdResource);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'unknown database error';
      this.logger.warn(
        `Starter leaf resource auto-create failed for code ${normalizedCode}: ${errorMessage}`,
      );
      return this.findResourceByCodeIgnoreCase(normalizedCode);
    }
  }

  private async grantStarterLeafReward(userId: string): Promise<void> {
    const starterLeafAmount = this.getStarterLeafAmount();

    if (starterLeafAmount <= 0) {
      return;
    }

    const leafResource = await this.ensureStarterLeafResource();
    if (!leafResource) {
      this.logger.warn(
        'Starter leaf reward skipped because no matching leaf resource code was found',
      );
      return;
    }

    let userLeafBalance = await this.userResourceRepository.findOne({
      where: {
        userId,
        resourceId: leafResource.id,
      },
    });

    if (!userLeafBalance) {
      userLeafBalance = this.userResourceRepository.create({
        userId,
        resourceId: leafResource.id,
        balance: '0',
      });
    }

    const currentBalance = BigInt(userLeafBalance.balance || '0');
    userLeafBalance.balance = (
      currentBalance + BigInt(starterLeafAmount)
    ).toString();
    await this.userResourceRepository.save(userLeafBalance);

    await this.economyLogRepository.save(
      this.economyLogRepository.create({
        userId,
        resourceType: leafResource.code,
        amount: starterLeafAmount,
        source: 'new_user_starter_reward',
      }),
    );
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private async findUserByEmail(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.student', 'student')
      .where('LOWER(user.email) = LOWER(:email)', { email })
      .getOne();
  }

  private getUserEmailOrThrow(user: User): string {
    const email = user.email?.trim();
    if (!email) {
      throw new BadRequestException('User does not have an email');
    }
    return email;
  }

  async login(loginDto: { email: string; password?: string }) {
    const normalizedEmail = this.normalizeEmail(loginDto.email);
    const user = await this.findUserByEmail(normalizedEmail);

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

    const normalizedEmail = this.normalizeEmail(email);

    let user = await this.findUserByEmail(normalizedEmail);

    if (!user) {
      const student = await this.studentRepository
        .createQueryBuilder('student')
        .where('LOWER(student.email) = LOWER(:email)', {
          email: normalizedEmail,
        })
        .getOne();

      const defaultAvatar = picture || undefined;
      const defaultUsername = String(normalizedEmail.split('@')[0]);

      user = this.userRepository.create({
        username: defaultUsername,
        email: normalizedEmail,
        student: student ?? null,
        avatar: defaultAvatar,
        role: UserRole.USER,
      });

      user = await this.userRepository.save(user);

      // Tạo cây mặc định cho user mới
      const tree = await this.treeRepository.findOne({
        where: { code: this.starterTreeCode },
      });

      if (tree) {
        await this.userTreeRepository.save({
          userId: user.id,
          treeId: tree.id,
          level: 1,
          isDamaged: false,
          lastHarvestTime: new Date(),
          checksum: '',
        });
      } else {
        this.logger.warn(
          `Default tree ${this.starterTreeCode} not found in trees catalog`,
        );
      }

      await this.grantStarterLeafReward(user.id);
    } else if (!user.student) {
      const student = await this.studentRepository
        .createQueryBuilder('student')
        .where('LOWER(student.email) = LOWER(:email)', {
          email: normalizedEmail,
        })
        .getOne();

      if (student) {
        user.student = student;
        user = await this.userRepository.save(user);
      }
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
    const normalizedEmail = this.normalizeEmail(loginDto.email);
    const user = await this.findUserByEmail(normalizedEmail);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const userEmail = this.getUserEmailOrThrow(user);

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
      userEmail,
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

    const userEmail = this.getUserEmailOrThrow(user);

    const baseDeviceInfo: DeviceInfo = {
      deviceId: verifyDto.deviceId,
      deviceType: 'unknown',
    };

    await this.devicesService.verifyAndRegisterDevice(
      userId,
      userEmail,
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
    const user = await this.findUserByEmail(this.normalizeEmail(email));
    return user || null;
  }
}
