import { UserRole } from '../../../../shared/constants/roles.constant';
export interface TokenPayload {
    sub: string;
    jti?: string;
    iat?: number;
    exp?: number;
}
export interface UserInfo {
    id: string;
    username: string;
    role: UserRole;
    studentId?: string;
}
export interface CoreUserProfile {
    id: string;
    username: string;
    role: UserRole;
    studentId?: string;
}
