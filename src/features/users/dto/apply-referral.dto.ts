import { IsString, IsNotEmpty, Length } from 'class-validator';

export class ApplyReferralCodeDto {
  @IsString()
  @IsNotEmpty()
  @Length(4, 4, { message: 'Mã mời phải gồm 4 ký tự' })
  refCode: string;
}
