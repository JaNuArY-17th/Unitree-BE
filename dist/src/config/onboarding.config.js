"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
const parsePositiveInt = (value, fallback) => {
    const parsed = Number.parseInt(value ?? '', 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};
exports.default = (0, config_1.registerAs)('onboarding', () => ({
    starterLeafAmount: parsePositiveInt(process.env.NEW_USER_STARTER_LEAF_AMOUNT, 100),
    starterLeafResourceCode: process.env.NEW_USER_STARTER_LEAF_RESOURCE_CODE || 'GREEN_LEAF',
}));
//# sourceMappingURL=onboarding.config.js.map