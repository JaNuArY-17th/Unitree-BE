import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum ActivityLogType {
  ECONOMY = 'economy',
  PVP = 'pvp',
  ALL = 'all',
}

export class ActivityLogQueryDto {
  @ApiPropertyOptional({
    enum: ActivityLogType,
    default: ActivityLogType.ALL,
    description: 'Loại lịch sử cần lấy: economy | pvp | all',
  })
  @IsEnum(ActivityLogType)
  @IsOptional()
  type?: ActivityLogType = ActivityLogType.ALL;

  @ApiPropertyOptional({ type: Number, default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ type: Number, default: 20 })
  @IsOptional()
  limit?: number = 20;
}

/** Một dòng lịch sử tài nguyên (economy log) */
export class EconomyActivityDto {
  kind: 'economy';
  resourceType: string;
  /** Dương = nhận, âm = chi */
  amount: number;
  source: string;
  createdAt: string;
}

/** Một dòng lịch sử PvP */
export class PvpActivityDto {
  kind: 'pvp';
  /** ID của người tấn công */
  attackerId: string;
  attackerUsername: string;
  attackerAvatar: string | null;
  /** ID của đối thủ bị tấn công */
  defenderId: string;
  defenderUsername: string;
  actionType: string;
  stolenAmount: number | null;
  wasBlocked: boolean;
  createdAt: string;
}

export type ActivityItem = EconomyActivityDto | PvpActivityDto;
