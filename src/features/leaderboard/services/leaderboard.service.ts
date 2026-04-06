import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../database/entities/user.entity';
import { CacheService } from '../../../services/cache.service';
import {
  CurrentUserRankingDto,
  OxyLeaderboardResponseDto,
  OxyTopPlayerDto,
} from '../dto/oxy-leaderboard-response.dto';

interface RankedUserScore {
  rank: number;
  userId: string;
  score: number;
}

@Injectable()
export class LeaderboardService {
  private readonly oxyLeaderboardKey: string;
  private readonly leaderboardLimit: number;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
  ) {
    this.oxyLeaderboardKey =
      this.configService.get<string>('leaderboard.keys.oxy') ??
      'leaderboard:oxy';

    const configuredLimit = this.configService.get<number>('leaderboard.limit');
    this.leaderboardLimit =
      typeof configuredLimit === 'number' && configuredLimit > 0
        ? Math.floor(configuredLimit)
        : 10;
  }

  async syncOxyScore(
    userId: string,
    score: string | number | bigint,
  ): Promise<void> {
    const normalizedScore = this.toNonNegativeNumber(score);
    await this.cacheService.zadd(
      this.oxyLeaderboardKey,
      normalizedScore,
      userId,
    );
  }

  async getOxyLeaderboard(
    currentUserId: string,
  ): Promise<OxyLeaderboardResponseDto> {
    const topRankedUsers = await this.getTopRankedUsers();
    const userMap = await this.getUserProfileMap(
      topRankedUsers.map((entry) => entry.userId),
    );

    const topPlayersList: OxyTopPlayerDto[] = topRankedUsers.map((entry) => {
      const user = userMap.get(entry.userId);

      return {
        rank: entry.rank,
        userId: entry.userId,
        username: user?.username ?? 'Unknown user',
        avatar: user?.avatar ?? '',
        oxy: entry.score,
        isStudent: Boolean(user?.student?.id),
      };
    });

    const currentUserRanking = await this.getCurrentUserRanking(currentUserId);

    return {
      topPlayersList,
      currentUserRanking,
    };
  }

  private async getTopRankedUsers(): Promise<RankedUserScore[]> {
    const stopIndex = Math.max(0, this.leaderboardLimit - 1);
    const rawEntries = await this.cacheService.zrevrange(
      this.oxyLeaderboardKey,
      0,
      stopIndex,
      true,
    );

    const rankedUsers: RankedUserScore[] = [];

    for (let index = 0; index < rawEntries.length; index += 2) {
      const userId = rawEntries[index];
      const scoreValue = rawEntries[index + 1];

      if (!userId || scoreValue === undefined) {
        continue;
      }

      rankedUsers.push({
        rank: rankedUsers.length + 1,
        userId,
        score: this.toNonNegativeNumber(scoreValue),
      });
    }

    return rankedUsers;
  }

  private async getUserProfileMap(
    userIds: string[],
  ): Promise<Map<string, User>> {
    if (userIds.length === 0) {
      return new Map<string, User>();
    }

    const users = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.student', 'student')
      .where('user.id IN (:...userIds)', { userIds })
      .getMany();

    const userMap = new Map<string, User>();
    for (const user of users) {
      userMap.set(user.id, user);
    }

    return userMap;
  }

  private async getCurrentUserRanking(
    currentUserId: string,
  ): Promise<CurrentUserRankingDto> {
    const rank = await this.cacheService.zrevrank(
      this.oxyLeaderboardKey,
      currentUserId,
    );

    const score = await this.cacheService.zscore(
      this.oxyLeaderboardKey,
      currentUserId,
    );

    return {
      rank: rank === null ? 0 : rank + 1,
      score: this.toNonNegativeNumber(score),
    };
  }

  private toNonNegativeNumber(value: string | number | bigint | null): number {
    if (value === null || value === undefined) {
      return 0;
    }

    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed < 0) {
      return 0;
    }

    return Math.floor(parsed);
  }
}
