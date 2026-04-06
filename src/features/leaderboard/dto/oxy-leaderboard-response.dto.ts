import { ApiProperty } from '@nestjs/swagger';

export class OxyTopPlayerDto {
  @ApiProperty({ example: 1 })
  rank!: number;

  @ApiProperty({ example: 'd4d3f7dc-a8de-4179-bfef-5cd95a5ca037' })
  userId!: string;

  @ApiProperty({ example: 'january17th' })
  username!: string;

  @ApiProperty({
    example: 'https://cdn.unitree.com/avatars/user.png',
    nullable: true,
  })
  avatar!: string;

  @ApiProperty({ example: 120045 })
  oxy!: number;

  @ApiProperty({ example: true })
  isStudent!: boolean;
}

export class CurrentUserRankingDto {
  @ApiProperty({
    example: 16,
    description:
      '0 means the user is currently not ranked in Redis leaderboard',
  })
  rank!: number;

  @ApiProperty({ example: 8450 })
  score!: number;
}

export class OxyLeaderboardResponseDto {
  @ApiProperty({ type: OxyTopPlayerDto, isArray: true })
  topPlayersList!: OxyTopPlayerDto[];

  @ApiProperty({ type: CurrentUserRankingDto })
  currentUserRanking!: CurrentUserRankingDto;
}
