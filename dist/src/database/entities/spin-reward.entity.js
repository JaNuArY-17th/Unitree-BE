"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpinReward = void 0;
const typeorm_1 = require("typeorm");
let SpinReward = class SpinReward {
    id;
    rewardType;
    rewardAmount;
    dropWeight;
};
exports.SpinReward = SpinReward;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'int' }),
    __metadata("design:type", Number)
], SpinReward.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reward_type', type: 'varchar' }),
    __metadata("design:type", String)
], SpinReward.prototype, "rewardType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reward_amount' }),
    __metadata("design:type", Number)
], SpinReward.prototype, "rewardAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'drop_weight', type: 'decimal' }),
    __metadata("design:type", Number)
], SpinReward.prototype, "dropWeight", void 0);
exports.SpinReward = SpinReward = __decorate([
    (0, typeorm_1.Entity)('spin_rewards')
], SpinReward);
//# sourceMappingURL=spin-reward.entity.js.map