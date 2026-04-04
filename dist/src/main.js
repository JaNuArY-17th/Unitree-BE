"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const logger_util_1 = require("./shared/utils/logger.util");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const apiPrefix = configService.get('app.apiPrefix') || 'api/v1';
    app.setGlobalPrefix(apiPrefix);
    const corsOrigins = configService.get('app.corsOrigins');
    app.enableCors({
        origin: corsOrigins,
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    if (configService.get('app.nodeEnv') !== 'production') {
        const config = new swagger_1.DocumentBuilder()
            .setTitle('Unitree API')
            .setDescription('Unitree Backend API Documentation')
            .setVersion('1.0')
            .addBearerAuth()
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup('api/docs', app, document);
    }
    const port = configService.get('app.port') || 3000;
    await app.listen(port, '0.0.0.0');
    logger_util_1.Logger.log(`🚀 Application is running on: http://localhost:${port}/${apiPrefix}`, 'Bootstrap');
    logger_util_1.Logger.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`, 'Bootstrap');
}
bootstrap().catch((err) => {
    logger_util_1.Logger.error('Error starting server', err instanceof Error ? err.stack : '', 'Bootstrap');
});
//# sourceMappingURL=main.js.map