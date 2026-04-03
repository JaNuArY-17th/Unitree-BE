import { ConfigService } from '@nestjs/config';
export declare class EmailService {
    private configService;
    private readonly transporter;
    private readonly fromEmail;
    private readonly fromName;
    constructor(configService: ConfigService);
    sendEmail(to: string, subject: string, html: string, text?: string): Promise<void>;
    sendVerificationEmail(email: string, token: string): Promise<void>;
    sendPasswordResetEmail(email: string, token: string): Promise<void>;
    sendWelcomeEmail(email: string, name: string): Promise<void>;
    sendDeviceVerificationEmail(email: string, otpCode: string): Promise<void>;
}
