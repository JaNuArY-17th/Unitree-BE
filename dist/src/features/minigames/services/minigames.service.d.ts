import { ConfigService } from '@nestjs/config';
import { Repository, DataSource } from 'typeorm';
import { SpinReward } from '../../../database/entities/spin-reward.entity';
import { CacheService } from '../../../services/cache.service';
export declare class MinigamesService {
    private readonly spinRewardRepo;
    private readonly dataSource;
    private readonly cacheService;
    private readonly configService;
    private readonly spinRewardsCacheKey;
    private readonly spinRewardsRuntimeCacheKey;
    private readonly spinResourceConfigCacheKey;
    private readonly spinRewardsCacheTtlSeconds;
    private readonly spinResourceConfigCacheTtlSeconds;
    private readonly instantUseRewardCodes;
    constructor(spinRewardRepo: Repository<SpinReward>, dataSource: DataSource, cacheService: CacheService, configService: ConfigService);
    getRewards(): Promise<any>;
    playSpin(userId: string): Promise<any>;
    getQuickInventory(userId: string): Promise<{
        spinBalance: number;
        manChupTranhMuoiBalance: number;
    }>;
    private getSpinRegenIntervalMinutes;
    private getSpinRewardsSnapshot;
    private pickWeightedReward;
    private getSpinResourceConfig;
    private getSpinBalanceSnapshotWithRegen;
    private getLeafScalingTier;
}
