import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WifiSessionsController } from './wifi-sessions.controller';
import { WifiSessionsService } from './wifi-sessions.service';
import { WifiSession } from '../../database/entities/wifi-session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WifiSession])],
  controllers: [WifiSessionsController],
  providers: [WifiSessionsService],
  exports: [WifiSessionsService],
})
export class WifiSessionsModule {}
