import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MinigamesController } from './minigames.controller';
import { MinigamesService } from './minigames.service';
import { SpinReward } from '../../database/entities/spin-reward.entity';
import { UserResource } from '../../database/entities/user-resource.entity';
import { EconomyLog } from '../../database/entities/economy-log.entity';
import { Resource } from '../../database/entities/resource.entity';
import { UserGameState } from '../../database/entities/user-game-state.entity';
import { CacheService } from '../../services/cache.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SpinReward,
      UserResource,
      EconomyLog,
      Resource,
      UserGameState,
    ]),
  ],
  controllers: [MinigamesController],
  providers: [MinigamesService, CacheService],
  exports: [MinigamesService],
})
export class MinigamesModule {}
