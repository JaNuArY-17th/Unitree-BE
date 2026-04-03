import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Conversation } from './conversation.entity';
export declare class ConversationParticipant extends BaseEntity {
    conversationId: string;
    userId: string;
    joinedAt: Date;
    lastReadAt?: Date;
    isAdmin: boolean;
    isMuted: boolean;
    leftAt?: Date;
    conversation: Conversation;
    user: User;
}
