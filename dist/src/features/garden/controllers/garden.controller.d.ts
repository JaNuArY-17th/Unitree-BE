import { GardenService } from '../services/garden.service';
export declare class GardenController {
    private readonly gardenService;
    constructor(gardenService: GardenService);
    syncResources(userId: string): Promise<import("../../../shared/utils/response.util").ApiResponse<{
        oxygenEarned: number;
        currentBalance: string;
        currentLeafBalance: string;
        hasWifiBoost: boolean;
        syncedTreeCount: number;
        syncedAt: Date;
    }>>;
}
