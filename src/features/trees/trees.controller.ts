import { Controller, Get, Param, Body, Post } from '@nestjs/common';
import { UpgradeTreeDto } from './dto/upgrade-tree.dto';
import { RepairTreeDto } from './dto/repair-tree.dto';
import { EvolveTreeDto } from './dto/evolve-tree.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { TreesService } from './trees.service';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ResponseUtil } from '../../shared/utils/response.util';
import { UnlockTreeDto } from './dto/unlock-tree.dto';

@ApiTags('Trees')
@ApiBearerAuth()
@Controller('trees')
export class TreesController {
  constructor(private readonly treesService: TreesService) {}

  @Post('upgrade')
  @ApiOperation({ summary: 'Người dùng nâng cấp cây' })
  @ApiBody({ type: UpgradeTreeDto, description: 'Dữ liệu nâng cấp cây' })
  @ApiResponse({
    status: 200,
    description: 'Nâng cấp cây thành công',
    schema: {
      example: {
        success: true,
        data: {
          /* userTree */
        },
        message: 'Nâng cấp cây thành công',
      },
    },
  })
  async upgradeTree(
    @CurrentUser('id') userId: string,
    @Body() dto: UpgradeTreeDto,
  ) {
    const userTree = await this.treesService.upgradeTree(userId, dto);
    return ResponseUtil.success(userTree, 'Nâng cấp cây thành công');
  }

  @Post('repair')
  @ApiOperation({ summary: 'Người dùng sửa cây' })
  @ApiBody({ type: RepairTreeDto, description: 'Dữ liệu sửa cây' })
  @ApiResponse({
    status: 200,
    description: 'Sửa cây thành công',
    schema: {
      example: {
        success: true,
        data: {
          /* userTree */
        },
        message: 'Sửa cây thành công',
      },
    },
  })
  async repairTree(
    @CurrentUser('id') userId: string,
    @Body() dto: RepairTreeDto,
  ) {
    const userTree = await this.treesService.repairTree(userId, dto);
    return ResponseUtil.success(userTree, 'Sửa cây thành công');
  }

  @Post('evolve')
  @ApiOperation({ summary: 'Cây tiến hóa' })
  @ApiBody({ type: EvolveTreeDto, description: 'Dữ liệu tiến hóa cây' })
  @ApiResponse({
    status: 200,
    description: 'Tiến hóa cây thành công',
    schema: {
      example: {
        success: true,
        data: {
          /* userTree */
        },
        message: 'Tiến hóa cây thành công',
      },
    },
  })
  async evolveTree(
    @CurrentUser('id') userId: string,
    @Body() dto: EvolveTreeDto,
  ) {
    const userTree = await this.treesService.evolveTree(userId, dto);
    return ResponseUtil.success(userTree, 'Tiến hóa cây thành công');
  }

  @Post('unlock')
  @ApiOperation({ summary: 'Mở khóa cây cho user' })
  @ApiBody({ type: UnlockTreeDto, description: 'Dữ liệu mở khóa cây' })
  @ApiResponse({
    status: 201,
    description: 'Mở khóa cây thành công',
    schema: {
      example: {
        success: true,
        data: {
          /* userTree */
        },
        message: 'Mở khóa cây thành công',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'User đã sở hữu cây này' })
  async unlockTree(
    @CurrentUser('id') userId: string,
    @Body() dto: UnlockTreeDto,
  ) {
    const userTree = await this.treesService.unlockTree(userId, dto);
    return ResponseUtil.success(userTree, 'Mở khóa cây thành công');
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách cây của user đang đăng nhập' })
  @ApiResponse({ status: 200, description: 'Trả về danh sách cây của user' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  async getUserTrees(@CurrentUser('id') userId: string) {
    const trees = await this.treesService.getUserTrees(userId);
    return ResponseUtil.success(trees);
  }

  @Get('catalog')
  @ApiOperation({ summary: 'Lấy danh sách loại cây (catalog)' })
  @ApiResponse({ status: 200, description: 'Danh sách loại cây' })
  async getAllCatalogTrees() {
    const trees = await this.treesService.getAllCatalogTrees();
    return ResponseUtil.success(trees);
  }

  @Get('catalog/:id')
  @ApiOperation({ summary: 'Lấy chi tiết một loại cây theo ID (catalog)' })
  @ApiParam({ name: 'id', description: 'UUID của loại cây' })
  @ApiResponse({ status: 200, description: 'Chi tiết loại cây' })
  async getCatalogTreeById(@Param('id') id: string) {
    const tree = await this.treesService.getCatalogTreeById(id);
    return ResponseUtil.success(tree);
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
