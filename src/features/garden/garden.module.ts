import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { GardenGateway } from './gateways/garden.gateway';
import { GardenService } from './services/garden.service';
import { GardenController } from './controllers/garden.controller';
import { UserTree } from '../../database/entities/user-tree.entity';
import { Tree } from '../../database/entities/tree.entity';
import { UserResource } from '../../database/entities/user-resource.entity';
import { Resource } from '../../database/entities/resource.entity';
import { WifiSession } from '../../database/entities/wifi-session.entity';
import { EconomyLog } from '../../database/entities/economy-log.entity';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';

@Module({
  controllers: [GardenController],
  imports: [
    TypeOrmModule.forFeature([
      UserTree,
      Tree,
      UserResource,
      Resource,
      WifiSession,
      EconomyLog,
    ]),
    LeaderboardModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    }),
  ],
  providers: [GardenGateway, GardenService],
  exports: [GardenService, GardenGateway],
})
export class GardenModule {}
