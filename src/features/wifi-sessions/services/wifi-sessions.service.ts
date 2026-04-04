import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, DataSource } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { WifiSession } from '../../../database/entities/wifi-session.entity';
import { WifiConfig } from '../../../database/entities/wifi-config.entity';
import { UserResource } from '../../../database/entities/user-resource.entity';
import { Resource } from '../../../database/entities/resource.entity';
import { StartSessionDto } from '../dto/start-session.dto';
import { HeartbeatDto } from '../dto/heartbeat.dto';
import { EndSessionDto } from '../dto/end-session.dto';
import {
  WifiSessionStatus,
  PointTransactionType,
} from '../../../shared/constants/enums.constant';
import { CacheService } from '../../../services/cache.service';
import { PointsService } from '../../points/services/points.service';
import { SocketService } from '../../../services/socket.service';

@Injectable()
export class WifiSessionsService {
  private readonly logger = new Logger(WifiSessionsService.name);
  private readonly minimumHeartbeatSeconds = 45;
  private readonly maxHeartbeatWindowMs = 15 * 60 * 1000;
  private readonly timeoutWindowMs = 15 * 60 * 1000;
  private readonly sessionCacheTtl = 20 * 60;

  constructor(
    @InjectRepository(WifiSession)
    private readonly wifiSessionRepository: Repository<WifiSession>,
    @InjectRepository(WifiConfig)
    private readonly wifiConfigRepository: Repository<WifiConfig>,
    @InjectRepository(UserResource)
    private readonly userResourceRepository: Repository<UserResource>,
    @InjectRepository(Resource)
    private readonly resourceRepository: Repository<Resource>,
    private readonly cacheService: CacheService,
    private readonly pointsService: PointsService,
    private readonly socketService: SocketService,
    private readonly dataSource: DataSource,
  ) {}

  // ===== START SESSION =====
  async startSession(
    userId: string,
    dto: StartSessionDto,
    requestIp: string,
  ): Promise<WifiSession> {
    const activeSessionKey = `active_wifi_session:${userId}`;
    const activeSession = await this.cacheService.exists(activeSessionKey);
    if (activeSession) {
      throw new BadRequestException('You already have an active WiFi session');
    }

    const ip = requestIp || dto.ipAddress;
    if (!ip) {
      throw new BadRequestException('Unable to resolve user IP address');
    }

    const wifiConfig = await this.validateWifiConfig(ip, dto.ssid);
    if (!wifiConfig) {
      throw new ForbiddenException('WiFi network is not allowed');
    }

    const session = this.wifiSessionRepository.create({
      userId,
      startTime: new Date(),
      lastHeartbeat: new Date(),
      status: WifiSessionStatus.ACTIVE,
      deviceId: dto.deviceId,
      ipAddress: ip,
      startIp: ip,
      wifiConfigId: wifiConfig.id,
    });

    const savedSession = await this.wifiSessionRepository.save(session);

    await this.cacheActiveSession(userId, savedSession.id, {
      sessionId: savedSession.id,
      startTime: savedSession.startTime.toISOString(),
      lastHeartbeat: savedSession.lastHeartbeat!.toISOString(),
      startIp: savedSession.startIp!,
      wifiConfigId: savedSession.wifiConfigId!,
      accumulatedMinutes: '0',
      heartbeatCount: '1',
      suspectCount: '0',
    });
    await this.cacheService.set(`wifi_accumulated:${userId}`, 0, this.sessionCacheTtl);

    this.logger.log(`WiFi session started: ${savedSession.id} for user ${userId}`);
    return savedSession;
  }

