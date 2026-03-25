import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RaidDto {
  @ApiProperty({ description: 'ID của người chơi bị Hái lộc (Raid)' })
  @IsString()
  @IsNotEmpty()
  targetUserId: string;
}
