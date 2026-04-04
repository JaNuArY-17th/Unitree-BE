import { Repository, DataSource } from 'typeorm';
import { WifiSession } from '../../../database/entities/wifi-session.entity';
import { WifiConfig } from '../../../database/entities/wifi-config.entity';
import { UserResource } from '../../../database/entities/user-resource.entity';
import { Resource } from '../../../database/entities/resource.entity';
import { StartSessionDto } from '../dto/start-session.dto';
import { HeartbeatDto } from '../dto/heartbeat.dto';
import { EndSessionDto } from '../dto/end-session.dto';
import { WifiSessionStatus } from '../../../shared/constants/enums.constant';
import { CacheService } from '../../../services/cache.service';
import { PointsService } from '../../points/services/points.service';
import { SocketService } from '../../../services/socket.service';
export declare class WifiSessionsService {
    private readonly wifiSessionRepository;
    private readonly wifiConfigRepository;
    private readonly userResourceRepository;
    private readonly resourceRepository;
    private readonly cacheService;
    private readonly pointsService;
    private readonly socketService;
    private readonly dataSource;
    private readonly logger;
    private readonly minimumHeartbeatSeconds;
    private readonly maxHeartbeatWindowMs;
    private readonly timeoutWindowMs;
    private readonly sessionCacheTtl;
    constructor(wifiSessionRepository: Repository<WifiSession>, wifiConfigRepository: Repository<WifiConfig>, userResourceRepository: Repository<UserResource>, resourceRepository: Repository<Resource>, cacheService: CacheService, pointsService: PointsService, socketService: SocketService, dataSource: DataSource);
    startSession(userId: string, dto: StartSessionDto, requestIp: string): Promise<WifiSession>;
    heartbeat(userId: string, dto: HeartbeatDto, requestIp: string): Promise<{
        acknowledged: boolean;
        currentDuration: number;
        accumulatedMinutes: number;
        cheatFlag: boolean;
        sessionStatus: WifiSessionStatus;
    }>;
    endSession(sessionId: string, userId: string, dto: EndSessionDto, requestIp: string): Promise<{
        session: WifiSession;
        pointsEarned: number;
        previousBalance: number;
        newBalance: number;
    }>;
    handleTimeoutSessions(): Promise<void>;
    private completeSessionTimeout;
    private flagSessionAsSuspicious;
    private validateWifiConfig;
    private addLeafResource;
    private findLeafResource;
    private cacheActiveSession;
    private updateActiveSessionHeartbeat;
    private incrementAccumulatedMinutes;
    private clearActiveSessionCache;
    getActiveSession(userId: string): Promise<WifiSession | null>;
    getUserSessions(userId: string, page?: number, limit?: number): Promise<{
        data: WifiSession[];
        total: number;
    }>;
    getSessionById(sessionId: string, userId: string): Promise<WifiSession>;
}
