import { BaseEntity } from './base.entity';
import { AirdropCode } from './airdrop-code.entity';
import { UserResource } from './user-resource.entity';
export declare class Resource extends BaseEntity {
    code: string;
    name: string;
    description?: string;
    assetsPath?: string;
    maxStack?: number;
    airdropCodes: AirdropCode[];
    userResources: UserResource[];
}
