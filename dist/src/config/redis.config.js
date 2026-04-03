"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('redis', () => {
    const redisDb = process.env.REDIS_DB || '0';
    const parsedDb = parseInt(redisDb, 10);
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
//# sourceMappingURL=redis.config.js.map