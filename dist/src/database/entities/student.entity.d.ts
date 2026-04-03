import { BaseEntity } from './base.entity';
import { User } from './user.entity';
export declare class Student extends BaseEntity {
    studentId: string;
    fullName: string;
    email: string;
    user: User;
}
