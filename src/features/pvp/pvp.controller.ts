import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PvpService } from './pvp.service';
import { RaidDto } from './dto/raid.dto';
import { AttackDto } from './dto/attack.dto';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ResponseUtil } from '../../shared/utils/response.util';

@ApiTags('PvP')
@ApiBearerAuth()
@Controller('pvp')
export class PvpController {
  constructor(private readonly pvpService: PvpService) {}

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
