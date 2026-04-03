import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { UserDevice } from './user-device.entity';
export declare class UserSession extends BaseEntity {
    userId: string;
    deviceId: string;
    accessTokenId: string;
    refreshTokenId: string;
    ipAddress?: string;
    userAgent?: string;
    isActive: boolean;
    expiresAt: Date;
    lastActive: Date;
    loggedOutAt?: Date | null;
    user: User;
    device: UserDevice;
}
