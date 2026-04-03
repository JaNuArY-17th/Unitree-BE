import { Repository } from 'typeorm';
import { EconomyLog } from '../../../database/entities/economy-log.entity';
export declare class PointsService {
    private readonly economyLogRepository;
    constructor(economyLogRepository: Repository<EconomyLog>);
    getEconomyHistory(userId: string, page?: number, limit?: number): Promise<{
        data: EconomyLog[];
        total: number;
    }>;
    addEconomyLog(userId: string, resourceType: string, amount: number, source: string): Promise<EconomyLog>;
}
