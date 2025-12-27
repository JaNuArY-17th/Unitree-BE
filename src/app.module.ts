import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

// Config
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import firebaseConfig from './config/firebase.config';
import jwtConfig from './config/jwt.config';
import appConfig from './config/app.config';
import cloudinaryConfig from './config/cloudinary.config';
import emailConfig from './config/email.config';

// Guards
import { JwtAuthGuard } from './shared/guards/jwt-auth.guard';

// Filters
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';

// Interceptors
import { TransformInterceptor } from './shared/interceptors/transform.interceptor';
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';

// Services
import { CacheService } from './services/cache.service';
import { FirebaseService } from './services/firebase.service';
import { EmailService } from './services/email.service';
import { StorageService } from './services/storage.service';
import { SocketService } from './services/socket.service';

// Feature Modules
import { AuthModule } from './features/auth/auth.module';
import { TokensModule } from './features/tokens/tokens.module';
import { DevicesModule } from './features/devices/devices.module';
import { UsersModule } from './features/users/users.module';
import { WifiSessionsModule } from './features/wifi-sessions/wifi-sessions.module';
import { PointsModule } from './features/points/points.module';
import { TreesModule } from './features/trees/trees.module';
import { ChatModule } from './features/chat/chat.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        redisConfig,
        firebaseConfig,
        jwtConfig,
        appConfig,
        cloudinaryConfig,
        emailConfig,
      ],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('database');
        if (!dbConfig) {
          throw new Error('Database configuration is not defined');
        }
        return dbConfig;
      },
      inject: [ConfigService],
    }),

    // Throttler (Rate Limiting)
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get<number>('app.throttleTtl') || 60000,
            limit: configService.get<number>('app.throttleLimit') || 100,
          },
        ],
      }),
      inject: [ConfigService],
    }),

    // Schedule
    ScheduleModule.forRoot(),

    // Feature Modules
    AuthModule,
    TokensModule,
    DevicesModule,
    UsersModule,
    WifiSessionsModule,
    PointsModule,
    TreesModule,
    ChatModule,
  ],
  providers: [
    // Global Guards
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },

    // Global Filters
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },

    // Global Interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },

    // Global Services
    CacheService,
    FirebaseService,
    EmailService,
    StorageService,
    SocketService,
  ],
})
export class AppModule {}
