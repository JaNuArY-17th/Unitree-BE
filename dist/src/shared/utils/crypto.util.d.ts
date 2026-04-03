export declare class CryptoUtil {
    private static readonly SALT_ROUNDS;
    static hashPassword(password: string): Promise<string>;
    static comparePassword(password: string, hashedPassword: string): Promise<boolean>;
    static generateRandomToken(length?: number): string;
    static generateOTP(length?: number): string;
    static hashSHA256(data: string): string;
}
