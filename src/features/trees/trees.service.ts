import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserTree } from '../../database/entities/user-tree.entity';

@Injectable()
export class TreesService {
  constructor(
    @InjectRepository(UserTree)
    private readonly userTreeRepository: Repository<UserTree>,
  ) {}

  async getUserTrees(userId: string): Promise<UserTree[]> {
    return this.userTreeRepository.find({
      where: { userId },
      relations: ['tree'],
      order: { createdAt: 'DESC' },
    });
  }

  async getTreeById(treeId: string, userId: string): Promise<UserTree> {
    const userTree = await this.userTreeRepository.findOne({
      where: { id: treeId, userId },
      relations: ['tree'],
    });

    if (!userTree) {
      throw new NotFoundException('Tree not found');
    }

    return userTree;
  }
}
