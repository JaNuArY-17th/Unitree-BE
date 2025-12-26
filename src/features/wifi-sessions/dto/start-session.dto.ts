import { IsOptional, IsString } from 'class-validator';

export class StartSessionDto {
  @IsString()
  @IsOptional()
  deviceId?: string;

  @IsString()
  @IsOptional()
  ipAddress?: string;

  @IsString()
  @IsOptional()
  macAddress?: string;

  @IsString()
  @IsOptional()
  location?: string;
}
