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
exports.PvpActivityDto = exports.EconomyActivityDto = exports.ActivityLogQueryDto = exports.ActivityLogType = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var ActivityLogType;
(function (ActivityLogType) {
    ActivityLogType["ECONOMY"] = "economy";
    ActivityLogType["PVP"] = "pvp";
    ActivityLogType["ALL"] = "all";
})(ActivityLogType || (exports.ActivityLogType = ActivityLogType = {}));
class ActivityLogQueryDto {
    type = ActivityLogType.ALL;
    page = 1;
    limit = 20;
}
exports.ActivityLogQueryDto = ActivityLogQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: ActivityLogType,
        default: ActivityLogType.ALL,
        description: 'Loại lịch sử cần lấy: economy | pvp | all',
    }),
    (0, class_validator_1.IsEnum)(ActivityLogType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ActivityLogQueryDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: Number, default: 1 }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], ActivityLogQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: Number, default: 20 }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], ActivityLogQueryDto.prototype, "limit", void 0);
class EconomyActivityDto {
    kind;
    resourceType;
    amount;
    source;
    createdAt;
}
exports.EconomyActivityDto = EconomyActivityDto;
class PvpActivityDto {
    kind;
    attackerId;
    attackerUsername;
    attackerAvatar;
    defenderId;
    defenderUsername;
    actionType;
    stolenAmount;
    wasBlocked;
    createdAt;
}
exports.PvpActivityDto = PvpActivityDto;
//# sourceMappingURL=activity-log.dto.js.map