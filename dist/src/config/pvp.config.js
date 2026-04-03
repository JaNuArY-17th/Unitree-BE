"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
const parsePositiveInt = (value, fallback) => {
    const parsed = Number.parseInt(value ?? '', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};
const parsePositiveFloat = (value, fallback) => {
    const parsed = Number.parseFloat(value ?? '');
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};
exports.default = (0, config_1.registerAs)('pvp', () => ({
    matchmakingMinRatio: parsePositiveFloat(process.env.PVP_MATCHMAKING_MIN_RATIO, 0.8),
    matchmakingMaxRatio: parsePositiveFloat(process.env.PVP_MATCHMAKING_MAX_RATIO, 1.2),
    fallbackLowMaxRatio: parsePositiveFloat(process.env.PVP_MATCHMAKING_LOWEST_MAX_RATIO, 2),
    fallbackTopMinRatio: parsePositiveFloat(process.env.PVP_MATCHMAKING_TOP_MIN_RATIO, 0.5),
    fallbackGlobalMinRatio: parsePositiveFloat(process.env.PVP_MATCHMAKING_GLOBAL_MIN_RATIO, 0.5),
    fallbackGlobalMaxRatio: parsePositiveFloat(process.env.PVP_MATCHMAKING_GLOBAL_MAX_RATIO, 2),
    regularTargetCount: parsePositiveInt(process.env.PVP_REGULAR_TARGET_COUNT, 4),
    defenderTargetCount: parsePositiveInt(process.env.PVP_DEFENDER_TARGET_COUNT, 1),
    historyDefaultLimit: parsePositiveInt(process.env.PVP_HISTORY_DEFAULT_LIMIT, 30),
    historyMaxLimit: parsePositiveInt(process.env.PVP_HISTORY_MAX_LIMIT, 100),
    otGrininiUnlockDefenseCount: parsePositiveInt(process.env.PVP_OT_GRININI_UNLOCK_DEFENSE_COUNT, 20),
    passiveBlockMaxChance: parsePositiveFloat(process.env.PVP_PASSIVE_BLOCK_MAX_CHANCE, 0.2),
}));
//# sourceMappingURL=pvp.config.js.map