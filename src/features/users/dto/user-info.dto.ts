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
  @Transform(
    ({ obj }: { obj: User }) => obj.student?.email ?? obj.email ?? null,
  )
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
  @ApiProperty({
    nullable: true,
    example: { studentId: 'SE171234', fullName: 'Nguyen Van A' },
  })
  @Transform(({ obj }: { obj: User }) =>
    obj.student
      ? {
          studentId: obj.student.studentId,
          fullName: obj.student.fullName,
        }
      : null,
  )
  student?: { studentId: string; fullName: string } | null;

  @Expose()
  @ApiProperty({ nullable: true })
  avatar?: string;

  @Expose()
  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @Expose()
  @ApiProperty({ nullable: true })
  referralCode?: string;

  @Expose()
  @ApiProperty({ nullable: true })
  @Transform(({ obj }: { obj: User }) => obj.referredBy?.id ?? null)
  referredById?: string;

  @Expose()
  @ApiProperty({ nullable: true })
  @Transform(({ obj }: { obj: User }) => obj.referredBy?.username ?? null)
  referredByUsername?: string;

  @Expose()
  @ApiProperty({ nullable: true })
  @Transform(({ obj }: { obj: User }) => obj.referredBy?.avatar ?? null)
  referredByAvatarUrl?: string;
}
