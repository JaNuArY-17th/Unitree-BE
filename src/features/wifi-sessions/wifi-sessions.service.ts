import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WifiSession } from '../../database/entities/wifi-session.entity';
import { StartSessionDto } from './dto/start-session.dto';
import { EndSessionDto } from './dto/end-session.dto';
import { WifiSessionStatus } from '../../shared/constants/enums.constant';

@Injectable()
export class WifiSessionsService {
  constructor(
    @InjectRepository(WifiSession)
    private readonly wifiSessionRepository: Repository<WifiSession>,
  ) {}

  async startSession(
    userId: string,
    startSessionDto: StartSessionDto,
  ): Promise<WifiSession> {
    const activeSession = await this.getActiveSession(userId);

    if (activeSession) {
      throw new BadRequestException('You already have an active WiFi session');
    }

    const session = this.wifiSessionRepository.create({
      userId,
      startTime: new Date(),
      status: WifiSessionStatus.ACTIVE,
      deviceId: startSessionDto.deviceId,
      ipAddress: startSessionDto.ipAddress,
      macAddress: startSessionDto.macAddress,
      location: startSessionDto.location,
    });

    return this.wifiSessionRepository.save(session);
  }

  async endSession(
    sessionId: string,
    userId: string,
    endSessionDto: EndSessionDto,
  ): Promise<WifiSession> {
    const session = await this.wifiSessionRepository.findOne({
      where: { id: sessionId, userId },
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

    // Calculate points: 1 point per 15 minutes, max 8 points per session (2 hours)
    const pointsEarned = Math.min(Math.floor(durationMinutes / 15), 8);

    session.endTime = endTime;
    session.durationMinutes = durationMinutes;
    session.pointsEarned = pointsEarned;
    session.status = WifiSessionStatus.COMPLETED;

    return this.wifiSessionRepository.save(session);
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

  async getActiveSession(userId: string): Promise<WifiSession | null> {
    return this.wifiSessionRepository.findOne({
      where: {
        userId,
        status: WifiSessionStatus.ACTIVE,
      },
    });
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
