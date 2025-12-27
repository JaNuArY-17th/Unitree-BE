import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, DataSource } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { WifiSession } from '../../database/entities/wifi-session.entity';
import { StartSessionDto } from './dto/start-session.dto';
import { HeartbeatDto } from './dto/heartbeat.dto';
import { EndSessionDto } from './dto/end-session.dto';
import {
  WifiSessionStatus,
  PointTransactionType,
} from '../../shared/constants/enums.constant';
import { CacheService } from '../../services/cache.service';
import { PointsService } from '../points/points.service';

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

      // Award points if any
      const previousBalance = session.user.availablePoints;
      let newBalance = previousBalance;

      if (pointsEarned > 0) {
        const point = await this.pointsService.addPoints(
          userId,
          pointsEarned,
          PointTransactionType.WIFI,
          sessionId,
          `WiFi session: ${durationMinutes} minutes`,
        );
        newBalance = point.balanceAfter;
      }

      // Clear cache
      await this.clearActiveSessionCache(userId);

      this.logger.log(
        `WiFi session ended: ${sessionId}, awarded ${pointsEarned} points`,
      );

      return {
        session,
        pointsEarned,
        previousBalance,
        newBalance,
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

      // Award points if any
      if (pointsEarned > 0) {
        await this.pointsService.addPoints(
          session.userId,
          pointsEarned,
          PointTransactionType.WIFI,
          session.id,
          `WiFi session (auto-ended): ${durationMinutes} minutes`,
        );
      }

      // Clear cache
      await this.clearActiveSessionCache(session.userId);

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
