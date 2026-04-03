"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('app', () => ({
    name: process.env.APP_NAME || 'Unitree Backend',
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    apiPrefix: process.env.API_PREFIX || 'api',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || [
        'http://localhost:3000',
    ],
    throttleTtl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
    throttleLimit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || '10', 10),
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || '100', 10),
}));
//# sourceMappingURL=app.config.js.map