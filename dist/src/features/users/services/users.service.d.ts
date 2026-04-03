import { Repository } from 'typeorm';
import { User } from '../../../database/entities/user.entity';
import { UpdateUserDto } from '../dto/update-user.dto';
import { ApplyReferralCodeDto } from '../dto/apply-referral.dto';
import { PaginationDto } from '../../../shared/dto/pagination.dto';
import { PaginationResult } from '../../../shared/repositories/pagination.repository';
export declare class UsersService {
    private readonly userRepository;
    private static readonly REF_CODE_NOT_FOUND_MESSAGE;
    private static readonly REF_CODE_SELF_MESSAGE;
    private static readonly REF_CODE_ALREADY_APPLIED_MESSAGE;
    countReferredUsers(userId: string): Promise<number>;
    getReferredUsers(userId: string): Promise<User[]>;
    constructor(userRepository: Repository<User>);
    findById(id: string): Promise<User>;
    generateReferralCode(userId: string): Promise<User>;
    findAll(paginationDto: PaginationDto, search?: string): Promise<PaginationResult<User>>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<User>;
    validateReferralCode(userId: string, code: string): Promise<{
        targetUserId: string;
        targetUsername: string;
        targetAvatarUrl: string;
    }>;
    applyReferralCode(userId: string, dto: ApplyReferralCodeDto): Promise<{
        success: true;
        message: string;
    }>;
    private normalizeRefCode;
    private validateReferralCodeForUser;
}
