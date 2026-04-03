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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
const token_constant_1 = require("../shared/constants/token.constant");
let CacheService = class CacheService {
    configService;
    redis;
    defaultTtl;
    constructor(configService) {
        this.configService = configService;
        const redisConfig = this.configService.get('redis');
        this.redis = new ioredis_1.default({
            host: redisConfig.host,
            port: redisConfig.port,
            password: redisConfig.password,
            db: redisConfig.db,
            keyPrefix: redisConfig.keyPrefix,
        });
        this.defaultTtl = redisConfig.ttl;
    }
    async get(key) {
        const value = await this.redis.get(key);
        return value ? JSON.parse(value) : null;
    }
    async set(key, value, ttl) {
        const serialized = JSON.stringify(value);
        const expiry = ttl || this.defaultTtl;
        await this.redis.setex(key, expiry, serialized);
    }
    async del(key) {
        await this.redis.del(key);
    }
    async delPattern(pattern) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
            await this.redis.del(...keys);
        }
    }
    async exists(key) {
        const result = await this.redis.exists(key);
        return result === 1;
    }
    async ttl(key) {
        return this.redis.ttl(key);
    }
    async incr(key) {
        return this.redis.incr(key);
    }
    async decr(key) {
        return this.redis.decr(key);
    }
    async expire(key, seconds) {
        await this.redis.expire(key, seconds);
    }
    async sadd(key, member) {
        return await this.redis.sadd(key, member);
    }
    async sismember(key, member) {
        return await this.redis.sismember(key, member);
    }
    async srem(key, member) {
        return await this.redis.srem(key, member);
    }
    async smembers(key) {
        return await this.redis.smembers(key);
    }
    async scard(key) {
        return await this.redis.scard(key);
    }
    async hset(key, field, value) {
        return await this.redis.hset(key, field, value);
    }
    async hget(key, field) {
        return await this.redis.hget(key, field);
    }
    async hgetall(key) {
        return await this.redis.hgetall(key);
    }
    async hdel(key, field) {
        return await this.redis.hdel(key, field);
    }
    async hsetWithExpiry(key, field, value, ttlSeconds) {
        await this.redis.hset(key, field, value);
        await this.redis.expire(key, ttlSeconds);
    }
    async delUserHash(userId) {
        await this.redis.del(`${token_constant_1.TokenPrefixes.USER}${userId}`);
    }
    async zadd(key, score, member) {
        return await this.redis.zadd(key, score, member);
    }
    async zrevrange(key, start, stop, withScores) {
        if (withScores) {
            return await this.redis.zrevrange(key, start, stop, 'WITHSCORES');
        }
        return await this.redis.zrevrange(key, start, stop);
    }
    async zrevrank(key, member) {
        return await this.redis.zrevrank(key, member);
    }
    async zscore(key, member) {
        return await this.redis.zscore(key, member);
    }
};
exports.CacheService = CacheService;
exports.CacheService = CacheService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CacheService);
//# sourceMappingURL=cache.service.js.map