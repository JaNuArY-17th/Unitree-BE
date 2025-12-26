export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export const ROLES = {
  USER: UserRole.USER,
  ADMIN: UserRole.ADMIN,
  SUPER_ADMIN: UserRole.SUPER_ADMIN,
} as const;
