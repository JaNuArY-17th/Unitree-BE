import { IsNotEmpty, IsString, IsUUID, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyDeviceDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'ID người dùng cần xác minh thiết bị',
  })
  @IsUUID('4')
  @IsNotEmpty()
  userId: string;

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
