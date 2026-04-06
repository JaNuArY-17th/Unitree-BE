import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../database/entities/user.entity';
import { CacheService } from '../../services/cache.service';
import { LeaderboardController } from './controllers/leaderboard.controller';
import { LeaderboardService } from './services/leaderboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [LeaderboardController],
  providers: [LeaderboardService, CacheService],
  exports: [LeaderboardService],
})
export class LeaderboardModule {}
