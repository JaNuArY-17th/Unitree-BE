import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tree } from '../../database/entities/tree.entity';

@Injectable()
export class TreesService {
  constructor(
    @InjectRepository(Tree)
    private readonly treeRepository: Repository<Tree>,
  ) {}

  async getUserTrees(userId: string): Promise<Tree[]> {
    return this.treeRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getTreeById(treeId: string, userId: string): Promise<Tree> {
    const tree = await this.treeRepository.findOne({
      where: { id: treeId, userId },
    });

    if (!tree) {
      throw new NotFoundException('Tree not found');
    }

    return tree;
  }
}
