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
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../../../database/entities/user.entity");
const pagination_repository_1 = require("../../../shared/repositories/pagination.repository");
const common_2 = require("@nestjs/common");
const user_info_dto_1 = require("../dto/user-info.dto");
const class_transformer_1 = require("class-transformer");
let UsersService = class UsersService {
    static { UsersService_1 = this; }
    userRepository;
    static REF_CODE_NOT_FOUND_MESSAGE = 'Mã mời không tồn tại';
    static REF_CODE_SELF_MESSAGE = 'Không thể tự nhập mã của mình';
    static REF_CODE_ALREADY_APPLIED_MESSAGE = 'Bạn đã nhập mã mời trước đó';
    async countReferredUsers(userId) {
        return this.userRepository.count({
            where: { referredBy: { id: userId } },
        });
    }
    async getReferredUsers(userId) {
        return this.userRepository.find({
            where: { referredBy: { id: userId } },
        });
    }
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async findById(id) {
        const user = await this.userRepository.findOne({
            where: { id },
            relations: ['student', 'referredBy'],
        });
        if (!user) {
            throw new common_2.NotFoundException('User not found');
        }
        return (0, class_transformer_1.plainToInstance)(user_info_dto_1.UserInfoDto, user);
    }
    async generateReferralCode(userId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user)
            throw new common_2.NotFoundException('User not found');
        if (user.referralCode)
            return user;
        let code;
        let exists = true;
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        do {
            code = Array.from({ length: 4 }, () => charset[Math.floor(Math.random() * charset.length)]).join('');
            exists = !!(await this.userRepository.findOne({
                where: { referralCode: code },
            }));
        } while (exists);
        user.referralCode = code;
        await this.userRepository.save(user);
        return user;
    }
    async findAll(paginationDto, search) {
        const { page = 1, limit = 10 } = paginationDto;
        const skip = (page - 1) * limit;
        const qb = this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.student', 'student');
        if (search) {
            qb.where('(student.fullName ILIKE :search OR student.email ILIKE :search OR user.email ILIKE :search OR user.username ILIKE :search)', { search: `%${search}%` });
        }
        qb.orderBy('user.createdAt', 'DESC').skip(skip).take(limit);
        const [data, total] = await qb.getManyAndCount();
        return new pagination_repository_1.PaginationResult({
            data: (0, class_transformer_1.plainToInstance)(user_info_dto_1.UserInfoDto, data),
            total,
            page,
            limit,
            total_pages: Math.ceil(total / limit),
        });
    }
    async update(id, updateUserDto) {
        const user = await this.findById(id);
        Object.assign(user, updateUserDto);
        await this.userRepository.save(user);
        return this.findById(id);
    }
    async validateReferralCode(userId, code) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['referredBy'],
        });
        if (!user) {
            throw new common_2.NotFoundException('User not found');
        }
        const target = await this.validateReferralCodeForUser(user, code);
        return {
            targetUserId: target.id,
            targetUsername: target.username,
            targetAvatarUrl: target.avatar ?? '',
        };
    }
    async applyReferralCode(userId, dto) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['referredBy'],
        });
        if (!user) {
            throw new common_2.NotFoundException('User not found');
        }
        const target = await this.validateReferralCodeForUser(user, dto.refCode);
        user.referredBy = target;
        await this.userRepository.save(user);
        return {
            success: true,
            message: 'Nhập mã thành công',
        };
    }
    normalizeRefCode(code) {
        return code.trim().toUpperCase();
    }
    async validateReferralCodeForUser(user, code) {
        const normalizedCode = this.normalizeRefCode(code);
        const target = await this.userRepository.findOne({
            where: { referralCode: normalizedCode },
        });
        if (!target) {
            throw new common_2.NotFoundException(UsersService_1.REF_CODE_NOT_FOUND_MESSAGE);
        }
        if (target.id === user.id || user.referralCode === normalizedCode) {
            throw new common_1.BadRequestException(UsersService_1.REF_CODE_SELF_MESSAGE);
        }
        if (user.referredBy) {
            throw new common_1.BadRequestException(UsersService_1.REF_CODE_ALREADY_APPLIED_MESSAGE);
        }
        return target;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map