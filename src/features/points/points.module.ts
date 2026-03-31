import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointsController } from './controllers/points.controller';
import { PointsService } from './services/points.service';
import { EconomyLog } from '../../database/entities/economy-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EconomyLog])],
  controllers: [PointsController],
  providers: [PointsService],
  exports: [PointsService],
})
export class PointsModule {}
