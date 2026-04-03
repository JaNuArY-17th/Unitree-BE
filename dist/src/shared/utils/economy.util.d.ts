export declare class EconomyUtil {
    static calculateYield(base: number, rate: number, level: number): number;
    static calculateUpgradeCost(base: number, rate: number, level: number): number;
    static applyWifiBoost(baseYield: number): number;
    static calculateOxygenHarvest({ baseYield, rate, level, lastHarvestTime, lastHeartbeat, now, isDamaged, hasWifiBoost, }: {
        baseYield: number;
        rate: number;
        level: number;
        lastHarvestTime: Date;
        lastHeartbeat: Date | null;
        now: Date;
        isDamaged: boolean;
        hasWifiBoost: boolean;
    }): number;
    static calculateRepairCost(baseCost: number, level: number): number;
}
