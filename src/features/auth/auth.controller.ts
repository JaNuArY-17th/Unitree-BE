import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Req,
  Param,
  Delete,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LoginWithDeviceDto } from './dto/login-with-device.dto';
import { VerifyDeviceDto } from './dto/verify-device.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from '../../shared/decorators/public.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ResponseUtil } from '../../shared/utils/response.util';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return ResponseUtil.success(result, 'Registration successful');
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return ResponseUtil.success(result, 'Login successful');
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    const result = await this.authService.refreshToken(
      refreshTokenDto.refreshToken,
    );
    return ResponseUtil.success(result, 'Token refreshed');
  }

  @Get('profile')
  async getProfile(@CurrentUser('id') userId: string) {
    const user = await this.authService.getProfile(userId);
    return ResponseUtil.success(user);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser('id') userId: string) {
    await this.authService.logout(userId);
    return ResponseUtil.success(null, 'Logout successful');
  }

  @Public()
  @Post('login-with-device')
  @HttpCode(HttpStatus.OK)
  async loginWithDevice(
    @Body() loginDto: LoginWithDeviceDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await this.authService.loginWithDevice(
      loginDto,
      ipAddress,
      userAgent,
    );

    if ('requireOtp' in result && result.requireOtp) {
      return ResponseUtil.success(
        {
          requireOtp: true,
          userId: result.userId,
          deviceId: result.deviceId,
        },
        result.message,
      );
    }

    return ResponseUtil.success(result, 'Login successful');
  }

  @Public()
  @Post('verify-device')
  @HttpCode(HttpStatus.OK)
  async verifyDevice(
    @Body() verifyDto: VerifyDeviceDto,
    @Body('userId') userId: string,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await this.authService.verifyDeviceAndLogin(
      userId,
      verifyDto,
      ipAddress,
      userAgent,
    );

    return ResponseUtil.success(
      result,
      'Device verified and logged in successfully',
    );
  }

  @Get('devices')
  async getUserDevices(@CurrentUser('id') userId: string) {
    const devices = await this.authService.getUserDevices(userId);
    return ResponseUtil.success(devices);
  }

  @Get('sessions')
  async getActiveSessions(@CurrentUser('id') userId: string) {
    const sessions = await this.authService.getActiveSessions(userId);
    return ResponseUtil.success(sessions);
  }

  @Delete('devices/:deviceId')
  @HttpCode(HttpStatus.OK)
  async logoutDevice(
    @CurrentUser('id') userId: string,
    @Param('deviceId') deviceId: string,
  ) {
    await this.authService.logoutDevice(userId, deviceId);
    return ResponseUtil.success(null, 'Device logged out successfully');
  }
}
