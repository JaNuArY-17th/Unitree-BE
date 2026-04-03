import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { WifiSessionStatus } from '../../shared/constants/enums.constant';
export declare class WifiSession extends BaseEntity {
    userId: string;
    startTime: Date;
    endTime?: Date;
    durationMinutes: number;
    pointsEarned: number;
    status: WifiSessionStatus;
    lastHeartbeat?: Date;
    deviceId?: string;
    ipAddress?: string;
    user: User;
}
