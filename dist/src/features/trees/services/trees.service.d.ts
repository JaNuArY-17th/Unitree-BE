import { UpgradeTreeDto } from '../dto/upgrade-tree.dto';
import { RepairTreeDto } from '../dto/repair-tree.dto';
import { DataSource, Repository } from 'typeorm';
import { UserTree } from '../../../database/entities/user-tree.entity';
import { Tree } from '../../../database/entities/tree.entity';
import { UnlockTreeDto } from 'src/features/trees/dto/unlock-tree.dto';
import { Resource } from '../../../database/entities/resource.entity';
import { WifiSession } from '../../../database/entities/wifi-session.entity';
import { GardenGateway } from '../../garden/gateways/garden.gateway';
export declare class TreesService {
    private readonly userTreeRepository;
    private readonly treeRepository;
    private readonly resourceRepository;
    private readonly wifiSessionRepository;
    private readonly dataSource;
    private readonly gardenGateway;
    upgradeTree(userId: string, dto: UpgradeTreeDto): Promise<UserTree>;
    repairTree(userId: string, dto: RepairTreeDto): Promise<UserTree>;
    getTreeUpgradeStatus(userId: string, userTreeId: string): Promise<{
        userTreeId: string;
        level: number;
        maxLevel: number;
        isUpgrading: boolean;
        upgradeEndTime?: Date;
        secondsRemaining: number;
        canUpgrade: boolean;
    }>;
    unlockTree(userId: string, dto: UnlockTreeDto): Promise<UserTree>;
    constructor(userTreeRepository: Repository<UserTree>, treeRepository: Repository<Tree>, resourceRepository: Repository<Resource>, wifiSessionRepository: Repository<WifiSession>, dataSource: DataSource, gardenGateway: GardenGateway);
    getUserTrees(userId: string): Promise<UserTree[]>;
    getAllCatalogTrees(): Promise<Tree[]>;
    getCatalogTreeById(id: string): Promise<Tree | null>;
    getTreeById(treeId: string, userId: string): Promise<UserTree>;
    private calculateUpgradeCost;
    private findUpgradeCurrencyResource;
    private findOxygenResource;
    private buildAssetPath;
}
