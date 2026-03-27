export const TOKEN_EXPIRATION_TIME = {
  ACCESS_TOKEN: 60 * 15, // 15 minutes
  REFRESH_TOKEN: 60 * 60 * 24 * 7, // 7 days
};

// Cache key prefixes
export enum TokenPrefixes {
  USER = 'users:', // Hash structure: users:{userId}
}

// Hash field names for user data
export enum UserHashFields {
  PROFILE = 'profile',
  REFRESH_TOKENS = 'refresh_tokens',
  GARDEN_STATE = 'garden_state',
}
