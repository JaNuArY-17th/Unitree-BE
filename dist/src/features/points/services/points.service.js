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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PointsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const economy_log_entity_1 = require("../../../database/entities/economy-log.entity");
let PointsService = class PointsService {
    economyLogRepository;
    constructor(economyLogRepository) {
        this.economyLogRepository = economyLogRepository;
    }
    async getEconomyHistory(userId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [data, total] = await this.economyLogRepository.findAndCount({
            where: { userId },
            skip,
            take: limit,
            order: { createdAt: 'DESC' },
        });
        return { data, total };
    }
    async addEconomyLog(userId, resourceType, amount, source) {
        const log = this.economyLogRepository.create({
            userId,
            resourceType,
            amount,
            source,
        });
        return this.economyLogRepository.save(log);
    }
};
exports.PointsService = PointsService;
exports.PointsService = PointsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(economy_log_entity_1.EconomyLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PointsService);
//# sourceMappingURL=points.service.js.map