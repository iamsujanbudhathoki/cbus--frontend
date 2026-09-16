import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, off } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyD4QwxgZpq7GistR4Exx3NXS2Wf1rhi38k",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "bustrakingnepal.firebaseapp.com",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://bustrakingnepal-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "bustrakingnepal",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "bustrakingnepal.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "239724786973",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:239724786973:web:9f761da15079ef0aa61df4",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getDatabase(app);

export interface FirebaseBusLocation {
  busId: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  status: string;
  lastUpdated: number;
}

export function subscribeToBusLocation(
  busId: string,
  onUpdate: (location: FirebaseBusLocation | null) => void
): () => void {
  if (!busId) return () => {};
  const busRef = ref(db, `buses/${busId}`);
  const unsubscribe = onValue(busRef, (snapshot) => {
    if (snapshot.exists()) {
      onUpdate(snapshot.val() as FirebaseBusLocation);
    } else {
      onUpdate(null);
    }
  });
  return () => off(busRef, 'value', unsubscribe);
}

export function subscribeToAllBuses(
  onUpdate: (busesMap: Record<string, FirebaseBusLocation>) => void
): () => void {
  const busesRef = ref(db, 'buses');
  const unsubscribe = onValue(busesRef, (snapshot) => {
    if (snapshot.exists()) {
      onUpdate(snapshot.val() as Record<string, FirebaseBusLocation>);
    } else {
      onUpdate({});
    }
  });
  return () => off(busesRef, 'value', unsubscribe);
}

export async function pushLocationToFirebase(
  busId: string,
  data: {
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    status?: string;
  }
): Promise<void> {
  if (!busId) return;
  const busRef = ref(db, `buses/${busId}`);
  const payload: FirebaseBusLocation = {
    busId,
    latitude: data.latitude,
    longitude: data.longitude,
    speed: data.speed ?? 0,
    heading: data.heading ?? 0,
    status: data.status || 'MOVING',
    lastUpdated: Date.now(),
  };
  await set(busRef, payload);
}
