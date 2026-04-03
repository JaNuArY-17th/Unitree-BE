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
exports.Resource = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
let Resource = class Resource extends base_entity_1.BaseEntity {
    code;
    name;
    description;
    assetsPath;
    maxStack;
    airdropCodes;
    userResources;
};
exports.Resource = Resource;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', unique: true }),
    __metadata("design:type", String)
], Resource.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', unique: false }),
    __metadata("design:type", String)
], Resource.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Resource.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'assets_path', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], Resource.prototype, "assetsPath", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'max_stack', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Resource.prototype, "maxStack", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('AirdropCode', 'resource'),
    __metadata("design:type", Array)
], Resource.prototype, "airdropCodes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('UserResource', 'resource'),
    __metadata("design:type", Array)
], Resource.prototype, "userResources", void 0);
exports.Resource = Resource = __decorate([
    (0, typeorm_1.Entity)('resources')
], Resource);
//# sourceMappingURL=resource.entity.js.map