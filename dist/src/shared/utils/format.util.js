"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomString = exports.maskPhoneNumber = exports.maskEmail = exports.slugify = exports.capitalize = exports.truncate = exports.formatNumber = exports.formatCurrency = exports.formatPhoneNumber = void 0;
const formatPhoneNumber = (phoneNumber) => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.startsWith('84')) {
        return `+${cleaned}`;
    }
    if (cleaned.startsWith('0')) {
        return `+84${cleaned.substring(1)}`;
    }
    return `+84${cleaned}`;
};
exports.formatPhoneNumber = formatPhoneNumber;
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount);
};
exports.formatCurrency = formatCurrency;
const formatNumber = (num) => {
    return new Intl.NumberFormat('vi-VN').format(num);
};
exports.formatNumber = formatNumber;
const truncate = (str, maxLength) => {
    if (str.length <= maxLength)
        return str;
    return str.substring(0, maxLength - 3) + '...';
};
exports.truncate = truncate;
const capitalize = (str) => {
    if (!str)
        return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
exports.capitalize = capitalize;
const slugify = (str) => {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};
exports.slugify = slugify;
const maskEmail = (email) => {
    const [name, domain] = email.split('@');
    if (name.length <= 2)
        return email;
    const visibleChars = Math.max(2, Math.floor(name.length * 0.3));
    const masked = name.substring(0, visibleChars) + '*'.repeat(name.length - visibleChars);
    return `${masked}@${domain}`;
};
exports.maskEmail = maskEmail;
const maskPhoneNumber = (phone) => {
    if (phone.length <= 4)
        return phone;
    const visibleStart = 3;
    const visibleEnd = 2;
    const masked = '*'.repeat(phone.length - visibleStart - visibleEnd);
    return (phone.substring(0, visibleStart) +
        masked +
        phone.substring(phone.length - visibleEnd));
};
exports.maskPhoneNumber = maskPhoneNumber;
const randomString = (length, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') => {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};
exports.randomString = randomString;
//# sourceMappingURL=format.util.js.map