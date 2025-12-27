import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ResponseUtil } from '../../shared/utils/response.util';
import { Roles } from '../../shared/decorators/roles.decorator';
import { UserRole } from '../../shared/constants/roles.constant';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { PaginationDto } from '../../shared/dto/pagination.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getCurrentUser(@CurrentUser('id') userId: string) {
    const user = await this.usersService.findById(userId);
    return ResponseUtil.success(user);
  }

  @Put('me')
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
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query('search') search?: string,
  ) {
    const result = await this.usersService.findAll(paginationDto, search);
    return ResponseUtil.success(result, 'Users retrieved successfully');
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    return ResponseUtil.success(user);
  }
}
