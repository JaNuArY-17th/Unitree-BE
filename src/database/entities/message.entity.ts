import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Conversation } from './conversation.entity';
import { MessageType } from '../../shared/constants/enums.constant';

@Entity('messages')
export class Message extends BaseEntity {
  @Column({ name: 'conversation_id' })
  @Index()
  conversationId: string;

  @Column({ name: 'sender_id' })
  @Index()
  senderId: string;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  type: MessageType;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;

  @Column({ name: 'reply_to_id', nullable: true })
  replyToId?: string;

  @Column({ name: 'is_edited', default: false })
  isEdited: boolean;

  @Column({ name: 'edited_at', nullable: true })
  editedAt?: Date;

  @Column({ name: 'is_deleted', default: false })
  isDeleted: boolean;

  // Relations
  @ManyToOne(() => Conversation, (conversation) => conversation.messages)
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @ManyToOne(() => User, (user) => user.messages)
  @JoinColumn({ name: 'sender_id' })
  sender: User;
}
