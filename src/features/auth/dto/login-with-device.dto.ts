import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class LoginWithDeviceDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @IsString()
  @IsOptional()
  deviceName?: string;

  @IsString()
  @IsNotEmpty()
  deviceType: string; // 'ios' | 'android' | 'web'

  @IsString()
  @IsOptional()
  deviceOs?: string;

  @IsString()
  @IsOptional()
  deviceModel?: string;

  @IsString()
  @IsOptional()
  browser?: string;

  @IsString()
  @IsOptional()
  fcmToken?: string;
}
