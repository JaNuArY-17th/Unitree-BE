"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
function getFirebasePrivateKey() {
    const base64Key = process.env.FIREBASE_PRIVATE_KEY_BASE64?.trim();
    if (base64Key) {
        try {
            return Buffer.from(base64Key, 'base64').toString('utf-8');
        }
        catch (error) {
            throw new Error('FIREBASE_PRIVATE_KEY_BASE64 is not valid base64');
        }
    }
    const rawKey = process.env.FIREBASE_PRIVATE_KEY?.trim();
    if (rawKey) {
        return rawKey.replace(/\\n/g, '\n');
    }
    return undefined;
}
exports.default = (0, config_1.registerAs)('firebase', () => {
    const privateKey = getFirebasePrivateKey();
    if (!privateKey) {
        throw new Error('Firebase private key is required: set FIREBASE_PRIVATE_KEY_BASE64 (preferred) or FIREBASE_PRIVATE_KEY');
    }
    return {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        databaseURL: process.env.FIREBASE_DATABASE_URL,
    };
});
//# sourceMappingURL=firebase.config.js.map