import { IsOptional, IsString, Matches } from 'class-validator';
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

  @ApiProperty({
    description: 'Current connected WiFi BSSID used for Tho nhuong effect',
    example: '00:13:10:85:FE:01',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^([0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2}$/, {
    message: 'bssid must be a valid MAC-like format',
  })
  bssid?: string;
}
