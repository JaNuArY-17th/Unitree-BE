import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  private readonly firebaseApp: admin.app.App | null = null;
  private readonly logger = new Logger(FirebaseService.name);

  constructor(private configService: ConfigService) {
    const firebaseConfig = this.configService.get('firebase');

    console.log('=== FIREBASE KEY DEBUG ===');
    console.log(
      'privateKey first 50:',
      firebaseConfig.privateKey?.substring(0, 50),
    );
    console.log(
      'privateKey last 50:',
      firebaseConfig.privateKey?.substring(
        firebaseConfig.privateKey.length - 50,
      ),
    );
    console.log('has literal \\n:', firebaseConfig.privateKey?.includes('\\n'));
    console.log('has real newline:', firebaseConfig.privateKey?.includes('\n'));
    console.log('==========================');

    if (!firebaseConfig.projectId) {
      this.logger.warn(
        'Firebase configuration is missing (projectId is empty). Firebase features will be disabled.',
      );
      return;
    }

    if (!admin.apps.length) {
      try {
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId: firebaseConfig.projectId,
            privateKey: firebaseConfig.privateKey,
            clientEmail: firebaseConfig.clientEmail,
          }),
          storageBucket: firebaseConfig.storageBucket,
          databaseURL: firebaseConfig.databaseURL,
        });
        this.logger.log('Firebase Admin SDK initialized successfully');
      } catch (error) {
        this.logger.error('Failed to initialize Firebase Admin SDK', error);
      }
    } else {
      this.firebaseApp = admin.app();
    }
  }

  isInitialized(): boolean {
    return this.firebaseApp !== null;
  }

  async sendNotification(
    fcmToken: string,
    title: string,
    body: string,
    data?: any,
  ): Promise<string> {
    if (!this.firebaseApp) {
      this.logger.warn(
        'Firebase is not initialized. Cannot send notification.',
      );
      return 'fake-message-id';
    }

    const message = {
      notification: {
        title,
        body,
      },
      data,
      token: fcmToken,
    };

    return this.firebaseApp.messaging().send(message);
  }

  async sendMulticast(
    fcmTokens: string[],
    title: string,
    body: string,
    data?: any,
  ): Promise<admin.messaging.BatchResponse> {
    if (!this.firebaseApp) {
      this.logger.warn(
        'Firebase is not initialized. Cannot send multicast notification.',
      );
      return { responses: [], successCount: 0, failureCount: fcmTokens.length };
    }

    const message = {
      notification: {
        title,
        body,
      },
      data,
      tokens: fcmTokens,
    };

    return this.firebaseApp.messaging().sendEachForMulticast(message);
  }

  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    if (!this.firebaseApp) {
      throw new Error('Firebase is not initialized. Cannot verify ID token.');
    }
    return this.firebaseApp.auth().verifyIdToken(idToken);
  }

  getStorage(): admin.storage.Storage {
    if (!this.firebaseApp) {
      throw new Error('Firebase is not initialized. Cannot access storage.');
    }
    return this.firebaseApp.storage();
  }
}
