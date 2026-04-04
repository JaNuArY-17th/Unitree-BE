import { BaseEntity } from './base.entity';
export declare class WifiConfig extends BaseEntity {
    ssid: string;
    publicIpAddress: string;
    rewardRate: number;
    status: 'active' | 'disabled';
}
