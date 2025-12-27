import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TokensService } from './tokens.service';
import { CacheService } from '../../services/cache.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('jwt.secret');
        if (!secret) {
          throw new Error('JWT secret is not configured');
        }
        return {
          secret,
        };
      },
      inject: [ConfigService],
      global: true,
    }),
  ],
  providers: [TokensService, CacheService],
  exports: [TokensService],
})
export class TokensModule {}
