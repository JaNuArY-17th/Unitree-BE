import {
  Entity,
  Column,
  OneToOne,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Student } from './student.entity';
import { UserRole } from '../../shared/constants/roles.constant';

@Entity('users')
export class User extends BaseEntity {
  @Index()
  @Column({ type: 'varchar' })
  username: string;

  @Column({ type: 'varchar', nullable: true })
  avatar?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  // Referral code: unique, nullable, chỉ tạo sau khi user đã có record
  @Column({
    name: 'referral_code',
    type: 'varchar',
    unique: true,
    nullable: true,
  })
  referralCode?: string;

  // User đã mời user này: nullable, chỉ nhập 1 lần
  @Index()
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'invited_by_user_id' })
  invitedBy?: User;

  @Column({
    name: 'last_spin_regen',
    type: 'timestamp',
    nullable: true,
  })
  lastSpinRegen?: Date;

  // Relations
  @OneToOne('Student', 'user')
  @JoinColumn({ name: 'student_id' })
  student: Student;
}
