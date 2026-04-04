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
const wifi_config_entity_1 = require("../../../database/entities/wifi-config.entity");
const user_resource_entity_1 = require("../../../database/entities/user-resource.entity");
const resource_entity_1 = require("../../../database/entities/resource.entity");
const enums_constant_1 = require("../../../shared/constants/enums.constant");
const cache_service_1 = require("../../../services/cache.service");
const points_service_1 = require("../../points/services/points.service");
const socket_service_1 = require("../../../services/socket.service");
let WifiSessionsService = WifiSessionsService_1 = class WifiSessionsService {
    wifiSessionRepository;
    wifiConfigRepository;
    userResourceRepository;
    resourceRepository;
    cacheService;
    pointsService;
    socketService;
    dataSource;
    logger = new common_1.Logger(WifiSessionsService_1.name);
    minimumHeartbeatSeconds = 45;
    maxHeartbeatWindowMs = 15 * 60 * 1000;
    timeoutWindowMs = 15 * 60 * 1000;
    sessionCacheTtl = 20 * 60;
    constructor(wifiSessionRepository, wifiConfigRepository, userResourceRepository, resourceRepository, cacheService, pointsService, socketService, dataSource) {
        this.wifiSessionRepository = wifiSessionRepository;
        this.wifiConfigRepository = wifiConfigRepository;
        this.userResourceRepository = userResourceRepository;
        this.resourceRepository = resourceRepository;
        this.cacheService = cacheService;
        this.pointsService = pointsService;
        this.socketService = socketService;
        this.dataSource = dataSource;
    }
    async startSession(userId, dto, requestIp) {
        const activeSessionKey = `active_wifi_session:${userId}`;
        const activeSession = await this.cacheService.exists(activeSessionKey);
        if (activeSession) {
            throw new common_1.BadRequestException('You already have an active WiFi session');
        }
        const ip = requestIp || dto.ipAddress;
        if (!ip) {
            throw new common_1.BadRequestException('Unable to resolve user IP address');
        }
        const wifiConfig = await this.validateWifiConfig(ip, dto.ssid);
        if (!wifiConfig) {
            throw new common_1.ForbiddenException('WiFi network is not allowed');
        }
        const session = this.wifiSessionRepository.create({
            userId,
            startTime: new Date(),
            lastHeartbeat: new Date(),
            status: enums_constant_1.WifiSessionStatus.ACTIVE,
            deviceId: dto.deviceId,
            ipAddress: ip,
            startIp: ip,
            wifiConfigId: wifiConfig.id,
        });
        const savedSession = await this.wifiSessionRepository.save(session);
        await this.cacheActiveSession(userId, savedSession.id, {
            sessionId: savedSession.id,
            startTime: savedSession.startTime.toISOString(),
            lastHeartbeat: savedSession.lastHeartbeat.toISOString(),
            startIp: savedSession.startIp,
            wifiConfigId: savedSession.wifiConfigId,
            accumulatedMinutes: '0',
            heartbeatCount: '1',
            suspectCount: '0',
        });
        await this.cacheService.set(`wifi_accumulated:${userId}`, 0, this.sessionCacheTtl);
        this.logger.log(`WiFi session started: ${savedSession.id} for user ${userId}`);
        return savedSession;
    }
    async heartbeat(userId, dto, requestIp) {
        const session = await this.wifiSessionRepository.findOne({
            where: { id: dto.sessionId, userId },
        });
        if (!session) {
            throw new common_1.NotFoundException('WiFi session not found');
        }
        if (session.status !== enums_constant_1.WifiSessionStatus.ACTIVE) {
            throw new common_1.BadRequestException('WiFi session is not active');
        }
        const ip = requestIp;
        if (session.startIp && ip !== session.startIp) {
            throw new common_1.ForbiddenException('Heartbeat IP does not match session IP');
        }
        const now = new Date();
        const lastHeartbeat = session.lastHeartbeat || session.startTime;
        const elapsedMs = now.getTime() - lastHeartbeat.getTime();
        if (elapsedMs > this.maxHeartbeatWindowMs) {
            await this.completeSessionTimeout(session);
            throw new common_1.BadRequestException('WiFi session timed out due to missing heartbeat');
        }
        if (elapsedMs < this.minimumHeartbeatSeconds * 1000) {
            await this.flagSessionAsSuspicious(session, `fast_heartbeat:${elapsedMs}`);
        }
        const durationMinutes = Math.floor((now.getTime() - session.startTime.getTime()) / 60000);
        const incrementMinutes = Math.max(0, Math.floor(elapsedMs / 60000));
        session.lastHeartbeat = now;
        await this.wifiSessionRepository.save(session);
        const accumulatedMinutes = await this.incrementAccumulatedMinutes(userId, incrementMinutes);
        await this.updateActiveSessionHeartbeat(userId, now.toISOString(), accumulatedMinutes);
        const result = {
            acknowledged: true,
            currentDuration: durationMinutes,
            accumulatedMinutes,
            cheatFlag: session.cheatFlag,
            sessionStatus: session.status,
        };
        this.logger.debug(`Heartbeat accepted for ${session.id}: ${accumulatedMinutes} min, cheat=${session.cheatFlag}`);
        return result;
    }
    async endSession(sessionId, userId, dto, requestIp) {
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
        if (session.startIp && requestIp !== session.startIp) {
            throw new common_1.ForbiddenException('End session IP does not match session IP');
        }
        const now = new Date();
        const elapsedMs = now.getTime() - session.lastHeartbeat.getTime();
        if (elapsedMs > this.timeoutWindowMs) {
            await this.completeSessionTimeout(session);
            throw new common_1.BadRequestException('WiFi session already timed out');
        }
        const endTime = now;
        const durationMinutes = Math.floor((endTime.getTime() - session.startTime.getTime()) / 60000);
        return await this.dataSource.transaction(async (manager) => {
            const wifiConfig = await this.wifiConfigRepository.findOneBy({
                id: session.wifiConfigId,
            });
            const rewardRate = wifiConfig?.rewardRate ?? 5;
            const leavesEarned = session.cheatFlag ? 0 : durationMinutes * rewardRate;
            session.endTime = endTime;
            session.durationMinutes = durationMinutes;
            session.pointsEarned = leavesEarned;
            session.status = session.cheatFlag
                ? enums_constant_1.WifiSessionStatus.CHEAT_FLAGGED
                : enums_constant_1.WifiSessionStatus.COMPLETED;
            await manager.save(session);
            const previousBalance = await this.addLeafResource(userId, leavesEarned);
            const newBalance = previousBalance + leavesEarned;
            if (leavesEarned > 0) {
                await this.pointsService.addEconomyLog(userId, enums_constant_1.PointTransactionType.WIFI, leavesEarned, `wifi_session:${sessionId}`);
            }
            await this.clearActiveSessionCache(userId);
            await this.cacheService.del(`wifi_accumulated:${userId}`);
            if (leavesEarned > 0) {
                this.socketService.emitToUser(userId, 'wifi.reward.updated', {
                    sessionId,
                    leavesEarned,
                    currentLeaves: newBalance,
                });
            }
            this.logger.log(`WiFi session ended: ${sessionId}, awarded ${leavesEarned} leaves`);
            return {
                session,
                pointsEarned: leavesEarned,
                previousBalance,
                newBalance,
            };
        });
    }
    async handleTimeoutSessions() {
        const timeoutThreshold = new Date(Date.now() - this.timeoutWindowMs);
        const lostSessions = await this.wifiSessionRepository.find({
            where: {
                status: enums_constant_1.WifiSessionStatus.ACTIVE,
                lastHeartbeat: (0, typeorm_2.LessThan)(timeoutThreshold),
            },
        });
        if (lostSessions.length === 0) {
            return;
        }
        this.logger.log(`Found ${lostSessions.length} timeout sessions to process`);
        for (const session of lostSessions) {
            await this.completeSessionTimeout(session);
        }
    }
    async completeSessionTimeout(session) {
        try {
            const endTime = session.lastHeartbeat || new Date();
            const durationMinutes = Math.floor((endTime.getTime() - session.startTime.getTime()) / 60000);
            const wifiConfig = await this.wifiConfigRepository.findOneBy({
                id: session.wifiConfigId,
            });
            const rewardRate = wifiConfig?.rewardRate ?? 5;
            const leavesEarned = session.cheatFlag ? 0 : durationMinutes * rewardRate;
            session.status = session.cheatFlag
                ? enums_constant_1.WifiSessionStatus.CHEAT_FLAGGED
                : enums_constant_1.WifiSessionStatus.TIMEOUT;
            session.endTime = endTime;
            session.durationMinutes = durationMinutes;
            session.pointsEarned = leavesEarned;
            await this.wifiSessionRepository.save(session);
            if (leavesEarned > 0) {
                await this.addLeafResource(session.userId, leavesEarned);
                await this.pointsService.addEconomyLog(session.userId, enums_constant_1.PointTransactionType.WIFI, leavesEarned, `wifi_session_timeout:${session.id}`);
            }
            await this.clearActiveSessionCache(session.userId);
            await this.cacheService.del(`wifi_accumulated:${session.userId}`);
            this.logger.log(`Completed timeout session: ${session.id}, awarded ${leavesEarned} leaves`);
        }
        catch (error) {
            this.logger.error(`Error completing timeout session ${session.id}: ${error.message}`);
        }
    }
    async flagSessionAsSuspicious(session, reason) {
        session.cheatFlag = true;
        session.cheatReason = reason;
        await this.wifiSessionRepository.save(session);
        await this.cacheService.hset(`active_wifi_session:${session.userId}`, 'suspectCount', '1');
        this.logger.warn(`WiFi session suspicious: ${session.id}, reason=${reason}`);
    }
    async validateWifiConfig(ip, ssid) {
        const query = this.wifiConfigRepository.createQueryBuilder('config');
        query.where('config.public_ip_address = :ip', { ip }).andWhere('config.status = :status', { status: 'active' });
        if (ssid) {
            query.andWhere('config.ssid = :ssid', { ssid });
        }
        return query.getOne();
    }
    async addLeafResource(userId, amount) {
        if (amount <= 0) {
            return 0;
        }
        const leafResource = await this.findLeafResource();
        if (!leafResource) {
            throw new common_1.NotFoundException('Leaf resource not found');
        }
        let userResource = await this.userResourceRepository.findOne({
            where: { userId, resourceId: leafResource.id },
        });
        if (!userResource) {
            userResource = this.userResourceRepository.create({
                userId,
                resourceId: leafResource.id,
                balance: `${amount}`,
            });
        }
        else {
            userResource.balance = `${BigInt(userResource.balance) + BigInt(amount)}`;
        }
        await this.userResourceRepository.save(userResource);
        return Number(BigInt(userResource.balance) - BigInt(amount));
    }
    async findLeafResource() {
        const codes = ['GREEN_LEAF', 'GREEN_LEAVES', 'LEAVES'];
        for (const code of codes) {
            const resource = await this.resourceRepository.findOne({
                where: { code },
            });
            if (resource) {
                return resource;
            }
        }
        return null;
    }
    async cacheActiveSession(userId, sessionId, data) {
        const key = `active_wifi_session:${userId}`;
        for (const [field, value] of Object.entries(data)) {
            await this.cacheService.hset(key, field, value);
        }
        await this.cacheService.expire(key, this.sessionCacheTtl);
    }
    async updateActiveSessionHeartbeat(userId, lastHeartbeat, accumulatedMinutes) {
        const key = `active_wifi_session:${userId}`;
        await this.cacheService.hset(key, 'lastHeartbeat', lastHeartbeat);
        await this.cacheService.hset(key, 'accumulatedMinutes', `${accumulatedMinutes}`);
        await this.cacheService.hset(key, 'heartbeatCount', `${Date.now()}`);
        await this.cacheService.expire(key, this.sessionCacheTtl);
    }
    async incrementAccumulatedMinutes(userId, minutes) {
        const key = `wifi_accumulated:${userId}`;
        if (minutes <= 0) {
            const existing = await this.cacheService.get(key);
            return existing ?? 0;
        }
        const current = (await this.cacheService.get(key)) ?? 0;
        const next = current + minutes;
        await this.cacheService.set(key, next, this.sessionCacheTtl);
        return next;
    }
    async clearActiveSessionCache(userId) {
        await this.cacheService.del(`active_wifi_session:${userId}`);
        await this.cacheService.del(`wifi_accumulated:${userId}`);
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
    (0, schedule_1.Cron)('*/10 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WifiSessionsService.prototype, "handleTimeoutSessions", null);
exports.WifiSessionsService = WifiSessionsService = WifiSessionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(wifi_session_entity_1.WifiSession)),
    __param(1, (0, typeorm_1.InjectRepository)(wifi_config_entity_1.WifiConfig)),
    __param(2, (0, typeorm_1.InjectRepository)(user_resource_entity_1.UserResource)),
    __param(3, (0, typeorm_1.InjectRepository)(resource_entity_1.Resource)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        cache_service_1.CacheService,
        points_service_1.PointsService,
        socket_service_1.SocketService,
        typeorm_2.DataSource])
], WifiSessionsService);
//# sourceMappingURL=wifi-sessions.service.js.map