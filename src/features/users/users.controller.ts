import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
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

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Lấy thông tin user đang đăng nhập' })
  @ApiResponse({ status: 200, description: 'Trả về thông tin user hiện tại' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  async getCurrentUser(@CurrentUser('id') userId: string) {
    const user = await this.usersService.findById(userId);
    return ResponseUtil.success(user);
  }

  @Put('me')
  @ApiOperation({
    summary: 'Cập nhật thông tin profile của user đang đăng nhập',
  })
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

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Lấy danh sách tất cả users' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Trang hiện tại (mặc định: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số bản ghi mỗi trang (mặc định: 10, tối đa: 100)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Tìm kiếm theo tên hoặc email',
  })
  @ApiResponse({
    status: 200,
    description: 'Trả về danh sách users có phân trang',
  })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({
    status: 403,
    description: 'Không đủ quyền truy cập (yêu cầu ADMIN hoặc SUPER_ADMIN)',
  })
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query('search') search?: string,
  ) {
    const result = await this.usersService.findAll(paginationDto, search);
    return ResponseUtil.success(result, 'Users retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin user theo ID' })
  @ApiParam({
    name: 'id',
    description: 'UUID của user',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({ status: 200, description: 'Trả về thông tin user' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({ status: 404, description: 'User không tồn tại' })
  async findById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    return ResponseUtil.success(user);
  }
}
