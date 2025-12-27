import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Logger } from '../shared/utils/logger.util';

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private configService: ConfigService) {
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

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string,
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to,
        subject,
        text,
        html,
      });
      Logger.log(`Email sent to ${to}`, 'EmailService');
    } catch (error) {
      Logger.error(
        `Failed to send email to ${to}`,
        error.stack,
        'EmailService',
      );
      throw error;
    }
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${this.configService.get('app.baseUrl')}/verify-email?token=${token}`;
    const html = `
      <h1>Email Verification</h1>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    await this.sendEmail(email, 'Verify Your Email', html);
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
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

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const html = `
      <h1>Welcome to Unitree!</h1>
      <p>Hi ${name},</p>
      <p>Thank you for joining Unitree. Start your journey to a greener planet today!</p>
    `;

    await this.sendEmail(email, 'Welcome to Unitree', html);
  }

  async sendDeviceVerificationEmail(
    email: string,
    otpCode: string,
  ): Promise<void> {
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
}
