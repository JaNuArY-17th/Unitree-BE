import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../../database/entities/conversation.entity';
import { Message } from '../../database/entities/message.entity';
import { ConversationParticipant } from '../../database/entities/conversation-participant.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(ConversationParticipant)
    private readonly participantRepository: Repository<ConversationParticipant>,
  ) {}

  async getUserConversations(userId: string): Promise<Conversation[]> {
    const participants = await this.participantRepository.find({
      where: { userId },
      relations: ['conversation'],
    });

    return participants.map((p) => p.conversation);
  }
}
