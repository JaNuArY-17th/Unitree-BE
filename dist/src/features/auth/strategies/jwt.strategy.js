"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var JwtStrategy_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../../../database/entities/user.entity");
const tokens_service_1 = require("../../tokens/services/tokens.service");
let JwtStrategy = JwtStrategy_1 = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    configService;
    tokensService;
    userRepository;
    logger = new common_1.Logger(JwtStrategy_1.name);
    constructor(configService, tokensService, userRepository) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('jwt.secret') || 'default-secret',
        });
        this.configService = configService;
        this.tokensService = tokensService;
        this.userRepository = userRepository;
    }
    async validate(payload) {
        if (!payload || !payload.sub) {
            this.logger.warn('Token payload missing required "sub"');
            throw new common_1.UnauthorizedException('Invalid token');
        }
        const userInfo = await this.tokensService.getUserInfo(String(payload.sub));
        if (userInfo) {
            this.logger.debug(`Using cached user info for user ID: ${String(payload.sub)}`);
            return {
                id: userInfo.id,
                username: userInfo.username,
                role: userInfo.role,
                studentId: userInfo.studentId,
            };
        }
        this.logger.debug(`No cached user info found, fetching from DB for user ID: ${String(payload.sub)}`);
        const user = await this.userRepository.findOne({
            where: { id: String(payload.sub) },
            relations: ['student'],
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        await this.tokensService.storeUserProfile(user);
        return {
            id: user.id,
            username: user.username,
            role: user.role,
            studentId: user.student?.studentId,
        };
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = JwtStrategy_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        tokens_service_1.TokensService,
        typeorm_2.Repository])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map