
'use client';

import React, { ReactNode, useMemo } from 'react';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';
import { FirebaseProvider } from './provider';

/**
 * Initializes Firebase instances strictly on the client side.
 * This function is used to ensure instances are available for the provider.
 */
export function initializeFirebase(): {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
} {
  const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const firestore = getFirestore(firebaseApp);
  const auth = getAuth(firebaseApp);

  return { firebaseApp, firestore, auth };
}

export function FirebaseClientProvider({
  children,
  firebaseApp: initialApp,
  firestore: initialFirestore,
  auth: initialAuth,
}: {
  children: ReactNode;
  firebaseApp?: FirebaseApp;
  firestore?: Firestore;
  auth?: Auth;
}) {
  // Memoize instances to ensure they are created once on the client and remain stable.
  // This avoids calling Firebase initialization logic during Server-Side Rendering (SSR).
  const instances = useMemo(() => {
    if (initialApp && initialFirestore && initialAuth) {
      return { firebaseApp: initialApp, firestore: initialFirestore, auth: initialAuth };
    }
    return initializeFirebase();
  }, [initialApp, initialFirestore, initialAuth]);

  return (
    <FirebaseProvider 
      firebaseApp={instances.firebaseApp} 
      firestore={instances.firestore} 
      auth={instances.auth}
    >
      {children}
    </FirebaseProvider>
  );
}
