import {
  IsNotEmpty,
  IsString,
  IsOptional,
  MaxLength,
  IsEmail,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GoogleLoginDto {
  @ApiProperty({
    example: 'eyJhbGciOiJSUzI1NiIsImtp...',
    description:
      'Firebase ID token received from Google Sign-In on client side',
  })
  @IsString()
  @IsNotEmpty()
  idToken!: string;

  @ApiPropertyOptional({
    example: 'user@gmail.com',
    description:
      'Google account email resolved by frontend OAuth flow. Optional when idToken is present.',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: 'https://lh3.googleusercontent.com/a/photo.jpg',
    description: 'Google avatar URL from frontend OAuth response',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  picture?: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Display name from frontend OAuth response',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;
}
