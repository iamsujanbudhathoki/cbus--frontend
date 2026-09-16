const getApiBaseUrl = (): string => {
  const rawUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1').trim().replace(/\/+$/, '');
  return rawUrl.endsWith('/api/v1') ? rawUrl : `${rawUrl}/api/v1`;
};

export const envConfig = {
  NEXT_PUBLIC_API_URL: getApiBaseUrl(),
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyD4QwxgZpq7GistR4Exx3NXS2Wf1rhi38k',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'bustrakingnepal.firebaseapp.com',
  NEXT_PUBLIC_FIREBASE_DATABASE_URL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://bustrakingnepal-default-rtdb.asia-southeast1.firebasedatabase.app',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'bustrakingnepal',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'bustrakingnepal.firebasestorage.app',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '239724786973',
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:239724786973:web:9f761da15079ef0aa61df4',
};

