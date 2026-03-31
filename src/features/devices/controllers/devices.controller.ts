import {
  Controller,
  Get,
  Delete,
  Param,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { DevicesService } from '../services/devices.service';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { ResponseUtil } from '../../../shared/utils/response.util';

@ApiTags('Devices')
@ApiBearerAuth()
@Controller('devices')
@UseGuards(JwtAuthGuard)
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get('sessions')
  @ApiOperation({
    summary: 'Lấy danh sách phiên đăng nhập đang hoạt động của user',
  })
  @ApiResponse({ status: 200, description: 'Danh sách active sessions' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  async getActiveSessions(@CurrentUser() user: { id: string }) {
    const sessions = await this.devicesService.getActiveSessions(user.id);
    return ResponseUtil.success(sessions, 'Active sessions retrieved');
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả thiết bị của user' })
  @ApiResponse({ status: 200, description: 'Danh sách thiết bị của user' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  async getUserDevices(@CurrentUser() user: { id: string }) {
    const devices = await this.devicesService.getUserDevices(user.id);
    return ResponseUtil.success(devices, 'Devices retrieved');
  }

  @Delete('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng xuất khỏi tất cả thiết bị' })
  @ApiResponse({
    status: 200,
    description: 'Đã đăng xuất khỏi tất cả thiết bị thành công',
  })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  async logoutAllDevices(@CurrentUser() user: { id: string }) {
    await this.devicesService.logoutAllDevices(user.id);
    return ResponseUtil.success(null, 'Logged out from all devices');
  }

  @Delete(':deviceId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xoá một thiết bị cụ thể' })
  @ApiParam({
    name: 'deviceId',
    description: 'UUID của thiết bị cần xoá',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({ status: 200, description: 'Thiết bị đã được xoá thành công' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({ status: 404, description: 'Thiết bị không tồn tại' })
  async removeDevice(
    @CurrentUser() user: { id: string },
    @Param('deviceId', new ParseUUIDPipe()) deviceId: string,
  ) {
    await this.devicesService.removeDevice(user.id, deviceId);
    return ResponseUtil.success(null, 'Device removed successfully');
  }
}
