import { UpgradeTreeDto } from '../dto/upgrade-tree.dto';
import { RepairTreeDto } from '../dto/repair-tree.dto';
import { TreesService } from '../services/trees.service';
import { UnlockTreeDto } from '../dto/unlock-tree.dto';
export declare class TreesController {
    private readonly treesService;
    constructor(treesService: TreesService);
    upgradeTree(userId: string, dto: UpgradeTreeDto): Promise<import("../../../shared/utils/response.util").ApiResponse<import("../../../database/entities/user-tree.entity").UserTree>>;
    repairTree(userId: string, dto: RepairTreeDto): Promise<import("../../../shared/utils/response.util").ApiResponse<import("../../../database/entities/user-tree.entity").UserTree>>;
    getTreeUpgradeStatus(userId: string, userTreeId: string): Promise<import("../../../shared/utils/response.util").ApiResponse<{
        userTreeId: string;
        level: number;
        maxLevel: number;
        isUpgrading: boolean;
        upgradeEndTime?: Date;
        secondsRemaining: number;
        canUpgrade: boolean;
    }>>;
    unlockTree(userId: string, dto: UnlockTreeDto): Promise<import("../../../shared/utils/response.util").ApiResponse<import("../../../database/entities/user-tree.entity").UserTree>>;
    getUserTrees(userId: string): Promise<import("../../../shared/utils/response.util").ApiResponse<import("../../../database/entities/user-tree.entity").UserTree[]>>;
    getAllCatalogTrees(): Promise<import("../../../shared/utils/response.util").ApiResponse<import("../../../database/entities/tree.entity").Tree[]>>;
    getCatalogTreeById(id: string): Promise<import("../../../shared/utils/response.util").ApiResponse<import("../../../database/entities/tree.entity").Tree | null>>;
    getTreeById(userId: string, treeId: string): Promise<import("../../../shared/utils/response.util").ApiResponse<import("../../../database/entities/user-tree.entity").UserTree>>;
}
