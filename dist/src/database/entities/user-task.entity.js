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
exports.UserTask = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
let UserTask = class UserTask extends base_entity_1.BaseEntity {
    userId;
    taskId;
    status;
    user;
    task;
};
exports.UserTask = UserTask;
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], UserTask.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'task_id', type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], UserTask.prototype, "taskId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', default: 'PENDING' }),
    __metadata("design:type", String)
], UserTask.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('User', { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", Object)
], UserTask.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('Task', 'userTasks', { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'task_id' }),
    __metadata("design:type", Object)
], UserTask.prototype, "task", void 0);
exports.UserTask = UserTask = __decorate([
    (0, typeorm_1.Entity)('user_tasks')
], UserTask);
//# sourceMappingURL=user-task.entity.js.map