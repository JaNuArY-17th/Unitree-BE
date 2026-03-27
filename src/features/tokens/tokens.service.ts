import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { CacheService } from '../../services/cache.service';
import { User } from '../../database/entities/user.entity';
import { TokenPayload, UserInfo } from './interfaces/token.interface';
import {
  TOKEN_EXPIRATION_TIME,
  TokenPrefixes,
  UserHashFields,
} from '../../shared/constants/token.constant';

interface RefreshTokenEntry {
  tokenId: string;
  revoked: boolean;
}

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

  private buildPayload(user: User): TokenPayload {
    return {
      sub: user.id,
    };
  }

  private buildUserInfo(user: User): UserInfo {
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      studentId: user.student?.studentId,
    };
  }

  private getUserHashKey(userId: string): string {
    return `${TokenPrefixes.USER}${userId}`;
  }

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

    await this.addRefreshTokenToHash(user.id, tokenId);
    await this.storeUserProfile(user);

    return { access_token, refresh_token };
  }

  async generateAccessToken(user: User): Promise<{ access_token: string }> {
    const payload = this.buildPayload(user);

    const access_token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('jwt.secret'),
      expiresIn: `${this.ACCESS_TOKEN_EXPIRY}s`,
    });

    await this.storeUserProfile(user);
    return { access_token };
  }

  private async addRefreshTokenToHash(
    userId: string,
    tokenId: string,
  ): Promise<void> {
    const hashKey = this.getUserHashKey(userId);
    const existingTokens = await this.getUserRefreshTokens(userId);
    existingTokens.push({ tokenId, revoked: false });

    await this.cacheService.hsetWithExpiry(
      hashKey,
      UserHashFields.REFRESH_TOKENS,
      JSON.stringify(existingTokens),
      this.REFRESH_TOKEN_EXPIRY,
    );
  }

  async storeUserProfile(user: User): Promise<void> {
    const hashKey = this.getUserHashKey(user.id);
    const userInfo = this.buildUserInfo(user);

    await this.cacheService.hsetWithExpiry(
      hashKey,
      UserHashFields.PROFILE,
      JSON.stringify(userInfo),
      this.REFRESH_TOKEN_EXPIRY,
    );
    this.logger.debug(
      `Stored user profile in Redis hash for user ID: ${user.id}`,
    );
  }

  async getUserInfo(userId: string): Promise<UserInfo | null> {
    try {
      const hashKey = this.getUserHashKey(userId);
      const profileJson = await this.cacheService.hget(
        hashKey,
        UserHashFields.PROFILE,
      );
      return profileJson ? JSON.parse(profileJson) : null;
    } catch (error) {
      this.logger.warn(`Error getting user info: ${error.message}`);
      return null;
    }
  }

  async getUserRefreshTokens(userId: string): Promise<RefreshTokenEntry[]> {
    try {
      const hashKey = this.getUserHashKey(userId);
      const tokensJson = await this.cacheService.hget(
        hashKey,
        UserHashFields.REFRESH_TOKENS,
      );
      return tokensJson ? JSON.parse(tokensJson) : [];
    } catch (error) {
      this.logger.warn(`Error parsing refresh tokens: ${error.message}`);
      return [];
    }
  }

  async removeUserData(userId: string): Promise<void> {
    await this.cacheService.delUserHash(userId);
    this.logger.debug(`Removed user data from Redis for user ID: ${userId}`);
  }

  async revokeRefreshToken(userId: string, tokenId: string): Promise<void> {
    try {
      const hashKey = this.getUserHashKey(userId);
      const tokens = await this.getUserRefreshTokens(userId);
      const updatedTokens = tokens.map((t) =>
        t.tokenId === tokenId ? { ...t, revoked: true } : t,
      );

      await this.cacheService.hset(
        hashKey,
        UserHashFields.REFRESH_TOKENS,
        JSON.stringify(updatedTokens),
      );
      this.logger.debug(`Revoked refresh token ${tokenId} for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error revoking refresh token: ${error.message}`);
    }
  }

  async revokeAllTokens(userId: string): Promise<boolean> {
    try {
      await this.removeUserData(userId);
      this.logger.debug(`All tokens revoked for user ${userId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error revoking all tokens: ${error.message}`);
      return false;
    }
  }

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

    const tokens = await this.getUserRefreshTokens(decoded.sub);
    const tokenEntry = tokens.find((t) => t.tokenId === decoded.jti);

    if (!tokenEntry) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (tokenEntry.revoked) {
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

    return decoded;
  }

  async revokeUserTokens(userId: string): Promise<void> {
    await this.revokeAllTokens(userId);
    this.logger.log(`All tokens revoked for user ${userId}`);
  }
}
