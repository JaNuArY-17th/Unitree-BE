/**
 * Format phone number to Vietnamese format
 * @param phoneNumber - Raw phone number
 * @returns Formatted phone number
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');

  // Check if it starts with country code
  if (cleaned.startsWith('84')) {
    return `+${cleaned}`;
  }

  // If starts with 0, replace with +84
  if (cleaned.startsWith('0')) {
    return `+84${cleaned.substring(1)}`;
  }

  return `+84${cleaned}`;
};

/**
 * Format currency to Vietnamese Dong
 * @param amount - Amount in VND
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

/**
 * Format number with thousands separator
 * @param num - Number to format
 * @returns Formatted number string
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('vi-VN').format(num);
};

/**
 * Truncate string with ellipsis
 * @param str - String to truncate
 * @param maxLength - Maximum length
 * @returns Truncated string
 */
export const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
};

/**
 * Capitalize first letter of string
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Convert string to slug
 * @param str - String to slugify
 * @returns Slug string
 */
export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Mask email address
 * @param email - Email to mask
 * @returns Masked email
 */
export const maskEmail = (email: string): string => {
  const [name, domain] = email.split('@');
  if (name.length <= 2) return email;

  const visibleChars = Math.max(2, Math.floor(name.length * 0.3));
  const masked =
    name.substring(0, visibleChars) + '*'.repeat(name.length - visibleChars);

  return `${masked}@${domain}`;
};

/**
 * Mask phone number
 * @param phone - Phone number to mask
 * @returns Masked phone number
 */
export const maskPhoneNumber = (phone: string): string => {
  if (phone.length <= 4) return phone;

  const visibleStart = 3;
  const visibleEnd = 2;
  const masked = '*'.repeat(phone.length - visibleStart - visibleEnd);

  return (
    phone.substring(0, visibleStart) +
    masked +
    phone.substring(phone.length - visibleEnd)
  );
};

/**
 * Generate random string
 * @param length - Length of string
 * @param chars - Characters to use (default: alphanumeric)
 * @returns Random string
 */
export const randomString = (
  length: number,
  chars: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
): string => {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
