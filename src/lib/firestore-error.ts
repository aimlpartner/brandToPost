import { auth, db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  
  // Log to Firestore silently
  if (auth.currentUser) {
    addDoc(collection(db, 'error_logs'), {
      ...errInfo,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      type: 'firestore_error'
    }).catch(e => console.error("Failed to log error to db", e));
  }

  throw new Error(JSON.stringify(errInfo));
}

// Global error logger for other types of silent failures
export function logSilentError(error: Error | string, context: Record<string, any> = {}) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  
  console.error('Silent Error: ', errorMessage, context);
  
  // Filter out client-side network fetch failures to prevent database spam
  const lowerMsg = errorMessage.toLowerCase();
  if (
    lowerMsg.includes('failed to fetch') || 
    lowerMsg.includes('load failed') || 
    lowerMsg.includes('networkerror') ||
    lowerMsg.includes('network error')
  ) {
    return;
  }
  
  if (auth.currentUser) {
    const errorData: any = {
      error: errorMessage,
      context: JSON.parse(JSON.stringify(context, (k, v) => v === undefined ? null : v)),
      userId: auth.currentUser.uid,
      email: auth.currentUser.email || null,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      type: 'silent_error'
    };
    if (stack) {
      errorData.stack = stack;
    }
    addDoc(collection(db, 'error_logs'), errorData).catch(e => console.error("Failed to log silent error to db", e));
  }
}
