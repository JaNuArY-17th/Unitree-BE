import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PointsService } from './points.service';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ResponseUtil } from '../../shared/utils/response.util';
import { PaginationDto } from '../../shared/dto/pagination.dto';

@ApiTags('Points')
@ApiBearerAuth()
@Controller('points')
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Get('history')
  @ApiOperation({
    summary: 'Lấy lịch sử điểm của user',
    description:
      'Trả về danh sách giao dịch điểm (kiếm được / sử dụng) với phân trang',
  })
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
    description: 'Số bản ghi mỗi trang (mặc định: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Trả về lịch sử điểm có phân trang',
  })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  async getEconomyHistory(
    @CurrentUser('id') userId: string,
    @Query() pagination: PaginationDto,
  ) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const result = await this.pointsService.getEconomyHistory(
      userId,
      page,
      limit,
    );
    return ResponseUtil.paginated(result.data, page, limit, result.total);
  }
}
