export enum PointTransactionType {
  WIFI = 'wifi',
  REFERRAL = 'referral',
  DAILY_CHECK_IN = 'daily_check_in',
  TREE_CARE = 'tree_care',
  ADMIN_ADJUSTMENT = 'admin_adjustment',
  REDEEM = 'redeem',
}

export enum TreeStatus {
  GROWING = 'growing',
  MATURE = 'mature',
  DEAD = 'dead',
}

export enum WifiSessionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum NotificationType {
  POINTS_EARNED = 'points_earned',
  TREE_MILESTONE = 'tree_milestone',
  NEW_MESSAGE = 'new_message',
  SYSTEM = 'system',
  ACHIEVEMENT = 'achievement',
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  SYSTEM = 'system',
}

export enum ConversationType {
  DIRECT = 'direct',
  GROUP = 'group',
}

export enum RealTreeStatus {
  PENDING = 'pending',
  PLANTED = 'planted',
  GROWING = 'growing',
  VERIFIED = 'verified',
}
