import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WifiSessionsController } from './controllers/wifi-sessions.controller';
import { WifiSessionsService } from './services/wifi-sessions.service';
import { WifiSession } from '../../database/entities/wifi-session.entity';
import { WifiConfig } from '../../database/entities/wifi-config.entity';
import { UserResource } from '../../database/entities/user-resource.entity';
import { Resource } from '../../database/entities/resource.entity';
import { PointsModule } from '../points/points.module';
import { CacheService } from '../../services/cache.service';
import { SocketService } from '../../services/socket.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WifiSession, WifiConfig, UserResource, Resource]),
    PointsModule, // For awarding points when session ends
  ],
  controllers: [WifiSessionsController],
  providers: [WifiSessionsService, CacheService, SocketService],
  exports: [WifiSessionsService],
})
export class WifiSessionsModule {}
