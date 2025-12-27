import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { CacheService } from '../../services/cache.service';
import { User } from '../../database/entities/user.entity';
import {
  CachedAccessToken,
  CachedRefreshToken,
  TokenPayload,
  UserInfo,
} from './interfaces/token.interface';
import {
  TOKEN_EXPIRATION_TIME,
  TokenPrefixes,
} from '../../shared/constants/token.constant';

@Injectable()
export class TokensService {
  private readonly logger = new Logger(TokensService.name);

  private readonly ACCESS_TOKEN_EXPIRY = TOKEN_EXPIRATION_TIME.ACCESS_TOKEN;
  private readonly REFRESH_TOKEN_EXPIRY = TOKEN_EXPIRATION_TIME.REFRESH_TOKEN;

  constructor(
    private readonly cacheService: CacheService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ========== PAYLOAD ==========
  private buildPayload(user: User): TokenPayload {
    return {
      sub: user.id,
    };
  }

  private buildUserInfo(user: User): UserInfo {
    return {
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      fullName: user.fullName,
      avatar: user.avatar,
      role: user.role,
      totalPoints: user.totalPoints,
      availablePoints: user.availablePoints,
      isActive: user.isActive,
      isVerified: user.isVerified,
      referralCode: user.referralCode,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  // ========== CACHE KEYS ==========
  private getAccessTokenKey(userId: string): string {
    return `${TokenPrefixes.ACCESS}${userId}`;
  }

  private getRefreshTokenKey(userId: string, tokenId: string): string {
    return `${TokenPrefixes.REFRESH}${userId}:${tokenId}`;
  }

  private getUserTokensKey(userId: string): string {
    return `${TokenPrefixes.USER_TOKENS}${userId}`;
  }

  private getUserInfoKey(userId: string): string {
    return `${TokenPrefixes.USER_INFO}${userId}`;
  }

  // ========== TOKEN GENERATION ==========
  async generateTokens(user: User): Promise<{
    access_token: string;
    refresh_token: string;
  }> {
    const tokenId = uuidv4();
    const payload = this.buildPayload(user);

    const access_token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('jwt.secret'),
      expiresIn: `${this.ACCESS_TOKEN_EXPIRY}s`,
    });

    const refresh_token = await this.jwtService.signAsync(
      { ...payload, jti: tokenId },
      {
        secret: this.configService.get('jwt.secret'),
        expiresIn: `${this.REFRESH_TOKEN_EXPIRY}s`,
      },
    );

    await this.storeAccessToken(user.id, access_token);
    await this.storeRefreshToken(user.id, tokenId, refresh_token);
    await this.storeUserInfo(user);

    return { access_token, refresh_token };
  }

  async generateAccessToken(user: User): Promise<{ access_token: string }> {
    const payload = this.buildPayload(user);

    const access_token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('jwt.secret'),
      expiresIn: `${this.ACCESS_TOKEN_EXPIRY}s`,
    });

