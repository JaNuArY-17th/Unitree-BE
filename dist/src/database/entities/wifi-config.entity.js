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
exports.WifiConfig = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
let WifiConfig = class WifiConfig extends base_entity_1.BaseEntity {
    ssid;
    publicIpAddress;
    rewardRate;
    status;
};
exports.WifiConfig = WifiConfig;
__decorate([
    (0, typeorm_1.Index)({ unique: true }),
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], WifiConfig.prototype, "ssid", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'public_ip_address', type: 'varchar' }),
    __metadata("design:type", String)
], WifiConfig.prototype, "publicIpAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reward_rate', type: 'int', default: 5 }),
    __metadata("design:type", Number)
], WifiConfig.prototype, "rewardRate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['active', 'disabled'],
        default: 'active',
    }),
    __metadata("design:type", String)
], WifiConfig.prototype, "status", void 0);
exports.WifiConfig = WifiConfig = __decorate([
    (0, typeorm_1.Entity)('wifi_config')
], WifiConfig);
//# sourceMappingURL=wifi-config.entity.js.map