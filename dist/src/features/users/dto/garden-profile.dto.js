"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GardenProfileResponseDto = exports.GardenTreeDto = void 0;
class GardenTreeDto {
    treeName;
    treeType;
    level;
    maxLevel;
    oxyPerHour;
    isDamaged;
    isUpgrading;
    assetPath;
}
exports.GardenTreeDto = GardenTreeDto;
class GardenProfileResponseDto {
    owner;
    trees;
    totalOxyPerHour;
    shieldCount;
}
exports.GardenProfileResponseDto = GardenProfileResponseDto;
//# sourceMappingURL=garden-profile.dto.js.map