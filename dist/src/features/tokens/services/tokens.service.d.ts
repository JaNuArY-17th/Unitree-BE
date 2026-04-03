import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CacheService } from '../../../services/cache.service';
import { User } from '../../../database/entities/user.entity';
import { TokenPayload, UserInfo } from '../common/interfaces/token.interface';
interface RefreshTokenEntry {
    tokenId: string;
    revoked: boolean;
}
export declare class TokensService {
    private readonly cacheService;
    private readonly jwtService;
    private readonly configService;
    private readonly logger;
    private readonly ACCESS_TOKEN_EXPIRY;
    private readonly REFRESH_TOKEN_EXPIRY;
    constructor(cacheService: CacheService, jwtService: JwtService, configService: ConfigService);
    private buildPayload;
    private buildUserInfo;
    private getUserHashKey;
    generateTokens(user: User): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    generateAccessToken(user: User): Promise<{
        access_token: string;
    }>;
    private addRefreshTokenToHash;
    storeUserProfile(user: User): Promise<void>;
    getUserInfo(userId: string): Promise<UserInfo | null>;
    getUserRefreshTokens(userId: string): Promise<RefreshTokenEntry[]>;
    removeUserData(userId: string): Promise<void>;
    revokeRefreshToken(userId: string, tokenId: string): Promise<void>;
    revokeAllTokens(userId: string): Promise<boolean>;
    verifyRefreshToken(refreshToken: string): Promise<TokenPayload>;
    verifyAccessToken(accessToken: string): Promise<TokenPayload>;
    revokeUserTokens(userId: string): Promise<void>;
}
export {};
