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
exports.Tree = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
let Tree = class Tree extends base_entity_1.BaseEntity {
    code;
    name;
    treeType;
    maxLevel;
    costBase;
    costRate;
    oxyBase;
    oxyRate;
    perkBase;
    perkStep;
    slotIndex;
    description;
    assetsPath;
    unlockCondition;
    userTrees;
};
exports.Tree = Tree;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', unique: true }),
    __metadata("design:type", String)
], Tree.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', unique: true }),
    __metadata("design:type", String)
], Tree.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tree_type', type: 'varchar' }),
    __metadata("design:type", String)
], Tree.prototype, "treeType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'max_level', type: 'smallint' }),
    __metadata("design:type", Number)
], Tree.prototype, "maxLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cost_base' }),
    __metadata("design:type", Number)
], Tree.prototype, "costBase", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cost_rate', type: 'decimal' }),
    __metadata("design:type", Number)
], Tree.prototype, "costRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'oxy_base', nullable: true }),
    __metadata("design:type", Number)
], Tree.prototype, "oxyBase", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'oxy_rate', type: 'decimal', nullable: true }),
    __metadata("design:type", Number)
], Tree.prototype, "oxyRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'perk_base', type: 'decimal', nullable: true }),
    __metadata("design:type", Number)
], Tree.prototype, "perkBase", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'perk_step', type: 'decimal', nullable: true }),
    __metadata("design:type", Number)
], Tree.prototype, "perkStep", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'slot_index', type: 'smallint' }),
    __metadata("design:type", Number)
], Tree.prototype, "slotIndex", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Tree.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'assets_path', type: 'varchar' }),
    __metadata("design:type", String)
], Tree.prototype, "assetsPath", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unlock_condition', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Tree.prototype, "unlockCondition", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('UserTree', 'tree'),
    __metadata("design:type", Array)
], Tree.prototype, "userTrees", void 0);
exports.Tree = Tree = __decorate([
    (0, typeorm_1.Entity)('trees')
], Tree);
//# sourceMappingURL=tree.entity.js.map