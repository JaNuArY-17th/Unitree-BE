import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EvolveTreeDto {
  @ApiProperty({
    description: 'UUID của cây user cần tiến hóa',
    example: 'user-tree-uuid',
  })
  @IsUUID()
  userTreeId: string;
}
