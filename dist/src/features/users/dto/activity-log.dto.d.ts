export declare enum ActivityLogType {
    ECONOMY = "economy",
    PVP = "pvp",
    ALL = "all"
}
export declare class ActivityLogQueryDto {
    type?: ActivityLogType;
    page?: number;
    limit?: number;
}
export declare class EconomyActivityDto {
    kind: 'economy';
    resourceType: string;
    amount: number;
    source: string;
    createdAt: string;
}
export declare class PvpActivityDto {
    kind: 'pvp';
    attackerId: string;
    attackerUsername: string;
    attackerAvatar: string | null;
    defenderId: string;
    defenderUsername: string;
    actionType: string;
    stolenAmount: number | null;
    wasBlocked: boolean;
    createdAt: string;
}
export type ActivityItem = EconomyActivityDto | PvpActivityDto;
