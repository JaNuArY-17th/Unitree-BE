import { User } from './user.entity';
export declare class EconomyLog {
    id: string;
    userId: string;
    resourceType: string;
    amount: number;
    source: string;
    createdAt: Date;
    user: User;
}
