export const TOKEN_EXPIRATION_TIME = {
  ACCESS_TOKEN: 60 * 15, // 15 minutes
  REFRESH_TOKEN: 60 * 60 * 24 * 7, // 7 days
};

// Cache key prefixes
export enum TokenPrefixes {
  ACCESS = 'auth:access_token:',
  REFRESH = 'auth:refresh_token:',
  USER_TOKENS = 'auth:user_tokens:',
  USER_INFO = 'auth:user_info:',
}
