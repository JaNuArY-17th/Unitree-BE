"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TokensService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokensService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const uuid_1 = require("uuid");
const cache_service_1 = require("../../../services/cache.service");
const token_constant_1 = require("../../../shared/constants/token.constant");
let TokensService = TokensService_1 = class TokensService {
    cacheService;
    jwtService;
    configService;
    logger = new common_1.Logger(TokensService_1.name);
    ACCESS_TOKEN_EXPIRY = token_constant_1.TOKEN_EXPIRATION_TIME.ACCESS_TOKEN;
    REFRESH_TOKEN_EXPIRY = token_constant_1.TOKEN_EXPIRATION_TIME.REFRESH_TOKEN;
    constructor(cacheService, jwtService, configService) {
        this.cacheService = cacheService;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    buildPayload(user) {
        return {
            sub: user.id,
        };
    }
    buildUserInfo(user) {
        return {
            id: user.id,
            username: user.username,
            role: user.role,
            studentId: user.student?.studentId,
        };
    }
    getUserHashKey(userId) {
        return `${token_constant_1.TokenPrefixes.USER}${userId}`;
    }
    async generateTokens(user) {
        const tokenId = (0, uuid_1.v4)();
        const payload = this.buildPayload(user);
        const access_token = await this.jwtService.signAsync(payload, {
            secret: this.configService.get('jwt.secret'),
            expiresIn: `${this.ACCESS_TOKEN_EXPIRY}s`,
        });
        const refresh_token = await this.jwtService.signAsync({ ...payload, jti: tokenId }, {
            secret: this.configService.get('jwt.secret'),
            expiresIn: `${this.REFRESH_TOKEN_EXPIRY}s`,
        });
        await this.addRefreshTokenToHash(user.id, tokenId);
        await this.storeUserProfile(user);
        return { access_token, refresh_token };
    }
    async generateAccessToken(user) {
        const payload = this.buildPayload(user);
        const access_token = await this.jwtService.signAsync(payload, {
            secret: this.configService.get('jwt.secret'),
            expiresIn: `${this.ACCESS_TOKEN_EXPIRY}s`,
        });
        await this.storeUserProfile(user);
        return { access_token };
    }
    async addRefreshTokenToHash(userId, tokenId) {
        const hashKey = this.getUserHashKey(userId);
        const existingTokens = await this.getUserRefreshTokens(userId);
        existingTokens.push({ tokenId, revoked: false });
        await this.cacheService.hsetWithExpiry(hashKey, token_constant_1.UserHashFields.REFRESH_TOKENS, JSON.stringify(existingTokens), this.REFRESH_TOKEN_EXPIRY);
    }
    async storeUserProfile(user) {
        const hashKey = this.getUserHashKey(user.id);
        const userInfo = this.buildUserInfo(user);
        await this.cacheService.hsetWithExpiry(hashKey, token_constant_1.UserHashFields.PROFILE, JSON.stringify(userInfo), this.REFRESH_TOKEN_EXPIRY);
        this.logger.debug(`Stored user profile in Redis hash for user ID: ${user.id}`);
    }
    async getUserInfo(userId) {
        try {
            const hashKey = this.getUserHashKey(userId);
            const profileJson = await this.cacheService.hget(hashKey, token_constant_1.UserHashFields.PROFILE);
            return profileJson ? JSON.parse(profileJson) : null;
        }
        catch (error) {
            this.logger.warn(`Error getting user info: ${error.message}`);
            return null;
        }
    }
    async getUserRefreshTokens(userId) {
        try {
            const hashKey = this.getUserHashKey(userId);
            const tokensJson = await this.cacheService.hget(hashKey, token_constant_1.UserHashFields.REFRESH_TOKENS);
            return tokensJson ? JSON.parse(tokensJson) : [];
        }
        catch (error) {
            this.logger.warn(`Error parsing refresh tokens: ${error.message}`);
            return [];
        }
    }
    async removeUserData(userId) {
        await this.cacheService.delUserHash(userId);
        this.logger.debug(`Removed user data from Redis for user ID: ${userId}`);
    }
    async revokeRefreshToken(userId, tokenId) {
        try {
            const hashKey = this.getUserHashKey(userId);
            const tokens = await this.getUserRefreshTokens(userId);
            const updatedTokens = tokens.map((t) => t.tokenId === tokenId ? { ...t, revoked: true } : t);
            await this.cacheService.hset(hashKey, token_constant_1.UserHashFields.REFRESH_TOKENS, JSON.stringify(updatedTokens));
            this.logger.debug(`Revoked refresh token ${tokenId} for user ${userId}`);
        }
        catch (error) {
            this.logger.error(`Error revoking refresh token: ${error.message}`);
        }
    }
    async revokeAllTokens(userId) {
        try {
            await this.removeUserData(userId);
            this.logger.debug(`All tokens revoked for user ${userId}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Error revoking all tokens: ${error.message}`);
            return false;
        }
    }
    async verifyRefreshToken(refreshToken) {
        let decoded;
        try {
            decoded = await this.jwtService.verifyAsync(refreshToken, {
                secret: this.configService.get('jwt.secret'),
            });
        }
        catch (error) {
            this.logger.warn(`Invalid or expired refresh token: ${error.message}`);
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        if (!decoded?.sub || !decoded?.jti) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        const tokens = await this.getUserRefreshTokens(decoded.sub);
        const tokenEntry = tokens.find((t) => t.tokenId === decoded.jti);
        if (!tokenEntry) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        if (tokenEntry.revoked) {
            throw new common_1.UnauthorizedException('Token has been revoked');
        }
        return decoded;
    }
    async verifyAccessToken(accessToken) {
        let decoded;
        try {
            decoded = await this.jwtService.verifyAsync(accessToken, {
                secret: this.configService.get('jwt.secret'),
            });
        }
        catch (error) {
            this.logger.warn(`Invalid or expired access token: ${error.message}`);
            throw new common_1.UnauthorizedException('Invalid token');
        }
        return decoded;
    }
    async revokeUserTokens(userId) {
        await this.revokeAllTokens(userId);
        this.logger.log(`All tokens revoked for user ${userId}`);
    }
};
exports.TokensService = TokensService;
exports.TokensService = TokensService = TokensService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cache_service_1.CacheService,
        jwt_1.JwtService,
        config_1.ConfigService])
], TokensService);
//# sourceMappingURL=tokens.service.js.map