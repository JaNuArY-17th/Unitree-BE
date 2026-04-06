import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { ResponseUtil } from '../../../shared/utils/response.util';
import { OxyLeaderboardResponseDto } from '../dto/oxy-leaderboard-response.dto';
import { LeaderboardService } from '../services/leaderboard.service';

@ApiTags('Leaderboard')
@ApiBearerAuth()
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('oxy')
  @ApiOperation({
    summary: 'Lay bang xep hang OXY va rank hien tai cua nguoi dung',
  })
  @ApiResponse({
    status: 200,
    description: 'Tra ve top nguoi choi theo OXY va rank cua user hien tai',
    type: OxyLeaderboardResponseDto,
  })
  async getOxyLeaderboard(@CurrentUser('id') userId: string) {
    const leaderboard = await this.leaderboardService.getOxyLeaderboard(userId);
    return ResponseUtil.success(leaderboard);
  }
}
