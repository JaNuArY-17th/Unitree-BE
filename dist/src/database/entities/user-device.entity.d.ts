import { BaseEntity } from './base.entity';
import { User } from './user.entity';
export declare class UserDevice extends BaseEntity {
    userId: string;
    deviceId: string;
    deviceName?: string;
    deviceType: string;
    deviceOs?: string;
    deviceModel?: string;
    browser?: string;
    ipAddress?: string;
    fcmToken?: string;
    isActive: boolean;
    lastActive: Date;
    loggedOutAt?: Date | null;
    user: User;
}
