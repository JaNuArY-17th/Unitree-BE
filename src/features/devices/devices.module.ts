import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevicesService } from './services/devices.service';
import { DevicesController } from './controllers/devices.controller';
import { UserDevice } from '../../database/entities/user-device.entity';
import { User } from '../../database/entities/user.entity';
import { TokensModule } from '../tokens/tokens.module';
import { AuthModule } from '../auth/auth.module';
import { EmailService } from '../../services/email.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserDevice, User]),
    TokensModule,
    forwardRef(() => AuthModule), // Import for OtpRedisService
  ],
  providers: [DevicesService, EmailService],
  exports: [DevicesService],
  controllers: [DevicesController],
})
export class DevicesModule {}
