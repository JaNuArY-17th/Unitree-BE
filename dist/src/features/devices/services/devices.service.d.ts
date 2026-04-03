import { Repository } from 'typeorm';
import { UserDevice } from '../../../database/entities/user-device.entity';
import { OtpRedisService } from '../../auth/services/otp-redis.service';
import { TokensService } from '../../tokens/services/tokens.service';
import { EmailService } from '../../../services/email.service';
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
export declare class DevicesService {
    private readonly deviceRepository;
    private readonly otpRedisService;
    private readonly tokensService;
    private readonly emailService;
    private readonly logger;
    constructor(deviceRepository: Repository<UserDevice>, otpRedisService: OtpRedisService, tokensService: TokensService, emailService: EmailService);
    isDeviceRecognized(userId: string, deviceId: string): Promise<boolean>;
    hasActiveDevice(userId: string, currentDeviceId: string): Promise<UserDevice | null>;
    handleDeviceLogin(userId: string, userEmail: string, deviceInfo: DeviceInfo): Promise<{
        requireOtp: boolean;
        otpSent?: boolean;
        message?: string;
    }>;
    verifyAndRegisterDevice(userId: string, userEmail: string, deviceInfo: DeviceInfo, otpCode: string): Promise<UserDevice>;
    registerDevice(userId: string, deviceInfo: DeviceInfo): Promise<UserDevice>;
    logoutDevice(deviceId: string): Promise<void>;
    logoutAllDevices(userId: string): Promise<void>;
    getActiveSessions(userId: string): Promise<UserDevice[]>;
    getUserDevices(userId: string): Promise<UserDevice[]>;
    updateDeviceActivity(deviceId: string): Promise<void>;
    updateFcmToken(userId: string, deviceId: string, fcmToken: string): Promise<void>;
    removeDevice(userId: string, deviceId: string): Promise<void>;
}
