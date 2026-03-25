import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AttackDto {
  @ApiProperty({ description: 'ID của Cây bị Thả bọ (Attack)' })
  @IsString()
  @IsNotEmpty()
  targetUserTreeId: string;
}
