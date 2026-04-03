import { UsersService } from '../services/users.service';
import { UpdateUserDto } from '../dto/update-user.dto';
import { ApplyReferralCodeDto } from '../dto/apply-referral.dto';
import { PaginationDto } from '../../../shared/dto/pagination.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getCurrentUser(userId: string): Promise<import("../../../shared/utils/response.util").ApiResponse<import("../../../database/entities/user.entity").User>>;
    updateCurrentUser(userId: string, updateUserDto: UpdateUserDto): Promise<import("../../../shared/utils/response.util").ApiResponse<import("../../../database/entities/user.entity").User>>;
    findAll(paginationDto: PaginationDto, search?: string): Promise<import("../../../shared/utils/response.util").ApiResponse<import("../../../shared/repositories/pagination.repository").PaginationResult<import("../../../database/entities/user.entity").User>>>;
    validateReferralCode(userId: string, code: string): Promise<{
        targetUserId: string;
        targetUsername: string;
        targetAvatarUrl: string;
    }>;
    findById(id: string): Promise<import("../../../shared/utils/response.util").ApiResponse<import("../../../database/entities/user.entity").User>>;
    applyReferralCode(userId: string, dto: ApplyReferralCodeDto): Promise<{
        success: true;
        message: string;
    }>;
}
