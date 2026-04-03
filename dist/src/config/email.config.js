"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('email', () => ({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
    from: {
        name: process.env.EMAIL_FROM_NAME || 'Unitree',
        address: process.env.EMAIL_FROM_ADDRESS || 'noreply@unitree.com',
    },
}));
//# sourceMappingURL=email.config.js.map