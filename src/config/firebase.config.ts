import { registerAs } from '@nestjs/config';

function getFirebasePrivateKey(): string | undefined {
  const key = process.env.FIREBASE_PRIVATE_KEY?.trim();
  if (!key) return undefined;

  let result: string;
  if (!key.startsWith('-----')) {
    result = Buffer.from(key, 'base64').toString('utf-8');
  } else {
    result = key.replace(/\\n/g, '\n');
  }

  // Log để debug
  console.log('=== FIREBASE KEY DEBUG ===');
  console.log('First 50 chars:', result.substring(0, 50));
  console.log('Last 50 chars:', result.substring(result.length - 50));
  console.log('Contains literal \\n:', result.includes('\\n'));
  console.log('Contains real newline:', result.includes('\n'));
  console.log('==========================');

  return result;
}

export default registerAs('firebase', () => {
  const privateKey = getFirebasePrivateKey();
  if (!privateKey) {
    throw new Error(
      'Firebase private key is required: set FIREBASE_PRIVATE_KEY',
    );
  }

  return {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  };
});
