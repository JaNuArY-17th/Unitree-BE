export declare const generateOTP: (length?: number) => string;
export declare const compareOTP: (otp: string, correctOTP: string) => boolean;
export declare const generateOTPWithExpiry: (length?: number, expiryMinutes?: number) => {
    otp: string;
    expiresAt: Date;
};
export declare const isOTPExpired: (expiresAt: Date) => boolean;
