import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { TreesService } from './trees.service';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ResponseUtil } from '../../shared/utils/response.util';

@Controller('trees')
export class TreesController {
  constructor(private readonly treesService: TreesService) {}

  @Get()
  async getUserTrees(@CurrentUser('id') userId: string) {
    const trees = await this.treesService.getUserTrees(userId);
    return ResponseUtil.success(trees);
  }

  @Get(':id')
  async getTreeById(
    @CurrentUser('id') userId: string,
    @Param('id') treeId: string,
  ) {
    const tree = await this.treesService.getTreeById(treeId, userId);
    return ResponseUtil.success(tree);
  }
}
