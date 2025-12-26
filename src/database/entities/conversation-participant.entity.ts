import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Conversation } from './conversation.entity';

@Entity('conversation_participants')
@Index(['conversationId', 'userId'], { unique: true })
export class ConversationParticipant extends BaseEntity {
  @Column({ name: 'conversation_id' })
  @Index()
  conversationId: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ name: 'joined_at' })
  joinedAt: Date;

  @Column({ name: 'last_read_at', nullable: true })
  lastReadAt?: Date;

  @Column({ name: 'is_admin', default: false })
  isAdmin: boolean;

  @Column({ name: 'is_muted', default: false })
  isMuted: boolean;

  @Column({ name: 'left_at', nullable: true })
  leftAt?: Date;

  // Relations
  @ManyToOne(() => Conversation, (conversation) => conversation.participants)
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @ManyToOne(() => User, (user) => user.conversationParticipants)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
