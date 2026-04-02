import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleLoginDto {
  @ApiProperty({
    example: 'eyJhbGciOiJSUzI1NiIsImtp...',
    description:
      'Firebase ID token received from Google Sign-In on client side',
  })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}
