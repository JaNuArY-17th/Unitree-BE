import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for starting a WiFi session
 *
 * Note: WiFi validation (BSSID check) is done on frontend
 * Backend only tracks the session
 */
export class StartSessionDto {
  @ApiProperty({
    description: 'Device identifier',
    example: 'device-uuid-123',
    required: false,
  })
  @IsString()
  @IsOptional()
  deviceId?: string;

  @ApiProperty({
    description: 'User IP address for optional validation',
    example: '10.0.0.123',
    required: false,
  })
  @IsString()
  @IsOptional()
  ipAddress?: string;
}
