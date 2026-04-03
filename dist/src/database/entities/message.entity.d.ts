import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Conversation } from './conversation.entity';
import { MessageType } from '../../shared/constants/enums.constant';
export declare class Message extends BaseEntity {
    conversationId: string;
    senderId: string;
    type: MessageType;
    content: string;
    metadata?: Record<string, unknown>;
    replyToId?: string;
    isEdited: boolean;
    editedAt?: Date;
    isDeleted: boolean;
    conversation: Conversation;
    sender: User;
}
