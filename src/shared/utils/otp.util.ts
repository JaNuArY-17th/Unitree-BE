/**
 * Generate a random OTP (One-Time Password)
 * @param length - Length of OTP (default: 6)
 * @returns OTP string
 */
export const generateOTP = (length: number = 6): string => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

/**
 * Compare OTP with the correct OTP
 * @param otp - User provided OTP
 * @param correctOTP - Correct OTP
 * @returns true if OTPs match
 */
export const compareOTP = (otp: string, correctOTP: string): boolean => {
  if (!otp || !correctOTP) return false;

  // For development/testing purposes
  if (process.env.NODE_ENV === 'development' && otp === '123456') {
    return true;
  }

  return otp === correctOTP;
};

/**
 * Generate OTP with expiration time
 * @param length - Length of OTP
 * @param expiryMinutes - Expiry time in minutes (default: 5)
 * @returns Object with OTP and expiry timestamp
 */
export const generateOTPWithExpiry = (
  length: number = 6,
  expiryMinutes: number = 5,
): { otp: string; expiresAt: Date } => {
  const otp = generateOTP(length);
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

  return { otp, expiresAt };
};

/**
 * Check if OTP has expired
 * @param expiresAt - Expiry timestamp
 * @returns true if OTP has expired
 */
export const isOTPExpired = (expiresAt: Date): boolean => {
  return new Date() > expiresAt;
};
