import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, DataSource } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { WifiSession } from '../../../database/entities/wifi-session.entity';
import { StartSessionDto } from '../dto/start-session.dto';
import { HeartbeatDto } from '../dto/heartbeat.dto';
import { EndSessionDto } from '../dto/end-session.dto';
import { WifiSessionStatus } from '../../../shared/constants/enums.constant';
import { THO_NHUONG_BSSID_ALLOWLIST } from '../../../shared/constants/tho-nhuong-bssid.constant';
import { CacheService } from '../../../services/cache.service';
import { PointsService } from '../../points/services/points.service';

/**
 * WiFi Sessions Service
 *
 * Simplified design:
 * - FE validates WiFi (BSSID check)
 * - BE manages session lifecycle
 * - Point calculation: 1 point per minute (no maximum)
 * - Heartbeat mechanism to track active connections
 * - Auto-complete sessions after 20min timeout
 */
@Injectable()
export class WifiSessionsService {
  private readonly logger = new Logger(WifiSessionsService.name);
  private readonly thoNhuongCacheTtlSeconds = 20 * 60;
  private readonly bssidPrefixSegments = 5;

  constructor(
    @InjectRepository(WifiSession)
    private readonly wifiSessionRepository: Repository<WifiSession>,
    private readonly cacheService: CacheService,
    private readonly pointsService: PointsService,
    private readonly dataSource: DataSource,
  ) {}

  // ===== START SESSION =====
  async startSession(
    userId: string,
    dto: StartSessionDto,
  ): Promise<WifiSession> {
    // Check if user already has an active session
    const activeSession = await this.getActiveSessionFromCache(userId);
    if (activeSession) {
      throw new BadRequestException('You already have an active WiFi session');
    }

    // Create new session
    const session = this.wifiSessionRepository.create({
      userId,
      startTime: new Date(),
      lastHeartbeat: new Date(),
      status: WifiSessionStatus.ACTIVE,
      deviceId: dto.deviceId,
      ipAddress: dto.ipAddress,
    });

    const savedSession = await this.wifiSessionRepository.save(session);

    await this.updateThoNhuongState(
      userId,
      dto.bssid,
      THO_NHUONG_BSSID_ALLOWLIST,
    );

    // Cache active session
    await this.cacheActiveSession(userId, savedSession.id);

    this.logger.log(
      `WiFi session started: ${savedSession.id} for user ${userId}`,
    );
    return savedSession;
  }

  // ===== HEARTBEAT =====
  async heartbeat(
    userId: string,
    dto: HeartbeatDto,
  ): Promise<{
    acknowledged: boolean;
    currentDuration: number;
    pointsEarned: number;
    sessionStatus: string;
    hasThoNhuongEffect: boolean;
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

    // Update heartbeat timestamp
    session.lastHeartbeat = new Date();
    await this.wifiSessionRepository.save(session);

    const hasThoNhuongEffect = dto.bssid
      ? await this.updateThoNhuongState(
          userId,
          dto.bssid,
          THO_NHUONG_BSSID_ALLOWLIST,
        )
      : await this.isThoNhuongActive(userId);

    // Calculate current stats
    const durationMinutes = Math.floor(
      (new Date().getTime() - session.startTime.getTime()) / 60000,
    );
    const pointsEarned = Math.floor(durationMinutes);

    this.logger.debug(`Heartbeat received for session: ${session.id}`);

    return {
      acknowledged: true,
      currentDuration: durationMinutes,
      pointsEarned,
      sessionStatus: session.status,
      hasThoNhuongEffect,
    };
  }

  // ===== END SESSION =====
  async endSession(
    sessionId: string,
    userId: string,
    dto: EndSessionDto,
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

    const endTime = new Date();
    const durationMinutes = Math.floor(
      (endTime.getTime() - session.startTime.getTime()) / 60000,
    );

    // Calculate points: 1 point per minute (simplified)
    const pointsEarned = Math.floor(durationMinutes);

    // Use database transaction for consistency
    return await this.dataSource.transaction(async (manager) => {
      // Update session
      session.endTime = endTime;
      session.durationMinutes = durationMinutes;
      session.pointsEarned = pointsEarned;
      session.status = WifiSessionStatus.COMPLETED;
      await manager.save(session);

      // Log economy transaction if points earned
      if (pointsEarned > 0) {
        await this.pointsService.addEconomyLog(
          userId,
          'point',
          pointsEarned,
          `wifi_session:${sessionId}`,
        );
      }

      // Clear cache
      await this.clearActiveSessionCache(userId);
      await this.clearThoNhuongState(userId);

      this.logger.log(
        `WiFi session ended: ${sessionId}, awarded ${pointsEarned} points`,
      );

      return {
        session,
        pointsEarned,
        previousBalance: 0,
        newBalance: pointsEarned,
      };
    });
  }

