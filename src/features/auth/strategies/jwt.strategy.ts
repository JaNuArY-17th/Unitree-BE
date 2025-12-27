import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../database/entities/user.entity';
import { TokensService } from '../../tokens/tokens.service';

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

  async validate(payload: any) {
    if (!payload || !payload.sub) {
      this.logger.warn('Token payload missing required "sub"');
      throw new UnauthorizedException('Invalid token');
    }

    // Try to get user info from Redis cache first
    const userInfo = await this.tokensService.getUserInfo(payload.sub);

    if (userInfo) {
      this.logger.debug(`Using cached user info for user ID: ${payload.sub}`);
      // Return user from cache
      return {
        id: userInfo.id,
        email: userInfo.email,
        role: userInfo.role,
        fullName: userInfo.fullName,
        isActive: userInfo.isActive,
      };
    }

    // If not in cache, fetch from database
    this.logger.debug(
      `No cached user info found, fetching from DB for user ID: ${payload.sub}`,
    );
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Store user info in Redis for future requests
    await this.tokensService.storeUserInfo(user);

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      isActive: user.isActive,
    };
  }
}
