import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginWithDeviceDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email đăng nhập' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'strongPassword123', description: 'Mật khẩu' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    example: 'device-uuid-abc123',
    description: 'ID định danh thiết bị (unique)',
  })
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @ApiProperty({
    example: 'Samsung Galaxy S24',
    description: 'Tîn thiết bị',
    required: false,
  })
  @IsString()
  @IsOptional()
  deviceName?: string;

  @ApiProperty({
    example: 'android',
    description: 'Loại thiết bị: ios | android | web',
  })
  @IsString()
  @IsNotEmpty()
  deviceType: string;

  @ApiProperty({
    example: 'Android 14',
    description: 'Hệ điều hành của thiết bị',
    required: false,
  })
  @IsString()
  @IsOptional()
  deviceOs?: string;

  @ApiProperty({
    example: 'SM-S921B',
    description: 'Model thiết bị',
    required: false,
  })
  @IsString()
  @IsOptional()
  deviceModel?: string;

  @ApiProperty({
    example: 'Chrome',
    description: 'Tîn trình duyệt (cho web)',
    required: false,
  })
  @IsString()
  @IsOptional()
  browser?: string;

  @ApiProperty({
    example: 'fcm-token-xyz',
    description: 'Firebase Cloud Messaging token',
    required: false,
  })
  @IsString()
  @IsOptional()
  fcmToken?: string;
}
