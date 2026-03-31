import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RaidDto {
  @ApiProperty({ description: 'ID của người chơi bị Hái lộc (Raid)' })
  @IsString()
  @IsNotEmpty()
  targetUserId: string;

  @ApiPropertyOptional({
    description: 'Danh sách hộp Lá được chọn (1-4), tối đa 3 hộp',
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(4, { each: true })
  selectedBoxIndexes?: number[];
}
