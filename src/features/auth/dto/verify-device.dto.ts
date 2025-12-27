import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyDeviceDto {
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP must be 6 digits' })
  otpCode: string;
}
