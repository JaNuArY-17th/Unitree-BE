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
exports.AirdropCode = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const resource_entity_1 = require("./resource.entity");
let AirdropCode = class AirdropCode extends base_entity_1.BaseEntity {
    code;
    resourceId;
    amount;
    expirationDate;
    resource;
};
exports.AirdropCode = AirdropCode;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', unique: true }),
    __metadata("design:type", String)
], AirdropCode.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'resource_id', type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], AirdropCode.prototype, "resourceId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], AirdropCode.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expiration_date', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], AirdropCode.prototype, "expirationDate", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('Resource', 'airdropCodes', { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'resource_id' }),
    __metadata("design:type", resource_entity_1.Resource)
], AirdropCode.prototype, "resource", void 0);
exports.AirdropCode = AirdropCode = __decorate([
    (0, typeorm_1.Entity)('airdrop_codes')
], AirdropCode);
//# sourceMappingURL=airdrop-code.entity.js.map