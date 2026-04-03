"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const throttler_1 = require("@nestjs/throttler");
const schedule_1 = require("@nestjs/schedule");
const core_1 = require("@nestjs/core");
const database_config_1 = __importDefault(require("./config/database.config"));
const redis_config_1 = __importDefault(require("./config/redis.config"));
const firebase_config_1 = __importDefault(require("./config/firebase.config"));
const jwt_config_1 = __importDefault(require("./config/jwt.config"));
const app_config_1 = __importDefault(require("./config/app.config"));
const cloudinary_config_1 = __importDefault(require("./config/cloudinary.config"));
const email_config_1 = __importDefault(require("./config/email.config"));
const onboarding_config_1 = __importDefault(require("./config/onboarding.config"));
const minigame_config_1 = __importDefault(require("./config/minigame.config"));
const pvp_config_1 = __importDefault(require("./config/pvp.config"));
const jwt_auth_guard_1 = require("./shared/guards/jwt-auth.guard");
const http_exception_filter_1 = require("./shared/filters/http-exception.filter");
const transform_interceptor_1 = require("./shared/interceptors/transform.interceptor");
const logging_interceptor_1 = require("./shared/interceptors/logging.interceptor");
const cache_service_1 = require("./services/cache.service");
const firebase_service_1 = require("./services/firebase.service");
const email_service_1 = require("./services/email.service");
const storage_service_1 = require("./services/storage.service");
const socket_service_1 = require("./services/socket.service");
const auth_module_1 = require("./features/auth/auth.module");
const tokens_module_1 = require("./features/tokens/tokens.module");
const devices_module_1 = require("./features/devices/devices.module");
const users_module_1 = require("./features/users/users.module");
const wifi_sessions_module_1 = require("./features/wifi-sessions/wifi-sessions.module");
const points_module_1 = require("./features/points/points.module");
const trees_module_1 = require("./features/trees/trees.module");
const chat_module_1 = require("./features/chat/chat.module");
const garden_module_1 = require("./features/garden/garden.module");
const minigames_module_1 = require("./features/minigames/minigames.module");
const pvp_module_1 = require("./features/pvp/pvp.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env.local', '.env'],
                load: [
                    database_config_1.default,
                    redis_config_1.default,
                    firebase_config_1.default,
                    jwt_config_1.default,
                    app_config_1.default,
                    cloudinary_config_1.default,
                    email_config_1.default,
                    onboarding_config_1.default,
                    minigame_config_1.default,
                    pvp_config_1.default,
                ],
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => {
                    const dbConfig = configService.get('database');
                    if (!dbConfig) {
                        throw new Error('Database configuration is not defined');
                    }
                    return dbConfig;
                },
                inject: [config_1.ConfigService],
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    throttlers: [
                        {
                            ttl: configService.get('app.throttleTtl') || 60000,
                            limit: configService.get('app.throttleLimit') || 100,
                        },
                    ],
                }),
                inject: [config_1.ConfigService],
            }),
            schedule_1.ScheduleModule.forRoot(),
            auth_module_1.AuthModule,
            tokens_module_1.TokensModule,
            devices_module_1.DevicesModule,
            users_module_1.UsersModule,
            wifi_sessions_module_1.WifiSessionsModule,
            points_module_1.PointsModule,
            trees_module_1.TreesModule,
            chat_module_1.ChatModule,
            garden_module_1.GardenModule,
            minigames_module_1.MinigamesModule,
            pvp_module_1.PvpModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
            {
                provide: core_1.APP_FILTER,
                useClass: http_exception_filter_1.HttpExceptionFilter,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: transform_interceptor_1.TransformInterceptor,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: logging_interceptor_1.LoggingInterceptor,
            },
            cache_service_1.CacheService,
            firebase_service_1.FirebaseService,
            email_service_1.EmailService,
            storage_service_1.StorageService,
            socket_service_1.SocketService,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map