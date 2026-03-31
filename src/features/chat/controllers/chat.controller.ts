import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ChatService } from '../services/chat.service';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { ResponseUtil } from '../../../shared/utils/response.util';

@ApiTags('Chat')
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  @ApiOperation({
    summary: 'Lấy danh sách cuộc hội thoại của user',
    description: 'Trả về tất cả conversation mà user đang đăng nhập tham gia',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách cuộc hội thoại của user',
  })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  async getConversations(@CurrentUser('id') userId: string) {
    const conversations = await this.chatService.getUserConversations(userId);
    return ResponseUtil.success(conversations);
  }
}
