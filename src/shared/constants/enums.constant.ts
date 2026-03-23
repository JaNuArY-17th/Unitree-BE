// ──────────────────────────────────
// Enums từ schema mới (schema.prisma)
// ──────────────────────────────────

/** Trạng thái nhiệm vụ của user */
export enum UserTaskStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CLAIMED = 'CLAIMED',
}

/** Role của user */
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

// ──────────────────────────────────
// Enums giữ lại cho các feature cũ vẫn còn dùng
// ──────────────────────────────────

/** Trạng thái phiên wifi */
export enum WifiSessionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/** Loại giao dịch điểm (legacy points feature) */
export enum PointTransactionType {
  WIFI = 'wifi',
  REFERRAL = 'referral',
  DAILY_CHECK_IN = 'daily_check_in',
  TREE_CARE = 'tree_care',
  ADMIN_ADJUSTMENT = 'admin_adjustment',
  REDEEM = 'redeem',
}

/** Loại conversation trong chat */
export enum ConversationType {
  DIRECT = 'direct',
  GROUP = 'group',
}

/** Loại message trong chat */
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  SYSTEM = 'system',
}
