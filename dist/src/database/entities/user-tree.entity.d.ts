import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Tree } from './tree.entity';
import { PvpActionLog } from './pvp-action-log.entity';
export declare class UserTree extends BaseEntity {
    userId: string;
    treeId: string;
    level: number;
    isDamaged: boolean;
    upgradeEndTime?: Date;
    assetPath?: string;
    lastHarvestTime: Date;
    damagedAt?: Date | null;
    version: number;
    checksum: string;
    user: User;
    tree: Tree;
    pvpActionLogs: PvpActionLog[];
}
