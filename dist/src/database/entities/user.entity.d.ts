import { BaseEntity } from './base.entity';
import { Student } from './student.entity';
import { UserRole } from '../../shared/constants/roles.constant';
export declare class User extends BaseEntity {
    username: string;
    email?: string;
    avatar?: string;
    role: UserRole;
    referralCode?: string;
    referredBy?: User;
    student?: Student | null;
}
