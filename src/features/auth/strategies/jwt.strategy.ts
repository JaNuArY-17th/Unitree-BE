import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../database/entities/user.entity';
import { TokensService } from '../../tokens/services/tokens.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    private tokensService: TokensService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret') || 'default-secret',
    });
  }

  async validate(payload: { sub?: string }) {
    if (!payload || !payload.sub) {
      this.logger.warn('Token payload missing required "sub"');
      throw new UnauthorizedException('Invalid token');
    }

    // Try to get user info from Redis cache first
    const userInfo = await this.tokensService.getUserInfo(String(payload.sub));

    if (userInfo) {
      this.logger.debug(
        `Using cached user info for user ID: ${String(payload.sub)}`,
      );
      return {
        id: userInfo.id,
        username: userInfo.username,
        role: userInfo.role,
        studentId: userInfo.studentId,
      };
    }

    this.logger.debug(
      `No cached user info found, fetching from DB for user ID: ${String(payload.sub)}`,
    );
    const user = await this.userRepository.findOne({
      where: { id: String(payload.sub) },
      relations: ['student'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.tokensService.storeUserProfile(user);

    return {
      id: user.id,
      username: user.username,
      role: user.role,
      studentId: user.student?.studentId,
    };
  }
}
