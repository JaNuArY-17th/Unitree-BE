import { Repository, DataSource } from 'typeorm';
import { UserTree } from '../../../database/entities/user-tree.entity';
import { Resource } from '../../../database/entities/resource.entity';
import { WifiSession } from '../../../database/entities/wifi-session.entity';
export declare class GardenService {
    private readonly userTreeRepository;
    private readonly resourceRepository;
    private readonly wifiSessionRepository;
    private readonly dataSource;
    private readonly fallbackLeafResourceCodes;
    constructor(userTreeRepository: Repository<UserTree>, resourceRepository: Repository<Resource>, wifiSessionRepository: Repository<WifiSession>, dataSource: DataSource);
    syncAllOxygen(userId: string): Promise<{
        oxygenEarned: number;
        currentBalance: string;
        currentLeafBalance: string;
        hasWifiBoost: boolean;
        syncedTreeCount: number;
        syncedAt: Date;
    }>;
    throwBug(attackerId: string, targetUserId: string, attackerTreeId: string): Promise<{
        attackerId: string;
        targetId: string;
        targetTreeId: string;
        userTreeId: string;
        level: number;
        oxygenEarned: number;
        isDamaged: boolean;
    }>;
    private findOxygenResource;
    private findLeafResource;
}
