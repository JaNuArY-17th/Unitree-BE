import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
export declare class FirebaseService {
    private configService;
    private readonly firebaseApp;
    private readonly logger;
    constructor(configService: ConfigService);
    isInitialized(): boolean;
    sendNotification(fcmToken: string, title: string, body: string, data?: any): Promise<string>;
    sendMulticast(fcmTokens: string[], title: string, body: string, data?: any): Promise<admin.messaging.BatchResponse>;
    verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken>;
    getStorage(): admin.storage.Storage;
}
