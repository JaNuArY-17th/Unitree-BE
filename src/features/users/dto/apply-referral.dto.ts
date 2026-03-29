import { IsString, IsNotEmpty, Length } from 'class-validator';

export class ApplyReferralCodeDto {
  @IsString()
  @IsNotEmpty()
  @Length(4, 10, { message: 'Referral code must be 4-10 characters' })
  referralCode: string;
}
