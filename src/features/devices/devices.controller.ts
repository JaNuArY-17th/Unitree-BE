import {
  Controller,
  Get,
  Delete,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ResponseUtil } from '../../shared/utils/response.util';

@ApiTags('Devices')
@ApiBearerAuth()
@Controller('devices')
@UseGuards(JwtAuthGuard)
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get('sessions')
  @ApiOperation({ summary: 'Get active sessions for current user' })
  async getActiveSessions(@CurrentUser() user: any) {
    const sessions = await this.devicesService.getActiveSessions(user.id);
    return ResponseUtil.success(sessions, 'Active sessions retrieved');
  }

  @Get()
  @ApiOperation({ summary: 'Get all devices for current user' })
  async getUserDevices(@CurrentUser() user: any) {
    const devices = await this.devicesService.getUserDevices(user.id);
    return ResponseUtil.success(devices, 'Devices retrieved');
  }

  @Delete('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout from all devices' })
  async logoutAllDevices(@CurrentUser() user: any) {
    await this.devicesService.logoutAllDevices(user.id);
    return ResponseUtil.success(null, 'Logged out from all devices');
  }

  @Delete(':deviceId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a specific device' })
  async removeDevice(
    @CurrentUser() user: any,
    @Param('deviceId') deviceId: string,
  ) {
    await this.devicesService.removeDevice(user.id, deviceId);
    return ResponseUtil.success(null, 'Device removed successfully');
  }
}
