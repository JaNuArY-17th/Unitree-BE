import { Repository } from 'typeorm';
import { Conversation } from '../../../database/entities/conversation.entity';
import { Message } from '../../../database/entities/message.entity';
import { ConversationParticipant } from '../../../database/entities/conversation-participant.entity';
export declare class ChatService {
    private readonly conversationRepository;
    private readonly messageRepository;
    private readonly participantRepository;
    constructor(conversationRepository: Repository<Conversation>, messageRepository: Repository<Message>, participantRepository: Repository<ConversationParticipant>);
    getUserConversations(userId: string): Promise<Conversation[]>;
}
