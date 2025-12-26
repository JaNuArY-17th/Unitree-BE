import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { WifiSessionsService } from './wifi-sessions.service';
import { StartSessionDto } from './dto/start-session.dto';
import { EndSessionDto } from './dto/end-session.dto';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ResponseUtil } from '../../shared/utils/response.util';

@Controller('wifi-sessions')
export class WifiSessionsController {
  constructor(private readonly wifiSessionsService: WifiSessionsService) {}

  @Post('start')
  async startSession(
    @CurrentUser('id') userId: string,
    @Body() startSessionDto: StartSessionDto,
  ) {
    const session = await this.wifiSessionsService.startSession(
      userId,
      startSessionDto,
    );
    return ResponseUtil.success(session, 'WiFi session started');
  }

  @Post(':id/end')
  async endSession(
    @CurrentUser('id') userId: string,
    @Param('id') sessionId: string,
    @Body() endSessionDto: EndSessionDto,
  ) {
    const session = await this.wifiSessionsService.endSession(
      sessionId,
      userId,
      endSessionDto,
    );
    return ResponseUtil.success(session, 'WiFi session ended');
  }

  @Get()
  async getUserSessions(
    @CurrentUser('id') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const result = await this.wifiSessionsService.getUserSessions(
      userId,
      page,
      limit,
    );
    return ResponseUtil.paginated(
      result.data,
      page,
      limit,
      result.total,
    );
  }

  @Get('active')
  async getActiveSession(@CurrentUser('id') userId: string) {
    const session = await this.wifiSessionsService.getActiveSession(userId);
    return ResponseUtil.success(session);
  }

  @Get(':id')
  async getSessionById(
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
