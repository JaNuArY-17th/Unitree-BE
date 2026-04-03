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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../../../database/entities/user.entity");
const tokens_service_1 = require("../../tokens/services/tokens.service");
const devices_service_1 = require("../../devices/services/devices.service");
const student_entity_1 = require("../../../database/entities/student.entity");
const tree_entity_1 = require("../../../database/entities/tree.entity");
const user_tree_entity_1 = require("../../../database/entities/user-tree.entity");
const resource_entity_1 = require("../../../database/entities/resource.entity");
const user_resource_entity_1 = require("../../../database/entities/user-resource.entity");
const economy_log_entity_1 = require("../../../database/entities/economy-log.entity");
const firebase_service_1 = require("../../../services/firebase.service");
const roles_constant_1 = require("../../../shared/constants/roles.constant");
const users_service_1 = require("../../users/services/users.service");
const user_info_dto_1 = require("../../users/dto/user-info.dto");
const class_transformer_1 = require("class-transformer");
let AuthService = AuthService_1 = class AuthService {
    userRepository;
    studentRepository;
    treeRepository;
    userTreeRepository;
    resourceRepository;
    userResourceRepository;
    economyLogRepository;
    tokensService;
    devicesService;
    firebaseService;
    usersService;
    configService;
    logger = new common_1.Logger(AuthService_1.name);
    starterTreeCode = 'BANANA_TREE';
    fallbackLeafResourceCodes = [
        'GREEN_LEAF',
        'GREEN_LEAVES',
        'LEAF',
        'LEAVES',
        'LA_XANH',
    ];
    constructor(userRepository, studentRepository, treeRepository, userTreeRepository, resourceRepository, userResourceRepository, economyLogRepository, tokensService, devicesService, firebaseService, usersService, configService) {
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.treeRepository = treeRepository;
        this.userTreeRepository = userTreeRepository;
        this.resourceRepository = resourceRepository;
        this.userResourceRepository = userResourceRepository;
        this.economyLogRepository = economyLogRepository;
        this.tokensService = tokensService;
        this.devicesService = devicesService;
        this.firebaseService = firebaseService;
        this.usersService = usersService;
        this.configService = configService;
    }
    getStarterLeafAmount() {
        const amount = this.configService.get('onboarding.starterLeafAmount') ?? 100;
        return Number.isFinite(amount) && amount > 0 ? Math.floor(amount) : 0;
    }
    getStarterLeafResourceCodes() {
        const configuredCode = this.configService
            .get('onboarding.starterLeafResourceCode')
            ?.trim();
        const preferredCodes = [
            ...(configuredCode ? [configuredCode] : []),
            ...this.fallbackLeafResourceCodes,
        ];
        const normalizedCodes = preferredCodes
            .map((code) => code.trim())
            .filter((code) => code.length > 0);
        return Array.from(new Set(normalizedCodes));
    }
    async findResourceByCodeIgnoreCase(code) {
        return this.resourceRepository
            .createQueryBuilder('resource')
            .where('LOWER(resource.code) = LOWER(:code)', { code })
            .getOne();
    }
    async findStarterLeafResource() {
        const preferredCodes = this.getStarterLeafResourceCodes();
        for (const code of preferredCodes) {
            const resource = await this.findResourceByCodeIgnoreCase(code);
            if (resource) {
                return resource;
            }
        }
        return null;
    }
    async ensureStarterLeafResource() {
        const existingResource = await this.findStarterLeafResource();
        if (existingResource) {
            return existingResource;
        }
        const [fallbackCode] = this.getStarterLeafResourceCodes();
        if (!fallbackCode) {
            return null;
        }
        const normalizedCode = fallbackCode.toUpperCase();
        try {
            const createdResource = this.resourceRepository.create({
                code: normalizedCode,
                name: normalizedCode,
                description: 'Starter leaf resource auto-created for onboarding reward',
            });
            return await this.resourceRepository.save(createdResource);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'unknown database error';
            this.logger.warn(`Starter leaf resource auto-create failed for code ${normalizedCode}: ${errorMessage}`);
            return this.findResourceByCodeIgnoreCase(normalizedCode);
        }
    }
    async grantStarterLeafReward(userId) {
        const starterLeafAmount = this.getStarterLeafAmount();
        if (starterLeafAmount <= 0) {
            return;
        }
        const leafResource = await this.ensureStarterLeafResource();
        if (!leafResource) {
            this.logger.warn('Starter leaf reward skipped because no matching leaf resource code was found');
            return;
        }
        let userLeafBalance = await this.userResourceRepository.findOne({
            where: {
                userId,
                resourceId: leafResource.id,
            },
        });
        if (!userLeafBalance) {
            userLeafBalance = this.userResourceRepository.create({
                userId,
                resourceId: leafResource.id,
                balance: '0',
            });
        }
        const currentBalance = BigInt(userLeafBalance.balance || '0');
        userLeafBalance.balance = (currentBalance + BigInt(starterLeafAmount)).toString();
        await this.userResourceRepository.save(userLeafBalance);
        await this.economyLogRepository.save(this.economyLogRepository.create({
            userId,
            resourceType: leafResource.code,
            amount: starterLeafAmount,
            source: 'new_user_starter_reward',
        }));
    }
    normalizeEmail(email) {
        return email.trim().toLowerCase();
    }
    async findUserByEmail(email) {
        return this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.student', 'student')
            .where('LOWER(user.email) = LOWER(:email)', { email })
            .getOne();
    }
    getUserEmailOrThrow(user) {
        const email = user.email?.trim();
        if (!email) {
            throw new common_1.BadRequestException('User does not have an email');
        }
        return email;
    }
    async login(loginDto) {
        const normalizedEmail = this.normalizeEmail(loginDto.email);
        const user = await this.findUserByEmail(normalizedEmail);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const tokens = await this.tokensService.generateTokens(user);
        return {
            user: (0, class_transformer_1.plainToInstance)(user_info_dto_1.UserInfoDto, user),
            ...tokens,
        };
    }
    async googleLogin(idToken) {
        if (!this.firebaseService.isInitialized()) {
            this.logger.warn('Google login attempted while Firebase Admin SDK is not initialized');
            throw new common_1.InternalServerErrorException('Firebase authentication is not configured on server');
        }
        let decodedToken;
        try {
            decodedToken = await this.firebaseService.verifyIdToken(idToken);
        }
        catch (error) {
            this.logger.warn(`Google token verification failed: ${error?.message || 'unknown error'}`);
            if (error?.message?.includes('Firebase is not initialized')) {
                throw new common_1.InternalServerErrorException('Firebase authentication is not configured on server');
            }
            throw new common_1.UnauthorizedException('Invalid Google ID token');
        }
        const { email, picture } = decodedToken;
        if (!email) {
            throw new common_1.UnauthorizedException('Google account does not have an email');
        }
        const normalizedEmail = this.normalizeEmail(email);
        let user = await this.findUserByEmail(normalizedEmail);
        if (!user) {
            const student = await this.studentRepository
                .createQueryBuilder('student')
                .where('LOWER(student.email) = LOWER(:email)', {
                email: normalizedEmail,
            })
                .getOne();
            const defaultAvatar = picture || undefined;
            const defaultUsername = String(normalizedEmail.split('@')[0]);
            user = this.userRepository.create({
                username: defaultUsername,
                email: normalizedEmail,
                student: student ?? null,
                avatar: defaultAvatar,
                role: roles_constant_1.UserRole.USER,
            });
            user = await this.userRepository.save(user);
            const tree = await this.treeRepository.findOne({
                where: { code: this.starterTreeCode },
            });
            if (tree) {
                await this.userTreeRepository.save({
                    userId: user.id,
                    treeId: tree.id,
                    level: 1,
                    isDamaged: false,
                    lastHarvestTime: new Date(),
                    checksum: '',
                });
            }
            else {
                this.logger.warn(`Default tree ${this.starterTreeCode} not found in trees catalog`);
            }
            await this.grantStarterLeafReward(user.id);
        }
        else if (!user.student) {
            const student = await this.studentRepository
                .createQueryBuilder('student')
                .where('LOWER(student.email) = LOWER(:email)', {
                email: normalizedEmail,
            })
                .getOne();
            if (student) {
                user.student = student;
                user = await this.userRepository.save(user);
            }
        }
        await this.usersService.generateReferralCode(user.id);
        const tokens = await this.tokensService.generateTokens(user);
        return {
            user: (0, class_transformer_1.plainToInstance)(user_info_dto_1.UserInfoDto, user),
            ...tokens,
        };
    }
    async refreshToken(refreshToken) {
        try {
            const payload = await this.tokensService.verifyRefreshToken(refreshToken);
            const user = await this.userRepository.findOne({
                where: { id: payload.sub },
                relations: ['student'],
            });
            if (!user) {
                throw new common_1.UnauthorizedException('Invalid refresh token');
            }
            return this.tokensService.generateTokens(user);
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async getProfile(userId) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['student'],
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return (0, class_transformer_1.plainToInstance)(user_info_dto_1.UserInfoDto, user);
    }
    async logout(userId) {
        await this.tokensService.revokeAllTokens(userId);
        return { message: 'Logged out successfully' };
    }
    async loginWithDevice(loginDto, ipAddress, userAgent) {
        const normalizedEmail = this.normalizeEmail(loginDto.email);
        const user = await this.findUserByEmail(normalizedEmail);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const userEmail = this.getUserEmailOrThrow(user);
        const deviceInfo = {
            deviceId: loginDto.deviceId,
            deviceName: loginDto.deviceName,
            deviceType: loginDto.deviceType,
            deviceOs: loginDto.deviceOs,
            deviceModel: loginDto.deviceModel,
            browser: loginDto.browser,
            ipAddress,
            userAgent,
        };
        const deviceCheck = await this.devicesService.handleDeviceLogin(user.id, userEmail, deviceInfo);
        if (deviceCheck.requireOtp) {
            return {
                requireOtp: true,
                message: deviceCheck.message,
                userId: user.id,
                deviceId: loginDto.deviceId,
            };
        }
        return this.completeDeviceLogin(user, deviceInfo);
    }
    async completeDeviceLogin(user, deviceInfo) {
        await this.devicesService.registerDevice(user.id, deviceInfo);
        const tokens = await this.tokensService.generateTokens(user);
        return {
            user: (0, class_transformer_1.plainToInstance)(user_info_dto_1.UserInfoDto, user),
            ...tokens,
            deviceId: deviceInfo.deviceId,
        };
    }
    async verifyDeviceAndLogin(userId, verifyDto, ipAddress, userAgent) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['student'],
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const userEmail = this.getUserEmailOrThrow(user);
        const baseDeviceInfo = {
            deviceId: verifyDto.deviceId,
            deviceType: 'unknown',
        };
        await this.devicesService.verifyAndRegisterDevice(userId, userEmail, baseDeviceInfo, verifyDto.otpCode);
        const deviceInfo = {
            deviceId: verifyDto.deviceId,
            deviceType: 'unknown',
            ipAddress,
            userAgent,
        };
        return this.completeDeviceLogin(user, deviceInfo);
    }
    async logoutDevice(userId, deviceId) {
        await this.devicesService.logoutDevice(deviceId);
        return { message: 'Device logged out successfully' };
    }
    async getUserDevices(userId) {
        return this.devicesService.getUserDevices(userId);
    }
    async getActiveSessions(userId) {
        return this.devicesService.getActiveSessions(userId);
    }
    async validateUser(email) {
        const user = await this.findUserByEmail(this.normalizeEmail(email));
        return user || null;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(2, (0, typeorm_1.InjectRepository)(tree_entity_1.Tree)),
    __param(3, (0, typeorm_1.InjectRepository)(user_tree_entity_1.UserTree)),
    __param(4, (0, typeorm_1.InjectRepository)(resource_entity_1.Resource)),
    __param(5, (0, typeorm_1.InjectRepository)(user_resource_entity_1.UserResource)),
    __param(6, (0, typeorm_1.InjectRepository)(economy_log_entity_1.EconomyLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        tokens_service_1.TokensService,
        devices_service_1.DevicesService,
        firebase_service_1.FirebaseService,
        users_service_1.UsersService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map