  // ===== HEARTBEAT =====
  async heartbeat(
    userId: string,
    dto: HeartbeatDto,
    requestIp: string,
  ): Promise<{
    acknowledged: boolean;
    currentDuration: number;
    accumulatedMinutes: number;
    cheatFlag: boolean;
    sessionStatus: WifiSessionStatus;
  }> {
    const session = await this.wifiSessionRepository.findOne({
      where: { id: dto.sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('WiFi session not found');
    }

    if (session.status !== WifiSessionStatus.ACTIVE) {
      throw new BadRequestException('WiFi session is not active');
    }

    const ip = requestIp;
    if (session.startIp && ip !== session.startIp) {
      throw new ForbiddenException('Heartbeat IP does not match session IP');
    }

    const now = new Date();
    const lastHeartbeat = session.lastHeartbeat || session.startTime;
    const elapsedMs = now.getTime() - lastHeartbeat.getTime();

    if (elapsedMs > this.maxHeartbeatWindowMs) {
      await this.completeSessionTimeout(session);
      throw new BadRequestException('WiFi session timed out due to missing heartbeat');
    }

    if (elapsedMs < this.minimumHeartbeatSeconds * 1000) {
      await this.flagSessionAsSuspicious(session, `fast_heartbeat:${elapsedMs}`);
    }

    const durationMinutes = Math.floor(
      (now.getTime() - session.startTime.getTime()) / 60000,
    );
    const incrementMinutes = Math.max(0, Math.floor(elapsedMs / 60000));

    session.lastHeartbeat = now;
    await this.wifiSessionRepository.save(session);

    const accumulatedMinutes = await this.incrementAccumulatedMinutes(
      userId,
      incrementMinutes,
    );

    await this.updateActiveSessionHeartbeat(userId, now.toISOString(), accumulatedMinutes);

    const result = {
      acknowledged: true,
      currentDuration: durationMinutes,
      accumulatedMinutes,
      cheatFlag: session.cheatFlag,
      sessionStatus: session.status,
    };

    this.logger.debug(
      `Heartbeat accepted for ${session.id}: ${accumulatedMinutes} min, cheat=${session.cheatFlag}`,
    );

    return result;
  }

  // ===== END SESSION =====
  async endSession(
    sessionId: string,
    userId: string,
    dto: EndSessionDto,
    requestIp: string,
  ): Promise<{
    session: WifiSession;
    pointsEarned: number;
    previousBalance: number;
    newBalance: number;
  }> {
    const session = await this.wifiSessionRepository.findOne({
      where: { id: sessionId, userId },
      relations: ['user'],
    });

    if (!session) {
      throw new NotFoundException('WiFi session not found');
    }

    if (session.status !== WifiSessionStatus.ACTIVE) {
      throw new BadRequestException('WiFi session is not active');
    }

    if (session.startIp && requestIp !== session.startIp) {
      throw new ForbiddenException('End session IP does not match session IP');
    }

    const now = new Date();
    const elapsedMs = now.getTime() - session.lastHeartbeat!.getTime();
    if (elapsedMs > this.timeoutWindowMs) {
      await this.completeSessionTimeout(session);
      throw new BadRequestException('WiFi session already timed out');
    }

    const endTime = now;
    const durationMinutes = Math.floor(
      (endTime.getTime() - session.startTime.getTime()) / 60000,
    );

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
        ? WifiSessionStatus.CHEAT_FLAGGED
        : WifiSessionStatus.COMPLETED;
      await manager.save(session);

      const previousBalance = await this.addLeafResource(userId, leavesEarned);
      const newBalance = previousBalance + leavesEarned;

      if (leavesEarned > 0) {
        await this.pointsService.addEconomyLog(
          userId,
          PointTransactionType.WIFI,
          leavesEarned,
          `wifi_session:${sessionId}`,
        );
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

      this.logger.log(
        `WiFi session ended: ${sessionId}, awarded ${leavesEarned} leaves`,
      );

      return {
        session,
        pointsEarned: leavesEarned,
        previousBalance,
        newBalance,
      };
    });
  }

  // ===== BACKGROUND JOB: TIMEOUT HANDLER =====
  @Cron('*/10 * * * *') // Every 10 minutes
  async handleTimeoutSessions(): Promise<void> {
    const timeoutThreshold = new Date(Date.now() - this.timeoutWindowMs);

    const lostSessions = await this.wifiSessionRepository.find({
      where: {
        status: WifiSessionStatus.ACTIVE,
        lastHeartbeat: LessThan(timeoutThreshold),
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

  private async completeSessionTimeout(session: WifiSession): Promise<void> {
    try {
      const endTime = session.lastHeartbeat || new Date();
      const durationMinutes = Math.floor(
        (endTime.getTime() - session.startTime.getTime()) / 60000,
      );

      const wifiConfig = await this.wifiConfigRepository.findOneBy({
        id: session.wifiConfigId,
      });
      const rewardRate = wifiConfig?.rewardRate ?? 5;
      const leavesEarned = session.cheatFlag ? 0 : durationMinutes * rewardRate;

      session.status = session.cheatFlag
        ? WifiSessionStatus.CHEAT_FLAGGED
        : WifiSessionStatus.TIMEOUT;
      session.endTime = endTime;
      session.durationMinutes = durationMinutes;
      session.pointsEarned = leavesEarned;

      await this.wifiSessionRepository.save(session);

      if (leavesEarned > 0) {
        await this.addLeafResource(session.userId, leavesEarned);
        await this.pointsService.addEconomyLog(
          session.userId,
          PointTransactionType.WIFI,
          leavesEarned,
          `wifi_session_timeout:${session.id}`,
        );
      }

      await this.clearActiveSessionCache(session.userId);
      await this.cacheService.del(`wifi_accumulated:${session.userId}`);

      this.logger.log(
        `Completed timeout session: ${session.id}, awarded ${leavesEarned} leaves`,
      );
    } catch (error) {
      this.logger.error(
        `Error completing timeout session ${session.id}: ${error.message}`,
      );
    }
  }

  private async flagSessionAsSuspicious(
    session: WifiSession,
    reason: string,
  ): Promise<void> {
    session.cheatFlag = true;
    session.cheatReason = reason;
    await this.wifiSessionRepository.save(session);
    await this.cacheService.hset(
      `active_wifi_session:${session.userId}`,
      'suspectCount',
      '1',
    );
    this.logger.warn(`WiFi session suspicious: ${session.id}, reason=${reason}`);
  }

  private async validateWifiConfig(
    ip: string,
    ssid?: string,
  ): Promise<WifiConfig | null> {
    const query = this.wifiConfigRepository.createQueryBuilder('config');
    query.where('config.public_ip_address = :ip', { ip }).andWhere(
      'config.status = :status',
      { status: 'active' },
    );
    if (ssid) {
      query.andWhere('config.ssid = :ssid', { ssid });
    }
    return query.getOne();
  }

  private async addLeafResource(
    userId: string,
    amount: number,
  ): Promise<number> {
    if (amount <= 0) {
      return 0;
    }

    const leafResource = await this.findLeafResource();
    if (!leafResource) {
      throw new NotFoundException('Leaf resource not found');
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
    } else {
      userResource.balance = `${BigInt(userResource.balance) + BigInt(amount)}`;
    }

    await this.userResourceRepository.save(userResource);
    return Number(BigInt(userResource.balance) - BigInt(amount));
  }

  private async findLeafResource(): Promise<Resource | null> {
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

  private async cacheActiveSession(
    userId: string,
    sessionId: string,
    data: Record<string, string>,
  ): Promise<void> {
    const key = `active_wifi_session:${userId}`;
    for (const [field, value] of Object.entries(data)) {
      await this.cacheService.hset(key, field, value);
    }
    await this.cacheService.expire(key, this.sessionCacheTtl);
  }

  private async updateActiveSessionHeartbeat(
    userId: string,
    lastHeartbeat: string,
    accumulatedMinutes: number,
  ): Promise<void> {
    const key = `active_wifi_session:${userId}`;
    await this.cacheService.hset(key, 'lastHeartbeat', lastHeartbeat);
    await this.cacheService.hset(key, 'accumulatedMinutes', `${accumulatedMinutes}`);
    await this.cacheService.hset(key, 'heartbeatCount', `${Date.now()}`);
    await this.cacheService.expire(key, this.sessionCacheTtl);
  }

  private async incrementAccumulatedMinutes(
    userId: string,
    minutes: number,
  ): Promise<number> {
    const key = `wifi_accumulated:${userId}`;
    if (minutes <= 0) {
      const existing = await this.cacheService.get<number>(key);
      return existing ?? 0;
    }

    const current = (await this.cacheService.get<number>(key)) ?? 0;
    const next = current + minutes;
    await this.cacheService.set(key, next, this.sessionCacheTtl);
    return next;
  }

  private async clearActiveSessionCache(userId: string): Promise<void> {
    await this.cacheService.del(`active_wifi_session:${userId}`);
    await this.cacheService.del(`wifi_accumulated:${userId}`);
  }

  async getActiveSession(userId: string): Promise<WifiSession | null> {
    return this.wifiSessionRepository.findOne({
      where: {
        userId,
        status: WifiSessionStatus.ACTIVE,
      },
    });
  }

  async getUserSessions(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: WifiSession[]; total: number }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.wifiSessionRepository.findAndCount({
      where: { userId },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { data, total };
  }

  async getSessionById(
    sessionId: string,
    userId: string,
  ): Promise<WifiSession> {
    const session = await this.wifiSessionRepository.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('WiFi session not found');
    }

    return session;
  }
}
