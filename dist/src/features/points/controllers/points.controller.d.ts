import { PointsService } from '../services/points.service';
import { PaginationDto } from '../../../shared/dto/pagination.dto';
export declare class PointsController {
    private readonly pointsService;
    constructor(pointsService: PointsService);
    getEconomyHistory(userId: string, pagination: PaginationDto): Promise<import("../../../shared/utils/response.util").ApiResponse<import("../../../database/entities/economy-log.entity").EconomyLog[]>>;
}
