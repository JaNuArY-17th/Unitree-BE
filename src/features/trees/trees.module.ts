import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TreesController } from './trees.controller';
import { TreesService } from './trees.service';
import { UserTree } from '../../database/entities/user-tree.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserTree])],
  controllers: [TreesController],
  providers: [TreesService],
  exports: [TreesService],
})
export class TreesModule {}
