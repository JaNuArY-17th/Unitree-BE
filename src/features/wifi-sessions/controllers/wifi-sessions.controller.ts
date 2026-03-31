import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { WifiSessionsService } from '../services/wifi-sessions.service';
import { StartSessionDto } from '../dto/start-session.dto';
import { HeartbeatDto } from '../dto/heartbeat.dto';
import { EndSessionDto } from '../dto/end-session.dto';
import { PaginationDto } from '../../../shared/dto/pagination.dto';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { ResponseUtil } from '../../../shared/utils/response.util';

/**
 * WiFi Sessions Controller
 *
 * Manages WiFi tracking sessions for point rewards
 * - Simple point calculation: 1 point per minute
 * - WiFi validation done on frontend (BSSID check)
 * - Backend only tracks session and awards points
 */
@ApiTags('WiFi Sessions')
@ApiBearerAuth()
@Controller('wifi-sessions')
@UseGuards(JwtAuthGuard)
export class WifiSessionsController {
  constructor(private readonly wifiSessionsService: WifiSessionsService) {}

  @Post('start')
  @ApiOperation({
    summary: 'Bắt đầu một phiên WiFi mới',
    description:
      'Lưu ý: Việc kiểm tra WiFi hợp lệ (BSSID check) phải được thực hiện ở phía client trước khi gọi endpoint này',
  })
  @ApiBody({ type: StartSessionDto })
  @ApiResponse({ status: 201, description: 'Phiên WiFi được tạo thành công' })
  @ApiResponse({ status: 400, description: 'Đã có phiên đang hoạt động' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  async startSession(
    @CurrentUser('id') userId: string,
    @Body() dto: StartSessionDto,
  ) {
    const session = await this.wifiSessionsService.startSession(userId, dto);
    return ResponseUtil.success(session, 'WiFi session started successfully');
  }

  @Post('heartbeat')
  @ApiOperation({
    summary: 'Gửi heartbeat để duy trì phiên WiFi',
    description:
      'Android: Gửi mỗi 5 phút (Foreground Service). iOS: Gửi mỗi 15 phút (Silent Push)',
  })
  @ApiBody({ type: HeartbeatDto })
  @ApiResponse({ status: 200, description: 'Heartbeat đã được ghi nhận' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({ status: 404, description: 'Phiên không tồn tại' })
  async heartbeat(
    @CurrentUser('id') userId: string,
    @Body() dto: HeartbeatDto,
  ) {
    const result = await this.wifiSessionsService.heartbeat(userId, dto);
    return ResponseUtil.success(result, 'Heartbeat recorded');
  }

  @Post(':id/end')
  @ApiOperation({
    summary: 'Kết thúc phiên WiFi và nhận điểm',
    description:
      'Tính toán thời gian phiên và trao điểm thưởng (1 điểm / phút)',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID của phiên WiFi',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Phiên đã kết thúc và điểm được trao',
  })
  @ApiResponse({ status: 400, description: 'Phiên không ở trạng thái active' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({ status: 404, description: 'Phiên không tồn tại' })
  async endSession(
    @CurrentUser('id') userId: string,
    @Param('id', new ParseUUIDPipe()) sessionId: string,
    @Body() dto: EndSessionDto,
  ) {
    const result = await this.wifiSessionsService.endSession(
      sessionId,
      userId,
      dto,
    );
    return ResponseUtil.success(
      result,
      `WiFi session ended. You earned ${result.pointsEarned} points!`,
    );
  }

  @Get('active')
  @ApiOperation({ summary: 'Lấy phiên WiFi đang hoạt động của user' })
  @ApiResponse({
    status: 200,
    description: 'Phiên hiện tại hoặc null nếu không có phiên nào',
  })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  async getActiveSession(@CurrentUser('id') userId: string) {
    const session = await this.wifiSessionsService.getActiveSession(userId);
    return ResponseUtil.success(session);
  }

  @Get('history')
  @ApiOperation({ summary: 'Lấy lịch sử các phiên WiFi có phân trang' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Trang hiện tại (mặc định: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số bản ghi mỗi trang (mặc định: 10, tối đa: 100)',
  })
  @ApiResponse({
    status: 200,
    description: 'Trả về lịch sử phiên WiFi có phân trang',
  })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  async getUserSessions(
    @CurrentUser('id') userId: string,
    @Query() pagination: PaginationDto,
  ) {
    const result = await this.wifiSessionsService.getUserSessions(
      userId,
      pagination.page || 1,
      pagination.limit || 10,
    );
    return ResponseUtil.paginated(
      result.data,
      pagination.page || 1,
      pagination.limit || 10,
      result.total,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết một phiên WiFi theo ID' })
  @ApiParam({
    name: 'id',
    description: 'UUID của phiên WiFi',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({ status: 200, description: 'Trả về thông tin phiên WiFi' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({
    status: 404,
    description: 'Phiên không tồn tại hoặc không thuộc về user này',
  })
  async getSession(
    @CurrentUser('id') userId: string,
    @Param('id', new ParseUUIDPipe()) sessionId: string,
  ) {
    const session = await this.wifiSessionsService.getSessionById(
      sessionId,
      userId,
    );
    return ResponseUtil.success(session);
  }
}
