import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ResponseUtil } from '../../shared/utils/response.util';
import { Roles } from '../../shared/decorators/roles.decorator';
import { UserRole } from '../../shared/constants/roles.constant';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { ActivityLogType } from './dto/activity-log.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ──────────────────────────────────
  // Own profile / inventory
  // (khai báo TRƯỚC ":id" để tránh bắt sai route)
  // ──────────────────────────────────

  @Get('me')
  @ApiOperation({ summary: 'Lấy thông tin user đang đăng nhập' })
  @ApiResponse({ status: 200, description: 'Thông tin user hiện tại' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  async getCurrentUser(@CurrentUser('id') userId: string) {
    const user = await this.usersService.findById(userId);
    return ResponseUtil.success(user);
  }

  @Put('me')
  @ApiOperation({ summary: 'Cập nhật profile của user đang đăng nhập' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'Profile được cập nhật thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  async updateCurrentUser(
    @CurrentUser('id') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.usersService.update(userId, updateUserDto);
    return ResponseUtil.success(user, 'Profile updated successfully');
  }

  @Get('me/inventory')
  @ApiOperation({
    summary: 'Lấy kho tài nguyên của user (Oxy, Lá Xanh, Spin, Items...)',
  })
  @ApiResponse({
    status: 200,
    description:
      'Danh sách số dư tài nguyên + thông tin hồi phục Lượt quay (Spin)',
    schema: {
      example: {
        success: true,
        data: {
          resources: [
            { code: 'OXYGEN', name: 'Oxy', balance: 125000, maxStack: null },
            { code: 'GREEN_LEAF', name: 'Lá Xanh', balance: 5000, maxStack: null },
            { code: 'SPIN', name: 'Lượt Quay', balance: 12, maxStack: 20 },
            { code: 'RAID_ITEM', name: 'Găng Tay', balance: 2, maxStack: 5 },
            { code: 'ATTACK_ITEM', name: 'Bọ Xít', balance: 1, maxStack: 5 },
            { code: 'SHIELD', name: 'Màn Bắt Côn Trùng', balance: 0, maxStack: 3 },
          ],
          spinRegen: {
            currentSpins: 12,
            maxSpins: 20,
            nextRegenAt: '2026-03-21T13:32:00.000Z',
            secondsUntilNextRegen: 420,
          },
        },
        message: null,
      },
    },
  })
  async getMyInventory(@CurrentUser('id') userId: string) {
    const inventory = await this.usersService.getMyInventory(userId);
    return ResponseUtil.success(inventory);
  }

  @Get('me/activity')
  @ApiOperation({
    summary: 'Lịch sử hoạt động cá nhân (giao dịch tài nguyên + chiến sự PvP)',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ActivityLogType,
    description: 'Loại log: economy | pvp | all (mặc định: all)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Trang (mặc định: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số records/trang (mặc định: 20)' })
  @ApiResponse({ status: 200, description: 'Lịch sử hoạt động có phân trang' })
  async getMyActivity(
    @CurrentUser('id') userId: string,
    @Query('type') type: ActivityLogType = ActivityLogType.ALL,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const result = await this.usersService.getActivityLog(userId, type, page, limit);
    return ResponseUtil.success(result);
  }

  // ──────────────────────────────────
  // Leaderboard
  // ──────────────────────────────────

  @Get('leaderboard')
  @ApiOperation({ summary: 'Bảng xếp hạng Oxy (toàn server hoặc bạn bè)' })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['global', 'friends'],
    description: 'Loại leaderboard: global | friends (mặc định: global)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Xếp hạng Oxy với rank của bản thân (myRank)',
  })
  async getLeaderboard(
    @CurrentUser('id') userId: string,
    @Query('type') type: 'global' | 'friends' = 'global',
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const result = await this.usersService.getLeaderboard(userId, type, page, limit);
    return ResponseUtil.success(result);
  }

  // ──────────────────────────────────
  // Opponents (PvP)
  // PHẢI khai báo TRƯỚC ":id" route
  // ──────────────────────────────────

  @Get('opponents/random')
  @ApiOperation({
    summary: 'Lấy danh sách đối thủ ngẫu nhiên để Raid/Attack (PvP)',
  })
  @ApiQuery({
    name: 'count',
    required: false,
    type: Number,
    description: 'Số đối thủ muốn lấy (1-10, mặc định: 3)',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách đối thủ ngẫu nhiên (username, avatar)',
  })
  async getRandomOpponents(
    @CurrentUser('id') userId: string,
    @Query('count', new DefaultValuePipe(3), ParseIntPipe) count: number,
  ) {
    const opponents = await this.usersService.getRandomOpponents(userId, count);
    return ResponseUtil.success(opponents);
  }

  @Get('opponents/revenge-list')
  @ApiOperation({
    summary: 'Danh sách người đã tấn công mình trong 48 giờ qua (để trả thù)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng tối đa (mặc định: 10)',
  })
  @ApiResponse({ status: 200, description: 'Danh sách attackers gần đây' })
  async getRevengeList(
    @CurrentUser('id') userId: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const list = await this.usersService.getRevengeList(userId, limit);
    return ResponseUtil.success(list);
  }

  // ──────────────────────────────────
  // Admin: list all users
  // ──────────────────────────────────

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Lấy danh sách tất cả users' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Danh sách users có phân trang' })
  @ApiResponse({ status: 403, description: 'Không đủ quyền' })
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query('search') search?: string,
  ) {
    const result = await this.usersService.findAll(paginationDto, search);
    return ResponseUtil.success(result, 'Users retrieved successfully');
  }

  // ──────────────────────────────────
  // Garden & Public profile
  // ":id" routes PHẢI ở DƯỚI cùng
  // ──────────────────────────────────

  @Get(':id/garden')
  @ApiOperation({
    summary: 'Xem vườn cây của một người dùng khác (dùng cho PvP)',
  })
  @ApiParam({ name: 'id', description: 'UUID của user muốn xem vườn' })
  @ApiResponse({
    status: 200,
    description: 'Trông thái vườn: danh sách cây, tốc độ Oxy, số khiên',
  })
  @ApiResponse({ status: 404, description: 'User không tồn tại' })
  async getGardenProfile(@Param('id') targetId: string) {
    const garden = await this.usersService.getGardenProfile(targetId);
    return ResponseUtil.success(garden);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin public profile của user theo ID' })
  @ApiParam({ name: 'id', description: 'UUID của user' })
  @ApiResponse({ status: 200, description: 'Thông tin user' })
  @ApiResponse({ status: 404, description: 'User không tồn tại' })
  async findById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    return ResponseUtil.success(user);
  }
}
