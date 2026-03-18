import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserTree } from '../../database/entities/user-tree.entity';
import { Tree } from '../../database/entities/tree.entity';
import { UnlockTreeDto } from 'src/features/trees/dto/unlock-tree.dto';

@Injectable()
export class TreesService {
  async unlockTree(userId: string, dto: UnlockTreeDto): Promise<UserTree> {
    // Kiểm tra user đã sở hữu cây này chưa
    const existed = await this.userTreeRepository.findOne({
      where: { userId, treeId: dto.treeId },
    });
    if (existed) {
      throw new BadRequestException('User đã sở hữu cây này');
    }
    // Kiểm tra cây có tồn tại không
    const tree = await this.treeRepository.findOne({
      where: { id: dto.treeId },
    });
    if (!tree) {
      throw new BadRequestException('Loại cây không tồn tại');
    }
    // Tạo mới UserTree
    const userTree = this.userTreeRepository.create({
      userId,
      treeId: dto.treeId,
      level: 1,
      isDamaged: false,
      lastHarvestTime: new Date(),
      checksum: '', // TODO: generate checksum
    });
    return this.userTreeRepository.save(userTree);
  }
  constructor(
    @InjectRepository(UserTree)
    private readonly userTreeRepository: Repository<UserTree>,
    @InjectRepository(Tree)
    private readonly treeRepository: Repository<Tree>,
  ) {}

  async getUserTrees(userId: string): Promise<UserTree[]> {
    return this.userTreeRepository.find({
      where: { userId },
      relations: ['tree'],
      order: { createdAt: 'DESC' },
    });
  }

  // Catalog logic: fetch all trees
  async getAllCatalogTrees(): Promise<Tree[]> {
    return this.treeRepository.find({ order: { slotIndex: 'ASC' } });
  }

  async getCatalogTreeById(id: string): Promise<Tree | null> {
    return this.treeRepository.findOne({ where: { id } });
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
