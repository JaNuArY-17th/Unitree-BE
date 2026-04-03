"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeLeafSpinReward = computeLeafSpinReward;
const LEAF_TIER_SCALE_MAP = {
    0: 1.0,
    1: 1.4,
    2: 2.0,
    3: 2.8,
    4: 4.0,
    5: 5.6,
    6: 8.0,
    7: 11.2,
};
function computeLeafSpinReward({ baseAmount, tier, }) {
    if (!Number.isFinite(baseAmount) || baseAmount <= 0) {
        return 0;
    }
    if (!Number.isFinite(tier)) {
        return 0;
    }
    const normalizedTier = Math.max(0, Math.min(7, Math.floor(tier)));
    const scale = LEAF_TIER_SCALE_MAP[normalizedTier] ?? LEAF_TIER_SCALE_MAP[0];
    const scaledReward = baseAmount * scale;
    return Math.max(0, Math.floor(scaledReward));
}
//# sourceMappingURL=leaf-spin-reward.util.js.map