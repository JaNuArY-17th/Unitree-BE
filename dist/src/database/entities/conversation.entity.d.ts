import { BaseEntity } from './base.entity';
import { ConversationType } from '../../shared/constants/enums.constant';
import { ConversationParticipant } from './conversation-participant.entity';
import { Message } from './message.entity';
export declare class Conversation extends BaseEntity {
    type: ConversationType;
    name?: string;
    avatar?: string;
    createdBy: string;
    lastMessageAt?: Date;
    isActive: boolean;
    participants: ConversationParticipant[];
    messages: Message[];
}
