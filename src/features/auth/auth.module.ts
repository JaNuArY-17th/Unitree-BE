import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { OtpRedisService } from './services/otp-redis.service';
import { User } from '../../database/entities/user.entity';
import { Student } from '../../database/entities/student.entity';
import { Tree } from '../../database/entities/tree.entity';
import { UserTree } from '../../database/entities/user-tree.entity';
import { Resource } from '../../database/entities/resource.entity';
import { UserResource } from '../../database/entities/user-resource.entity';
import { EconomyLog } from '../../database/entities/economy-log.entity';
import { CacheService } from '../../services/cache.service';
import { EmailService } from '../../services/email.service';
import { TokensModule } from '../tokens/tokens.module';
import { DevicesModule } from '../devices/devices.module';
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
    TypeOrmModule.forFeature([
      User,
      Student,
      Tree,
      UserTree,
      Resource,
      UserResource,
      EconomyLog,
    ]),
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
    CacheService,
    EmailService,
    FirebaseService,
  ],
  exports: [AuthService, OtpRedisService],
})
export class AuthModule {}
