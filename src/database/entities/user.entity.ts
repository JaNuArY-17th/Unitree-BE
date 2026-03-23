import {
  Entity,
  Column,
  OneToMany,
  OneToOne,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Student } from './student.entity';
import { EconomyLog } from './economy-log.entity';
import { Friendship } from './friendship.entity';
import { Notification } from './notification.entity';
import { PvpActionLog } from './pvp-action-log.entity';
import { UserResource } from './user-resource.entity';
import { UserTask } from './user-task.entity';
import { UserTree } from './user-tree.entity';
import { WifiSession } from './wifi-session.entity';
import { ConversationParticipant } from './conversation-participant.entity';
import { Message } from './message.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar' })
  username: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar' })
  fullname: string;

  @Column({ name: 'student_id', type: 'varchar', unique: true })
  studentId: string;

  @Column({ type: 'varchar', nullable: true })
  avatar?: string;

  @Column({ type: 'varchar' })
  role: string;

  // Referral code: unique, nullable, chỉ tạo sau khi user đã có record
  @Column({
    name: 'referral_code',
    type: 'varchar',
    unique: true,
    nullable: true,
  })
  referralCode?: string;

  // Mã mời đã nhập: nullable, chỉ nhập 1 lần, lưu mã của người mời
  @Column({ name: 'invited_by_code', type: 'varchar', nullable: true })
  invitedByCode?: string;

  @Column({
    name: 'last_spin_regen',
    type: 'timestamp',
    nullable: true,
  })
  lastSpinRegen?: Date;

  // Relations
  @OneToOne('Student', 'user')
  @JoinColumn({ name: 'student_id', referencedColumnName: 'studentId' })
  student: Student;

  @OneToMany('EconomyLog', 'user')
  economyLogs: EconomyLog[];

  @OneToMany('Friendship', 'user1')
  friendshipsAsUser1: Friendship[];

  @OneToMany('Friendship', 'user2')
  friendshipsAsUser2: Friendship[];

  @OneToMany('Notification', 'user')
  notifications: Notification[];

  @OneToMany('PvpActionLog', 'attacker')
  pvpAttackLogs: PvpActionLog[];

  @OneToMany('PvpActionLog', 'defender')
  pvpDefendLogs: PvpActionLog[];

  @OneToMany('UserResource', 'user')
  userResources: UserResource[];

  @OneToMany('UserTask', 'user')
  userTasks: UserTask[];

  @OneToMany('UserTree', 'user')
  userTrees: UserTree[];

  // Relations from kept features (wifi-sessions, chat)
  @OneToMany('WifiSession', 'user')
  wifiSessions: WifiSession[];

  @OneToMany('ConversationParticipant', 'user')
  conversationParticipants: ConversationParticipant[];

  @OneToMany('Message', 'sender')
  messages: Message[];
}
