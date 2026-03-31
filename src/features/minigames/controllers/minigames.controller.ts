import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MinigamesService } from '../services/minigames.service';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';

@ApiTags('Minigames')
@ApiBearerAuth()
@Controller('minigames')
export class MinigamesController {
  constructor(private readonly minigamesService: MinigamesService) {}

  @Get('inventory/quick')
  @ApiOperation({ summary: 'Lấy nhanh số dư SPIN và MAN_CHUP_TRANH_MUOI' })
  @ApiResponse({
    status: 200,
    description: 'Số dư hiện tại của SPIN và MAN_CHUP_TRANH_MUOI',
  })
  async getQuickInventory(@CurrentUser('id') userId: string) {
    return this.minigamesService.getQuickInventory(userId);
  }

  @Get('spin/rewards')
  @ApiOperation({ summary: 'Lấy cấu hình phần thưởng vòng quay' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách các phần thưởng kèm drop rate',
  })
  async getSpinRewards() {
    return this.minigamesService.getRewards();
  }

  @Post('spin/play')
  @ApiOperation({ summary: 'Quay vòng quay gacha' })
  @ApiResponse({
    status: 200,
    description: 'Kết quả vòng quay (Trúng thưởng item gì)',
  })
  async playSpin(@CurrentUser() user: any) {
    return this.minigamesService.playSpin(user.id);
  }
}
