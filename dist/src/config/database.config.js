"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('database', () => {
    return {
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_DATABASE || 'unitree',
        entities: [__dirname + '/../database/entities/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/../database/migrations/**/*{.ts,.js}'],
        synchronize: process.env.TYPEORM_SYNC === 'true' && process.env.NODE_ENV === 'development',
        logging: false,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        extra: {
            max: 10,
            min: 2,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        },
    };
});
//# sourceMappingURL=database.config.js.map