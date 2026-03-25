import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Req,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { LoginWithDeviceDto } from './dto/login-with-device.dto';
import { VerifyDeviceDto } from './dto/verify-device.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from '../../shared/decorators/public.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ResponseUtil } from '../../shared/utils/response.util';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập bằng email và mật khẩu' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công, trả về access token và refresh token',
  })
  @ApiResponse({
    status: 401,
    description: 'Email hoặc mật khẩu không chính xác',
  })
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return ResponseUtil.success(result, 'Login successful');
  }

  @Public()
  @Post('google/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập bằng Google (Firebase ID Token)' })
  @ApiBody({ type: GoogleLoginDto })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công, trả về access token và refresh token',
  })
  @ApiResponse({
    status: 401,
    description: 'ID Token không hợp lệ',
  })
  async googleLogin(@Body() googleLoginDto: GoogleLoginDto) {
    const result = await this.authService.googleLogin(googleLoginDto.idToken);
    return ResponseUtil.success(result, 'Google login successful');
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Làm mới access token bằng refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 200, description: 'Trả về access token mới' })
  @ApiResponse({
    status: 401,
    description: 'Refresh token không hợp lệ hoặc đã hết hạn',
  })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    const result = await this.authService.refreshToken(
      refreshTokenDto.refreshToken,
    );
    return ResponseUtil.success(result, 'Token refreshed');
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin profile của user đang đăng nhập' })
  @ApiResponse({ status: 200, description: 'Trả về thông tin profile user' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  async getProfile(@CurrentUser('id') userId: string) {
    const user = await this.authService.getProfile(userId);
    return ResponseUtil.success(user);
  }

  @Post('logout')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng xuất khỏi phiên hiện tại' })
  @ApiResponse({ status: 200, description: 'Đăng xuất thành công' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  async logout(@CurrentUser('id') userId: string) {
    await this.authService.logout(userId);
    return ResponseUtil.success(null, 'Logout successful');
  }

  @Public()
  @Post('login-with-device')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Đăng nhập kèm thông tin thiết bị',
    description:
      'Nếu thiết bị chưa được xác minh, server sẽ gửi OTP qua email và trả về requireOtp: true',
  })
  @ApiBody({ type: LoginWithDeviceDto })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công hoặc yêu cầu OTP xác minh thiết bị',
  })
  @ApiResponse({
    status: 401,
    description: 'Email hoặc mật khẩu không chính xác',
  })
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
  @ApiOperation({
    summary: 'Xác minh thiết bị mới bằng mã OTP',
    description:
      'Nhận mã OTP 6 chữ số được gửi qua email để xác minh thiết bị và đăng nhập',
  })
  @ApiBody({ type: VerifyDeviceDto })
  @ApiResponse({
    status: 200,
    description: 'Xác minh thiết bị thành công, trả về access token',
  })
  @ApiResponse({
    status: 400,
    description: 'OTP không chính xác hoặc đã hết hạn',
  })
  async verifyDevice(
    @Body() verifyDto: VerifyDeviceDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await this.authService.verifyDeviceAndLogin(
      verifyDto.userId,
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy danh sách thiết bị đã đăng ký của user' })
  @ApiResponse({ status: 200, description: 'Danh sách thiết bị của user' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  async getUserDevices(@CurrentUser('id') userId: string) {
    const devices = await this.authService.getUserDevices(userId);
    return ResponseUtil.success(devices);
  }

  @Get('sessions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy danh sách phiên đăng nhập đang hoạt động' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách active sessions của user',
  })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  async getActiveSessions(@CurrentUser('id') userId: string) {
    const sessions = await this.authService.getActiveSessions(userId);
    return ResponseUtil.success(sessions);
  }

  @Delete('devices/:deviceId')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng xuất và xoá một thiết bị cụ thể' })
  @ApiResponse({ status: 200, description: 'Thiết bị đã được xoá thành công' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({ status: 404, description: 'Thiết bị không tồn tại' })
  async logoutDevice(
    @CurrentUser('id') userId: string,
    @Param('deviceId', new ParseUUIDPipe()) deviceId: string,
  ) {
    await this.authService.logoutDevice(userId, deviceId);
    return ResponseUtil.success(null, 'Device logged out successfully');
  }
}
