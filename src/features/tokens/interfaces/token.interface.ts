import { UserRole } from '../../../shared/constants/roles.constant';

export interface TokenPayload {
  sub: string; // user ID
  jti?: string; // JWT ID (for refresh tokens)
  iat?: number; // issued at
  exp?: number; // expiration time
}

export interface UserInfo {
  id: string;
  email: string;
  phoneNumber?: string;
  fullName: string;
  avatar?: string;
  role: UserRole;
  totalPoints: number;
  availablePoints: number;
  isActive: boolean;
  isVerified: boolean;
  referralCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CachedAccessToken {
  token: string;
  revoked: boolean;
}

export interface CachedRefreshToken {
  token: string;
  tokenId: string;
  revoked: boolean;
}
