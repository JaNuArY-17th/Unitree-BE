import { UserRole } from '../../../shared/constants/roles.constant';
export declare class UserInfoDto {
    id: string;
    username: string;
    email?: string;
    fullname?: string;
    studentId?: string;
    student?: {
        studentId: string;
        fullName: string;
    } | null;
    avatar?: string;
    role: UserRole;
    referralCode?: string;
    referredById?: string;
    referredByUsername?: string;
    referredByAvatarUrl?: string;
}
