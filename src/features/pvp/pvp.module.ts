import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PvpController } from './controllers/pvp.controller';
import { PvpService } from './services/pvp.service';
import { UserResource } from '../../database/entities/user-resource.entity';
import { UserTree } from '../../database/entities/user-tree.entity';
import { PvpActionLog } from '../../database/entities/pvp-action-log.entity';
import { EconomyLog } from '../../database/entities/economy-log.entity';
import { User } from '../../database/entities/user.entity';
import { Resource } from '../../database/entities/resource.entity';
import { Tree } from '../../database/entities/tree.entity';
import { WifiSessionsModule } from '../wifi-sessions/wifi-sessions.module';

@Module({
  imports: [
    WifiSessionsModule,
    TypeOrmModule.forFeature([
      UserResource,
      UserTree,
      PvpActionLog,
      EconomyLog,
      User,
      Resource,
      Tree,
    ]),
  ],
  controllers: [PvpController],
  providers: [PvpService],
  exports: [PvpService],
})
export class PvpModule {}
