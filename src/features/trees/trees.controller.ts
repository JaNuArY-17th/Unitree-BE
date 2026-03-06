import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { TreesService } from './trees.service';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ResponseUtil } from '../../shared/utils/response.util';

@ApiTags('Trees')
@ApiBearerAuth()
@Controller('trees')
export class TreesController {
  constructor(private readonly treesService: TreesService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách cây của user đang đăng nhập' })
  @ApiResponse({ status: 200, description: 'Trả về danh sách cây của user' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  async getUserTrees(@CurrentUser('id') userId: string) {
    const trees = await this.treesService.getUserTrees(userId);
    return ResponseUtil.success(trees);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết một cây theo ID' })
  @ApiParam({
    name: 'id',
    description: 'UUID của cây',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Trả về thông tin chi tiết của cây',
  })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({
    status: 404,
    description: 'Cây không tồn tại hoặc không thuộc về user này',
  })
  async getTreeById(
    @CurrentUser('id') userId: string,
    @Param('id') treeId: string,
  ) {
    const tree = await this.treesService.getTreeById(treeId, userId);
    return ResponseUtil.success(tree);
  }
}
