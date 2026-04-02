import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GoogleLoginDto {
  @ApiPropertyOptional({
    example: 'eyJhbGciOiJSUzI1NiIsImtp...',
    description:
      'Firebase ID token (optional). If present and Firebase Admin is configured, backend will verify it.',
  })
  @IsOptional()
  @IsString()
  idToken?: string;

  @ApiProperty({
    example: 'user@gmail.com',
    description:
      'Google account email resolved by frontend OAuth flow. Used as identity source when idToken is not provided.',
  })
  @IsEmail()
  email: string;

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
