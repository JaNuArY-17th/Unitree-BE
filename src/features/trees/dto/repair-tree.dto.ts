import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RepairTreeDto {
  @ApiProperty({
    description: 'UUID của cây user cần sửa',
    example: 'user-tree-uuid',
  })
  @IsUUID()
  userTreeId: string;
}
