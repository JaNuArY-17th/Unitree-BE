import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpgradeTreeDto {
  @ApiProperty({
    description: 'UUID của cây user muốn nâng cấp',
    example: 'user-tree-uuid',
  })
  @IsUUID()
  userTreeId: string;
}
