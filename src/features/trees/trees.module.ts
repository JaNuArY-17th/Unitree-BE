import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TreesController } from './trees.controller';
import { TreesService } from './trees.service';
import { Tree } from '../../database/entities/tree.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tree])],
  controllers: [TreesController],
  providers: [TreesService],
  exports: [TreesService],
})
export class TreesModule {}
