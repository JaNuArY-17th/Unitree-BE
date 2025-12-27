import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ConversationType } from '../../shared/constants/enums.constant';
import { ConversationParticipant } from './conversation-participant.entity';
import { Message } from './message.entity';

@Entity('conversations')
export class Conversation extends BaseEntity {
  @Column({
    type: 'enum',
    enum: ConversationType,
    default: ConversationType.DIRECT,
  })
  type: ConversationType;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ name: 'created_by' })
  @Index()
  createdBy: string;

  @Column({ name: 'last_message_at', nullable: true })
  lastMessageAt?: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  // Relations
  @OneToMany(
    () => ConversationParticipant,
    (participant) => participant.conversation,
  )
  participants: ConversationParticipant[];

  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];
}
