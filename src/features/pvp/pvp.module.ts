import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PvpController } from './controllers/pvp.controller';
import { PvpService } from './services/pvp.service';
import { UserResource } from '../../database/entities/user-resource.entity';
import { UserTree } from '../../database/entities/user-tree.entity';
import { PvpActionLog } from '../../database/entities/pvp-action-log.entity';
import { EconomyLog } from '../../database/entities/economy-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserResource,
      UserTree,
      PvpActionLog,
      EconomyLog,
    ]),
  ],
  controllers: [PvpController],
  providers: [PvpService],
  exports: [PvpService],
})
export class PvpModule {}
