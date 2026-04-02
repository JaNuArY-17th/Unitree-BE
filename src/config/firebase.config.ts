import { registerAs } from '@nestjs/config';

export default registerAs('firebase', () => {
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  const privateKey = rawPrivateKey
    ? rawPrivateKey
        .replace(/\\n/g, '\n')
        .trim()
        .replace(/^"(.*)"$/, '$1')
        .replace(/^\'(.*)\'$/, '$1')
    : undefined;

  return {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  };
});
