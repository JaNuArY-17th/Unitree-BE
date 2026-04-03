import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Resource } from './resource.entity';
export declare class UserResource extends BaseEntity {
    userId: string;
    resourceId: string;
    balance: string;
    user: User;
    resource: Resource;
}
