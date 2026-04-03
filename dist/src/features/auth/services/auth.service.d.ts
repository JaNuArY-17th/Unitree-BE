import { ConfigService } from '@nestjs/config';
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
import { UsersService } from '../../users/services/users.service';
import { UserInfoDto } from '../../users/dto/user-info.dto';
export declare class AuthService {
    private readonly userRepository;
    private readonly studentRepository;
    private readonly treeRepository;
    private readonly userTreeRepository;
    private readonly resourceRepository;
    private readonly userResourceRepository;
    private readonly economyLogRepository;
    private readonly tokensService;
    private readonly devicesService;
    private readonly firebaseService;
    private readonly usersService;
    private readonly configService;
    private readonly logger;
    private readonly starterTreeCode;
    private readonly fallbackLeafResourceCodes;
    constructor(userRepository: Repository<User>, studentRepository: Repository<Student>, treeRepository: Repository<Tree>, userTreeRepository: Repository<UserTree>, resourceRepository: Repository<Resource>, userResourceRepository: Repository<UserResource>, economyLogRepository: Repository<EconomyLog>, tokensService: TokensService, devicesService: DevicesService, firebaseService: FirebaseService, usersService: UsersService, configService: ConfigService);
    private getStarterLeafAmount;
    private getStarterLeafResourceCodes;
    private findResourceByCodeIgnoreCase;
    private findStarterLeafResource;
    private ensureStarterLeafResource;
    private grantStarterLeafReward;
    private normalizeEmail;
    private findUserByEmail;
    private getUserEmailOrThrow;
    login(loginDto: {
        email: string;
        password?: string;
    }): Promise<{
        access_token: string;
        refresh_token: string;
        user: UserInfoDto;
    }>;
    googleLogin(idToken: string): Promise<{
        access_token: string;
        refresh_token: string;
        user: UserInfoDto;
    }>;
    refreshToken(refreshToken: string): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    getProfile(userId: string): Promise<UserInfoDto>;
    logout(userId: string): Promise<{
        message: string;
    }>;
    loginWithDevice(loginDto: {
        email: string;
        deviceId: string;
        deviceName?: string;
        deviceType: string;
        deviceOs?: string;
        deviceModel?: string;
        browser?: string;
        fcmToken?: string;
    }, ipAddress?: string, userAgent?: string): Promise<{
        deviceId: string;
        access_token: string;
        refresh_token: string;
        user: UserInfoDto;
    } | {
        requireOtp: boolean;
        message: string | undefined;
        userId: string;
        deviceId: string;
    }>;
    completeDeviceLogin(user: User, deviceInfo: DeviceInfo): Promise<{
        deviceId: string;
        access_token: string;
        refresh_token: string;
        user: UserInfoDto;
    }>;
    verifyDeviceAndLogin(userId: string, verifyDto: {
        deviceId: string;
        otpCode: string;
    }, ipAddress?: string, userAgent?: string): Promise<{
        deviceId: string;
        access_token: string;
        refresh_token: string;
        user: UserInfoDto;
    }>;
    logoutDevice(userId: string, deviceId: string): Promise<{
        message: string;
    }>;
    getUserDevices(userId: string): Promise<import("../../../database/entities/user-device.entity").UserDevice[]>;
    getActiveSessions(userId: string): Promise<import("../../../database/entities/user-device.entity").UserDevice[]>;
    validateUser(email: string): Promise<any>;
}
