import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  private readonly redis: Redis;
  private readonly defaultTtl: number;

  constructor(private configService: ConfigService) {
    const redisConfig = this.configService.get('redis');
    this.redis = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      db: redisConfig.db,
      keyPrefix: redisConfig.keyPrefix,
    });
    this.defaultTtl = redisConfig.ttl;
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    const expiry = ttl || this.defaultTtl;
    await this.redis.setex(key, expiry, serialized);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async delPattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  async ttl(key: string): Promise<number> {
    return this.redis.ttl(key);
  }

  async incr(key: string): Promise<number> {
    return this.redis.incr(key);
  }

  async decr(key: string): Promise<number> {
    return this.redis.decr(key);
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.redis.expire(key, seconds);
  }

  // ===== SET OPERATIONS (for WiFi SSIDs, online users, etc.) =====

  async sadd(key: string, member: string): Promise<number> {
    return await this.redis.sadd(key, member);
  }

  async sismember(key: string, member: string): Promise<number> {
    return await this.redis.sismember(key, member);
  }

  async srem(key: string, member: string): Promise<number> {
    return await this.redis.srem(key, member);
  }

  async smembers(key: string): Promise<string[]> {
    return await this.redis.smembers(key);
  }

  async scard(key: string): Promise<number> {
    return await this.redis.scard(key);
  }

  // ===== HASH OPERATIONS (for complex objects) =====

  async hset(key: string, field: string, value: string): Promise<number> {
    return await this.redis.hset(key, field, value);
  }

  async hget(key: string, field: string): Promise<string | null> {
    return await this.redis.hget(key, field);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return await this.redis.hgetall(key);
  }

  async hdel(key: string, field: string): Promise<number> {
    return await this.redis.hdel(key, field);
  }

  // ===== SORTED SET OPERATIONS (for leaderboards) =====

  async zadd(key: string, score: number, member: string): Promise<number> {
    return await this.redis.zadd(key, score, member);
  }

  async zrevrange(
    key: string,
    start: number,
    stop: number,
    withScores?: boolean,
  ): Promise<string[]> {
    if (withScores) {
      return await this.redis.zrevrange(key, start, stop, 'WITHSCORES');
    }
    return await this.redis.zrevrange(key, start, stop);
  }

  async zrevrank(key: string, member: string): Promise<number | null> {
    return await this.redis.zrevrank(key, member);
  }

  async zscore(key: string, member: string): Promise<string | null> {
    return await this.redis.zscore(key, member);
  }
}