  // ===== BACKGROUND JOB: TIMEOUT HANDLER =====
  @Cron('*/5 * * * *') // Every 5 minutes
  async handleTimeoutSessions(): Promise<void> {
    const timeoutThreshold = new Date(Date.now() - 20 * 60 * 1000); // 20 mins ago

    const lostSessions = await this.wifiSessionRepository.find({
      where: {
        status: WifiSessionStatus.ACTIVE,
        lastHeartbeat: LessThan(timeoutThreshold),
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

  private async completeTimeoutSession(session: WifiSession): Promise<void> {
    try {
      // Use lastHeartbeat as endTime (not current time)
      const endTime = session.lastHeartbeat || new Date();
      const durationMinutes = Math.floor(
        (endTime.getTime() - session.startTime.getTime()) / 60000,
      );
      const pointsEarned = Math.floor(durationMinutes);

      // Update session
      session.status = WifiSessionStatus.COMPLETED;
      session.endTime = endTime;
      session.durationMinutes = durationMinutes;
      session.pointsEarned = pointsEarned;

      await this.wifiSessionRepository.save(session);

      // Log economy transaction if points earned
      if (pointsEarned > 0) {
        await this.pointsService.addEconomyLog(
          session.userId,
          'point',
          pointsEarned,
          `wifi_session_timeout:${session.id}`,
        );
      }

      // Clear cache
      await this.clearActiveSessionCache(session.userId);
      await this.clearThoNhuongState(session.userId);

      this.logger.log(
        `Completed timeout session: ${session.id}, awarded ${pointsEarned} points`,
      );
    } catch (error) {
      this.logger.error(
        `Error completing timeout session ${session.id}: ${error.message}`,
      );
    }
  }

  // ===== CACHE HELPERS =====
  private async getActiveSessionFromCache(
    userId: string,
  ): Promise<string | null> {
    return await this.cacheService.get<string>(`wifi:active:${userId}`);
  }

  private async cacheActiveSession(
    userId: string,
    sessionId: string,
  ): Promise<void> {
    await this.cacheService.set(`wifi:active:${userId}`, sessionId, 86400); // 24h TTL
  }

  private async clearActiveSessionCache(userId: string): Promise<void> {
    await this.cacheService.del(`wifi:active:${userId}`);
  }

  private getThoNhuongCacheKey(userId: string): string {
    return `wifi:tho-nhuong:${userId}`;
  }

  private async updateThoNhuongState(
    userId: string,
    rawBssid?: string,
    bssidAllowlist: string[] = THO_NHUONG_BSSID_ALLOWLIST,
  ): Promise<boolean> {
    const normalizedBssid = this.normalizeBssid(rawBssid);
    const hasThoNhuongEffect = this.isBssidAllowed(rawBssid, bssidAllowlist);

    await this.cacheService.set(
      this.getThoNhuongCacheKey(userId),
      hasThoNhuongEffect,
      this.thoNhuongCacheTtlSeconds,
    );

    this.logger.debug(
      `Tho nhuong state updated for user ${userId}: ${hasThoNhuongEffect} (bssid=${normalizedBssid ?? 'N/A'})`,
    );

    return hasThoNhuongEffect;
  }

  private async clearThoNhuongState(userId: string): Promise<void> {
    await this.cacheService.del(this.getThoNhuongCacheKey(userId));
  }

  async isThoNhuongActive(userId: string): Promise<boolean> {
    const hasActiveSession = await this.getActiveSession(userId);
    if (!hasActiveSession) {
      await this.clearThoNhuongState(userId);
      return false;
    }

    const cached = await this.cacheService.get<boolean>(
      this.getThoNhuongCacheKey(userId),
    );

    return cached === true;
  }

  private normalizeBssidWhitelist(allowlist: string[]): Set<string> {
    if (!allowlist || allowlist.length === 0) {
      return new Set<string>();
    }

    const normalizedEntries = allowlist
      .map((entry) => this.normalizeBssid(entry))
      .filter((entry): entry is string => entry != null);

    return new Set(normalizedEntries);
  }

  private isBssidAllowed(
    rawBssid: string | undefined,
    allowlist: string[],
  ): boolean {
    const normalizedBssid = this.normalizeBssidPrefix(rawBssid);
    if (!normalizedBssid) {
      return false;
    }

    const normalizedAllowlist = this.normalizeBssidWhitelist(allowlist);
    return normalizedAllowlist.has(normalizedBssid);
  }

  private normalizeBssidPrefix(rawValue?: string): string | null {
    if (!rawValue) {
      return null;
    }

    const normalized = rawValue.trim().toUpperCase().replace(/-/g, ':');
    const segments = normalized.split(':').filter((segment) => segment !== '');

    const acceptedSegmentCount = [
      this.bssidPrefixSegments,
      this.bssidPrefixSegments + 1,
    ];

    if (!acceptedSegmentCount.includes(segments.length)) {
      return null;
    }

    const isValidHexPair = segments.every((segment) =>
      /^[0-9A-F]{2}$/.test(segment),
    );

    if (!isValidHexPair) {
      return null;
    }

    return segments.slice(0, this.bssidPrefixSegments).join(':');
  }

  private normalizeBssid(rawValue?: string): string | null {
    return this.normalizeBssidPrefix(rawValue);
  }

  // ===== QUERY METHODS =====
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
