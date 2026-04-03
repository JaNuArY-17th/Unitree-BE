"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = __importStar(require("nodemailer"));
const logger_util_1 = require("../shared/utils/logger.util");
let EmailService = class EmailService {
    configService;
    transporter;
    fromEmail;
    fromName;
    constructor(configService) {
        this.configService = configService;
        const emailConfig = this.configService.get('email');
        this.transporter = nodemailer.createTransport({
            host: emailConfig.host,
            port: emailConfig.port,
            secure: emailConfig.secure,
            auth: emailConfig.auth,
        });
        this.fromEmail = emailConfig.from.address;
        this.fromName = emailConfig.from.name;
    }
    async sendEmail(to, subject, html, text) {
        try {
            await this.transporter.sendMail({
                from: `"${this.fromName}" <${this.fromEmail}>`,
                to,
                subject,
                text,
                html,
            });
            logger_util_1.Logger.log(`Email sent to ${to}`, 'EmailService');
        }
        catch (error) {
            logger_util_1.Logger.error(`Failed to send email to ${to}`, error instanceof Error ? error.stack : String(error), 'EmailService');
            throw error;
        }
    }
    async sendVerificationEmail(email, token) {
        const verificationUrl = `${this.configService.get('app.baseUrl')}/verify-email?token=${token}`;
        const html = `
      <h1>Email Verification</h1>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>If you didn't request this, please ignore this email.</p>
    `;
        await this.sendEmail(email, 'Verify Your Email', html);
    }
    async sendPasswordResetEmail(email, token) {
        const resetUrl = `${this.configService.get('app.baseUrl')}/reset-password?token=${token}`;
        const html = `
      <h1>Password Reset</h1>
      <p>Please click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;
        await this.sendEmail(email, 'Reset Your Password', html);
    }
    async sendWelcomeEmail(email, name) {
        const html = `
      <h1>Welcome to Unitree!</h1>
      <p>Hi ${name},</p>
      <p>Thank you for joining Unitree. Start your journey to a greener planet today!</p>
    `;
        await this.sendEmail(email, 'Welcome to Unitree', html);
    }
    async sendDeviceVerificationEmail(email, otpCode) {
        const html = `
      <h1>Device Verification</h1>
      <p>Hi,</p>
      <p>You're trying to log in from a new device. Please verify this device using the OTP code below:</p>
      <h2 style="color: #2ecc71; font-size: 28px; letter-spacing: 5px;">${otpCode}</h2>
      <p>This code will expire in 5 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;
        await this.sendEmail(email, 'Device Verification - Unitree', html);
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map