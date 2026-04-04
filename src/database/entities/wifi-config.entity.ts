import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('wifi_config')
export class WifiConfig extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar' })
  ssid!: string;

  @Column({ name: 'public_ip_address', type: 'varchar' })
  publicIpAddress!: string;

  @Column({ name: 'reward_rate', type: 'int', default: 5 })
  rewardRate!: number;

  @Column({
    type: 'enum',
    enum: ['active', 'disabled'],
    default: 'active',
  })
  status!: 'active' | 'disabled';
}
