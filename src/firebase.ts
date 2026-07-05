import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, OAuthProvider } from 'firebase/auth';
import { initializeFirestore, getDocFromServer, doc, enableIndexedDbPersistence } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

// Enable Firestore IndexedDB offline persistence for instant local queries
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab at a time.
    console.warn('Firestore persistence failed-precondition: multiple tabs open.');
  } else if (err.code === 'unimplemented') {
    // The current browser does not support all of the features required to enable persistence
    console.warn('Firestore persistence unimplemented in this browser.');
  }
});

export const auth = getAuth(app);

// Map hostnames to Firebase Tenant IDs
// Configure your Tenant IDs here from the Firebase Console (Authentication > Tenants)
const TENANT_MAP: Record<string, string> = {
  'brandtopost.com': 'brandtopost-3isdh',
  'localhost': 'brandtopost-3isdh',
  // Add other domains and tenant mappings as needed
};

if (typeof window !== 'undefined') {
  const currentHost = window.location.hostname;
  if (TENANT_MAP[currentHost]) {
    auth.tenantId = TENANT_MAP[currentHost];
  }
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
export const facebookProvider = new FacebookAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
    // Skip logging for other errors, as this is simply a connection test.
  }
}
testConnection();
