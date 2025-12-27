import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => {
  const redisDb = process.env.REDIS_DB || '0';
  const parsedDb = parseInt(redisDb, 10);

  // Validate Redis DB number (must be 0-15)
  const db = isNaN(parsedDb) ? 0 : Math.max(0, Math.min(15, parsedDb));

  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'unitree:',
    ttl: parseInt(process.env.REDIS_TTL || '3600', 10),
  };
});
