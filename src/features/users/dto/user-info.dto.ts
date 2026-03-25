import { Exclude, Expose, Transform } from 'class-transformer';
import { UserRole } from '../../../shared/constants/roles.constant';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../../database/entities/user.entity';

@Exclude()
export class UserInfoDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  username: string;

  @Expose()
  @ApiProperty({ nullable: true })
  @Transform(({ obj }: { obj: User }) => obj.student?.email)
  email?: string;

  @Expose()
  @ApiProperty({ nullable: true })
  @Transform(({ obj }: { obj: User }) => obj.student?.fullName)
  fullname?: string;

  @Expose()
  @ApiProperty({ nullable: true })
  @Transform(({ obj }: { obj: User }) => obj.student?.studentId)
  studentId?: string;

  @Expose()
  @ApiProperty({ nullable: true })
  avatar?: string;

  @Expose()
  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @Expose()
  @ApiProperty({ nullable: true })
  referralCode?: string;
}
