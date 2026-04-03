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
exports.UserTree = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const user_entity_1 = require("./user.entity");
const tree_entity_1 = require("./tree.entity");
let UserTree = class UserTree extends base_entity_1.BaseEntity {
    userId;
    treeId;
    level;
    isDamaged;
    upgradeEndTime;
    assetPath;
    lastHarvestTime;
    damagedAt;
    version;
    checksum;
    user;
    tree;
    pvpActionLogs;
};
exports.UserTree = UserTree;
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], UserTree.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tree_id', type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], UserTree.prototype, "treeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'smallint', default: 1 }),
    __metadata("design:type", Number)
], UserTree.prototype, "level", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_damaged', default: false }),
    __metadata("design:type", Boolean)
], UserTree.prototype, "isDamaged", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'upgrade_end_time', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], UserTree.prototype, "upgradeEndTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'asset_path', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], UserTree.prototype, "assetPath", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'last_harvest_time',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    }),
    __metadata("design:type", Date)
], UserTree.prototype, "lastHarvestTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'damaged_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], UserTree.prototype, "damagedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 1 }),
    __metadata("design:type", Number)
], UserTree.prototype, "version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], UserTree.prototype, "checksum", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('User', { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], UserTree.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('Tree', 'userTrees', { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'tree_id' }),
    __metadata("design:type", tree_entity_1.Tree)
], UserTree.prototype, "tree", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('PvpActionLog', 'targetTree'),
    __metadata("design:type", Array)
], UserTree.prototype, "pvpActionLogs", void 0);
exports.UserTree = UserTree = __decorate([
    (0, typeorm_1.Entity)('user_trees'),
    (0, typeorm_1.Unique)('unique_user_tree', ['userId', 'treeId'])
], UserTree);
//# sourceMappingURL=user-tree.entity.js.map