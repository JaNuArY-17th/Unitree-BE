"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EconomyUtil = void 0;
class EconomyUtil {
    static calculateYield(base, rate, level) {
        return base * Math.pow(rate, level - 1);
    }
    static calculateUpgradeCost(base, rate, level) {
        return base * Math.pow(rate, level);
    }
    static applyWifiBoost(baseYield) {
        return baseYield * 1.2;
    }
    static calculateOxygenHarvest({ baseYield, rate, level, lastHarvestTime, lastHeartbeat, now, isDamaged, hasWifiBoost, }) {
        const currentYield = this.calculateYield(baseYield, rate, level);
        const secondsElapsed = (now.getTime() - lastHarvestTime.getTime()) / 1000;
        let totalOxygen = 0;
        if (lastHeartbeat && lastHeartbeat > lastHarvestTime) {
            const wifiEndTime = lastHeartbeat > now ? now : lastHeartbeat;
            const wifiSeconds = Math.max(0, (wifiEndTime.getTime() - lastHarvestTime.getTime()) / 1000);
            const wifiOxygen = this.applyWifiBoost(currentYield * (wifiSeconds / 3600));
            totalOxygen += wifiOxygen;
            if (lastHeartbeat < now) {
                const noWifiSeconds = Math.max(0, (now.getTime() - lastHeartbeat.getTime()) / 1000);
                const noWifiOxygen = currentYield * (noWifiSeconds / 3600);
                totalOxygen += noWifiOxygen;
            }
        }
        else {
            totalOxygen = currentYield * (secondsElapsed / 3600);
        }
        if (isDamaged) {
            totalOxygen *= 0.5;
        }
        return Math.max(0, Math.floor(totalOxygen * 100) / 100);
    }
    static calculateRepairCost(baseCost, level) {
        return Math.floor(baseCost * level * 0.5);
    }
}
exports.EconomyUtil = EconomyUtil;
//# sourceMappingURL=economy.util.js.map