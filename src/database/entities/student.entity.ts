import { Entity, Column, OneToOne, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

/**
 * Student Entity
 *
 * Bảng chứa thông tin sinh viên được import từ hệ thống trường.
 * Mỗi user sẽ liên kết với một student thông qua student_id.
 */
@Entity('students')
export class Student extends BaseEntity {
  @Column({ name: 'student_id', type: 'varchar', unique: true })
  studentId!: string;

  @Index()
  @Column({ name: 'full_name', type: 'varchar' })
  fullName!: string;

  @Column({ type: 'varchar', unique: true })
  email!: string;

  // Relations
  @OneToOne('User', 'student')
  user!: User;
}
