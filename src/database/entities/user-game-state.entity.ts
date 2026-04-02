import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

/**
 * UserGameState Entity
 *
 * Lưu trữ trạng thái game của từng user.
 * Được tách riêng khỏi User để giữ User chỉ chứa identity/auth data.
 * Mỗi user có đúng một GameState, được tạo cùng lúc với User.
 *
 * Các field game-loop sẽ được thêm vào đây trong tương lai:
 * - lastSpinRegen: thời điểm spin cuối được hồi
 * - spinCount, shieldCount, gloveCount, ... (nếu cần migrate)
 */
@Entity('user_game_states')
export class UserGameState extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId!: string;

  /**
   * Thời điểm lần cuối spin được hồi.
   * Dùng để tính toán số lượt spin hiện có dựa theo thời gian thực.
   */
  @Column({ name: 'last_spin_regen', type: 'timestamp', nullable: true })
  lastSpinRegen?: Date;

  // Relations
  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
