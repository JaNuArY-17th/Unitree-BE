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
exports.UserResource = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const user_entity_1 = require("./user.entity");
const resource_entity_1 = require("./resource.entity");
let UserResource = class UserResource extends base_entity_1.BaseEntity {
    userId;
    resourceId;
    balance;
    user;
    resource;
};
exports.UserResource = UserResource;
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], UserResource.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'resource_id', type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], UserResource.prototype, "resourceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', default: 0 }),
    __metadata("design:type", String)
], UserResource.prototype, "balance", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('User', { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], UserResource.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('Resource', 'userResources', { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'resource_id' }),
    __metadata("design:type", resource_entity_1.Resource)
], UserResource.prototype, "resource", void 0);
exports.UserResource = UserResource = __decorate([
    (0, typeorm_1.Entity)('user_resources'),
    (0, typeorm_1.Unique)('unique_user_resource', ['userId', 'resourceId'])
], UserResource);
//# sourceMappingURL=user-resource.entity.js.map