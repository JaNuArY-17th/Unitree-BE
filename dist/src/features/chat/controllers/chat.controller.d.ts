import { ChatService } from '../services/chat.service';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    getConversations(userId: string): Promise<import("../../../shared/utils/response.util").ApiResponse<import("../../../database/entities/conversation.entity").Conversation[]>>;
}
