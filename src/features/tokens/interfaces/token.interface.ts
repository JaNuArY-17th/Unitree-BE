import { UserRole } from '../../../shared/constants/roles.constant';

export interface TokenPayload {
  sub: string; // user ID
  jti?: string; // JWT ID (for refresh tokens)
  iat?: number; // issued at
  exp?: number; // expiration time
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
