import type { Request } from 'express';
import { WifiSessionsService } from '../services/wifi-sessions.service';
import { StartSessionDto } from '../dto/start-session.dto';
import { HeartbeatDto } from '../dto/heartbeat.dto';
import { EndSessionDto } from '../dto/end-session.dto';
import { PaginationDto } from '../../../shared/dto/pagination.dto';
export declare class WifiSessionsController {
    private readonly wifiSessionsService;
    constructor(wifiSessionsService: WifiSessionsService);
    startSession(userId: string, req: Request, dto: StartSessionDto): Promise<import("../../../shared/utils/response.util").ApiResponse<import("../../../database/entities/wifi-session.entity").WifiSession>>;
    heartbeat(userId: string, req: Request, dto: HeartbeatDto): Promise<import("../../../shared/utils/response.util").ApiResponse<{
        acknowledged: boolean;
        currentDuration: number;
        accumulatedMinutes: number;
        cheatFlag: boolean;
        sessionStatus: import("../../../shared/constants/enums.constant").WifiSessionStatus;
    }>>;
    endSession(userId: string, sessionId: string, req: Request, dto: EndSessionDto): Promise<import("../../../shared/utils/response.util").ApiResponse<{
        session: import("../../../database/entities/wifi-session.entity").WifiSession;
        pointsEarned: number;
        previousBalance: number;
        newBalance: number;
    }>>;
    getActiveSession(userId: string): Promise<import("../../../shared/utils/response.util").ApiResponse<import("../../../database/entities/wifi-session.entity").WifiSession | null>>;
    getUserSessions(userId: string, pagination: PaginationDto): Promise<import("../../../shared/utils/response.util").ApiResponse<import("../../../database/entities/wifi-session.entity").WifiSession[]>>;
    getSession(userId: string, sessionId: string): Promise<import("../../../shared/utils/response.util").ApiResponse<import("../../../database/entities/wifi-session.entity").WifiSession>>;
}
