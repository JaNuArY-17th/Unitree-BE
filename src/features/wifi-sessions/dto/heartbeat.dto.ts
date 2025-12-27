import { IsNotEmpty, IsUUID } from 'class-validator';
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
}
