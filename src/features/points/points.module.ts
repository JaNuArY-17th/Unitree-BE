import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointsController } from './points.controller';
import { PointsService } from './points.service';
import { EconomyLog } from '../../database/entities/economy-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EconomyLog])],
  controllers: [PointsController],
  providers: [PointsService],
  exports: [PointsService],
})
export class PointsModule {}
