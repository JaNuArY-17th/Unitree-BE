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
exports.PvpActionLog = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const user_tree_entity_1 = require("./user-tree.entity");
let PvpActionLog = class PvpActionLog {
    id;
    attackerId;
    defenderId;
    actionType;
    stolenAmount;
    targetTreeId;
    wasBlocked;
    createdAt;
    attacker;
    defender;
    targetTree;
};
exports.PvpActionLog = PvpActionLog;
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        primary: true,
        generated: 'uuid',
    }),
    __metadata("design:type", String)
], PvpActionLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'attacker_id', type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], PvpActionLog.prototype, "attackerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'defender_id', type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], PvpActionLog.prototype, "defenderId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'action_type', type: 'varchar' }),
    __metadata("design:type", String)
], PvpActionLog.prototype, "actionType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'stolen_amount', nullable: true }),
    __metadata("design:type", Number)
], PvpActionLog.prototype, "stolenAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'target_tree_id', type: 'uuid', nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], PvpActionLog.prototype, "targetTreeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'was_blocked', default: false }),
    __metadata("design:type", Boolean)
], PvpActionLog.prototype, "wasBlocked", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], PvpActionLog.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('User', { onDelete: 'NO ACTION' }),
    (0, typeorm_1.JoinColumn)({ name: 'attacker_id' }),
    __metadata("design:type", user_entity_1.User)
], PvpActionLog.prototype, "attacker", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('User', { onDelete: 'NO ACTION' }),
    (0, typeorm_1.JoinColumn)({ name: 'defender_id' }),
    __metadata("design:type", user_entity_1.User)
], PvpActionLog.prototype, "defender", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('UserTree', 'pvpActionLogs', {
        onDelete: 'NO ACTION',
        nullable: true,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'target_tree_id' }),
    __metadata("design:type", user_tree_entity_1.UserTree)
], PvpActionLog.prototype, "targetTree", void 0);
exports.PvpActionLog = PvpActionLog = __decorate([
    (0, typeorm_1.Entity)('pvp_action_logs')
], PvpActionLog);
//# sourceMappingURL=pvp-action-log.entity.js.map