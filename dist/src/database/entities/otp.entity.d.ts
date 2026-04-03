import { BaseEntity } from './base.entity';
export declare enum OtpType {
    EMAIL_VERIFICATION = "email_verification",
    PHONE_VERIFICATION = "phone_verification",
    PASSWORD_RESET = "password_reset",
    DEVICE_VERIFICATION = "device_verification",
    TWO_FACTOR_AUTH = "two_factor_auth"
}
export declare class Otp extends BaseEntity {
    userId: string;
    otpCode: string;
    type: OtpType;
    email?: string;
    phoneNumber?: string;
    deviceId?: string;
    expiresAt: Date;
    verifiedAt?: Date;
    attempts: number;
    maxAttempts: number;
    isUsed: boolean;
    metadata?: Record<string, unknown>;
}
