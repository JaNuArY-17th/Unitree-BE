import { Controller, HttpCode, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ResponseUtil } from '../../shared/utils/response.util';
import { GardenService } from './garden.service';

@ApiTags('Garden')
@ApiBearerAuth()
@Controller('garden')
export class GardenController {
  constructor(private readonly gardenService: GardenService) {}

  @Post('sync-resources')
  @ApiOperation({
    summary: 'Dong bo tai nguyen truc tiep tu DB theo toan bo cay cua user',
  })
  @ApiResponse({
    status: 200,
    description: 'Dong bo tai nguyen thanh cong',
  })
  @HttpCode(200)
  async syncResources(@CurrentUser('id') userId: string) {
    const result = await this.gardenService.syncAllOxygen(userId);
    return ResponseUtil.success(result, 'Dong bo tai nguyen thanh cong');
  }
}
