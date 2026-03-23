import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { OtpRedisService } from './services/otp-redis.service';
import { User } from '../../database/entities/user.entity';
import { CacheService } from '../../services/cache.service';
import { EmailService } from '../../services/email.service';
import { TokensModule } from '../tokens/tokens.module';
import { DevicesModule } from '../devices/devices.module';
import { Student } from '../../database/entities/student.entity';
import { FirebaseService } from '../../services/firebase.service';
import { UsersModule } from '../users/users.module';

/**
 * Auth Module - Refactored
 *
 * Changes:
 * - Separated TokenService into TokensModule
 * - Separated DeviceService into DevicesModule
 * - Cleaner separation of concerns following Ensogo-IAM pattern
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Student]),
    PassportModule,
    TokensModule,
    forwardRef(() => DevicesModule),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    OtpRedisService,
    JwtStrategy,
    LocalStrategy,
    CacheService,
    EmailService,
    FirebaseService,
  ],
  exports: [AuthService, OtpRedisService],
})
export class AuthModule {}
