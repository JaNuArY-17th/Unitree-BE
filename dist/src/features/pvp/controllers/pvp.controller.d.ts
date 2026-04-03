import { PvpService } from '../services/pvp.service';
import { RaidDto } from '../dto/raid.dto';
import { AttackDto } from '../dto/attack.dto';
export declare class PvpController {
    private readonly pvpService;
    constructor(pvpService: PvpService);
    getTargets(userId: string): Promise<import("../../../shared/utils/response.util").ApiResponse<{
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
    }>>;
    getHistory(userId: string, limit?: string): Promise<import("../../../shared/utils/response.util").ApiResponse<{
        total: number;
        items: Array<{
            id: string;
            actionType: string;
            direction: "ATTACKED" | "DEFENDED";
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
    }>>;
    raid(userId: string, dto: RaidDto): Promise<import("../../../shared/utils/response.util").ApiResponse<{
        success: boolean;
        wasBlocked: boolean;
        defenseSource?: "MAN_CHUP_TRANH_MUOI" | "OT_GRININI_PASSIVE";
        stolenLeafAmount: number;
        selectedBoxes: {
            boxIndex: number;
            percent: number;
            amount: number;
        }[];
        message: string;
    }>>;
    attack(userId: string, dto: AttackDto): Promise<import("../../../shared/utils/response.util").ApiResponse<{
        success: boolean;
        wasBlocked: boolean;
        defenseSource?: "MAN_CHUP_TRANH_MUOI" | "OT_GRININI_PASSIVE";
        targetUserTreeId: string;
        message: string;
    }>>;
}
