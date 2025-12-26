import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  private readonly firebaseApp: admin.app.App;

  constructor(private configService: ConfigService) {
    const firebaseConfig = this.configService.get('firebase');
    
    if (!admin.apps.length) {
      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: firebaseConfig.projectId,
          privateKey: firebaseConfig.privateKey,
          clientEmail: firebaseConfig.clientEmail,
        }),
        storageBucket: firebaseConfig.storageBucket,
        databaseURL: firebaseConfig.databaseURL,
      });
    } else {
      this.firebaseApp = admin.app();
    }
  }

  async sendNotification(
    fcmToken: string,
    title: string,
    body: string,
    data?: any,
  ): Promise<string> {
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
    return this.firebaseApp.auth().verifyIdToken(idToken);
  }

  getStorage(): admin.storage.Storage {
    return this.firebaseApp.storage();
  }
}
