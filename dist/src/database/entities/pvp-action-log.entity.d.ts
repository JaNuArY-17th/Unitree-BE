import { User } from './user.entity';
import { UserTree } from './user-tree.entity';
export declare class PvpActionLog {
    id: string;
    attackerId: string;
    defenderId: string;
    actionType: string;
    stolenAmount?: number;
    targetTreeId?: string;
    wasBlocked: boolean;
    createdAt: Date;
    attacker: User;
    defender: User;
    targetTree: UserTree;
}
