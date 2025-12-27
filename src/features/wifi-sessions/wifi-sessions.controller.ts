import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { WifiSessionsService } from './wifi-sessions.service';
import { StartSessionDto } from './dto/start-session.dto';
import { HeartbeatDto } from './dto/heartbeat.dto';
import { EndSessionDto } from './dto/end-session.dto';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { ResponseUtil } from '../../shared/utils/response.util';

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
    summary: 'Start a new WiFi session',
    description:
      'Note: WiFi validation (BSSID check) should be done on frontend before calling this endpoint',
  })
  @ApiResponse({ status: 201, description: 'Session started successfully' })
  @ApiResponse({ status: 400, description: 'Already have an active session' })
  async startSession(
    @CurrentUser('id') userId: string,
    @Body() dto: StartSessionDto,
  ) {
    const session = await this.wifiSessionsService.startSession(userId, dto);
    return ResponseUtil.success(session, 'WiFi session started successfully');
  }

  @Post('heartbeat')
  @ApiOperation({
    summary: 'Send heartbeat to keep session alive',
    description:
      'Should be called every 5 minutes (Android) or 15 minutes (iOS)',
  })
  @ApiResponse({ status: 200, description: 'Heartbeat acknowledged' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async heartbeat(
    @CurrentUser('id') userId: string,
    @Body() dto: HeartbeatDto,
  ) {
    const result = await this.wifiSessionsService.heartbeat(userId, dto);
    return ResponseUtil.success(result, 'Heartbeat recorded');
  }

  @Post(':id/end')
  @ApiOperation({
    summary: 'End an active WiFi session',
    description:
      'Calculates final duration and awards points (1 point per minute)',
  })
  @ApiResponse({ status: 200, description: 'Session ended and points awarded' })
  @ApiResponse({ status: 400, description: 'Session is not active' })
  async endSession(
    @CurrentUser('id') userId: string,
    @Param('id') sessionId: string,
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
  @ApiOperation({ summary: 'Get current active session' })
  @ApiResponse({ status: 200, description: 'Returns active session or null' })
  async getActiveSession(@CurrentUser('id') userId: string) {
    const session = await this.wifiSessionsService.getActiveSession(userId);
    return ResponseUtil.success(session);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get user WiFi session history with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated session history',
  })
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
  @ApiOperation({ summary: 'Get WiFi session by ID' })
  @ApiResponse({ status: 200, description: 'Returns session details' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getSession(
    @CurrentUser('id') userId: string,
    @Param('id') sessionId: string,
  ) {
    const session = await this.wifiSessionsService.getSessionById(
      sessionId,
      userId,
    );
    return ResponseUtil.success(session);
  }
}
