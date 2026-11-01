/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * MEHFIL FIREBASE CONFIGURATION
 * -----------------------------
 * To connect your live Firebase project:
 * 1. Go to https://console.firebase.google.com/
 * 2. Create a project and register a Web app
 * 3. Enable Authentication (Email/Password and Google sign-in)
 * 4. Enable Cloud Firestore and Cloud Storage
 * 5. Replace the configuration object below or specify environment variables in .env:
 *    - VITE_FIREBASE_API_KEY
 *    - VITE_FIREBASE_AUTH_DOMAIN
 *    - VITE_FIREBASE_PROJECT_ID
 *    - VITE_FIREBASE_STORAGE_BUCKET
 *    - VITE_FIREBASE_MESSAGING_SENDER_ID
 *    - VITE_FIREBASE_APP_ID
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// PLACE YOUR FIREBASE CONFIGURATION KEYS HERE:
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoPlaceholderKeyForMehfilApp12345",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mehfil-social.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mehfil-social",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mehfil-social.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1029384756",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1029384756:web:a1b2c3d4e5f6g7h8",
};

export const isFirebaseConfigured = (): boolean => {
  return (
    Boolean(import.meta.env.VITE_FIREBASE_API_KEY) &&
    !import.meta.env.VITE_FIREBASE_API_KEY.includes('Placeholder')
  );
};

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firebase Auth, Firestore, and Storage instances
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
