import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PvpService } from '../services/pvp.service';
import { RaidDto } from '../dto/raid.dto';
import { AttackDto } from '../dto/attack.dto';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { ResponseUtil } from '../../../shared/utils/response.util';

@ApiTags('PvP')
@ApiBearerAuth()
@Controller('pvp')
export class PvpController {
  constructor(private readonly pvpService: PvpService) {}

  @Get('targets')
  @ApiOperation({ summary: 'Lấy danh sách mục tiêu tấn công theo matchmaking' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách mục tiêu gồm 4 thường + 1 báo thủ',
  })
  async getTargets(@CurrentUser('id') userId: string) {
    const result = await this.pvpService.getAttackTargets(userId);
    return ResponseUtil.success(result, 'Attack targets fetched');
  }

  @Get('history')
  @ApiOperation({ summary: 'Lịch sử PvP để hỗ trợ trả thù sau này' })
  @ApiResponse({
    status: 200,
    description: 'Các lượt tấn công và phòng thủ gần đây của user',
  })
  async getHistory(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? Number.parseInt(limit, 10) : undefined;
    const result = await this.pvpService.getHistory(userId, parsedLimit);
    return ResponseUtil.success(result, 'PVP history fetched');
  }

  @Post('raid')
  @ApiOperation({ summary: 'Hái lộc (Đi cướp Vàng)' })
  @ApiResponse({
    status: 200,
    description: 'Kết quả hái lộc (thành công hoặc bị block)',
  })
  async raid(@CurrentUser('id') userId: string, @Body() dto: RaidDto) {
    const result = await this.pvpService.raid(userId, dto);
    return ResponseUtil.success(result, 'Raid action completed');
  }

  @Post('attack')
  @ApiOperation({ summary: 'Thả bọ (Làm hỏng cây)' })
  @ApiResponse({
    status: 200,
    description: 'Kết quả thả bọ (thành công hoặc bị block)',
  })
  async attack(@CurrentUser('id') userId: string, @Body() dto: AttackDto) {
    const result = await this.pvpService.attack(userId, dto);
    return ResponseUtil.success(result, 'Attack action completed');
  }
}
