import { BaseEntity } from './base.entity';
export declare class UserTask extends BaseEntity {
    userId: string;
    taskId: string;
    status: string;
    user: any;
    task: any;
}
