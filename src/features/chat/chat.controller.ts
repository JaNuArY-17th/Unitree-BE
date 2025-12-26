import { Controller, Get } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ResponseUtil } from '../../shared/utils/response.util';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  async getConversations(@CurrentUser('id') userId: string) {
    const conversations = await this.chatService.getUserConversations(userId);
    return ResponseUtil.success(conversations);
  }
}
