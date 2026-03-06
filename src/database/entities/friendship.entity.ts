import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  PrimaryColumn,
} from 'typeorm';
import { FriendshipStatus } from '../../shared/constants/enums.constant';

/**
 * Friendship Entity
 *
 * Quan hệ bạn bè giữa hai user.
 * Dùng composite PK: (user_id_1, user_id_2).
 * Convention: user_id_1 < user_id_2 (để tránh trùng lặp).
 */
@Entity('friendships')
export class Friendship {
  @PrimaryColumn({ name: 'user_id_1', type: 'uuid' })
  userId1: string;

  @PrimaryColumn({ name: 'user_id_2', type: 'uuid' })
  userId2: string;

  /**
   * Trạng thái quan hệ: ACCEPTED | PENDING | BLOCKED
   */
  @Column({
    type: 'enum',
    enum: FriendshipStatus,
    default: FriendshipStatus.PENDING,
  })
  status: FriendshipStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  // Relations
  @ManyToOne('User', 'friendshipsAsUser1', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id_1' })
  user1: any;

  @ManyToOne('User', 'friendshipsAsUser2', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id_2' })
  user2: any;
}
