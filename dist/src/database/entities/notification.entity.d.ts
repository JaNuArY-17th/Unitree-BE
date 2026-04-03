import { User } from './user.entity';
export declare class Notification {
    id: string;
    userId: string;
    type: string;
    message: string;
    isRead: boolean;
    createdAt: Date;
    user: User;
}
