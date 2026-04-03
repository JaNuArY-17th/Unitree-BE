"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const typeorm_1 = require("@nestjs/typeorm");
const auth_controller_1 = require("./controllers/auth.controller");
const auth_service_1 = require("./services/auth.service");
const jwt_strategy_1 = require("./strategies/jwt.strategy");
const local_strategy_1 = require("./strategies/local.strategy");
const otp_redis_service_1 = require("./services/otp-redis.service");
const user_entity_1 = require("../../database/entities/user.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const tree_entity_1 = require("../../database/entities/tree.entity");
const user_tree_entity_1 = require("../../database/entities/user-tree.entity");
const resource_entity_1 = require("../../database/entities/resource.entity");
const user_resource_entity_1 = require("../../database/entities/user-resource.entity");
const economy_log_entity_1 = require("../../database/entities/economy-log.entity");
const cache_service_1 = require("../../services/cache.service");
const email_service_1 = require("../../services/email.service");
const tokens_module_1 = require("../tokens/tokens.module");
const devices_module_1 = require("../devices/devices.module");
const firebase_service_1 = require("../../services/firebase.service");
const users_module_1 = require("../users/users.module");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                user_entity_1.User,
                student_entity_1.Student,
                tree_entity_1.Tree,
                user_tree_entity_1.UserTree,
                resource_entity_1.Resource,
                user_resource_entity_1.UserResource,
                economy_log_entity_1.EconomyLog,
            ]),
            passport_1.PassportModule,
            tokens_module_1.TokensModule,
            (0, common_1.forwardRef)(() => devices_module_1.DevicesModule),
            users_module_1.UsersModule,
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [
            auth_service_1.AuthService,
            otp_redis_service_1.OtpRedisService,
            jwt_strategy_1.JwtStrategy,
            local_strategy_1.LocalStrategy,
            cache_service_1.CacheService,
            email_service_1.EmailService,
            firebase_service_1.FirebaseService,
        ],
        exports: [auth_service_1.AuthService, otp_redis_service_1.OtpRedisService],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map