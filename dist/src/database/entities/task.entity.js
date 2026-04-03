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
exports.Task = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
let Task = class Task extends base_entity_1.BaseEntity {
    title;
    description;
    rewardType;
    rewardAmount;
    isDaily;
    userTasks;
};
exports.Task = Task;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], Task.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Task.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reward_type', type: 'varchar' }),
    __metadata("design:type", String)
], Task.prototype, "rewardType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reward_amount' }),
    __metadata("design:type", Number)
], Task.prototype, "rewardAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_daily', default: true }),
    __metadata("design:type", Boolean)
], Task.prototype, "isDaily", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('UserTask', 'task'),
    __metadata("design:type", Array)
], Task.prototype, "userTasks", void 0);
exports.Task = Task = __decorate([
    (0, typeorm_1.Entity)('tasks')
], Task);
//# sourceMappingURL=task.entity.js.map