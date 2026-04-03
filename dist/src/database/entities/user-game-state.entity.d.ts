import { BaseEntity } from './base.entity';
import { User } from './user.entity';
export declare class UserGameState extends BaseEntity {
    userId: string;
    lastSpinRegen?: Date;
    user: User;
}
