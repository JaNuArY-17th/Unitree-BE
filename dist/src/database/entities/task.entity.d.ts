import { BaseEntity } from './base.entity';
import { UserTask } from './user-task.entity';
export declare class Task extends BaseEntity {
    title: string;
    description?: string;
    rewardType: string;
    rewardAmount: number;
    isDaily: boolean;
    userTasks: UserTask[];
}