    await this.storeAccessToken(user.id, access_token);
    await this.storeUserInfo(user);
    return { access_token };
  }

  // ========== STORE ==========
  async storeAccessToken(userId: string, token: string): Promise<void> {
    const key = this.getAccessTokenKey(userId);
    const data: CachedAccessToken = { token, revoked: false };
    await this.cacheService.set(key, data, this.ACCESS_TOKEN_EXPIRY);
  }

  async storeRefreshToken(
    userId: string,
    tokenId: string,
    token: string,
  ): Promise<void> {
    const key = this.getRefreshTokenKey(userId, tokenId);
    const data: CachedRefreshToken = { token, revoked: false, tokenId };
    await this.cacheService.set(key, data, this.REFRESH_TOKEN_EXPIRY);

    // Store token ID in user's token list
    const userTokensKey = this.getUserTokensKey(userId);
    const existing =
      (await this.cacheService.get<string[]>(userTokensKey)) || [];
    existing.push(tokenId);
    await this.cacheService.set(
      userTokensKey,
      existing,
      this.REFRESH_TOKEN_EXPIRY,
    );
  }

  async storeUserInfo(user: User): Promise<void> {
    const key = this.getUserInfoKey(user.id);
    const userInfo = this.buildUserInfo(user);
    await this.cacheService.set(key, userInfo, this.REFRESH_TOKEN_EXPIRY);
    this.logger.debug(`Stored user info in Redis for user ID: ${user.id}`);
  }

  async getUserInfo(userId: string): Promise<UserInfo | null> {
    const key = this.getUserInfoKey(userId);
    return await this.cacheService.get<UserInfo>(key);
  }

  async removeUserInfo(userId: string): Promise<void> {
    const key = this.getUserInfoKey(userId);
    await this.cacheService.del(key);
    this.logger.debug(`Removed user info from Redis for user ID: ${userId}`);
  }

  // ========== GET ==========
  async getAccessToken(userId: string): Promise<CachedAccessToken | null> {
    const key = this.getAccessTokenKey(userId);
    return await this.cacheService.get<CachedAccessToken>(key);
  }

  async getRefreshToken(
    userId: string,
    tokenId: string,
  ): Promise<CachedRefreshToken | null> {
    const key = this.getRefreshTokenKey(userId, tokenId);
    return await this.cacheService.get<CachedRefreshToken>(key);
  }

  // ========== REVOKE ==========
  async revokeAccessToken(userId: string): Promise<void> {
    const key = this.getAccessTokenKey(userId);
    const token = await this.getAccessToken(userId);
    if (token) {
      await this.cacheService.set(
        key,
        { ...token, revoked: true },
        this.ACCESS_TOKEN_EXPIRY,
      );
    }
  }

  async revokeRefreshToken(userId: string, tokenId: string): Promise<void> {
    const key = this.getRefreshTokenKey(userId, tokenId);
    const token = await this.getRefreshToken(userId, tokenId);
    if (token) {
      await this.cacheService.set(
        key,
        { ...token, revoked: true },
        this.REFRESH_TOKEN_EXPIRY,
      );
    }
  }

  async revokeAllTokens(userId: string): Promise<boolean> {
    try {
      const key = this.getUserTokensKey(userId);
      const tokenIds = (await this.cacheService.get<string[]>(key)) || [];

      for (const tokenId of tokenIds) {
        await this.revokeRefreshToken(userId, tokenId);
      }

      await this.revokeAccessToken(userId);
      await this.removeUserInfo(userId);
      await this.cacheService.del(key);
      return true;
    } catch (error) {
      this.logger.error(`Error revoking all tokens: ${error.message}`);
      return false;
    }
  }

  // ========== VERIFY ==========
  async verifyRefreshToken(refreshToken: string): Promise<TokenPayload> {
    let decoded: TokenPayload;
    try {
      decoded = await this.jwtService.verifyAsync<TokenPayload>(refreshToken, {
        secret: this.configService.get('jwt.secret'),
      });
    } catch (error) {
      this.logger.warn(`Invalid or expired refresh token: ${error.message}`);
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!decoded?.sub || !decoded?.jti) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const stored = await this.getRefreshToken(decoded.sub, decoded.jti);
    if (!stored) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (stored.revoked) {
      throw new UnauthorizedException('Token has been revoked');
    }

    return decoded;
  }

  async verifyAccessToken(accessToken: string): Promise<TokenPayload> {
    let decoded: TokenPayload;
    try {
      decoded = await this.jwtService.verifyAsync<TokenPayload>(accessToken, {
        secret: this.configService.get('jwt.secret'),
      });
    } catch (error) {
      this.logger.warn(`Invalid or expired access token: ${error.message}`);
      throw new UnauthorizedException('Invalid token');
    }

    const tokenData = await this.getAccessToken(decoded.sub);
    if (!tokenData || tokenData.revoked) {
      throw new UnauthorizedException('Token has been revoked');
    }

    return decoded;
  }

  /**
   * Revoke all tokens for user (for logout all devices)
   * Alias for revokeAllTokens() to match DeviceService expectations
   */
  async revokeUserTokens(userId: string): Promise<void> {
    await this.revokeAllTokens(userId);
    this.logger.log(`All tokens revoked for user ${userId}`);
  }
}
