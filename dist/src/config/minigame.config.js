"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
const parsePositiveInt = (value, fallback) => {
    const parsed = Number.parseInt(value ?? '', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};
exports.default = (0, config_1.registerAs)('minigame', () => ({
    spinRegenIntervalMinutes: parsePositiveInt(process.env.SPIN_REGEN_INTERVAL_MINUTES, 5),
}));
//# sourceMappingURL=minigame.config.js.map