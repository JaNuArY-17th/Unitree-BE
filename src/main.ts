import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Logger } from './shared/utils/logger.util';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // API Prefix
  const apiPrefix = configService.get('app.apiPrefix');
  app.setGlobalPrefix(apiPrefix);

  // CORS
  const corsOrigins = configService.get('app.corsOrigins');
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger Documentation
  if (configService.get('app.nodeEnv') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Unitree API')
      .setDescription('Unitree Backend API Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Start Server
  const port = configService.get('app.port');
  await app.listen(port);

  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${apiPrefix}`,
    'Bootstrap',
  );
  Logger.log(
    `📚 Swagger documentation: http://localhost:${port}/api/docs`,
    'Bootstrap',
  );
}

bootstrap();
