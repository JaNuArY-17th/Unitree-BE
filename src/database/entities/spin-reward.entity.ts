import { Entity, Column, PrimaryColumn } from 'typeorm';

/**
 * SpinReward Entity
 *
 * Cấu hình phần thưởng vòng quay may mắn.
 * ID là integer (không phải UUID) do đây là config bảng tĩnh.
 */
@Entity('spin_rewards')
export class SpinReward {
  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ name: 'reward_type', type: 'varchar' })
  rewardType: string;

  @Column({ name: 'reward_amount' })
  rewardAmount: number;

  /**
   * Trọng số xác suất rơi của phần thưởng này.
   * Giá trị càng cao, xác suất rơi càng lớn.
   */
  @Column({ name: 'drop_weight', type: 'decimal' })
  dropWeight: number;
}
