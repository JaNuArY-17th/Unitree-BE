import { Controller, Get, Query } from '@nestjs/common';
import { PointsService } from './points.service';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ResponseUtil } from '../../shared/utils/response.util';

@Controller('points')
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Get('history')
  async getEconomyHistory(
    @CurrentUser('id') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const result = await this.pointsService.getEconomyHistory(
      userId,
      page,
      limit,
    );
    return ResponseUtil.paginated(result.data, page, limit, result.total);
  }
}
