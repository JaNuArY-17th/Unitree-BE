import { IsOptional, IsString, Matches } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsString()
  @IsOptional()
  @Matches(/^(\+84|0)[3|5|7|8|9][0-9]{8}$/, {
    message: 'Phone number must be a valid Vietnamese phone number',
  })
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  fcmToken?: string;
}
