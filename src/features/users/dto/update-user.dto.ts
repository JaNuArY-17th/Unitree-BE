import { IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({
    example: 'Nguyễn Văn A',
    description: 'Tên đầy đủ của người dùng',
    required: false,
  })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({
    example: 'https://cdn.example.com/avatar.jpg',
    description: 'URL ảnh đại diện',
    required: false,
  })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiProperty({
    example: '0912345678',
    description: 'Số điện thoại Việt Nam',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^(\+84|0)[3|5|7|8|9][0-9]{8}$/, {
    message: 'Phone number must be a valid Vietnamese phone number',
  })
  phoneNumber?: string;

  @ApiProperty({
    example: 'fcm-token-xyz',
    description: 'Firebase Cloud Messaging token',
    required: false,
  })
  @IsString()
  @IsOptional()
  fcmToken?: string;
}
