import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WifiSessionsController } from './wifi-sessions.controller';
import { WifiSessionsService } from './wifi-sessions.service';
import { WifiSession } from '../../database/entities/wifi-session.entity';
import { PointsModule } from '../points/points.module';
import { CacheService } from '../../services/cache.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WifiSession]),
    PointsModule, // For awarding points when session ends
  ],
  controllers: [WifiSessionsController],
  providers: [WifiSessionsService, CacheService],
  exports: [WifiSessionsService],
})
export class WifiSessionsModule {}
