import { registerAs } from '@nestjs/config';

export default registerAs('firebase', () => {
  const base64 = process.env.FIREBASE_PRIVATE_KEY;
  
  if (!base64) {
    throw new Error('FIREBASE_PRIVATE_KEY is required');
  }

  const serviceAccount = JSON.parse(
    Buffer.from(base64, 'base64').toString('utf-8')
  );

  return {
    projectId: serviceAccount.project_id,
    privateKey: serviceAccount.private_key,  
    clientEmail: serviceAccount.client_email,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  };
});