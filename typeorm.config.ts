require('dotenv/config');
const { DataSource } = require('typeorm');

/**
 * Standalone DataSource for TypeORM CLI (migration:generate / migration:run).
 * Does NOT use NestJS config wrapper so the CLI can load it directly.
 */
module.exports = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'unitree',
  entities: ['src/database/entities/**/*.entity{.ts,.js}'],
  migrations: ['src/database/migrations/**/*{.ts,.js}'],
  synchronize: false,
  logging: true,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
