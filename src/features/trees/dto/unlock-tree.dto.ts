import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UnlockTreeDto {
  @ApiProperty({
    description: 'UUID của loại cây muốn mở khóa',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  treeId: string;
}
