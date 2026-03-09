import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar' })
  username: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar' })
  fullname: string;

  @Column({ type: 'varchar' })
  nickname: string;

  @Column({ name: 'student_id', type: 'varchar', unique: true })
  studentId: string;

  @Column({ type: 'varchar', nullable: true })
  avatar?: string;

  @Column({ type: 'varchar' })
  role: string;

  @Column({
    name: 'spin_count',
    type: 'smallint',
    default: 5,
  })
  spinCount: number;

  @Column({
    name: 'glove_count',
    type: 'smallint',
    default: 0,
  })
  gloveCount: number;

  @Column({
    name: 'watering_can_count',
    type: 'smallint',
    default: 0,
  })
  wateringCanCount: number;

  @Column({
    name: 'shield_count',
    type: 'smallint',
    default: 0,
  })
  shieldCount: number;

  @Column({
    name: 'last_spin_regen',
    type: 'timestamp',
    nullable: true,
  })
  lastSpinRegen?: Date;

  // Relations
  @ManyToOne('Student', 'users')
  @JoinColumn({ name: 'student_id', referencedColumnName: 'studentId' })
  student: any;

  @OneToMany('EconomyLog', 'user')
  economyLogs: any[];

  @OneToMany('Friendship', 'user1')
  friendshipsAsUser1: any[];

  @OneToMany('Friendship', 'user2')
  friendshipsAsUser2: any[];

  @OneToMany('Notification', 'user')
  notifications: any[];

  @OneToMany('PvpActionLog', 'attacker')
  pvpAttackLogs: any[];

  @OneToMany('PvpActionLog', 'defender')
  pvpDefendLogs: any[];

  @OneToMany('UserResource', 'user')
  userResources: any[];

  @OneToMany('UserTask', 'user')
  userTasks: any[];

  @OneToMany('UserTree', 'user')
  userTrees: any[];

  // Relations from kept features (wifi-sessions, chat)
  @OneToMany('WifiSession', 'user')
  wifiSessions: any[];

  @OneToMany('ConversationParticipant', 'user')
  conversationParticipants: any[];

  @OneToMany('Message', 'sender')
  messages: any[];
}
