"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyInventoryResponseDto = exports.SpinRegenInfoDto = exports.ResourceBalanceDto = void 0;
class ResourceBalanceDto {
    code;
    name;
    balance;
    maxStack;
}
exports.ResourceBalanceDto = ResourceBalanceDto;
class SpinRegenInfoDto {
    currentSpins;
    maxSpins;
    nextRegenAt;
    secondsUntilNextRegen;
}
exports.SpinRegenInfoDto = SpinRegenInfoDto;
class MyInventoryResponseDto {
    resources;
    spinRegen;
}
exports.MyInventoryResponseDto = MyInventoryResponseDto;
//# sourceMappingURL=resource-balance.dto.js.map