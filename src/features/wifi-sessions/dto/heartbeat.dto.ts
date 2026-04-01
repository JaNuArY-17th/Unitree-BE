import { IsNotEmpty, IsOptional, IsString, IsUUID, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for sending heartbeat to keep session alive
 *
 * Heartbeat should be sent:
 * - Android: Every 5 minutes (via Foreground Service)
 * - iOS: Every 15 minutes (via Silent Push)
 */
export class HeartbeatDto {
  @ApiProperty({
    description: 'WiFi session ID',
    example: 'uuid-123',
  })
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({
    description: 'Current connected WiFi BSSID for Tho nhuong tracking',
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
