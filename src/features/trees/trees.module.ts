import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TreesController } from './trees.controller';
import { TreesService } from './trees.service';
import { UserTree } from '../../database/entities/user-tree.entity';
import { Tree } from '../../database/entities/tree.entity';
import { UserResource } from '../../database/entities/user-resource.entity';
import { Resource } from '../../database/entities/resource.entity';
import { EconomyLog } from '../../database/entities/economy-log.entity';
import { WifiSession } from '../../database/entities/wifi-session.entity';
import { GardenModule } from '../garden/garden.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserTree,
      Tree,
      UserResource,
      Resource,
      EconomyLog,
      WifiSession,
    ]),
    GardenModule,
  ],
  controllers: [TreesController],
  providers: [TreesService],
  exports: [TreesService],
})
export class TreesModule {}
