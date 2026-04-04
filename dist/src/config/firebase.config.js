"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('firebase', () => {
    const base64 = process.env.FIREBASE_PRIVATE_KEY;
    if (!base64) {
        throw new Error('FIREBASE_PRIVATE_KEY is required');
    }
    const serviceAccount = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
    return {
        projectId: serviceAccount.project_id,
        privateKey: serviceAccount.private_key,
        clientEmail: serviceAccount.client_email,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        databaseURL: process.env.FIREBASE_DATABASE_URL,
    };
});
//# sourceMappingURL=firebase.config.js.map