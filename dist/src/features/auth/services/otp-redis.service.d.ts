import { CacheService } from '../../../services/cache.service';
export declare enum OtpType {
    EMAIL_VERIFICATION = "email_verification",
    PHONE_VERIFICATION = "phone_verification",
    PASSWORD_RESET = "password_reset",
    DEVICE_VERIFICATION = "device_verification",
    TWO_FACTOR_AUTH = "two_factor_auth"
}
export declare class OtpRedisService {
    private readonly cacheService;
    private readonly logger;
    private readonly TTL;
    private readonly MAX_ATTEMPTS;
    constructor(cacheService: CacheService);
    generateOTP(type: OtpType, identifier: string, userId?: string, metadata?: any): Promise<string>;
    verifyOTP(type: OtpType, identifier: string, code: string, userId?: string): Promise<boolean>;
    getOtpTTL(type: OtpType, identifier: string, userId?: string): Promise<number | null>;
    deleteOTP(type: OtpType, identifier: string, userId?: string): Promise<void>;
    private buildKey;
    private getTTL;
    private generateRandomCode;
    generateToken(type: 'email_verification' | 'password_reset', userId: string, data: any, ttl?: number): Promise<string>;
    verifyToken(type: 'email_verification' | 'password_reset', token: string): Promise<any>;
    deleteToken(type: 'email_verification' | 'password_reset', token: string): Promise<void>;
}
