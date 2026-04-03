import { Repository, DataSource } from 'typeorm';
import { WifiSession } from '../../../database/entities/wifi-session.entity';
import { StartSessionDto } from '../dto/start-session.dto';
import { HeartbeatDto } from '../dto/heartbeat.dto';
import { EndSessionDto } from '../dto/end-session.dto';
import { CacheService } from '../../../services/cache.service';
import { PointsService } from '../../points/services/points.service';
export declare class WifiSessionsService {
    private readonly wifiSessionRepository;
    private readonly cacheService;
    private readonly pointsService;
    private readonly dataSource;
    private readonly logger;
    constructor(wifiSessionRepository: Repository<WifiSession>, cacheService: CacheService, pointsService: PointsService, dataSource: DataSource);
    startSession(userId: string, dto: StartSessionDto): Promise<WifiSession>;
    heartbeat(userId: string, dto: HeartbeatDto): Promise<{
        acknowledged: boolean;
        currentDuration: number;
        pointsEarned: number;
        sessionStatus: string;
    }>;
    endSession(sessionId: string, userId: string, dto: EndSessionDto): Promise<{
        session: WifiSession;
        pointsEarned: number;
        previousBalance: number;
        newBalance: number;
    }>;
    handleTimeoutSessions(): Promise<void>;
    private completeTimeoutSession;
    private getActiveSessionFromCache;
    private cacheActiveSession;
    private clearActiveSessionCache;
    getActiveSession(userId: string): Promise<WifiSession | null>;
    getUserSessions(userId: string, page?: number, limit?: number): Promise<{
        data: WifiSession[];
        total: number;
    }>;
    getSessionById(sessionId: string, userId: string): Promise<WifiSession>;
}
