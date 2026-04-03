"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validators = void 0;
class Validators {
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    static isValidPhone(phone) {
        const phoneRegex = /^(\+84|0)[3|5|7|8|9][0-9]{8}$/;
        return phoneRegex.test(phone);
    }
    static isValidPassword(password) {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        return passwordRegex.test(password);
    }
    static sanitizeInput(input) {
        return input
            .trim()
            .replace(/[<>]/g, '')
            .replace(/[\x00-\x1F\x7F]/g, '');
    }
    static isValidUUID(uuid) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }
}
exports.Validators = Validators;
//# sourceMappingURL=validators.util.js.map