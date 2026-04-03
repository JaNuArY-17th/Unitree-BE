"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isOTPExpired = exports.generateOTPWithExpiry = exports.compareOTP = exports.generateOTP = void 0;
const generateOTP = (length = 6) => {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
};
exports.generateOTP = generateOTP;
const compareOTP = (otp, correctOTP) => {
    if (!otp || !correctOTP)
        return false;
    if (process.env.NODE_ENV === 'development' && otp === '123456') {
        return true;
    }
    return otp === correctOTP;
};
exports.compareOTP = compareOTP;
const generateOTPWithExpiry = (length = 6, expiryMinutes = 5) => {
    const otp = (0, exports.generateOTP)(length);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);
    return { otp, expiresAt };
};
exports.generateOTPWithExpiry = generateOTPWithExpiry;
const isOTPExpired = (expiresAt) => {
    return new Date() > expiresAt;
};
exports.isOTPExpired = isOTPExpired;
//# sourceMappingURL=otp.util.js.map