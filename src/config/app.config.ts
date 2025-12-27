import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  name: process.env.APP_NAME || 'Unitree Backend',
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || 'api',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:3000',
  ],

  // Rate limiting
  throttleTtl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
  throttleLimit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),

  // Pagination
  defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || '10', 10),
  maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || '100', 10),
}));
