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
exports.UserGameState = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const user_entity_1 = require("./user.entity");
let UserGameState = class UserGameState extends base_entity_1.BaseEntity {
    userId;
    lastSpinRegen;
    user;
};
exports.UserGameState = UserGameState;
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'uuid', unique: true }),
    __metadata("design:type", String)
], UserGameState.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_spin_regen', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], UserGameState.prototype, "lastSpinRegen", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], UserGameState.prototype, "user", void 0);
exports.UserGameState = UserGameState = __decorate([
    (0, typeorm_1.Entity)('user_game_states')
], UserGameState);
//# sourceMappingURL=user-game-state.entity.js.map