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
var WifiSessionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WifiSessionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const schedule_1 = require("@nestjs/schedule");
const wifi_session_entity_1 = require("../../../database/entities/wifi-session.entity");
const enums_constant_1 = require("../../../shared/constants/enums.constant");
const cache_service_1 = require("../../../services/cache.service");
const points_service_1 = require("../../points/services/points.service");
let WifiSessionsService = WifiSessionsService_1 = class WifiSessionsService {
    wifiSessionRepository;
    cacheService;
    pointsService;
    dataSource;
    logger = new common_1.Logger(WifiSessionsService_1.name);
    constructor(wifiSessionRepository, cacheService, pointsService, dataSource) {
        this.wifiSessionRepository = wifiSessionRepository;
        this.cacheService = cacheService;
        this.pointsService = pointsService;
        this.dataSource = dataSource;
    }
    async startSession(userId, dto) {
        const activeSession = await this.getActiveSessionFromCache(userId);
        if (activeSession) {
            throw new common_1.BadRequestException('You already have an active WiFi session');
        }
        const session = this.wifiSessionRepository.create({
            userId,
            startTime: new Date(),
            lastHeartbeat: new Date(),
            status: enums_constant_1.WifiSessionStatus.ACTIVE,
            deviceId: dto.deviceId,
            ipAddress: dto.ipAddress,
        });
        const savedSession = await this.wifiSessionRepository.save(session);
        await this.cacheActiveSession(userId, savedSession.id);
        this.logger.log(`WiFi session started: ${savedSession.id} for user ${userId}`);
        return savedSession;
    }
    async heartbeat(userId, dto) {
        const session = await this.wifiSessionRepository.findOne({
            where: { id: dto.sessionId, userId },
        });
        if (!session) {
            throw new common_1.NotFoundException('WiFi session not found');
        }
        if (session.status !== enums_constant_1.WifiSessionStatus.ACTIVE) {
            throw new common_1.BadRequestException('WiFi session is not active');
        }
        session.lastHeartbeat = new Date();
        await this.wifiSessionRepository.save(session);
        const durationMinutes = Math.floor((new Date().getTime() - session.startTime.getTime()) / 60000);
        const pointsEarned = Math.floor(durationMinutes);
        this.logger.debug(`Heartbeat received for session: ${session.id}`);
        return {
            acknowledged: true,
            currentDuration: durationMinutes,
            pointsEarned,
            sessionStatus: session.status,
        };
    }
    async endSession(sessionId, userId, dto) {
        const session = await this.wifiSessionRepository.findOne({
            where: { id: sessionId, userId },
            relations: ['user'],
        });
        if (!session) {
            throw new common_1.NotFoundException('WiFi session not found');
        }
        if (session.status !== enums_constant_1.WifiSessionStatus.ACTIVE) {
            throw new common_1.BadRequestException('WiFi session is not active');
        }
        const endTime = new Date();
        const durationMinutes = Math.floor((endTime.getTime() - session.startTime.getTime()) / 60000);
        const pointsEarned = Math.floor(durationMinutes);
        return await this.dataSource.transaction(async (manager) => {
            session.endTime = endTime;
            session.durationMinutes = durationMinutes;
            session.pointsEarned = pointsEarned;
            session.status = enums_constant_1.WifiSessionStatus.COMPLETED;
            await manager.save(session);
            if (pointsEarned > 0) {
                await this.pointsService.addEconomyLog(userId, 'point', pointsEarned, `wifi_session:${sessionId}`);
            }
            await this.clearActiveSessionCache(userId);
            this.logger.log(`WiFi session ended: ${sessionId}, awarded ${pointsEarned} points`);
            return {
                session,
                pointsEarned,
                previousBalance: 0,
                newBalance: pointsEarned,
            };
        });
    }
    async handleTimeoutSessions() {
        const timeoutThreshold = new Date(Date.now() - 20 * 60 * 1000);
        const lostSessions = await this.wifiSessionRepository.find({
            where: {
                status: enums_constant_1.WifiSessionStatus.ACTIVE,
                lastHeartbeat: (0, typeorm_2.LessThan)(timeoutThreshold),
            },
            relations: ['user'],
        });
        if (lostSessions.length === 0) {
            return;
        }
        this.logger.log(`Found ${lostSessions.length} timeout sessions to process`);
        for (const session of lostSessions) {
            await this.completeTimeoutSession(session);
        }
    }
    async completeTimeoutSession(session) {
        try {
            const endTime = session.lastHeartbeat || new Date();
            const durationMinutes = Math.floor((endTime.getTime() - session.startTime.getTime()) / 60000);
            const pointsEarned = Math.floor(durationMinutes);
            session.status = enums_constant_1.WifiSessionStatus.COMPLETED;
            session.endTime = endTime;
            session.durationMinutes = durationMinutes;
            session.pointsEarned = pointsEarned;
            await this.wifiSessionRepository.save(session);
            if (pointsEarned > 0) {
                await this.pointsService.addEconomyLog(session.userId, 'point', pointsEarned, `wifi_session_timeout:${session.id}`);
            }
            await this.clearActiveSessionCache(session.userId);
            this.logger.log(`Completed timeout session: ${session.id}, awarded ${pointsEarned} points`);
        }
        catch (error) {
            this.logger.error(`Error completing timeout session ${session.id}: ${error.message}`);
        }
    }
    async getActiveSessionFromCache(userId) {
        return await this.cacheService.get(`wifi:active:${userId}`);
    }
    async cacheActiveSession(userId, sessionId) {
        await this.cacheService.set(`wifi:active:${userId}`, sessionId, 86400);
    }
    async clearActiveSessionCache(userId) {
        await this.cacheService.del(`wifi:active:${userId}`);
    }
    async getActiveSession(userId) {
        return this.wifiSessionRepository.findOne({
            where: {
                userId,
                status: enums_constant_1.WifiSessionStatus.ACTIVE,
            },
        });
    }
    async getUserSessions(userId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [data, total] = await this.wifiSessionRepository.findAndCount({
            where: { userId },
            skip,
            take: limit,
            order: { createdAt: 'DESC' },
        });
        return { data, total };
    }
    async getSessionById(sessionId, userId) {
        const session = await this.wifiSessionRepository.findOne({
            where: { id: sessionId, userId },
        });
        if (!session) {
            throw new common_1.NotFoundException('WiFi session not found');
        }
        return session;
    }
};
exports.WifiSessionsService = WifiSessionsService;
__decorate([
    (0, schedule_1.Cron)('*/5 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WifiSessionsService.prototype, "handleTimeoutSessions", null);
exports.WifiSessionsService = WifiSessionsService = WifiSessionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(wifi_session_entity_1.WifiSession)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        cache_service_1.CacheService,
        points_service_1.PointsService,
        typeorm_2.DataSource])
], WifiSessionsService);
//# sourceMappingURL=wifi-sessions.service.js.map