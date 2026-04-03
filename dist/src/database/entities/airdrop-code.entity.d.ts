import { BaseEntity } from './base.entity';
import { Resource } from './resource.entity';
export declare class AirdropCode extends BaseEntity {
    code: string;
    resourceId: string;
    amount: number;
    expirationDate?: Date;
    resource: Resource;
}
