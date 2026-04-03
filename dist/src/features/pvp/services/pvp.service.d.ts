import { ConfigService } from '@nestjs/config';
import { DataSource, Repository } from 'typeorm';
import { UserResource } from '../../../database/entities/user-resource.entity';
import { UserTree } from '../../../database/entities/user-tree.entity';
import { PvpActionLog } from '../../../database/entities/pvp-action-log.entity';
import { EconomyLog } from '../../../database/entities/economy-log.entity';
import { User } from '../../../database/entities/user.entity';
import { Resource } from '../../../database/entities/resource.entity';
import { Tree } from '../../../database/entities/tree.entity';
import { RaidDto } from '../dto/raid.dto';
import { AttackDto } from '../dto/attack.dto';
type DefenseSource = 'OT_GRININI_PASSIVE' | 'MAN_CHUP_TRANH_MUOI';
type SelectedRaidBox = {
    boxIndex: number;
    percent: number;
    amount: number;
};
export declare class PvpService {
    private readonly userResourceRepo;
    private readonly userTreeRepo;
    private readonly pvpActionLogRepo;
    private readonly economyLogRepo;
    private readonly userRepo;
    private readonly resourceRepo;
    private readonly treeRepo;
    private readonly configService;
    private readonly dataSource;
    private readonly leafResourceCodes;
    constructor(userResourceRepo: Repository<UserResource>, userTreeRepo: Repository<UserTree>, pvpActionLogRepo: Repository<PvpActionLog>, economyLogRepo: Repository<EconomyLog>, userRepo: Repository<User>, resourceRepo: Repository<Resource>, treeRepo: Repository<Tree>, configService: ConfigService, dataSource: DataSource);
    getAttackTargets(userId: string): Promise<{
        myScore: number;
        targets: Array<{
            userId: string;
            username: string;
            avatarUrl: string;
            powerScore: number;
            primaryTreeId: string | null;
            passiveBlockChance: number;
            hasShield: boolean;
            isBaoThu: boolean;
        }>;
    }>;
    getHistory(userId: string, requestedLimit?: number): Promise<{
        total: number;
        items: Array<{
            id: string;
            actionType: string;
            direction: 'ATTACKED' | 'DEFENDED';
            wasBlocked: boolean;
            stolenAmount: number;
            createdAt: Date;
            attacker: {
                userId: string;
                username: string;
                avatarUrl: string;
            };
            defender: {
                userId: string;
                username: string;
                avatarUrl: string;
            };
            targetTreeId?: string;
            revengeTargetUserId: string;
        }>;
    }>;
    raid(userId: string, dto: RaidDto): Promise<{
        success: boolean;
        wasBlocked: boolean;
        defenseSource?: DefenseSource;
        stolenLeafAmount: number;
        selectedBoxes: SelectedRaidBox[];
        message: string;
    }>;
    attack(userId: string, dto: AttackDto): Promise<{
        success: boolean;
        wasBlocked: boolean;
        defenseSource?: DefenseSource;
        targetUserTreeId: string;
        message: string;
    }>;
    private resolveDefense;
    private tryConsumeMosquitoShield;
    private getPassiveBlockChance;
    private tryUnlockOtGrinini;
    private buildPowerSnapshots;
    private resolveRevengeTargetId;
    private pickClosestTargets;
    private computeTreeOxyPerHour;
    private findFirstResourceByCodes;
    private pickRandomDistinctIndexes;
    private resolveRaidSelection;
    private normalizeSelectedBoxIndexes;
    private shuffleArray;
    private buildAssetPath;
    private getPvpNumberConfig;
    private roundScore;
    private roundChance;
}
export {};
