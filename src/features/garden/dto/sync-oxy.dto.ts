import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SyncOxyDto {
  @ApiProperty({ description: 'ID of the user tree to sync' })
  @IsString()
  @IsNotEmpty()
  userTreeId: string;
}

export class ThrowBugDto {
  @ApiProperty({ description: 'Target user ID to attack' })
  @IsString()
  @IsNotEmpty()
  targetUserId: string;

  @ApiProperty({ description: 'ID of the attacker user tree' })
  @IsString()
  @IsNotEmpty()
  userTreeId: string;
}
