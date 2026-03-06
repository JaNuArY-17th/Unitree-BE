import { IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyDeviceDto {
  @ApiProperty({
    example: 'device-uuid-abc123',
    description: 'ID thiết bị cần xác minh',
  })
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @ApiProperty({
    example: '123456',
    description: 'Mã OTP 6 chữ số được gửi qua email',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP must be 6 digits' })
  otpCode: string;
}
